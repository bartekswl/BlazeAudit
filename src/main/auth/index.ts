import { app } from 'electron';
import type {
  AccountSummary,
  ActivateInput,
  AuthStatus,
  LoginInput,
  SetPasswordInput,
} from '../../shared/auth';
import { accountIdFromEmail } from '../../shared/accountId';
import { DEFAULT_LOGIN_POLICY } from '../../shared/loginPolicy';
import { setLoginPolicy as persistLoginPolicy } from '../settings/store';
import { wrapKeyWithPassword, unwrapKeyWithPassword } from './crypto';
import {
  getActiveAccountId,
  isAddingNewAccount,
  setActiveAccountId,
  setAddingNewAccount,
} from './context';
import { keyXFingerprint } from './keyX';
import { ensureProfileRecordSecret } from './profileSecret';
import { ensureAccountRecordSecret } from './recordSecret';
import { createInstanceId } from './instance';
import { lockDatabaseSession, isSessionUnlocked } from './session';
import {
  accountExists,
  findAccountById,
  getLastActiveAccountId,
  hasAnyAccount,
  listAccounts,
  registerAccount,
  setLastActiveAccountId,
} from './registry';
import {
  clearDpapiKeyX,
  clearPendingKeyX,
  isAccountActivated,
  ManifestTamperedError,
  SettingsTamperedError,
  readActivationToken,
  readManifest,
  readPasswordWrap,
  readPendingKeyX,
  storeActivationToken,
  storePasswordWrap,
  storePendingKeyX,
  writeManifest,
} from './store';
import {
  completeUnlock,
  enforcePasswordGate,
  getLoginPolicy,
  getColorTheme,
  setLoginPolicy,
  setColorTheme,
  shouldPromptForPassword,
  tryAutoUnlock,
} from './unlock';
import { verifyActivationToken } from './token';
import { createDevLicenseClient, generateKeyX } from '../license/devStub';
import {
  clearAuthStatusCache,
  readCachedAuthStatus,
  writeCachedAuthStatus,
} from './statusCache';

function bootstrapActiveAccount(): void {
  if (getActiveAccountId()) return;

  const last = getLastActiveAccountId();
  if (last && accountExists(last)) {
    setActiveAccountId(last);
    return;
  }

  const first = listAccounts()[0];
  if (first) setActiveAccountId(first.id);
}

function accountSummaries(): AccountSummary[] {
  return listAccounts().map((a) => ({
    id: a.id,
    email: a.email,
    addedAt: a.addedAt,
  }));
}

function loginStatus(email: string): AuthStatus {
  return {
    phase: 'login',
    email,
    accountId: getActiveAccountId()!,
    accounts: accountSummaries(),
  };
}

export function getAuthStatus(): AuthStatus {
  const cached = readCachedAuthStatus();
  if (cached) return cached;

  const status = computeAuthStatus();
  writeCachedAuthStatus(status);
  return status;
}

function computeAuthStatus(): AuthStatus {
  if (!isAddingNewAccount()) {
    bootstrapActiveAccount();
  }

  if (!getActiveAccountId()) {
    return hasAnyAccount()
      ? { phase: 'activation', hasExistingAccounts: true }
      : { phase: 'activation' };
  }

  if (isSessionUnlocked()) {
    const email = readManifest()?.email;
    if (email) return { phase: 'unlocked', email, accountId: getActiveAccountId()! };
  }

  let manifest;
  try {
    manifest = readManifest();
  } catch (e) {
    if (e instanceof ManifestTamperedError) {
      const accountId = getActiveAccountId()!;
      const entry = findAccountById(accountId);
      if (entry) {
        clearDpapiKeyX();
        return loginStatus(entry.email);
      }
    }
    throw e;
  }

  if (!manifest) {
    return { phase: 'activation' };
  }

  if (!manifest.passwordSet) {
    return { phase: 'set_password', email: manifest.email };
  }

  try {
    const gated = enforcePasswordGate(manifest);

    if (shouldPromptForPassword(gated)) {
      return loginStatus(gated.email);
    }

    if (tryAutoUnlock()) {
      return { phase: 'unlocked', email: manifest.email, accountId: getActiveAccountId()! };
    }

    return loginStatus(manifest.email);
  } catch (e) {
    if (e instanceof SettingsTamperedError) {
      clearDpapiKeyX();
      return loginStatus(manifest.email);
    }
    throw e;
  }
}

export async function activate(input: ActivateInput): Promise<{ email: string }> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }

  const accountId = accountIdFromEmail(email);
  if (accountExists(accountId)) {
    throw new Error('This account is already on this computer. Log in with that email.');
  }

  setAddingNewAccount(false);
  setActiveAccountId(accountId);
  ensureProfileRecordSecret();
  registerAccount(email);

  const instanceId = createInstanceId();
  const licenseClient = createDevLicenseClient(generateKeyX);
  const { keyX, token } = await licenseClient.activate({
    email: input.email,
    activationKey: input.activationKey,
    instanceId,
    appVersion: app.getVersion(),
  });

  ensureAccountRecordSecret();

  writeManifest({
    version: 1,
    email,
    instanceId,
    activatedAt: new Date().toISOString(),
    passwordSet: false,
    unlockEpoch: 1,
  });
  storeActivationToken(token);
  storePendingKeyX(keyX);
  clearAuthStatusCache();

  return { email };
}

export async function setPassword(input: SetPasswordInput): Promise<void> {
  const manifest = readManifest();
  if (!manifest) throw new Error('Activate before setting a password.');
  if (manifest.passwordSet) throw new Error('Password is already set. Log in instead.');

  if (input.password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
  if (input.password !== input.confirmPassword) {
    throw new Error('Passwords do not match.');
  }

  const keyX = readPendingKeyX();
  if (!keyX) throw new Error('Activation state is incomplete. Activate again.');

  const wrap = await wrapKeyWithPassword(keyX, input.password);
  storePasswordWrap(wrap);
  clearPendingKeyX();

  const updated = {
    ...manifest,
    passwordSet: true,
    keyXId: keyXFingerprint(keyX),
  };
  writeManifest(updated);
  persistLoginPolicy(input.loginPolicy ?? DEFAULT_LOGIN_POLICY);
  completeUnlock(keyX, updated);
}

export async function login(input: LoginInput): Promise<void> {
  const manifest = readManifest();
  if (!manifest?.passwordSet) throw new Error('Set a password before logging in.');

  const wrap = readPasswordWrap();
  if (!wrap) throw new Error('Password wrap is missing. Contact support.');

  const token = readActivationToken();
  if (!token) throw new Error('Activation token is missing.');

  const keyX = await unwrapKeyWithPassword(wrap, input.password);
  const payload = verifyActivationToken(token);

  if (payload.email !== manifest.email || payload.instanceId !== manifest.instanceId) {
    throw new Error('Activation token does not match this account on this computer.');
  }

  completeUnlock(keyX, manifest);
}

/** Switch to another activated account (login panel). */
export function selectAccount(accountId: string): void {
  if (!accountExists(accountId)) throw new Error('Account not found on this computer.');
  setActiveAccountId(accountId);
  setLastActiveAccountId(accountId);
  lockDatabaseSession();
}

/** Start full activation for a new account. */
export function beginAddAccount(): void {
  lockDatabaseSession();
  setAddingNewAccount(true);
  setActiveAccountId(null);
}

/** Cancel new-account activation and return to the login panel. */
export function returnToLogin(): void {
  lockDatabaseSession();
  setAddingNewAccount(false);
  setActiveAccountId(null);
  bootstrapActiveAccount();
}

/** Log out: close the app and require password on the next launch. */
export function logOut(): void {
  const manifest = readManifest();
  if (manifest) {
    writeManifest({
      ...manifest,
      requirePasswordOnLaunch: true,
      unlockEpoch: (manifest.unlockEpoch ?? 1) + 1,
    });
  }
  clearDpapiKeyX();
  lockDatabaseSession();
  app.quit();
}

export function isActivated(): boolean {
  bootstrapActiveAccount();
  return getActiveAccountId() !== null && isAccountActivated();
}

export { getLoginPolicy, getColorTheme, setLoginPolicy, setColorTheme };
