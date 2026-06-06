import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../shared/ipc';
import type {
  ActivateInput,
  AuthStatus,
  LoginInput,
  SecuritySettings,
  SetPasswordInput,
} from '../shared/auth';
import type { LoginPolicy } from '../shared/loginPolicy';
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
  auth: {
    getStatus: (): Promise<AuthStatus> => ipcRenderer.invoke(IpcChannels.authGetStatus),
    activate: (input: ActivateInput): Promise<{ email: string }> =>
      ipcRenderer.invoke(IpcChannels.authActivate, input),
    setPassword: (input: SetPasswordInput): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.authSetPassword, input),
    login: (input: LoginInput): Promise<void> => ipcRenderer.invoke(IpcChannels.authLogin, input),
    logOut: (): Promise<void> => ipcRenderer.invoke(IpcChannels.authLogOut),
    selectAccount: (accountId: string): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.authSelectAccount, accountId),
    beginAddAccount: (): Promise<void> => ipcRenderer.invoke(IpcChannels.authBeginAddAccount),
    returnToLogin: (): Promise<void> => ipcRenderer.invoke(IpcChannels.authReturnToLogin),
    getSecuritySettings: (): Promise<SecuritySettings> =>
      ipcRenderer.invoke(IpcChannels.authGetSecuritySettings),
    setLoginPolicy: (policy: LoginPolicy): Promise<LoginPolicy> =>
      ipcRenderer.invoke(IpcChannels.authSetLoginPolicy, policy),
  },
  database: {
    exportClientsCsv: (): Promise<{ saved: false } | { saved: true; filePath: string }> =>
      ipcRenderer.invoke(IpcChannels.databaseExportClientsCsv),
    getDataDir: (): Promise<string> => ipcRenderer.invoke(IpcChannels.databaseGetDataDir),
    openDataFolder: (): Promise<{ opened: true; path: string }> =>
      ipcRenderer.invoke(IpcChannels.databaseOpenDataFolder),
  },
};

contextBridge.exposeInMainWorld('blazeaudit', api);

export type BlazeAuditApi = typeof api;
