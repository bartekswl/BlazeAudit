import { useState, type FormEvent } from 'react';
import { Plus, User } from 'lucide-react';
import type { AccountSummary } from '../../../shared/auth';
import { cn } from '../../lib/cn';
import { notifyAccountThemeSync } from '../../theme/ThemeProvider';
import { AuthError, AuthShell, AuthSubmit, authInputCls, formatAuthError } from './AuthShell';

export function LoginScreen({
  email,
  accountId,
  accounts,
  onDone,
  onFlowChange,
}: {
  email: string;
  accountId: string;
  accounts: AccountSummary[];
  onDone: () => void;
  onFlowChange: () => void;
}) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await window.blazeaudit.auth.login({ password });
      onDone();
    } catch (err) {
      setError(formatAuthError(err, 'Login failed.'));
      setLoading(false);
    }
  };

  const switchAccount = async (id: string) => {
    if (id === accountId || switchingId || loading) return;
    setSwitchingId(id);
    setError(null);
    setPassword('');
    try {
      await window.blazeaudit.auth.selectAccount(id);
      notifyAccountThemeSync();
      onFlowChange();
    } finally {
      setSwitchingId(null);
    }
  };

  const addAccount = async () => {
    await window.blazeaudit.auth.beginAddAccount();
    onFlowChange();
  };

  const busy = loading || switchingId !== null;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Choose an account, then enter your password to unlock its data."
    >
      <div className="space-y-4">
        <div>
          <p className="ba-auth-label mb-2 text-xs font-medium">Accounts on this computer</p>
          <ul className="space-y-1.5">
            {accounts.map((account) => {
              const selected = account.id === accountId;
              const switching = switchingId === account.id;
              return (
                <li key={account.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void switchAccount(account.id)}
                    className={cn(
                      'ba-auth-account flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors disabled:opacity-50',
                      selected && 'ba-auth-account--selected',
                    )}
                  >
                    <span
                      className={cn(
                        'ba-auth-account-icon grid size-8 shrink-0 place-items-center rounded-full',
                        selected && 'ba-auth-account-icon--selected',
                      )}
                    >
                      <User className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="ba-auth-account-email block truncate text-sm font-medium">
                        {account.email}
                      </span>
                      <span className="ba-auth-account-meta block text-xs">
                        {switching ? 'Switching…' : selected ? 'Signing in to this account' : 'Switch'}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <form onSubmit={submit} className="ba-auth-divider space-y-4 border-t pt-4">
          <AuthError message={error} />
          <label className="block">
            <span className="ba-auth-label mb-1.5 block text-xs font-medium">Password for {email}</span>
            <input
              className={authInputCls}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              disabled={busy}
            />
          </label>
          <AuthSubmit label="Log in" loading={loading} disabled={busy} />
        </form>

        <button
          type="button"
          disabled={busy}
          onClick={() => void addAccount()}
          className="ba-auth-add flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2.5 text-sm transition-colors disabled:opacity-50"
        >
          <Plus className="size-4" />
          Add another account
        </button>
      </div>
    </AuthShell>
  );
}
