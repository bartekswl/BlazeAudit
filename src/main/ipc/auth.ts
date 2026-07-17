import { ipcMain } from 'electron';
import { userInfo } from 'node:os';
import {
  activate,
  beginAddAccount,
  changePassword,
  getAuthStatus,
  getLoginPolicy,
  getColorTheme,
  logOut,
  login,
  returnToLogin,
  selectAccount,
  setLoginPolicy,
  setColorTheme,
  setPassword,
} from '../auth';
import { getActiveAccountId } from '../auth/context';
import { describeDataDir } from '../db/paths';
import { IpcChannels } from '../../shared/ipc';
import type {
  ActivateInput,
  ChangePasswordInput,
  LoginInput,
  SetPasswordInput,
} from '../../shared/auth';
import type { LoginPolicy } from '../../shared/loginPolicy';
import type { ColorTheme } from '../../shared/theme';

export function registerAuthIpc(): void {
  ipcMain.handle(IpcChannels.authGetStatus, () => getAuthStatus());

  ipcMain.handle(IpcChannels.authActivate, (_event, input: ActivateInput) => activate(input));

  ipcMain.handle(IpcChannels.authSetPassword, (_event, input: SetPasswordInput) =>
    setPassword(input),
  );

  ipcMain.handle(IpcChannels.authChangePassword, (_event, input: ChangePasswordInput) =>
    changePassword(input),
  );

  ipcMain.handle(IpcChannels.authLogin, (_event, input: LoginInput) => login(input));

  ipcMain.handle(IpcChannels.authLogOut, () => {
    logOut();
  });

  ipcMain.handle(IpcChannels.authSelectAccount, (_event, accountId: string) => {
    selectAccount(accountId);
  });

  ipcMain.handle(IpcChannels.authBeginAddAccount, () => {
    beginAddAccount();
  });

  ipcMain.handle(IpcChannels.authReturnToLogin, () => {
    returnToLogin();
  });

  ipcMain.handle(IpcChannels.authGetSecuritySettings, () => ({
    loginPolicy: getLoginPolicy(),
    colorTheme: getColorTheme(),
    dataDir: describeDataDir(),
    osUsername: userInfo().username,
    accountId: getActiveAccountId() ?? '',
  }));

  ipcMain.handle(IpcChannels.authSetLoginPolicy, (_event, policy: LoginPolicy) =>
    setLoginPolicy(policy),
  );

  ipcMain.handle(IpcChannels.authSetColorTheme, (_event, theme: ColorTheme) =>
    setColorTheme(theme),
  );
}
