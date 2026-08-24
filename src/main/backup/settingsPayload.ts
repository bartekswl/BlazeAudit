import fs from 'node:fs';
import path from 'node:path';
import type { LoginPolicy } from '../../shared/loginPolicy';
import type { ColorTheme } from '../../shared/theme';
import { ensureAccountRecordSecret } from '../auth/recordSecret';
import {
  type AccountSettings,
  readAccountSettings,
  writeAccountSettings,
} from '../settings/store';
import type { PackedEntry } from './pack';

/** Logical settings inside the keyX-encrypted backup (not machine-sealed .bin). */
export const SETTINGS_PAYLOAD_RELATIVE_PATH = 'settings.payload.json';

const LOGIN_POLICIES = new Set<LoginPolicy>(['always', 'week', 'month', 'year', 'never']);

function isColorTheme(value: unknown): value is ColorTheme {
  return value === 'light' || value === 'dark';
}

function isAccountSettings(value: unknown): value is AccountSettings {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  if (s.version !== 1) return false;
  if (typeof s.loginPolicy !== 'string' || !LOGIN_POLICIES.has(s.loginPolicy as LoginPolicy)) {
    return false;
  }
  if (s.colorTheme !== undefined && !isColorTheme(s.colorTheme)) return false;
  return true;
}

export function buildSettingsPayloadEntry(): PackedEntry {
  const settings = readAccountSettings();
  return {
    relativePath: SETTINGS_PAYLOAD_RELATIVE_PATH,
    data: Buffer.from(JSON.stringify(settings), 'utf8'),
  };
}

function removeSettingsFiles(root: string): void {
  for (const name of ['settings.bin', 'settings.json'] as const) {
    const full = path.join(root, name);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  }
}

/**
 * Install preferences from a backup using this machine's record secret.
 * Raw settings.bin is HMAC-bound to one PC's DPAPI secret — restoring the file
 * bytes verbatim triggers SettingsTamperedError whenever the seal doesn't match.
 */
export function installSettingsFromBackupEntries(root: string, entries: PackedEntry[]): void {
  removeSettingsFiles(root);

  const payload = entries.find((e) => e.relativePath === SETTINGS_PAYLOAD_RELATIVE_PATH);
  if (payload) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload.data.toString('utf8'));
    } catch {
      throw new Error('Backup settings payload is corrupt.');
    }
    if (!isAccountSettings(parsed)) {
      throw new Error('Backup settings payload is invalid.');
    }
    writeAccountSettings(parsed);
    return;
  }

  // Legacy backups: sealed settings.bin (only works when this PC's HMAC secret matches).
  const bin = entries.find((e) => e.relativePath === 'settings.bin');
  if (bin) {
    const target = path.join(root, 'settings.bin');
    fs.writeFileSync(target, bin.data);
    try {
      void ensureAccountRecordSecret();
      readAccountSettings();
      return;
    } catch {
      // Heal path inside readAccountSettings, or unreadable file — reset and continue.
      removeSettingsFiles(root);
    }
  }

  const json = entries.find((e) => e.relativePath === 'settings.json');
  if (json) {
    fs.writeFileSync(path.join(root, 'settings.json'), json.data);
    try {
      readAccountSettings();
      return;
    } catch {
      removeSettingsFiles(root);
    }
  }

  // Defaults (legacy backup whose sealed settings couldn't be verified here).
  readAccountSettings();
}
