import { app, BrowserWindow, ipcMain, shell } from 'electron';
import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import { resolveAppIconUrl, resolveTitleBarIconUrl } from '../appIcon';
import { IpcChannels } from '../../shared/ipc';

const windowFrom = (event: IpcMainEvent | IpcMainInvokeEvent): BrowserWindow | null =>
  BrowserWindow.fromWebContents(event.sender);

export function registerWindowIpc(): void {
  ipcMain.on(IpcChannels.windowMinimize, (event) => windowFrom(event)?.minimize());

  ipcMain.on(IpcChannels.windowToggleMaximize, (event) => {
    const win = windowFrom(event);
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });

  ipcMain.on(IpcChannels.windowClose, (event) => windowFrom(event)?.close());

  ipcMain.handle(IpcChannels.windowIsMaximized, (event) => windowFrom(event)?.isMaximized() ?? false);

  ipcMain.handle(IpcChannels.appVersion, () => app.getVersion());

  ipcMain.handle(IpcChannels.appIconUrl, () => resolveAppIconUrl());

  ipcMain.handle(IpcChannels.appTitleBarIconUrl, () => resolveTitleBarIconUrl());

  ipcMain.handle(IpcChannels.appOpenExternal, async (_event, url: string) => {
    if (typeof url !== 'string' || !/^(https?:|mailto:)/.test(url)) {
      throw new Error('Invalid URL.');
    }
    await shell.openExternal(url);
  });
}
