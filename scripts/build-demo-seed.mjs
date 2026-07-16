/**
 * Build the demo/tester seed bundle from the current dev database.
 *
 * Usage (app must NOT be running — needs exclusive DB access):
 *   npx electron scripts/build-demo-seed.mjs [accountFolderId]
 *
 * Writes:
 *   resources/demo/blazeaudit.db   — re-keyed copy of the source DB
 *   resources/demo/assets/         — logos, badge photos, etc.
 *   resources/demo/demo.flag       — marker for demo builds
 */

import { app, safeStorage } from 'electron';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

app.setPath('userData', resolve(process.cwd(), '.electron-dev'));

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3-multiple-ciphers');

const DEMO_EMAIL = 'jackpps@mail.com';
const DEMO_KEY_X =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

const OUT_DIR = join(process.cwd(), 'resources', 'demo');

function findAccountDirs(dataDir) {
  const accountsDir = join(dataDir, 'accounts');
  if (!existsSync(accountsDir)) return [];
  return readdirSync(accountsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function readKeyX(accountDirPath) {
  const dpapi = join(accountDirPath, 'auth', 'keyx.dpapi');
  if (existsSync(dpapi) && safeStorage.isEncryptionAvailable()) {
    try {
      const raw = safeStorage.decryptString(readFileSync(dpapi));
      if (/^[0-9a-f]{64}$/i.test(raw)) return raw;
      const { keyX } = JSON.parse(raw);
      if (/^[0-9a-f]{64}$/i.test(keyX)) return keyX;
    } catch {
      /* fall through */
    }
  }
  return null;
}

function pickAccountId(dataDir, requested) {
  const ids = findAccountDirs(dataDir);
  if (ids.length === 0) return null;
  if (requested && ids.includes(requested)) return requested;

  // Prefer the account with the largest DB (most demo content).
  let best = ids[0];
  let bestSize = 0;
  for (const id of ids) {
    const dbPath = join(dataDir, 'accounts', id, 'blazeaudit.db');
    if (!existsSync(dbPath)) continue;
    const keyX = readKeyX(join(dataDir, 'accounts', id));
    if (!keyX) continue;
    const size = readFileSync(dbPath).length;
    if (size > bestSize) {
      bestSize = size;
      best = id;
    }
  }
  return best;
}

app.whenReady().then(() => {
  try {
    const dataDir = join(process.cwd(), 'data');
    const requested = process.argv[2] ?? null;
    const accountId = pickAccountId(dataDir, requested);
    if (!accountId) {
      console.error('No usable BlazeAudit account found under data/accounts/. Log in once in dev first.');
      app.exit(1);
      return;
    }

    const accountDirPath = join(dataDir, 'accounts', accountId);
    const sourceDb = join(accountDirPath, 'blazeaudit.db');
    const keyX = readKeyX(accountDirPath);
    if (!keyX) {
      console.error(
        'Could not read DB key from DPAPI cache.\n' +
          'Log in to BlazeAudit once so the key is cached, then re-run.',
      );
      app.exit(1);
      return;
    }

    rmSync(OUT_DIR, { recursive: true, force: true });
    mkdirSync(OUT_DIR, { recursive: true });

    const tempDb = join(OUT_DIR, 'blazeaudit.db.tmp');
    copyFileSync(sourceDb, tempDb);

    const db = new Database(tempDb);
    db.pragma("cipher='sqlcipher'");
    db.pragma(`key="x'${keyX}'"`);
    db.exec('SELECT count(*) FROM sqlite_master');
    db.pragma('journal_mode = DELETE');
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)');

    db.exec(`PRAGMA rekey="x'${DEMO_KEY_X}'"`);
    db.pragma(`key="x'${DEMO_KEY_X}'"`);
    db.exec('SELECT count(*) FROM sqlite_master');

    db.prepare(`UPDATE business_profile SET email = ? WHERE id = 'default'`).run(DEMO_EMAIL);
    const profile = db.prepare(`SELECT email FROM business_profile LIMIT 1`).get();
    console.log(`Business profile email → ${profile?.email ?? '(not found)'}`);

    const counts = {
      clients: db.prepare(`SELECT count(*) AS n FROM clients`).get()?.n ?? 0,
      inspections: db.prepare(`SELECT count(*) AS n FROM inspections`).get()?.n ?? 0,
    };
    console.log(`Seed content: ${counts.clients} clients, ${counts.inspections} documents`);

    db.close();

    const destDb = join(OUT_DIR, 'blazeaudit.db');
    copyFileSync(tempDb, destDb);
    rmSync(tempDb, { force: true });

    const assetsSrc = join(accountDirPath, 'assets');
    if (existsSync(assetsSrc)) {
      cpSync(assetsSrc, join(OUT_DIR, 'assets'), { recursive: true });
      console.log('Copied account assets.');
    }

    writeFileSync(join(OUT_DIR, 'demo.flag'), 'demo\n', 'utf8');

    const sha = createHash('sha256').update(readFileSync(destDb)).digest('hex').slice(0, 16);
    console.log(`\nDemo seed ready → ${OUT_DIR}`);
    console.log(`  account source: ${accountId}`);
    console.log(`  db sha256 prefix: ${sha}`);
    console.log(`  login: ${DEMO_EMAIL} / password`);
    app.exit(0);
  } catch (err) {
    console.error(err);
    app.exit(1);
  }
});
