import { closeDatabase, openDatabase } from '../db/connection';
import { seedDefaultTemplates } from '../db/seedTemplates';
import { LATEST_SCHEMA_VERSION, runMigrations } from '../db/migrations';
import { dbFilePath } from '../db/paths';

let unlocked = false;

export function isSessionUnlocked(): boolean {
  return unlocked;
}

export function unlockDatabaseWithKey(keyX: string): void {
  closeDatabase();
  const db = openDatabase(keyX);
  runMigrations(db);
  seedDefaultTemplates();
  unlocked = true;
  console.log(`[db] unlocked (schema v${LATEST_SCHEMA_VERSION}) → ${dbFilePath()}`);
}

export function lockDatabaseSession(): void {
  closeDatabase();
  unlocked = false;
  console.log('[auth] session locked');
}
