import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { app } from 'electron';

const mainDir = path.dirname(fileURLToPath(import.meta.url));

function resolveResourcePng(fileName: string): string | undefined {
  const candidates = [
    path.join(process.cwd(), 'resources', fileName),
    path.join(mainDir, '../../resources', fileName),
    path.join(process.resourcesPath, fileName),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

/** PNG for the OS window / taskbar (rounded, full icon). */
export function resolveAppIconPath(): string | undefined {
  return resolveResourcePng('app-icon.png');
}

/** PNG for the in-app title bar (transparent, tight flame + shield crop). */
export function resolveTitleBarIconPath(): string | undefined {
  return resolveResourcePng('titlebar-icon.png');
}

function iconUrl(iconPath: string | undefined): string | null {
  if (!iconPath) return null;
  return `${pathToFileURL(iconPath).href}?v=${app.getVersion()}`;
}

export function resolveAppIconUrl(): string | null {
  return iconUrl(resolveAppIconPath());
}

export function resolveTitleBarIconUrl(): string | null {
  return iconUrl(resolveTitleBarIconPath() ?? resolveAppIconPath());
}
