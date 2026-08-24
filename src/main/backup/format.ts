import { app } from 'electron';
import {
  DATABASE_BACKUP_FORMAT_VERSION,
  DATABASE_BACKUP_MAGIC,
  type DatabaseBackupHeader,
  type DatabaseBackupRecency,
} from '../../shared/databaseBackup';
import {
  decryptWithKeyX,
  encryptWithKeyX,
  openKeyXFromEmailRecovery,
  sealKeyXForEmailRecovery,
} from './crypto';
import { packEntries, unpackEntries, type PackedEntry } from './pack';
import { normalizeAccountEmail } from './stamp';

function isHeader(value: unknown): value is DatabaseBackupHeader {
  if (!value || typeof value !== 'object') return false;
  const h = value as Record<string, unknown>;
  if (
    h.formatVersion !== DATABASE_BACKUP_FORMAT_VERSION ||
    typeof h.accountEmail !== 'string' ||
    typeof h.schemaVersion !== 'number' ||
    typeof h.createdAt !== 'string' ||
    typeof h.dataStamp !== 'string' ||
    typeof h.appVersion !== 'string'
  ) {
    return false;
  }
  if (h.keyXRecovery !== undefined && typeof h.keyXRecovery !== 'string') {
    return false;
  }
  return true;
}

export function buildBackupFile(args: {
  header: Omit<DatabaseBackupHeader, 'formatVersion' | 'appVersion' | 'keyXRecovery'> & {
    appVersion?: string;
  };
  entries: PackedEntry[];
  keyX: string;
}): Buffer {
  const accountEmail = normalizeAccountEmail(args.header.accountEmail);
  const header: DatabaseBackupHeader = {
    formatVersion: DATABASE_BACKUP_FORMAT_VERSION,
    accountEmail,
    schemaVersion: args.header.schemaVersion,
    createdAt: args.header.createdAt,
    dataStamp: args.header.dataStamp,
    appVersion: args.header.appVersion ?? app.getVersion(),
    keyXRecovery: sealKeyXForEmailRecovery(args.keyX, accountEmail),
  };

  const headerJson = Buffer.from(JSON.stringify(header), 'utf8');
  const packed = packEntries(args.entries);
  const encrypted = encryptWithKeyX(packed, args.keyX);

  const magic = Buffer.from(DATABASE_BACKUP_MAGIC, 'ascii');
  const headerLen = Buffer.alloc(4);
  headerLen.writeUInt32BE(headerJson.length, 0);
  return Buffer.concat([magic, headerLen, headerJson, encrypted]);
}

export function readBackupHeader(file: Buffer): DatabaseBackupHeader {
  if (file.length < 8) throw new Error('Backup file is corrupt or incomplete.');
  const magic = file.subarray(0, 4).toString('ascii');
  if (magic !== DATABASE_BACKUP_MAGIC) {
    throw new Error('Not a BlazeAudit database backup file.');
  }
  const headerLen = file.readUInt32BE(4);
  if (headerLen < 2 || 8 + headerLen > file.length) {
    throw new Error('Backup file is corrupt or incomplete.');
  }
  const raw = file.subarray(8, 8 + headerLen).toString('utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Backup header is corrupt.');
  }
  if (!isHeader(parsed)) {
    throw new Error('Unsupported or corrupt backup header.');
  }
  return parsed;
}

export type OpenedBackup = {
  header: DatabaseBackupHeader;
  entries: PackedEntry[];
  /** Key X that encrypts the packed body / SQLCipher snapshot. */
  sourceKeyX: string;
};

/**
 * Open a backup for an unlocked session whose email already matched the header.
 * Prefers the local key X; falls back to email-bound recovery (cross-machine).
 */
export function openBackupForAccount(file: Buffer, localKeyX: string): OpenedBackup {
  const header = readBackupHeader(file);
  const headerLen = file.readUInt32BE(4);
  const encrypted = file.subarray(8 + headerLen);
  const email = normalizeAccountEmail(header.accountEmail);

  try {
    const packed = decryptWithKeyX(encrypted, localKeyX);
    return {
      header,
      entries: unpackEntries(packed),
      sourceKeyX: localKeyX.toLowerCase(),
    };
  } catch (localErr) {
    if (!header.keyXRecovery) {
      throw localErr instanceof Error
        ? localErr
        : new Error(
            'This backup cannot be opened with the current account. Export a new backup from the source machine.',
          );
    }
    const sourceKeyX = openKeyXFromEmailRecovery(header.keyXRecovery, email);
    try {
      const packed = decryptWithKeyX(encrypted, sourceKeyX);
      return {
        header,
        entries: unpackEntries(packed),
        sourceKeyX,
      };
    } catch {
      throw new Error(
        'This backup cannot be opened for this account email. Export a new backup from the source machine.',
      );
    }
  }
}

/** @deprecated Prefer openBackupForAccount — kept for narrow call sites. */
export function decryptBackupEntries(file: Buffer, keyX: string): PackedEntry[] {
  return openBackupForAccount(file, keyX).entries;
}

export function compareBackupRecency(
  backupDataStamp: string,
  localDataStamp: string,
): DatabaseBackupRecency {
  const backupMs = Date.parse(backupDataStamp);
  const localMs = Date.parse(localDataStamp);
  if (!Number.isFinite(backupMs) || !Number.isFinite(localMs)) return 'same';
  if (backupMs > localMs + 1000) return 'newer';
  if (backupMs < localMs - 1000) return 'older';
  return 'same';
}
