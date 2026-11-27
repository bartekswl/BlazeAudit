import { app, BrowserWindow, ipcMain, Notification } from 'electron';
import electronUpdater, { type UpdateInfo } from 'electron-updater';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { IpcChannels } from '../../shared/ipc';
import type { RollbackInfo, UpdateStatus } from '../../shared/update';
import { sanitizeReleaseNotes } from '../../shared/update';
import { isDemoBuild } from '../demo/isDemoBuild';
import { isNewerVersion, listNewerReleases, type ReleaseOffer } from './latestRelease';
import { downloadRollbackInstaller, spawnSilentInstall } from './rollback';
import { readUpdateState, syncUpdateStateOnStartup } from './updateState';

const { autoUpdater } = electronUpdater;

const UPDATER_CACHE_DIR_NAME = 'blazeaudit-updater';

function updaterCacheDir(): string {
  const base = process.env.LOCALAPPDATA ?? app.getPath('temp');
  return path.join(base, UPDATER_CACHE_DIR_NAME);
}

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
  const raw =
    typeof notes === 'string'
      ? notes
      : notes
          .map((entry) => entry.note?.trim())
          .filter((note): note is string => Boolean(note))
          .join('\n\n');
  return sanitizeReleaseNotes(raw);
}

function broadcast(status: UpdateStatus): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(IpcChannels.updateStatus, status);
  }
}

let wired = false;
let installScheduled = false;
/** Target version for the in-flight download (not the installed app version). */
let pendingDownloadVersion = '';
/**
 * Set when more than one release is ahead. The download then fetches that
 * installer directly so the app skips intermediate versions.
 */
let directUpdate: ReleaseOffer | null = null;

function showUpdatingToast(): void {
  if (!Notification.isSupported()) return;
  try {
    new Notification({ title: 'Updating BlazeAudit' }).show();
  } catch (error) {
    console.warn('[update] Could not show update notification:', error);
  }
}

function installAndQuit(version: string, installerPath?: string): void {
  if (installScheduled) return;
  installScheduled = true;
  broadcast({ phase: 'installing', version });
  showUpdatingToast();
  if (installerPath) {
    spawnSilentInstall(installerPath);
    setImmediate(() => app.quit());
    return;
  }
  setImmediate(() => autoUpdater.quitAndInstall(true, true));
}

function wireAutoUpdaterEvents(): void {
  if (wired) return;
  wired = true;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('checking-for-update', () => broadcast({ phase: 'checking' }));
  autoUpdater.on('update-available', (info) => {
    pendingDownloadVersion = info.version;
    broadcast({
      phase: 'available',
      version: info.version,
      notes: releaseNotesToText(info.releaseNotes),
    });
  });
  autoUpdater.on('update-not-available', (info) => {
    pendingDownloadVersion = '';
    broadcast({ phase: 'not-available', version: info.version });
  });
  autoUpdater.on('download-progress', (progress) =>
    broadcast({
      phase: 'downloading',
      version: pendingDownloadVersion,
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    }),
  );
  autoUpdater.on('update-downloaded', (info) => {
    pendingDownloadVersion = info.version;
    broadcast({
      phase: 'downloaded',
      version: info.version,
      notes: releaseNotesToText(info.releaseNotes),
    });
    setTimeout(() => installAndQuit(info.version), 400);
  });
  autoUpdater.on('error', (err) => {
    pendingDownloadVersion = '';
    broadcast({ phase: 'error', message: err?.message ?? 'Update failed.' });
  });
}

function rollbackInfo(): RollbackInfo {
  const state = readUpdateState();
  const canRollback =
    Boolean(state.previousVersion) &&
    isNewerVersion(state.currentVersion, state.previousVersion!);
  return {
    currentVersion: state.currentVersion,
    previousVersion: canRollback ? state.previousVersion : null,
  };
}

async function installReleaseDirect(offer: ReleaseOffer): Promise<void> {
  installScheduled = false;
  pendingDownloadVersion = offer.version;
  const installerPath = await downloadRollbackInstaller(offer.version, updaterCacheDir(), (status) =>
    broadcast(status),
  );
  broadcast({ phase: 'downloaded', version: offer.version, notes: offer.notes });
  setTimeout(() => installAndQuit(offer.version, installerPath), 400);
}

/**
 * Demo installs (jackpps) should not wait on the Update tab.
 * If GitHub has a newer release, download it and restart into it.
 */
export function installLatestUpdateOnLaunch(): void {
  if (!app.isPackaged || !isDemoBuild()) return;
  void installLatestUpdateIfAny();
}

async function installLatestUpdateIfAny(): Promise<void> {
  try {
    const newer = await listNewerReleases(app.getVersion());
    if (newer.length === 0) return;
    if (newer.length > 1) {
      directUpdate = newer[0];
      await installReleaseDirect(newer[0]);
      return;
    }
    const result = await autoUpdater.checkForUpdates();
    if (result?.isUpdateAvailable) await autoUpdater.downloadUpdate();
  } catch (err) {
    console.warn('[update] Startup update skipped:', err);
  }
}

export function registerUpdateIpc(): void {
  if (app.isPackaged) {
    syncUpdateStateOnStartup();
    cleanUpdaterCache();
  }

  wireAutoUpdaterEvents();

  ipcMain.handle(IpcChannels.updateGetRollbackInfo, () => {
    if (!app.isPackaged) {
      return { currentVersion: app.getVersion(), previousVersion: null } satisfies RollbackInfo;
    }
    return rollbackInfo();
  });

  ipcMain.handle(IpcChannels.updateCheck, async () => {
    if (!app.isPackaged) {
      broadcast({
        phase: 'error',
        message: 'Updates are only available in the installed app, not in development.',
      });
      return;
    }
    directUpdate = null;
    try {
      const newer = await listNewerReleases(app.getVersion());
      if (newer.length === 0) {
        broadcast({ phase: 'not-available', version: app.getVersion() });
        return;
      }
      // One release ahead keeps the blockmap download. Several ahead must
      // install the newest installer, not the next version in line.
      if (newer.length === 1) {
        await autoUpdater.checkForUpdates();
        return;
      }
      directUpdate = newer[0];
      pendingDownloadVersion = newer[0].version;
      broadcast({
        phase: 'available',
        version: newer[0].version,
        notes: newer[0].notes,
        fullDownload: true,
      });
    } catch (err) {
      console.warn('[update] Could not list releases, using built-in updater:', err);
      try {
        await autoUpdater.checkForUpdates();
      } catch (checkErr) {
        broadcast({
          phase: 'error',
          message: checkErr instanceof Error ? checkErr.message : 'Could not check for updates.',
        });
      }
    }
  });

  ipcMain.handle(IpcChannels.updateDownload, async () => {
    try {
      let newer: ReleaseOffer[] | null = null;
      try {
        newer = await listNewerReleases(app.getVersion());
      } catch (err) {
        console.warn('[update] Could not refresh release list before download:', err);
      }
      if (newer && newer.length > 1) {
        directUpdate = newer[0];
        await installReleaseDirect(newer[0]);
        return;
      }
      if (directUpdate) {
        await installReleaseDirect(newer && newer.length > 0 ? newer[0] : directUpdate);
        return;
      }
      if (
        newer &&
        newer.length === 1 &&
        pendingDownloadVersion &&
        pendingDownloadVersion !== newer[0].version
      ) {
        await installReleaseDirect(newer[0]);
        return;
      }
      await autoUpdater.downloadUpdate();
    } catch (err) {
      broadcast({ phase: 'error', message: err instanceof Error ? err.message : 'Download failed.' });
    }
  });

  ipcMain.handle(IpcChannels.updateInstall, () => {
    const version = autoUpdater.currentVersion?.version ?? app.getVersion();
    installAndQuit(version);
  });

  ipcMain.handle(IpcChannels.updateRollback, async () => {
    if (!app.isPackaged) {
      broadcast({
        phase: 'error',
        message: 'Rollback is only available in the installed app, not in development.',
      });
      return;
    }

    const info = rollbackInfo();
    if (!info.previousVersion) {
      broadcast({ phase: 'error', message: 'No previous version is available to install.' });
      return;
    }

    installScheduled = false;
    const version = info.previousVersion;

    try {
      const installerPath = await downloadRollbackInstaller(version, updaterCacheDir(), (status) =>
        broadcast(status),
      );
      broadcast({ phase: 'downloaded', version, notes: null });
      setTimeout(() => installAndQuit(version, installerPath), 400);
    } catch (err) {
      broadcast({ phase: 'error', message: err instanceof Error ? err.message : 'Rollback failed.' });
    }
  });
}
