import { app } from 'electron';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { getActiveAccountId, requireActiveAccountId } from '../auth/context';

/**
 * Local data root. Dev: `<project>/data/`; packaged: per Windows profile AppData.
 * Each BlazeAudit account gets `accounts/<opaque-id>/` under this root.
 */
export function dataDir(): string {
  const base = app.isPackaged
    ? path.join(app.getPath('userData'), 'data')
    : path.join(process.cwd(), 'data');

  mkdirSync(base, { recursive: true });
  return base;
}

/** Opaque per-account directory — id is sha256(email), not the email itself. */
export function accountDir(accountId?: string): string {
  const id = accountId ?? requireActiveAccountId();
  const dir = path.join(dataDir(), 'accounts', id);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function dbFilePath(accountId?: string): string {
  return path.join(accountDir(accountId), 'blazeaudit.db');
}

/** Human-readable path label for UI. */
export function describeDataDir(): string {
  const id = getActiveAccountId();
  const accountPath = id ? accountDir(id) : dataDir();
  if (app.isPackaged) return accountPath;
  return `${accountPath} (dev)`;
}
