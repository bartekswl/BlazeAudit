import { app } from 'electron';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Where local DB files live.
 *
 * - **Dev** (not packaged): `<project>/data/` only. Never AppData. Gitignored.
 * - **Production** (packaged installer): `%APPDATA%/BlazeAudit/data/`.
 */
export function dataDir(): string {
  const base = app.isPackaged
    ? path.join(app.getPath('userData'), 'data')
    : path.join(process.cwd(), 'data');
  mkdirSync(base, { recursive: true });
  return base;
}

export function dbFilePath(): string {
  return path.join(dataDir(), 'blazeaudit.db');
}

export function keyFilePath(): string {
  return path.join(dataDir(), 'db.key');
}
