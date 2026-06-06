import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../shared/ipc';
import type { Client, ClientInput } from '../shared/types';

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
  clients: {
    list: (): Promise<Client[]> => ipcRenderer.invoke(IpcChannels.clientsList),
    get: (id: string): Promise<Client | null> => ipcRenderer.invoke(IpcChannels.clientsGet, id),
    create: (input: ClientInput): Promise<Client> =>
      ipcRenderer.invoke(IpcChannels.clientsCreate, input),
    update: (id: string, input: ClientInput): Promise<Client> =>
      ipcRenderer.invoke(IpcChannels.clientsUpdate, id, input),
    remove: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.clientsDelete, id),
  },
  database: {
    exportClientsCsv: (): Promise<{ saved: false } | { saved: true; filePath: string }> =>
      ipcRenderer.invoke(IpcChannels.databaseExportClientsCsv),
  },
};

contextBridge.exposeInMainWorld('blazeaudit', api);

export type BlazeAuditApi = typeof api;
