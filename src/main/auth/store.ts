import { safeStorage } from 'electron';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { PasswordWrap } from './crypto';
import { accountDir } from '../db/paths';

export interface AuthManifest {
  version: 1;
  email: string;
  instanceId: string;
  activatedAt: string;
  passwordSet: boolean;
  /** sha256(keyX) prefix — ties this account folder to one key, not install-wide. */
  keyXId?: string;
  /** Set by Log out — requires password on next app launch (ignores remember policy). */
  requirePasswordOnLaunch?: boolean;
  /** @deprecated Migrated to accounts/<id>/settings.json */
  loginPolicy?: import('../../shared/loginPolicy').LoginPolicy;
  lastUnlockAt?: string;
}

const authDir = () => {
  const dir = path.join(accountDir(), 'auth');
  mkdirSync(dir, { recursive: true });
  return dir;
};

function dpapiWrite(name: string, value: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS secure storage (DPAPI) is unavailable.');
  }
  const file = path.join(authDir(), name);
  writeFileSync(file, safeStorage.encryptString(value), { mode: 0o600 });
}

function dpapiRead(name: string): string | null {
  const file = path.join(authDir(), name);
  if (!existsSync(file) || !safeStorage.isEncryptionAvailable()) return null;
  return safeStorage.decryptString(readFileSync(file));
}

export function readManifest(): AuthManifest | null {
  const file = path.join(authDir(), 'manifest.json');
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf8')) as AuthManifest;
}

export function writeManifest(manifest: AuthManifest): void {
  const file = path.join(authDir(), 'manifest.json');
  writeFileSync(file, JSON.stringify(manifest, null, 2), { mode: 0o600 });
}

export function storeActivationToken(token: string): void {
  dpapiWrite('token.dpapi', token);
}

export function readActivationToken(): string | null {
  return dpapiRead('token.dpapi');
}

export function storePendingKeyX(keyX: string): void {
  dpapiWrite('keyx.pending.dpapi', keyX);
}

export function readPendingKeyX(): string | null {
  return dpapiRead('keyx.pending.dpapi');
}

export function clearPendingKeyX(): void {
  const file = path.join(authDir(), 'keyx.pending.dpapi');
  if (existsSync(file)) unlinkSync(file);
}

export function storePasswordWrap(wrap: PasswordWrap): void {
  const file = path.join(authDir(), 'keyx.wrap.json');
  writeFileSync(file, JSON.stringify(wrap), { mode: 0o600 });
}

export function readPasswordWrap(): PasswordWrap | null {
  const file = path.join(authDir(), 'keyx.wrap.json');
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf8')) as PasswordWrap;
}

export function isAccountActivated(): boolean {
  return readManifest() !== null;
}

export function storeDpapiKeyX(keyX: string): void {
  dpapiWrite('keyx.dpapi', keyX);
}

export function readDpapiKeyX(): string | null {
  return dpapiRead('keyx.dpapi');
}

export function touchLastUnlock(manifest: AuthManifest): void {
  writeManifest({ ...manifest, lastUnlockAt: new Date().toISOString() });
}
