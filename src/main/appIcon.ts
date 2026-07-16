import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { app } from 'electron';

const mainDir = path.dirname(fileURLToPath(import.meta.url));

/** PNG used for the OS window/taskbar and the in-app title bar. */
export function resolveAppIconPath(): string | undefined {
  const candidates = [
    path.join(process.cwd(), 'resources', 'app-icon.png'),
    path.join(mainDir, '../../resources/app-icon.png'),
    path.join(process.resourcesPath, 'app-icon.png'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

export function resolveAppIconUrl(): string | null {
  const iconPath = resolveAppIconPath();
  if (!iconPath) return null;
  return `${pathToFileURL(iconPath).href}?v=${app.getVersion()}`;
}
