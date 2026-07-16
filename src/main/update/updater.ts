import { app, BrowserWindow, ipcMain } from 'electron';
import electronUpdater, { type UpdateInfo } from 'electron-updater';
import { IpcChannels } from '../../shared/ipc';
import type { UpdateStatus } from '../../shared/update';

// electron-updater ships CommonJS; grab the singleton via the default export.
const { autoUpdater } = electronUpdater;

function releaseNotesToText(notes: UpdateInfo['releaseNotes']): string | null {
  if (!notes) return null;
  if (typeof notes === 'string') return notes.trim() || null;
  const joined = notes
    .map((entry) => entry.note?.trim())
    .filter((note): note is string => Boolean(note))
    .join('\n\n');
  return joined || null;
}

function broadcast(status: UpdateStatus): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(IpcChannels.updateStatus, status);
  }
}

let wired = false;

function wireAutoUpdaterEvents(): void {
  if (wired) return;
  wired = true;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('checking-for-update', () => broadcast({ phase: 'checking' }));
  autoUpdater.on('update-available', (info) =>
    broadcast({ phase: 'available', version: info.version, notes: releaseNotesToText(info.releaseNotes) }),
  );
  autoUpdater.on('update-not-available', (info) =>
    broadcast({ phase: 'not-available', version: info.version }),
  );
  autoUpdater.on('download-progress', (progress) =>
    broadcast({
      phase: 'downloading',
      version: autoUpdater.currentVersion?.version ?? '',
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    }),
  );
  autoUpdater.on('update-downloaded', (info) =>
    broadcast({ phase: 'downloaded', version: info.version, notes: releaseNotesToText(info.releaseNotes) }),
  );
  autoUpdater.on('error', (err) =>
    broadcast({ phase: 'error', message: err?.message ?? 'Update failed.' }),
  );
}

export function registerUpdateIpc(): void {
  wireAutoUpdaterEvents();

  ipcMain.handle(IpcChannels.updateCheck, async () => {
    if (!app.isPackaged) {
      broadcast({
        phase: 'error',
        message: 'Updates are only available in the installed app, not in development.',
      });
      return;
    }
    try {
      await autoUpdater.checkForUpdates();
    } catch (err) {
      broadcast({ phase: 'error', message: err instanceof Error ? err.message : 'Could not check for updates.' });
    }
  });

  ipcMain.handle(IpcChannels.updateDownload, async () => {
    try {
      await autoUpdater.downloadUpdate();
    } catch (err) {
      broadcast({ phase: 'error', message: err instanceof Error ? err.message : 'Download failed.' });
    }
  });

  ipcMain.handle(IpcChannels.updateInstall, () => {
    // Closes the app, installs the update in place, and relaunches.
    setImmediate(() => autoUpdater.quitAndInstall());
  });
}
