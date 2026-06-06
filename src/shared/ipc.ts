// Allow-listed IPC channel names shared across main, preload, and renderer.
// Keeping them in one place keeps the contract typed and prevents drift.
export const IpcChannels = {
  windowMinimize: 'window:minimize',
  windowToggleMaximize: 'window:toggle-maximize',
  windowClose: 'window:close',
  windowIsMaximized: 'window:is-maximized',
  windowMaximizeChanged: 'window:maximize-changed',
  appVersion: 'app:version',
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
