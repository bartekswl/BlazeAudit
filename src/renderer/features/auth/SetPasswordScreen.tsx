import { useState, type FormEvent } from 'react';
import { DEFAULT_LOGIN_POLICY, type LoginPolicy } from '../../../shared/loginPolicy';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../../shared/auth';
import { LoginPolicySelect } from '../../components/LoginPolicySelect';
import { AuthError, AuthShell, AuthSubmit, authInputCls, formatAuthError } from './AuthShell';

export function SetPasswordScreen({ email, onDone }: { email: string; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginPolicy, setLoginPolicy] = useState<LoginPolicy>(DEFAULT_LOGIN_POLICY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await window.blazeaudit.auth.setPassword({ password, confirmPassword, loginPolicy });
      onDone();
    } catch (err) {
      setError(formatAuthError(err, 'Could not set password.'));
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
          <span className="ba-auth-label mb-1.5 block text-xs font-medium">Password</span>
          <input
            className={authInputCls}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            required
          />
        </label>
        <label className="block">
          <span className="ba-auth-label mb-1.5 block text-xs font-medium">Confirm password</span>
          <input
            className={authInputCls}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            required
          />
        </label>
        <p className="ba-auth-hint text-xs">
          {PASSWORD_MIN_LENGTH}–{PASSWORD_MAX_LENGTH} characters. Used only on this machine.
        </p>
        <LoginPolicySelect value={loginPolicy} onChange={setLoginPolicy} />
        <AuthSubmit label="Save password" loading={loading} />
      </form>
    </AuthShell>
  );
}
