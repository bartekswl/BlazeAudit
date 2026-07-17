import { useState, type FormEvent } from 'react';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../../../shared/auth';
import { formatAuthError } from '../auth/AuthShell';

export function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await window.blazeaudit.auth.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated.');
    } catch (err) {
      setError(formatAuthError(err, 'Could not change password.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="ba-panel p-5">
      <h3 className="ba-section-title">Change password</h3>
      <p className="mt-1 text-xs leading-relaxed text-[var(--ba-text-muted)]">
        Update the local password that unlocks this account. Must be {PASSWORD_MIN_LENGTH}–
        {PASSWORD_MAX_LENGTH} characters.
      </p>
      <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-3">
        <label className="block">
          <span className="ba-field-label">Current password</span>
          <input
            className="ba-input px-3 py-2 text-sm"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <label className="block">
          <span className="ba-field-label">New password</span>
          <input
            className="ba-input px-3 py-2 text-sm"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            required
          />
        </label>
        <label className="block">
          <span className="ba-field-label">Confirm new password</span>
          <input
            className="ba-input px-3 py-2 text-sm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            required
          />
        </label>
        <div className="flex items-center gap-3 pt-1">
          <button type="submit" className="ba-btn-primary px-4 py-2 text-sm" disabled={saving}>
            {saving ? 'Updating…' : 'Update password'}
          </button>
          {message && <p className="text-xs text-emerald-600">{message}</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </form>
    </section>
  );
}
