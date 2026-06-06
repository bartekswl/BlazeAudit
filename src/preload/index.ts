import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../shared/ipc';

const api = {
  window: {
    minimize: (): void => ipcRenderer.send(IpcChannels.windowMinimize),
    toggleMaximize: (): void => ipcRenderer.send(IpcChannels.windowToggleMaximize),
    close: (): void => ipcRenderer.send(IpcChannels.windowClose),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke(IpcChannels.windowIsMaximized),
    /** Subscribe to maximize/unmaximize changes. Returns an unsubscribe function. */
    onMaximizeChange: (callback: (isMaximized: boolean) => void): (() => void) => {
      const listener = (_event: unknown, isMaximized: boolean) => callback(isMaximized);
      ipcRenderer.on(IpcChannels.windowMaximizeChanged, listener);
      return () => ipcRenderer.removeListener(IpcChannels.windowMaximizeChanged, listener);
    },
  },
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke(IpcChannels.appVersion),
  },
};

contextBridge.exposeInMainWorld('blazeaudit', api);

export type BlazeAuditApi = typeof api;
