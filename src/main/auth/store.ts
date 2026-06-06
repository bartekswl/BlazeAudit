import { safeStorage } from 'electron';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { PasswordWrap } from './crypto';
import { ensureAccountRecordSecret } from './recordSecret';
import { readSignedBinaryRecord, writeSignedBinaryRecord } from '../storage/binaryRecord';
import { RecordTamperError } from '../storage/recordSeal';
import { accountDir } from '../db/paths';

export interface AuthManifest {
  version: 1;
  email: string;
  instanceId: string;
  activatedAt: string;
  passwordSet: boolean;
  /** sha256(keyX) prefix — ties this account folder to one key, not install-wide. */
  keyXId?: string;
  /** Bumped on log out / password gate — must match DPAPI cache epoch. */
  unlockEpoch?: number;
  /** Set by Log out — requires password on next app launch (ignores remember policy). */
  requirePasswordOnLaunch?: boolean;
  /** @deprecated Migrated to accounts/<id>/settings.bin */
  loginPolicy?: import('../../shared/loginPolicy').LoginPolicy;
  lastUnlockAt?: string;
}

export interface DpapiKeyCache {
  keyX: string;
  epoch: number;
}

export class ManifestTamperedError extends Error {
  constructor() {
    super('Account manifest was modified outside BlazeAudit.');
    this.name = 'ManifestTamperedError';
  }
}

export class SettingsTamperedError extends Error {
  constructor() {
    super('Account settings were modified outside BlazeAudit.');
    this.name = 'SettingsTamperedError';
  }
}

const authDir = () => {
  const dir = path.join(accountDir(), 'auth');
  mkdirSync(dir, { recursive: true });
  return dir;
};

const manifestBin = () => path.join(authDir(), 'manifest.bin');
const manifestJson = () => path.join(authDir(), 'manifest.json');
const wrapBin = () => path.join(authDir(), 'keyx.wrap.bin');
const wrapJson = () => path.join(authDir(), 'keyx.wrap.json');

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

function readSigned<T>(binPath: string, jsonPath: string): T | null {
  try {
    return readSignedBinaryRecord<T>(binPath, jsonPath, ensureAccountRecordSecret());
  } catch (e) {
    if (e instanceof RecordTamperError) throw e;
    throw e;
  }
}

function writeSigned(path: string, value: unknown): void {
  writeSignedBinaryRecord(path, value, ensureAccountRecordSecret());
}

export function currentUnlockEpoch(manifest: AuthManifest): number {
  return manifest.unlockEpoch ?? 1;
}

export function bumpUnlockEpoch(manifest: AuthManifest): AuthManifest {
  const updated = { ...manifest, unlockEpoch: currentUnlockEpoch(manifest) + 1 };
  writeManifest(updated);
  return updated;
}

export function readManifest(): AuthManifest | null {
  try {
    return readSigned<AuthManifest>(manifestBin(), manifestJson());
  } catch (e) {
    if (e instanceof RecordTamperError) {
      clearDpapiKeyX();
      throw new ManifestTamperedError();
    }
    throw e;
  }
}

export function writeManifest(manifest: AuthManifest): void {
  ensureAccountRecordSecret();
  writeSigned(manifestBin(), manifest);
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
  writeSigned(wrapBin(), wrap);
}

export function readPasswordWrap(): PasswordWrap | null {
  try {
    return readSigned<PasswordWrap>(wrapBin(), wrapJson());
  } catch (e) {
    if (e instanceof RecordTamperError) {
      clearDpapiKeyX();
      throw new ManifestTamperedError();
    }
    throw e;
  }
}

export function isAccountActivated(): boolean {
  try {
    return readManifest() !== null;
  } catch (e) {
    if (e instanceof ManifestTamperedError) return true;
    throw e;
  }
}

export function storeDpapiKeyX(keyX: string, epoch: number): void {
  const payload: DpapiKeyCache = { keyX, epoch };
  dpapiWrite('keyx.dpapi', JSON.stringify(payload));
}

export function readDpapiKeyCache(): DpapiKeyCache | null {
  const raw = dpapiRead('keyx.dpapi');
  if (!raw) return null;

  if (/^[0-9a-f]{64}$/i.test(raw)) return null;

  try {
    const parsed = JSON.parse(raw) as DpapiKeyCache;
    if (!/^[0-9a-f]{64}$/i.test(parsed.keyX) || typeof parsed.epoch !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDpapiKeyX(): void {
  const file = path.join(authDir(), 'keyx.dpapi');
  if (existsSync(file)) unlinkSync(file);
}

export function touchLastUnlock(manifest: AuthManifest): void {
  writeManifest({ ...manifest, lastUnlockAt: new Date().toISOString() });
}
