import { app, safeStorage } from 'electron';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 key handling (bridge until Phase 3).
//
// The *real* per-account key ("key X") is provisioned during online activation
// and additionally wrapped by the local login password — that's Phase 3. Until
// then we still want genuine encryption at rest, so we:
//
//   1. generate a random 256-bit key on first run,
//   2. protect it with Windows DPAPI (Electron `safeStorage`), tied to the OS
//      user, and store the ciphertext on disk,
//   3. load + decrypt it on subsequent launches.
//
// This is forward-compatible: in Phase 3 the same key becomes "key X" with
// password-wrapping and server escrow layered on top.
// ─────────────────────────────────────────────────────────────────────────────

const KEY_FILE = 'db.key';

function dataDir(): string {
  const dir = path.join(app.getPath('userData'), 'data');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function keyFilePath(): string {
  return path.join(dataDir(), KEY_FILE);
}

/**
 * Returns the database key as a 64-char hex string, creating and persisting a
 * new DPAPI-protected key on first run.
 */
export function getOrCreateDbKey(): string {
  if (!safeStorage.isEncryptionAvailable()) {
    // On Windows this is backed by DPAPI and is available after `app` is ready.
    throw new Error('OS secure storage (DPAPI) is unavailable; cannot protect the database key.');
  }

  const file = keyFilePath();

  if (existsSync(file)) {
    const ciphertext = readFileSync(file);
    const hex = safeStorage.decryptString(ciphertext);
    if (!/^[0-9a-f]{64}$/i.test(hex)) {
      throw new Error('Stored database key is malformed.');
    }
    return hex;
  }

  const hex = randomBytes(32).toString('hex');
  writeFileSync(file, safeStorage.encryptString(hex), { mode: 0o600 });
  return hex;
}
