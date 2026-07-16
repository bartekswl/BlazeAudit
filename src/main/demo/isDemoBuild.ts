import { app } from 'electron';
import { existsSync } from 'node:fs';
import path from 'node:path';

/** True when this executable is the demo/tester build (bundled seed + demo.flag). */
export function isDemoBuild(): boolean {
  if (!app.isPackaged) return process.env.BLAZE_DEMO === '1';
  return existsSync(path.join(process.resourcesPath, 'demo', 'demo.flag'));
}

export function demoResourcesDir(): string {
  return path.join(process.resourcesPath, 'demo');
}
