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
  {
    version: 2,
    up: (db) => {
      db.exec(`
        ALTER TABLE clients ADD COLUMN street TEXT NOT NULL DEFAULT '';
        ALTER TABLE clients ADD COLUMN unit TEXT NOT NULL DEFAULT '';
        ALTER TABLE clients ADD COLUMN city TEXT NOT NULL DEFAULT '';
        ALTER TABLE clients ADD COLUMN post_code TEXT NOT NULL DEFAULT '';
        ALTER TABLE clients ADD COLUMN country TEXT NOT NULL DEFAULT '';
        ALTER TABLE clients ADD COLUMN province TEXT NOT NULL DEFAULT '';
      `);
      db.exec(`
        UPDATE clients
           SET street = address
         WHERE street = '' AND address != '';
      `);
    },
  },
  {
    version: 3,
    up: (db) => {
      db.exec(`
        CREATE TABLE templates (
          id          TEXT PRIMARY KEY,
          seed_id     TEXT UNIQUE,
          name        TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          document    TEXT NOT NULL,
          version     INTEGER NOT NULL DEFAULT 1,
          created_at  TEXT NOT NULL,
          updated_at  TEXT NOT NULL
        );

        CREATE INDEX idx_templates_name ON templates (name);
      `);
    },
  },
  {
    version: 4,
    up: (db) => {
      db.exec(`
        CREATE TABLE inspections (
          id           TEXT PRIMARY KEY,
          client_id    TEXT NOT NULL REFERENCES clients(id),
          template_id  TEXT REFERENCES templates(id),
          title        TEXT NOT NULL,
          status       TEXT NOT NULL DEFAULT 'draft',
          inspector    TEXT NOT NULL DEFAULT '',
          document     TEXT NOT NULL,
          inspected_at TEXT,
          cadence      TEXT NOT NULL DEFAULT 'annual',
          next_due_at  TEXT,
          created_at   TEXT NOT NULL,
          updated_at   TEXT NOT NULL
        );

        CREATE INDEX idx_inspections_client ON inspections (client_id);
        CREATE INDEX idx_inspections_status ON inspections (status);
        CREATE INDEX idx_inspections_next_due ON inspections (next_due_at);
        CREATE INDEX idx_inspections_updated ON inspections (updated_at);
      `);
    },
  },
  {
    version: 5,
    up: (db) => {
      db.exec(`
        CREATE TABLE business_profile (
          id            TEXT PRIMARY KEY,
          business_name TEXT NOT NULL DEFAULT '',
          logo_path     TEXT NOT NULL DEFAULT '',
          street        TEXT NOT NULL DEFAULT '',
          unit          TEXT NOT NULL DEFAULT '',
          city          TEXT NOT NULL DEFAULT '',
          post_code     TEXT NOT NULL DEFAULT '',
          country       TEXT NOT NULL DEFAULT '',
          province      TEXT NOT NULL DEFAULT '',
          updated_at    TEXT NOT NULL
        );

        CREATE TABLE inspectors (
          id              TEXT PRIMARY KEY,
          name            TEXT NOT NULL DEFAULT '',
          license_number  TEXT NOT NULL DEFAULT '',
          sort_order      INTEGER NOT NULL DEFAULT 0,
          created_at      TEXT NOT NULL,
          updated_at      TEXT NOT NULL
        );

        CREATE INDEX idx_inspectors_sort ON inspectors (sort_order);
      `);
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO business_profile (id, updated_at) VALUES ('default', ?)`,
      ).run(now);
    },
  },
  {
    version: 6,
    up: (db) => {
      db.exec(`
        ALTER TABLE clients ADD COLUMN owner_manager_name TEXT NOT NULL DEFAULT '';
        ALTER TABLE clients ADD COLUMN owner_manager_phone TEXT NOT NULL DEFAULT '';
        ALTER TABLE clients ADD COLUMN signal_receiving_center_name TEXT NOT NULL DEFAULT '';
        ALTER TABLE clients ADD COLUMN signal_receiving_center_phone TEXT NOT NULL DEFAULT '';
      `);
    },
  },
  {
    version: 7,
    up: (db) => {
      db.exec(`
        CREATE TABLE builtin_templates (
          id          TEXT PRIMARY KEY,
          seed_id     TEXT NOT NULL UNIQUE,
          name        TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          document    TEXT NOT NULL,
          version     INTEGER NOT NULL DEFAULT 1,
          created_at  TEXT NOT NULL,
          updated_at  TEXT NOT NULL
        );

        CREATE INDEX idx_builtin_templates_name ON builtin_templates (name);

        CREATE TABLE custom_templates (
          id          TEXT PRIMARY KEY,
          name        TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          document    TEXT NOT NULL,
          version     INTEGER NOT NULL DEFAULT 1,
          created_at  TEXT NOT NULL,
          updated_at  TEXT NOT NULL
        );

        CREATE INDEX idx_custom_templates_name ON custom_templates (name);
      `);

      db.exec(`
        INSERT INTO builtin_templates (id, seed_id, name, description, document, version, created_at, updated_at)
        SELECT id, seed_id, name, description, document, version, created_at, updated_at
          FROM templates
         WHERE seed_id IS NOT NULL;

        INSERT INTO custom_templates (id, name, description, document, version, created_at, updated_at)
        SELECT id, name, description, document, version, created_at, updated_at
          FROM templates
         WHERE seed_id IS NULL;
      `);

      db.exec(`
        CREATE TABLE inspections_new (
          id            TEXT PRIMARY KEY,
          client_id     TEXT NOT NULL REFERENCES clients(id),
          template_kind TEXT,
          template_id   TEXT,
          title         TEXT NOT NULL,
          status        TEXT NOT NULL DEFAULT 'draft',
          inspector     TEXT NOT NULL DEFAULT '',
          document      TEXT NOT NULL,
          inspected_at  TEXT,
          cadence       TEXT NOT NULL DEFAULT 'annual',
          next_due_at   TEXT,
          created_at    TEXT NOT NULL,
          updated_at    TEXT NOT NULL
        );

        INSERT INTO inspections_new (
          id, client_id, template_kind, template_id, title, status, inspector,
          document, inspected_at, cadence, next_due_at, created_at, updated_at
        )
        SELECT
          i.id,
          i.client_id,
          CASE
            WHEN i.template_id IS NOT NULL
              AND EXISTS (SELECT 1 FROM builtin_templates b WHERE b.id = i.template_id)
              THEN 'builtin'
            WHEN i.template_id IS NOT NULL
              AND EXISTS (SELECT 1 FROM custom_templates c WHERE c.id = i.template_id)
              THEN 'custom'
            ELSE NULL
          END,
          i.template_id,
          i.title,
          i.status,
          i.inspector,
          i.document,
          i.inspected_at,
          i.cadence,
          i.next_due_at,
          i.created_at,
          i.updated_at
        FROM inspections i;

        DROP TABLE inspections;
        ALTER TABLE inspections_new RENAME TO inspections;

        CREATE INDEX idx_inspections_client ON inspections (client_id);
        CREATE INDEX idx_inspections_status ON inspections (status);
        CREATE INDEX idx_inspections_next_due ON inspections (next_due_at);
        CREATE INDEX idx_inspections_updated ON inspections (updated_at);

        DROP TABLE templates;
      `);
    },
  },
  {
    version: 8,
    up: (db) => {
      db.exec(`
        UPDATE inspections
           SET template_kind = NULL, template_id = NULL
         WHERE template_kind = 'builtin';

        DELETE FROM builtin_templates;
      `);
    },
  },
  {
    version: 9,
    up: (db) => {
      db.exec(`
        ALTER TABLE builtin_templates ADD COLUMN code TEXT NOT NULL DEFAULT '';
        ALTER TABLE builtin_templates ADD COLUMN title TEXT NOT NULL DEFAULT '';
      `);
    },
  },
  {
    version: 10,
    up: (db) => {
      db.exec(`
        ALTER TABLE business_profile ADD COLUMN phone TEXT NOT NULL DEFAULT '';
        ALTER TABLE business_profile ADD COLUMN email TEXT NOT NULL DEFAULT '';
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
