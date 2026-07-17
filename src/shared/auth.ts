// Auth types shared across main, preload, and renderer.

import type { LoginPolicy } from './loginPolicy';
import type { ColorTheme } from './theme';

export type AuthPhase = 'activation' | 'set_password' | 'login' | 'unlocked';

export interface AccountSummary {
  id: string;
  email: string;
  addedAt: string;
}

export type AuthStatus =
  | { phase: 'activation'; hasExistingAccounts?: boolean }
  | { phase: 'set_password'; email: string }
  | {
      phase: 'login';
      email: string;
      accountId: string;
      accounts: AccountSummary[];
      /** Account preference — available before unlock for themed login. */
      colorTheme?: ColorTheme;
    }
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

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface LoginInput {
  password: string;
}

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 20;

/** Throws if password is outside the allowed length. */
export function assertPasswordLength(password: string): void {
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw new Error(
      `Password must be ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters.`,
    );
  }
}

export interface SecuritySettings {
  loginPolicy: LoginPolicy;
  colorTheme: ColorTheme;
  dataDir: string;
  osUsername: string;
  accountId: string;
}
