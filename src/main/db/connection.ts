import Database from 'better-sqlite3-multiple-ciphers';
import { dbFilePath } from './paths';
import type { Db } from './types';

let db: Db | null = null;

/**
 * Opens (and unlocks) the encrypted database with the supplied key X (64-char hex).
 * The connection is created once per session and reused until closeDatabase().
 */
export function openDatabase(keyX: string): Db {
  if (db) return db;

  if (!/^[0-9a-f]{64}$/i.test(keyX)) {
    throw new Error('Database key is malformed.');
  }

  const connection: Db = new Database(dbFilePath());

  connection.pragma("cipher='sqlcipher'");
  connection.pragma(`key="x'${keyX}'"`);

  connection.exec('SELECT count(*) FROM sqlite_master');

  connection.pragma('journal_mode = WAL');
  connection.pragma('foreign_keys = ON');

  db = connection;
  return db;
}

export function getDatabase(): Db {
  if (!db) throw new Error('Database is locked. Log in to continue.');
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
