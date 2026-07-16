import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerWindowIpc } from './ipc/window';
import { registerClientsIpc } from './ipc/clients';
import { registerDatabaseIpc } from './ipc/database';
import { registerTemplatesIpc } from './ipc/templates';
import { registerInspectionsIpc } from './ipc/inspections';
import { registerProfileIpc } from './ipc/profile';
import { registerNameBadgesIpc } from './ipc/nameBadges';
import { registerAuthIpc } from './ipc/auth';
import { closeDatabase } from './db/connection';
import { IpcChannels } from '../shared/ipc';

// Dev/preview: never write under the real AppData profile. Keep all Electron
// runtime files (cache, prefs, etc.) inside the repo. Packaged builds only use
// the normal per-user location.
if (!app.isPackaged) {
  app.setPath('userData', path.join(process.cwd(), '.electron-dev'));
}

// Windows taskbar grouping / identity (keeps the window icon tied to BlazeAudit).
if (process.platform === 'win32') {
  app.setAppUserModelId('com.subralab.blazeaudit');
}

const dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveAppIconPath(): string | undefined {
  const candidates = [
    path.join(process.cwd(), 'resources', 'app-icon.png'),
    path.join(dirname, '../../resources/app-icon.png'),
    path.join(process.resourcesPath, 'app-icon.png'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

// Set by vite-plugin-electron during `vite` dev; undefined in a packaged build.
const devServerUrl = process.env.VITE_DEV_SERVER_URL;

// Preload changes only need a renderer refresh in development. Initial app
// startup remains owned by the main-process build, preventing two competing
// launches and the visible app → black → app cycle.
process.on('message', (message) => {
  if (message !== 'electron-vite&type=hot-reload') return;
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.reload();
  }
});

// Instant, network-free splash painted before the real app (dev server or
// dist/index.html) loads — keeps the spinner in sync with the window
// appearing, even if the real page takes a moment (e.g. cold dev-server
// compile). Mirrors the boot markup/styles in index.html so the swap to the
// real page is visually seamless.
const BOOT_SPLASH_HTML = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8" />
<style>
  html, body { height: 100%; margin: 0; }
  body { overflow: hidden; background: #0a0a0a; color: #a3a3a3; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
  #app-boot-loader { display: flex; height: 100%; flex-direction: column; align-items: center; justify-content: center; gap: 0.875rem; background: #0a0a0a; -webkit-app-region: drag; }
  #app-boot-loader .boot-spinner { width: 1.75rem; height: 1.75rem; border: 2px solid rgb(249 115 22 / 0.2); border-top-color: #f97316; border-radius: 9999px; animation: boot-spin 0.75s linear infinite; }
  #app-boot-loader .boot-label { font-size: 0.8125rem; letter-spacing: 0.04em; }
  @keyframes boot-spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <div id="app-boot-loader" aria-live="polite" aria-busy="true">
    <div class="boot-spinner" aria-hidden="true"></div>
    <span class="boot-label">Loading…</span>
  </div>
</body>
</html>`;
const BOOT_SPLASH_URL = `data:text/html;charset=UTF-8,${encodeURIComponent(BOOT_SPLASH_HTML)}`;

function createMainWindow(): BrowserWindow {
  const icon = resolveAppIconPath();
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    backgroundColor: '#0a0a0a',
    show: false,
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: path.join(dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  let shown = false;
  const revealWindow = () => {
    if (shown) return;
    shown = true;
    win.show();
    win.focus();
  };

  win.once('ready-to-show', revealWindow);
  // Safety net in case the splash itself is ever slow to paint.
  setTimeout(revealWindow, 250);

  const emitMaximizeState = () => {
    win.webContents.send(IpcChannels.windowMaximizeChanged, win.isMaximized());
  };
  win.on('maximize', emitMaximizeState);
  win.on('unmaximize', emitMaximizeState);

  // Paint the spinner instantly (no network round-trip), then swap in the
  // real app once it's ready. The window's backgroundColor + identical boot
  // markup keep this swap invisible.
  win.webContents.once('did-finish-load', () => {
    if (devServerUrl) {
      void win.loadURL(devServerUrl);
      if (process.env.BLAZE_OPEN_DEVTOOLS === '1') {
        win.webContents.openDevTools({ mode: 'detach' });
      }
    } else {
      void win.loadFile(path.join(dirname, '../../dist/index.html'));
    }
  });
  void win.loadURL(BOOT_SPLASH_URL);

  return win;
}

void app.whenReady().then(() => {
  registerWindowIpc();
  registerAuthIpc();
  registerClientsIpc();
  registerDatabaseIpc();
  registerTemplatesIpc();
  registerInspectionsIpc();
  registerProfileIpc();
  registerNameBadgesIpc();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  closeDatabase();
});
