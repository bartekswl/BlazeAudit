import Database from 'better-sqlite3-multiple-ciphers';
import { dbFilePath } from '../db/paths';
import type { Db } from '../db/types';

/**
 * Re-encrypt an on-disk SQLCipher DB from one key X to another.
 * Connection must be closed. No-op when keys match.
 */
export function rekeyDatabaseFile(fromKeyX: string, toKeyX: string, filePath = dbFilePath()): void {
  if (fromKeyX.toLowerCase() === toKeyX.toLowerCase()) return;
  if (!/^[0-9a-f]{64}$/i.test(fromKeyX) || !/^[0-9a-f]{64}$/i.test(toKeyX)) {
    throw new Error('Database key is malformed.');
  }

  const db = new Database(filePath) as Db;
  try {
    db.pragma("cipher='sqlcipher'");
    db.pragma(`key="x'${fromKeyX}'"`);
    db.exec('SELECT count(*) FROM sqlite_master');
    db.exec(`PRAGMA rekey="x'${toKeyX}'"`);
    db.pragma(`key="x'${toKeyX}'"`);
    db.exec('SELECT count(*) FROM sqlite_master');
  } finally {
    db.close();
  }
}
