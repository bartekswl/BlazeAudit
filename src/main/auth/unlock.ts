import type { LoginPolicy } from '../../shared/loginPolicy';
import type { ColorTheme } from '../../shared/theme';
import { isPasswordRequired } from '../../shared/loginPolicy';
import { getLoginPolicy, setLoginPolicy as persistLoginPolicy, getColorTheme, setColorTheme as persistColorTheme } from '../settings/store';
import { assertKeyXMatchesManifest, manifestWithKeyXId } from './keyX';
import { unlockDatabaseWithKey } from './session';
import {
  bumpUnlockEpoch,
  clearDpapiKeyX,
  currentUnlockEpoch,
  readActivationToken,
  readDpapiKeyCache,
  readManifest,
  storeDpapiKeyX,
  touchLastUnlock,
  type AuthManifest,
} from './store';
import { verifyActivationToken } from './token';

export function shouldPromptForPassword(manifest: AuthManifest): boolean {
  if (manifest.requirePasswordOnLaunch) return true;
  return isPasswordRequired(getLoginPolicy(), manifest.lastUnlockAt);
}

/** Drop stale DPAPI cache when a password will be required (epoch bumps happen on log out / policy change only). */
export function enforcePasswordGate(manifest: AuthManifest): AuthManifest {
  if (!shouldPromptForPassword(manifest)) return manifest;
  clearDpapiKeyX();
  return manifest;
}

function shouldCacheKeyXInDpapi(): boolean {
  return getLoginPolicy() !== 'always';
}

export function tryAutoUnlock(): boolean {
  const manifest = readManifest();
  if (!manifest?.passwordSet) return false;
  if (shouldPromptForPassword(manifest)) return false;

  const cache = readDpapiKeyCache();
  const token = readActivationToken();
  if (!cache || !token) return false;

  if (cache.epoch !== currentUnlockEpoch(manifest)) {
    clearDpapiKeyX();
    return false;
  }

  try {
    const payload = verifyActivationToken(token);
    if (payload.email !== manifest.email || payload.instanceId !== manifest.instanceId) {
      return false;
    }
    assertKeyXMatchesManifest(cache.keyX, manifest);
    unlockDatabaseWithKey(cache.keyX);
    completeUnlockTouch(manifest.keyXId ? manifest : manifestWithKeyXId(manifest, cache.keyX));
    return true;
  } catch {
    clearDpapiKeyX();
    return false;
  }
}

function completeUnlockTouch(manifest: AuthManifest): void {
  touchLastUnlock({ ...manifest, requirePasswordOnLaunch: false });
}

export function completeUnlock(keyX: string, manifest: AuthManifest): void {
  assertKeyXMatchesManifest(keyX, manifest);
  unlockDatabaseWithKey(keyX);
  if (shouldCacheKeyXInDpapi()) {
    storeDpapiKeyX(keyX, currentUnlockEpoch(manifest));
  } else {
    clearDpapiKeyX();
  }
  const withId = manifest.keyXId ? manifest : manifestWithKeyXId(manifest, keyX);
  completeUnlockTouch(withId);
}

export function setLoginPolicy(policy: LoginPolicy): LoginPolicy {
  const manifest = readManifest();
  if (!manifest?.passwordSet) {
    throw new Error('Activate and set a password before changing login policy.');
  }
  const saved = persistLoginPolicy(policy);
  if (policy === 'always') {
    clearDpapiKeyX();
    bumpUnlockEpoch(manifest);
  }
  return saved;
}

export function setColorTheme(theme: ColorTheme): ColorTheme {
  const manifest = readManifest();
  if (!manifest?.passwordSet) {
    throw new Error('Activate and set a password before changing appearance settings.');
  }
  return persistColorTheme(theme);
}

export { getLoginPolicy, getColorTheme };
