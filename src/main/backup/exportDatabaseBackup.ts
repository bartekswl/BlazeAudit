import { app, dialog } from 'electron';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  DATABASE_BACKUP_EXTENSION,
  type DatabaseBackupExportResult,
} from '../../shared/databaseBackup';
import { requireSessionKeyX } from '../auth/session';
import { readManifest } from '../auth/store';
import { getDatabase } from '../db/connection';
import { LATEST_SCHEMA_VERSION } from '../db/migrations';
import { accountDir } from '../db/paths';
import { buildBackupFile } from './format';
import { readFileEntry } from './pack';
import { computeLocalDataStamp, listBackupSourceFiles, normalizeAccountEmail } from './stamp';

function checkpointDatabase(): void {
  try {
    getDatabase().pragma('wal_checkpoint(TRUNCATE)');
  } catch {
    /* best effort — copy still proceeds */
  }
}

function snapshotDatabaseToTemp(): string {
  const tempDb = path.join(
    os.tmpdir(),
    `blazeaudit-backup-${process.pid}-${Date.now()}.db`,
  );
  const escaped = tempDb.replace(/'/g, "''");
  getDatabase().exec(`VACUUM INTO '${escaped}'`);
  return tempDb;
}

export async function exportDatabaseBackup(): Promise<DatabaseBackupExportResult> {
  const manifest = readManifest();
  if (!manifest?.email) throw new Error('No active account.');
  const keyX = requireSessionKeyX();

  checkpointDatabase();

  const createdAt = new Date().toISOString();
  const dataStamp = computeLocalDataStamp();
  const defaultName = `BlazeAudit-backup-${createdAt.slice(0, 10)}.${DATABASE_BACKUP_EXTENSION}`;

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export database backup',
    defaultPath: defaultName,
    filters: [
      { name: 'BlazeAudit backup', extensions: [DATABASE_BACKUP_EXTENSION] },
      { name: 'All files', extensions: ['*'] },
    ],
  });

  if (canceled || !filePath) return { saved: false };

  let tempDb: string | null = null;
  try {
    tempDb = snapshotDatabaseToTemp();
    const entries = [];
    entries.push(readFileEntry(tempDb, 'blazeaudit.db'));

    for (const file of listBackupSourceFiles(accountDir())) {
      if (file.relativePath === 'blazeaudit.db') continue;
      entries.push(readFileEntry(file.absolutePath, file.relativePath));
    }

    const file = buildBackupFile({
      header: {
        accountEmail: normalizeAccountEmail(manifest.email),
        schemaVersion: LATEST_SCHEMA_VERSION,
        createdAt,
        dataStamp,
        appVersion: app.getVersion(),
      },
      entries,
      keyX,
    });

    fs.writeFileSync(filePath, file);
    return { saved: true, filePath, createdAt, dataStamp };
  } finally {
    if (tempDb && fs.existsSync(tempDb)) {
      try {
        fs.unlinkSync(tempDb);
      } catch {
        /* ignore */
      }
    }
  }
}
