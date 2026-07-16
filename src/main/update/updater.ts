import { app, BrowserWindow, ipcMain, Notification } from 'electron';
import electronUpdater, { type UpdateInfo } from 'electron-updater';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { IpcChannels } from '../../shared/ipc';
import type { UpdateStatus } from '../../shared/update';

// electron-updater ships CommonJS; grab the singleton via the default export.
const { autoUpdater } = electronUpdater;

/** Matches `updaterCacheDirName` embedded in app-update.yml at build time. */
const UPDATER_CACHE_DIR_NAME = 'blazeaudit-updater';

function updaterCacheDir(): string {
  const base = process.env.LOCALAPPDATA ?? app.getPath('temp');
  return path.join(base, UPDATER_CACHE_DIR_NAME);
}

/** Remove leftover installer downloads from a previous update (frees disk space). */
function cleanUpdaterCache(): void {
  const dir = updaterCacheDir();
  if (!existsSync(dir)) return;
  try {
    rmSync(dir, { recursive: true, force: true });
    console.log(`[update] Cleared updater cache → ${dir}`);
  } catch (error) {
    console.warn('[update] Could not clear updater cache:', error);
  }
}

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
let installScheduled = false;

function showUpdatingToast(): void {
  if (!Notification.isSupported()) return;
  try {
    new Notification({ title: 'Updating BlazeAudit' }).show();
  } catch (error) {
    console.warn('[update] Could not show update notification:', error);
  }
}

function installDownloadedUpdate(version: string): void {
  if (installScheduled) return;
  installScheduled = true;
  broadcast({ phase: 'installing', version });
  showUpdatingToast();
  setImmediate(() => autoUpdater.quitAndInstall(true, true));
}

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
  autoUpdater.on('update-downloaded', (info) => {
    broadcast({
      phase: 'downloaded',
      version: info.version,
      notes: releaseNotesToText(info.releaseNotes),
    });
    setTimeout(() => installDownloadedUpdate(info.version), 400);
  });
  autoUpdater.on('error', (err) =>
    broadcast({ phase: 'error', message: err?.message ?? 'Update failed.' }),
  );
}

export function registerUpdateIpc(): void {
  if (app.isPackaged) {
    // Previous session's downloaded installer is no longer needed after restart.
    cleanUpdaterCache();
  }

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
    const version = autoUpdater.currentVersion?.version ?? '';
    installDownloadedUpdate(version);
  });
}
