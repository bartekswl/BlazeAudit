import { closeDatabase, openDatabase } from '../db/connection';
import { LATEST_SCHEMA_VERSION, runMigrations } from '../db/migrations';
import { dbFilePath } from '../db/paths';
import { clearAuthStatusCache } from './statusCache';

let unlocked = false;
/** In-memory session key — cleared on lock. Used by database backup export/import. */
let sessionKeyX: string | null = null;

export function isSessionUnlocked(): boolean {
  return unlocked;
}

export function requireSessionKeyX(): string {
  if (!sessionKeyX) throw new Error('Database is locked. Log in to continue.');
  return sessionKeyX;
}

export function unlockDatabaseWithKey(keyX: string): void {
  closeDatabase();
  const db = openDatabase(keyX);
  runMigrations(db);
  unlocked = true;
  sessionKeyX = keyX;
  console.log(`[db] unlocked (schema v${LATEST_SCHEMA_VERSION}) → ${dbFilePath()}`);
  setImmediate(async () => {
    try {
      const { seedDefaultTemplates } = await import('../db/seedTemplates');
      seedDefaultTemplates();
    } catch (error) {
      console.error('[templates] deferred seed failed:', error);
    }
  });
}

export function lockDatabaseSession(): void {
  closeDatabase();
  unlocked = false;
  sessionKeyX = null;
  clearAuthStatusCache();
  console.log('[auth] session locked');
}
