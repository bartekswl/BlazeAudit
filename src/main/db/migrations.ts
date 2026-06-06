import type { Db } from './types';

// Each migration bumps the SQLite `user_version`. Migrations run in order, once,
// inside a transaction. Add new migrations by appending to the array — never
// edit a shipped one (write a new one instead). See DATA_MODEL.md §3.
interface Migration {
  version: number;
  up: (db: Db) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      db.exec(`
        CREATE TABLE clients (
          id           TEXT PRIMARY KEY,
          name         TEXT NOT NULL,
          address      TEXT NOT NULL DEFAULT '',
          contact_name TEXT NOT NULL DEFAULT '',
          phone        TEXT NOT NULL DEFAULT '',
          email        TEXT NOT NULL DEFAULT '',
          notes        TEXT NOT NULL DEFAULT '',
          created_at   TEXT NOT NULL,
          updated_at   TEXT NOT NULL
        );

        CREATE INDEX idx_clients_name ON clients (name);

        CREATE TABLE app_meta (
          key   TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
    },
  },
];

/** Applies any migrations newer than the database's current `user_version`. */
export function runMigrations(db: Db): void {
  const current = db.pragma('user_version', { simple: true }) as number;

  for (const migration of migrations) {
    if (migration.version <= current) continue;
    const apply = db.transaction(() => {
      migration.up(db);
      // user_version doesn't accept bound params; the value is a trusted integer.
      db.pragma(`user_version = ${migration.version}`);
    });
    apply();
  }
}

export const LATEST_SCHEMA_VERSION = migrations[migrations.length - 1].version;
