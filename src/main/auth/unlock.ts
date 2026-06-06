import type { LoginPolicy } from '../../shared/loginPolicy';
import { isPasswordRequired } from '../../shared/loginPolicy';
import { getLoginPolicy, setLoginPolicy as persistLoginPolicy } from '../settings/store';
import { assertKeyXMatchesManifest, manifestWithKeyXId } from './keyX';
import { unlockDatabaseWithKey } from './session';
import {
  readActivationToken,
  readDpapiKeyX,
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

export function tryAutoUnlock(): boolean {
  const manifest = readManifest();
  if (!manifest?.passwordSet) return false;
  if (manifest.requirePasswordOnLaunch) return false;
  if (shouldPromptForPassword(manifest)) return false;

  const keyX = readDpapiKeyX();
  const token = readActivationToken();
  if (!keyX || !token) return false;

  try {
    const payload = verifyActivationToken(token);
    if (payload.email !== manifest.email || payload.instanceId !== manifest.instanceId) {
      return false;
    }
    assertKeyXMatchesManifest(keyX, manifest);
    unlockDatabaseWithKey(keyX);
    completeUnlockTouch(manifest.keyXId ? manifest : manifestWithKeyXId(manifest, keyX));
    return true;
  } catch {
    return false;
  }
}

function completeUnlockTouch(manifest: AuthManifest): void {
  touchLastUnlock({ ...manifest, requirePasswordOnLaunch: false });
}

export function completeUnlock(keyX: string, manifest: AuthManifest): void {
  assertKeyXMatchesManifest(keyX, manifest);
  storeDpapiKeyX(keyX);
  unlockDatabaseWithKey(keyX);
  const withId = manifest.keyXId ? manifest : manifestWithKeyXId(manifest, keyX);
  completeUnlockTouch(withId);
}

export function setLoginPolicy(policy: LoginPolicy): LoginPolicy {
  const manifest = readManifest();
  if (!manifest?.passwordSet) {
    throw new Error('Activate and set a password before changing login policy.');
  }
  return persistLoginPolicy(policy);
}

export { getLoginPolicy };
