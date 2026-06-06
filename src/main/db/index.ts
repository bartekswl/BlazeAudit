import { openDatabase } from './connection';
import { LATEST_SCHEMA_VERSION, runMigrations } from './migrations';

/** Opens the encrypted database and brings the schema up to date. */
export function initDatabase(): void {
  const db = openDatabase();
  runMigrations(db);
  console.log(`[db] ready (schema v${LATEST_SCHEMA_VERSION})`);
}

export { getDatabase, closeDatabase } from './connection';
export * as clients from './clients';
