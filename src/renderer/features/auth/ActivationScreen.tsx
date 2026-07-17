import { useState, type FormEvent } from 'react';
import { AuthError, AuthShell, AuthSubmit, authInputCls, formatAuthError } from './AuthShell';

declare const __BLAZEAUDIT_DEV_ACTIVATION__: boolean;

const devActivation = typeof __BLAZEAUDIT_DEV_ACTIVATION__ !== 'undefined' && __BLAZEAUDIT_DEV_ACTIVATION__;

export function ActivationScreen({
  onDone,
  hasExistingAccounts,
  onBack,
}: {
  onDone: () => void;
  hasExistingAccounts?: boolean;
  onBack?: () => void;
}) {
  const [email, setEmail] = useState('');
  const [activationKey, setActivationKey] = useState(devActivation ? 'DEV-TEST-KEY' : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await window.blazeaudit.auth.activate({ email, activationKey });
      onDone();
    } catch (err) {
      setError(formatAuthError(err, 'Activation failed.'));
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={hasExistingAccounts ? 'Activate another account' : 'Activate BlazeAudit'}
      subtitle={
        devActivation
          ? 'One-time online activation. Use DEV-TEST-KEY or any BLZ- key in development.'
          : 'One-time online activation. Enter the activation key issued for this install.'
      }
    >
      {hasExistingAccounts && onBack && (
        <button
          type="button"
          onClick={() => void onBack()}
          className="mb-4 text-xs text-neutral-500 transition-colors hover:text-flame-300"
        >
          ← Back to sign in
        </button>
      )}
      <form onSubmit={submit} className="space-y-4">
        <AuthError message={error} />
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-neutral-400">Email</span>
          <input
            className={authInputCls}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-neutral-400">Activation key</span>
          <input
            className={authInputCls}
            value={activationKey}
            onChange={(e) => setActivationKey(e.target.value)}
            required
          />
        </label>
        <AuthSubmit label="Activate" loading={loading} />
      </form>
    </AuthShell>
  );
}
