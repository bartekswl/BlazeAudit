import { useState, type FormEvent } from 'react';
import { DEFAULT_LOGIN_POLICY, type LoginPolicy } from '../../../shared/loginPolicy';
import { LoginPolicySelect } from '../../components/LoginPolicySelect';
import { AuthError, AuthShell, AuthSubmit, authInputCls } from './AuthShell';

export function SetPasswordScreen({ email, onDone }: { email: string; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginPolicy, setLoginPolicy] = useState<LoginPolicy>(DEFAULT_LOGIN_POLICY);  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await window.blazeaudit.auth.setPassword({ password, confirmPassword, loginPolicy });      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set password.');
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your password"
      subtitle={`Set a local password for ${email}. This unlocks your encrypted data offline.`}
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthError message={error} />
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-neutral-400">Password</span>
          <input
            className={authInputCls}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            minLength={8}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-neutral-400">Confirm password</span>
          <input
            className={authInputCls}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
        <p className="text-xs text-neutral-500">At least 8 characters. Used only on this machine.</p>
        <LoginPolicySelect value={loginPolicy} onChange={setLoginPolicy} />
        <AuthSubmit label="Save password" loading={loading} />      </form>
    </AuthShell>
  );
}
