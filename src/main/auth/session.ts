import { closeDatabase, openDatabase } from '../db/connection';
import { seedDefaultTemplates } from '../db/seedTemplates';
import { LATEST_SCHEMA_VERSION, runMigrations } from '../db/migrations';
import { dbFilePath } from '../db/paths';
import { clearAuthStatusCache } from './statusCache';

let unlocked = false;

export function isSessionUnlocked(): boolean {
  return unlocked;
}

export function unlockDatabaseWithKey(keyX: string): void {
  closeDatabase();
  const db = openDatabase(keyX);
  runMigrations(db);
  unlocked = true;
  console.log(`[db] unlocked (schema v${LATEST_SCHEMA_VERSION}) → ${dbFilePath()}`);
  setImmediate(() => {
    try {
      seedDefaultTemplates();
    } catch (error) {
      console.error('[templates] deferred seed failed:', error);
    }
  });
}

export function lockDatabaseSession(): void {
  closeDatabase();
  unlocked = false;
  clearAuthStatusCache();
  console.log('[auth] session locked');
}
