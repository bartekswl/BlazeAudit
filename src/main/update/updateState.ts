import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

export type UpdateState = {
  currentVersion: string;
  previousVersion: string | null;
};

function statePath(): string {
  return path.join(app.getPath('userData'), 'update-state.json');
}

/** After an upgrade, remember the version we came from (for rollback). */
export function syncUpdateStateOnStartup(): UpdateState {
  const current = app.getVersion();
  let next: UpdateState = { currentVersion: current, previousVersion: null };

  try {
    if (fs.existsSync(statePath())) {
      const stored = JSON.parse(fs.readFileSync(statePath(), 'utf8')) as UpdateState;
      if (stored.currentVersion && stored.currentVersion !== current) {
        next = { currentVersion: current, previousVersion: stored.currentVersion };
      } else {
        next = {
          currentVersion: current,
          previousVersion: stored.previousVersion ?? null,
        };
      }
    }
  } catch (error) {
    console.warn('[update] Could not read update-state.json:', error);
  }

  try {
    fs.writeFileSync(statePath(), `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  } catch (error) {
    console.warn('[update] Could not write update-state.json:', error);
  }

  return next;
}

export function readUpdateState(): UpdateState {
  try {
    if (fs.existsSync(statePath())) {
      return JSON.parse(fs.readFileSync(statePath(), 'utf8')) as UpdateState;
    }
  } catch (error) {
    console.warn('[update] Could not read update-state.json:', error);
  }
  return { currentVersion: app.getVersion(), previousVersion: null };
}
