import { dialog } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import {
  DATABASE_BACKUP_EXTENSION,
  type DatabaseBackupApplyResult,
  type DatabaseBackupInspectResult,
} from '../../shared/databaseBackup';
import { requireSessionKeyX, unlockDatabaseWithKey } from '../auth/session';
import { readManifest } from '../auth/store';
import { closeDatabase } from '../db/connection';
import { accountDir } from '../db/paths';
import { compareBackupRecency, decryptBackupEntries, readBackupHeader } from './format';
import { resolvePackedPath } from './pack';
import { computeLocalDataStamp, normalizeAccountEmail } from './stamp';

function assertSameAccount(backupEmail: string): void {
  const manifest = readManifest();
  if (!manifest?.email) throw new Error('No active account.');
  if (normalizeAccountEmail(manifest.email) !== normalizeAccountEmail(backupEmail)) {
    throw new Error(
      'This backup belongs to a different account. Import only works for the same email.',
    );
  }
}

export async function inspectDatabaseBackup(): Promise<DatabaseBackupInspectResult> {
  requireSessionKeyX();
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Import database backup',
    properties: ['openFile'],
    filters: [
      { name: 'BlazeAudit backup', extensions: [DATABASE_BACKUP_EXTENSION] },
      { name: 'All files', extensions: ['*'] },
    ],
  });

  if (canceled || filePaths.length === 0) return { canceled: true };

  const filePath = filePaths[0];
  const raw = fs.readFileSync(filePath);
  const header = readBackupHeader(raw);
  assertSameAccount(header.accountEmail);

  // Crypto binding — wrong key / tampered body fails here.
  decryptBackupEntries(raw, requireSessionKeyX());

  const localDataStamp = computeLocalDataStamp();
  const recency = compareBackupRecency(header.dataStamp, localDataStamp);

  return {
    canceled: false,
    filePath,
    header,
    localDataStamp,
    recency,
    sameAccount: true,
  };
}

function clearDirectoryContents(dir: string): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fs.rmSync(full, { recursive: true, force: true });
    } else {
      fs.unlinkSync(full);
    }
  }
}

function removeDbSidecars(root: string): void {
  for (const name of ['blazeaudit.db', 'blazeaudit.db-wal', 'blazeaudit.db-shm']) {
    const full = path.join(root, name);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  }
}

export async function applyDatabaseBackup(filePath: string): Promise<DatabaseBackupApplyResult> {
  if (!filePath || typeof filePath !== 'string') {
    return { applied: false, reason: 'canceled' };
  }

  const keyX = requireSessionKeyX();
  const raw = fs.readFileSync(filePath);
  const header = readBackupHeader(raw);
  assertSameAccount(header.accountEmail);

  const localDataStamp = computeLocalDataStamp();
  const recency = compareBackupRecency(header.dataStamp, localDataStamp);
  const entries = decryptBackupEntries(raw, keyX);

  const hasDb = entries.some((e) => e.relativePath === 'blazeaudit.db');
  if (!hasDb) throw new Error('Backup is missing the database file.');

  const root = accountDir();
  const safetyRoot = path.join(root, '.backup-import-safety');
  if (fs.existsSync(safetyRoot)) {
    fs.rmSync(safetyRoot, { recursive: true, force: true });
  }
  fs.mkdirSync(safetyRoot, { recursive: true });

  const preserveRelative = new Set([
    'blazeaudit.db',
    'blazeaudit.db-wal',
    'blazeaudit.db-shm',
    'settings.bin',
    'settings.json',
  ]);

  try {
    closeDatabase();

    // Snapshot current data for rollback.
    for (const name of preserveRelative) {
      const src = path.join(root, name);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(safetyRoot, name));
      }
    }
    const assetsSrc = path.join(root, 'assets');
    if (fs.existsSync(assetsSrc)) {
      fs.cpSync(assetsSrc, path.join(safetyRoot, 'assets'), { recursive: true });
    }

    removeDbSidecars(root);
    for (const name of ['settings.bin', 'settings.json'] as const) {
      const full = path.join(root, name);
      if (fs.existsSync(full)) fs.unlinkSync(full);
    }
    clearDirectoryContents(path.join(root, 'assets'));

    for (const entry of entries) {
      const target = resolvePackedPath(root, entry.relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, entry.data);
    }

    unlockDatabaseWithKey(keyX);
    fs.rmSync(safetyRoot, { recursive: true, force: true });

    return { applied: true, filePath, recency };
  } catch (error) {
    // Best-effort rollback to pre-import snapshot.
    try {
      closeDatabase();
      removeDbSidecars(root);
      for (const name of ['settings.bin', 'settings.json'] as const) {
        const full = path.join(root, name);
        if (fs.existsSync(full)) fs.unlinkSync(full);
      }
      clearDirectoryContents(path.join(root, 'assets'));

      for (const name of preserveRelative) {
        const src = path.join(safetyRoot, name);
        if (fs.existsSync(src)) fs.copyFileSync(src, path.join(root, name));
      }
      const assetsSafety = path.join(safetyRoot, 'assets');
      if (fs.existsSync(assetsSafety)) {
        fs.cpSync(assetsSafety, path.join(root, 'assets'), { recursive: true });
      }
      unlockDatabaseWithKey(keyX);
    } catch (rollbackError) {
      console.error('[backup] rollback failed:', rollbackError);
    }
    throw error;
  } finally {
    if (fs.existsSync(safetyRoot)) {
      try {
        fs.rmSync(safetyRoot, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  }
}
