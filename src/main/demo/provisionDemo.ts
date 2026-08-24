import { app } from 'electron';
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3-multiple-ciphers';
import { accountIdFromEmail } from '../../shared/accountId';
import { DEMO_EMAIL, DEMO_KEY_X, DEMO_PASSWORD } from '../../shared/demo';
import { setActiveAccountId } from '../auth/context';
import { wrapKeyWithPassword } from '../auth/crypto';
import { createInstanceId } from '../auth/instance';
import { keyXFingerprint } from '../auth/keyX';
import {
  accountExists,
  hasAnyAccount,
  registerAccount,
} from '../auth/registry';
import { ensureAccountRecordSecret } from '../auth/recordSecret';
import { ensureProfileRecordSecret } from '../auth/profileSecret';
import {
  storeActivationToken,
  storeDpapiKeyX,
  storePasswordWrap,
  writeManifest,
} from '../auth/store';
import { issueDevActivationToken } from '../auth/token';
import { clearAuthStatusCache } from '../auth/statusCache';
import { setLoginPolicy as persistLoginPolicy } from '../settings/store';
import { accountDir, dataDir, dbFilePath } from '../db/paths';
import type { Db } from '../db/types';
import { demoResourcesDir, isDemoBuild } from './isDemoBuild';

function copyDirIfExists(from: string, to: string): void {
  if (!existsSync(from)) return;
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}

function removeDbSidecars(accountId: string): void {
  const root = accountDir(accountId);
  for (const name of ['blazeaudit.db', 'blazeaudit.db-wal', 'blazeaudit.db-shm'] as const) {
    const full = path.join(root, name);
    if (existsSync(full)) rmSync(full, { force: true });
  }
}

/** Uninstall leaves AppData — wipe so a reinstall can provision cleanly. */
function wipeDemoUserData(): void {
  const root = dataDir();
  if (!existsSync(root)) return;
  for (const entry of readdirSync(root)) {
    rmSync(path.join(root, entry), { recursive: true, force: true });
  }
  console.warn('[demo] Cleared leftover AppData under', root);
}

function canOpenDbWithDemoKey(accountId: string): boolean {
  const file = dbFilePath(accountId);
  if (!existsSync(file)) return false;
  let db: Db | null = null;
  try {
    db = new Database(file);
    db.pragma("cipher='sqlcipher'");
    db.pragma(`key="x'${DEMO_KEY_X}'"`);
    db.exec('SELECT count(*) FROM sqlite_master');
    return true;
  } catch {
    return false;
  } finally {
    try {
      db?.close();
    } catch {
      /* ignore */
    }
  }
}

function restoreSeedFiles(accountId: string): void {
  const seedDb = path.join(demoResourcesDir(), 'blazeaudit.db');
  if (!existsSync(seedDb)) {
    throw new Error('Demo seed database is missing from the installer.');
  }
  const destDir = accountDir(accountId);
  mkdirSync(destDir, { recursive: true });
  removeDbSidecars(accountId);
  copyFileSync(seedDb, path.join(destDir, 'blazeaudit.db'));
  const assetsDest = path.join(destDir, 'assets');
  if (existsSync(assetsDest)) {
    rmSync(assetsDest, { recursive: true, force: true });
  }
  copyDirIfExists(path.join(demoResourcesDir(), 'assets'), assetsDest);
}

async function writeKnownDemoAuth(email: string, accountId: string): Promise<void> {
  setActiveAccountId(accountId);
  ensureProfileRecordSecret();
  ensureAccountRecordSecret();

  const instanceId = createInstanceId();
  const token = issueDevActivationToken({
    email,
    instanceId,
    issuedAt: new Date().toISOString(),
  });

  const wrap = await wrapKeyWithPassword(DEMO_KEY_X, DEMO_PASSWORD);
  storePasswordWrap(wrap);
  storeActivationToken(token);

  writeManifest({
    version: 1,
    email,
    instanceId,
    activatedAt: new Date().toISOString(),
    passwordSet: true,
    keyXId: keyXFingerprint(DEMO_KEY_X),
    unlockEpoch: 1,
    lastUnlockAt: new Date().toISOString(),
    requirePasswordOnLaunch: false,
  });

  persistLoginPolicy('never');
  storeDpapiKeyX(DEMO_KEY_X, 1);
  clearAuthStatusCache();
}

async function provisionFreshDemo(): Promise<void> {
  const seedDb = path.join(demoResourcesDir(), 'blazeaudit.db');
  if (!existsSync(seedDb)) {
    console.warn('[demo] Seed database missing — skipping demo provisioning.');
    return;
  }

  const email = DEMO_EMAIL.trim().toLowerCase();
  const accountId = accountIdFromEmail(email);
  setActiveAccountId(accountId);

  restoreSeedFiles(accountId);
  registerAccount(email);
  await writeKnownDemoAuth(email, accountId);

  console.log(`[demo] Provisioned tester account (${email}) with bundled data.`);
}

/**
 * Reinstalls leave AppData behind (`deleteAppDataOnUninstall: false`). If the
 * leftover account/password wrap no longer matches the demo DB key, login fails
 * with "Incorrect password." Repair auth (and restore the seed DB when needed).
 */
async function ensureDemoLoginWorks(): Promise<void> {
  const email = DEMO_EMAIL.trim().toLowerCase();
  const accountId = accountIdFromEmail(email);
  setActiveAccountId(accountId);

  if (!accountExists(accountId)) {
    console.warn('[demo] Registry has accounts but not the demo email — resetting.');
    wipeDemoUserData();
    await provisionFreshDemo();
    return;
  }

  if (!canOpenDbWithDemoKey(accountId)) {
    console.warn('[demo] DB does not open with demo key — restoring seed database.');
    restoreSeedFiles(accountId);
  }

  await writeKnownDemoAuth(email, accountId);
  console.log(`[demo] Repaired tester login for ${email}.`);
}

/** First launch (or repair after leftover AppData) for the demo installer. */
export async function provisionDemoIfNeeded(): Promise<void> {
  if (!app.isPackaged || !isDemoBuild()) return;

  try {
    if (!hasAnyAccount()) {
      await provisionFreshDemo();
      return;
    }
    await ensureDemoLoginWorks();
  } catch (error) {
    console.warn('[demo] Provision/repair failed — full local reset.', error);
    try {
      wipeDemoUserData();
      await provisionFreshDemo();
    } catch (resetError) {
      console.error('[demo] Reset after failure also failed:', resetError);
    }
  }
}
