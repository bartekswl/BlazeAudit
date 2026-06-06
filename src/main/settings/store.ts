import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { LoginPolicy } from '../../shared/loginPolicy';
import { DEFAULT_LOGIN_POLICY } from '../../shared/loginPolicy';
import { readManifest } from '../auth/store';
import { accountDir } from '../db/paths';

export interface AccountSettings {
  version: 1;
  loginPolicy: LoginPolicy;
}

function settingsFilePath(): string {
  return path.join(accountDir(), 'settings.json');
}

function writeAccountSettings(settings: AccountSettings): void {
  writeFileSync(settingsFilePath(), JSON.stringify(settings, null, 2), { mode: 0o600 });
}

/** Per-account preferences — always under the active account folder. */
export function readAccountSettings(): AccountSettings {
  const file = settingsFilePath();
  if (existsSync(file)) {
    return JSON.parse(readFileSync(file, 'utf8')) as AccountSettings;
  }

  // Migrate login policy from legacy auth manifest (pre-settings.json).
  const manifest = readManifest();
  const settings: AccountSettings = {
    version: 1,
    loginPolicy: manifest?.loginPolicy ?? DEFAULT_LOGIN_POLICY,
  };
  writeAccountSettings(settings);
  return settings;
}

export function getLoginPolicy(): LoginPolicy {
  return readAccountSettings().loginPolicy;
}

export function setLoginPolicy(policy: LoginPolicy): LoginPolicy {
  const settings = readAccountSettings();
  writeAccountSettings({ ...settings, loginPolicy: policy });
  return policy;
}
