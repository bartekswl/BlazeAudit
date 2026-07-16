import { app, BrowserWindow, ipcMain } from 'electron';
import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import { resolveAppIconUrl } from '../appIcon';
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
}
