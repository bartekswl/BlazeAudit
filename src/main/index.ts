import { app, BrowserWindow } from 'electron';
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
import { closeDatabase } from './db';
import { IpcChannels } from '../shared/ipc';

// Dev/preview: never write under the real AppData profile. Keep all Electron
// runtime files (cache, prefs, etc.) inside the repo. Packaged builds only use
// the normal per-user location.
if (!app.isPackaged) {
  app.setPath('userData', path.join(process.cwd(), '.electron-dev'));
}

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Set by vite-plugin-electron during `vite` dev; undefined in a packaged build.
const devServerUrl = process.env.VITE_DEV_SERVER_URL;

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    backgroundColor: '#0a0a0a',
    show: true,
    webPreferences: {
      preload: path.join(dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => {
    if (!win.isVisible()) win.show();
    win.focus();
  });

  const emitMaximizeState = () => {
    win.webContents.send(IpcChannels.windowMaximizeChanged, win.isMaximized());
  };
  win.on('maximize', emitMaximizeState);
  win.on('unmaximize', emitMaximizeState);

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
