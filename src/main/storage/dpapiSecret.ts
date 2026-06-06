import { safeStorage } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRecordSecret } from './recordSeal';

function writeDpapiSecret(filePath: string, secret: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS secure storage (DPAPI) is unavailable.');
  }
  const dir = path.dirname(filePath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, safeStorage.encryptString(secret), { mode: 0o600 });
}

function readDpapiSecret(filePath: string): string | null {
  if (!existsSync(filePath) || !safeStorage.isEncryptionAvailable()) return null;
  return safeStorage.decryptString(readFileSync(filePath));
}

export function ensureDpapiSecret(filePath: string): string {
  const existing = readDpapiSecret(filePath);
  if (existing) return existing;

  const secret = createRecordSecret();
  writeDpapiSecret(filePath, secret);
  return secret;
}
