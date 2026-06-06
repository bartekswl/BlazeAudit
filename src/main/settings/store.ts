import path from 'node:path';
import type { LoginPolicy } from '../../shared/loginPolicy';
import { DEFAULT_LOGIN_POLICY } from '../../shared/loginPolicy';
import { ensureAccountRecordSecret } from '../auth/recordSecret';
import { readManifest, SettingsTamperedError } from '../auth/store';
import { readSignedBinaryRecord, writeSignedBinaryRecord } from '../storage/binaryRecord';
import { RecordTamperError } from '../storage/recordSeal';
import { accountDir } from '../db/paths';

export interface AccountSettings {
  version: 1;
  loginPolicy: LoginPolicy;
}

function settingsBin(): string {
  return path.join(accountDir(), 'settings.bin');
}

function settingsJson(): string {
  return path.join(accountDir(), 'settings.json');
}

/** Per-account preferences — always under the active account folder. */
export function readAccountSettings(): AccountSettings {
  try {
    const existing = readSignedBinaryRecord<AccountSettings>(
      settingsBin(),
      settingsJson(),
      ensureAccountRecordSecret(),
    );
    if (existing) return existing;
  } catch (e) {
    if (e instanceof RecordTamperError) {
      throw new SettingsTamperedError();
    }
    throw e;
  }

  const manifest = readManifest();
  const settings: AccountSettings = {
    version: 1,
    loginPolicy: manifest?.loginPolicy ?? DEFAULT_LOGIN_POLICY,
  };
  writeSignedBinaryRecord(settingsBin(), settings, ensureAccountRecordSecret());
  return settings;
}

export function getLoginPolicy(): LoginPolicy {
  return readAccountSettings().loginPolicy;
}

export function setLoginPolicy(policy: LoginPolicy): LoginPolicy {
  const settings = readAccountSettings();
  writeSignedBinaryRecord(settingsBin(), { ...settings, loginPolicy: policy }, ensureAccountRecordSecret());
  return policy;
}
