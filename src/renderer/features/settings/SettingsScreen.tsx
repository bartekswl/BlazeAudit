import { useEffect, useState } from 'react';
import { DEFAULT_LOGIN_POLICY, type LoginPolicy } from '../../../shared/loginPolicy';
import { LoginPolicySelect } from '../../components/LoginPolicySelect';
import { AppearanceSection } from './AppearanceSection';
import { UserProfileSection } from './UserProfileSection';

export type SettingsScrollTarget = 'user-profile';

export function SettingsScreen({
  scrollTo,
  onScrollConsumed,
}: {
  scrollTo?: SettingsScrollTarget | null;
  onScrollConsumed?: () => void;
}) {
  const [loginPolicy, setLoginPolicy] = useState<LoginPolicy>(DEFAULT_LOGIN_POLICY);
  const [dataDir, setDataDir] = useState('');
  const [osUsername, setOsUsername] = useState('');
  const [accountId, setAccountId] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void window.blazeaudit.auth.getSecuritySettings().then((settings) => {
      setLoginPolicy(settings.loginPolicy);
      setDataDir(settings.dataDir);
      setOsUsername(settings.osUsername);
      setAccountId(settings.accountId);
    });
  }, []);

  useEffect(() => {
    if (scrollTo !== 'user-profile') return;
    const target = document.getElementById('user-profile');
    if (!target) return;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onScrollConsumed?.();
    });
  }, [scrollTo, onScrollConsumed]);

  const savePolicy = async (policy: LoginPolicy) => {
    setLoginPolicy(policy);
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await window.blazeaudit.auth.setLoginPolicy(policy);
      setMessage('Login preference saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save preference.');
      const settings = await window.blazeaudit.auth.getSecuritySettings();
      setLoginPolicy(settings.loginPolicy);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <UserProfileSection />

      <section className="ba-panel p-5">
        <h3 className="ba-section-title">Security</h3>
        <p className="mt-1 text-xs leading-relaxed text-[var(--ba-text-muted)]">
          Controls how often your password is required when you open BlazeAudit after closing it
          normally. Closing the window respects this schedule.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--ba-text-muted)]">
          Log out from the sidebar always closes the app and requires your password on the next
          launch — even if you chose never or a time interval above.
        </p>
        <div className="mt-4">
          <LoginPolicySelect
            value={loginPolicy}
            onChange={(policy) => void savePolicy(policy)}
          />
        </div>
        {saving && <p className="mt-2 text-xs text-[var(--ba-text-muted)]">Saving…</p>}
        {message && <p className="mt-2 text-xs text-emerald-300">{message}</p>}
        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      </section>

      <section className="ba-panel p-5">
        <h3 className="ba-section-title">Data location</h3>
        <p className="mt-1 text-xs leading-relaxed text-[var(--ba-text-muted)]">
          Settings and your encrypted account database are stored per account under an opaque folder
          id (not your email). Each account loads only its own files.
        </p>
        <dl className="mt-4 space-y-2 text-xs">
          <div>
            <dt className="text-[var(--ba-text-muted)]">Windows user</dt>
            <dd className="font-mono text-[var(--ba-text-secondary)]">{osUsername || '—'}</dd>
          </div>
          <div>
            <dt className="text-[var(--ba-text-muted)]">Account folder id</dt>
            <dd className="break-all font-mono text-[var(--ba-text-secondary)]">
              {accountId ? `${accountId.slice(0, 16)}…` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--ba-text-muted)]">Data folder</dt>
            <dd className="break-all font-mono text-[var(--ba-text-secondary)]">{dataDir || '—'}</dd>
          </div>
        </dl>
      </section>

      <AppearanceSection />
    </div>
  );
}
