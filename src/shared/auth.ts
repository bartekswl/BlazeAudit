// Auth types shared across main, preload, and renderer.

import type { LoginPolicy } from './loginPolicy';

export type AuthPhase = 'activation' | 'set_password' | 'login' | 'unlocked';

export interface AccountSummary {
  id: string;
  email: string;
  addedAt: string;
}

export type AuthStatus =
  | { phase: 'activation'; hasExistingAccounts?: boolean }
  | { phase: 'set_password'; email: string }
  | { phase: 'login'; email: string; accountId: string; accounts: AccountSummary[] }
  | { phase: 'unlocked'; email: string; accountId: string };

export interface ActivateInput {
  email: string;
  activationKey: string;
}

export interface SetPasswordInput {
  password: string;
  confirmPassword: string;
  loginPolicy?: LoginPolicy;
}

export interface LoginInput {
  password: string;
}

export interface SecuritySettings {
  loginPolicy: LoginPolicy;
  dataDir: string;
  osUsername: string;
  accountId: string;
}
