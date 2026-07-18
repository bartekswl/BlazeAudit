import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveAppIconPath } from './appIcon';
import { registerWindowIpc } from './ipc/window';
import { registerClientsIpc } from './ipc/clients';
import { registerDatabaseIpc } from './ipc/database';
import { registerTemplatesIpc } from './ipc/templates';
import { registerInspectionsIpc } from './ipc/inspections';
import { registerProfileIpc } from './ipc/profile';
import { registerNameBadgesIpc } from './ipc/nameBadges';
import { registerCalendarTasksIpc } from './ipc/calendarTasks';
import { registerAuthIpc } from './ipc/auth';
import { provisionDemoIfNeeded } from './demo/provisionDemo';
import { registerUpdateIpc } from './update/updater';
import { closeDatabase } from './db/connection';
import { disposePrintWindow, warmPrintWindow } from './pdf/printHtmlWindow';
import { IpcChannels } from '../shared/ipc';
import { buildBootSplashHtml } from '../shared/bootSplash';

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
const BOOT_SPLASH_HTML = buildBootSplashHtml();
const BOOT_SPLASH_URL = `data:text/html;charset=UTF-8,${encodeURIComponent(BOOT_SPLASH_HTML)}`;

let mainWindow: BrowserWindow | null = null;

function createMainWindow(): BrowserWindow {
  const icon = resolveAppIconPath();
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    // Usable floor: sidebar + main content stay workable; user cannot shrink below this.
    minWidth: 1024,
    minHeight: 700,
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
  mainWindow = win;

  if (icon) {
    win.setIcon(icon);
  }

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

  // Hidden print BrowserWindow must die with the main UI — otherwise
  // window-all-closed never fires and Electron (and vite) stay running after X.
  win.on('close', () => {
    disposePrintWindow();
  });
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
    disposePrintWindow();
    if (process.platform !== 'darwin') app.quit();
  });

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

void app.whenReady().then(async () => {
  await provisionDemoIfNeeded();

  registerWindowIpc();
  registerAuthIpc();
  registerClientsIpc();
  registerDatabaseIpc();
  registerTemplatesIpc();
  registerInspectionsIpc();
  registerProfileIpc();
  registerNameBadgesIpc();
  registerCalendarTasksIpc();
  registerUpdateIpc();
  createMainWindow();

  // Pre-warm Chromium print host after UI is up so first PDF export skips cold start.
  setTimeout(() => {
    void warmPrintWindow();
  }, 2500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  disposePrintWindow();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  disposePrintWindow();
});

app.on('will-quit', () => {
  disposePrintWindow();
  closeDatabase();
});
