/**
 * Database backup / restore types.
 *
 * Removable feature: delete `src/main/backup/`, drop these IPC channels + UI
 * buttons, and clear `DATABASE_BACKUP_FEATURE_ENABLED`.
 */

export const DATABASE_BACKUP_FEATURE_ENABLED = true;

export const DATABASE_BACKUP_MAGIC = 'BBAK';
export const DATABASE_BACKUP_FORMAT_VERSION = 1;
export const DATABASE_BACKUP_EXTENSION = 'blazebak';

export type DatabaseBackupRecency = 'newer' | 'older' | 'same';

export type DatabaseBackupHeader = {
  formatVersion: typeof DATABASE_BACKUP_FORMAT_VERSION;
  accountEmail: string;
  schemaVersion: number;
  createdAt: string;
  /** Max mtime of packed data at export time (ISO). */
  dataStamp: string;
  appVersion: string;
  /**
   * Key X sealed to the account email so another machine unlocked under the
   * same email can decrypt the body and re-key the DB to its local key X.
   */
  keyXRecovery?: string;
};

export type DatabaseBackupInspectResult =
  | { canceled: true }
  | {
      canceled: false;
      filePath: string;
      header: DatabaseBackupHeader;
      localDataStamp: string;
      recency: DatabaseBackupRecency;
      sameAccount: true;
    };

export type DatabaseBackupExportResult =
  | { saved: false }
  | { saved: true; filePath: string; createdAt: string; dataStamp: string };

export type DatabaseBackupApplyResult =
  | { applied: false; reason: 'canceled' }
  | { applied: true; filePath: string; recency: DatabaseBackupRecency };
