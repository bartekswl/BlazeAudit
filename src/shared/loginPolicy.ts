// How often the local password is required to unlock the database.

export type LoginPolicy = 'always' | 'week' | 'month' | 'year' | 'never';

export const LOGIN_POLICIES: ReadonlyArray<{
  value: LoginPolicy;
  label: string;
  description: string;
}> = [
  {
    value: 'always',
    label: 'Every launch',
    description: 'Ask for your password each time BlazeAudit starts.',
  },
  {
    value: 'week',
    label: 'Every week',
    description: 'Remember unlock for 7 days on this Windows user profile.',
  },
  {
    value: 'month',
    label: 'Every month',
    description: 'Remember unlock for 30 days on this Windows user profile.',
  },
  {
    value: 'year',
    label: 'Every year',
    description: 'Remember unlock for 365 days on this Windows user profile.',
  },
  {
    value: 'never',
    label: 'Never',
    description: 'Unlock automatically for this Windows user (no password prompt).',
  },
];

export const DEFAULT_LOGIN_POLICY: LoginPolicy = 'always';

const MS_DAY = 24 * 60 * 60 * 1000;

export function loginPolicyIntervalMs(policy: LoginPolicy): number | null {
  switch (policy) {
    case 'always':
      return 0;
    case 'week':
      return 7 * MS_DAY;
    case 'month':
      return 30 * MS_DAY;
    case 'year':
      return 365 * MS_DAY;
    case 'never':
      return null;
  }
}

/** True when the user must enter a password (policy expired or set to always). */
export function isPasswordRequired(
  policy: LoginPolicy,
  lastUnlockAt: string | undefined,
  now = Date.now(),
): boolean {
  if (policy === 'never') return false;
  if (policy === 'always') return true;
  if (!lastUnlockAt) return true;

  const interval = loginPolicyIntervalMs(policy);
  if (!interval) return false;

  const elapsed = now - new Date(lastUnlockAt).getTime();
  return elapsed >= interval;
}
