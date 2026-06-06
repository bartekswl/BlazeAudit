// Allow-listed IPC channel names shared across main, preload, and renderer.
// Keeping them in one place keeps the contract typed and prevents drift.
export const IpcChannels = {
  windowMinimize: 'window:minimize',
  windowToggleMaximize: 'window:toggle-maximize',
  windowClose: 'window:close',
  windowIsMaximized: 'window:is-maximized',
  windowMaximizeChanged: 'window:maximize-changed',
  appVersion: 'app:version',
  clientsList: 'clients:list',
  clientsGet: 'clients:get',
  clientsCreate: 'clients:create',
  clientsUpdate: 'clients:update',
  clientsDelete: 'clients:delete',
  databaseExportClientsCsv: 'database:export-clients-csv',
  databaseGetDataDir: 'database:get-data-dir',
  databaseOpenDataFolder: 'database:open-data-folder',
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
