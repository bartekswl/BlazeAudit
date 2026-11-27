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
import { installLatestUpdateOnLaunch, registerUpdateIpc } from './update/updater';
import { registerReadContentIpc } from './ipc/readContent';
import { closeDatabase } from './db/connection';
import { disposePrintWindow, warmPrintWindow } from './pdf/printHtmlWindow';
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
  // Safety net in case first paint is ever delayed.
  setTimeout(revealWindow, 450);

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

  // Load index.html directly so the inline #app-boot-loader paints once in a
  // single document — eliminating the splash -> app page navigation flicker.
  if (devServerUrl) {
    void win.loadURL(devServerUrl);
    if (process.env.BLAZE_OPEN_DEVTOOLS === '1') {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    void win.loadFile(path.join(dirname, '../../dist/index.html'));
  }

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
  installLatestUpdateOnLaunch();
  registerReadContentIpc();
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
