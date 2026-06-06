import Database from 'better-sqlite3-multiple-ciphers';
import { getOrCreateDbKey } from './key';
import { dbFilePath } from './paths';
import type { Db } from './types';

let db: Db | null = null;

/**
 * Opens (and unlocks) the encrypted database. The connection is created once and
 * reused. Must be called after `app` is ready (needs userData path + DPAPI).
 */
export function openDatabase(): Db {
  if (db) return db;

  const key = getOrCreateDbKey();
  const connection: Db = new Database(dbFilePath());

  // Configure SQLCipher BEFORE any read/write. Raw 256-bit key (no KDF).
  connection.pragma("cipher='sqlcipher'");
  connection.pragma(`key="x'${key}'"`);

  // Fail fast if the key is wrong / file is corrupt.
  connection.exec('SELECT count(*) FROM sqlite_master');

  connection.pragma('journal_mode = WAL');
  connection.pragma('foreign_keys = ON');

  db = connection;
  return db;
}

export function getDatabase(): Db {
  if (!db) throw new Error('Database not initialized. Call openDatabase() first.');
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
