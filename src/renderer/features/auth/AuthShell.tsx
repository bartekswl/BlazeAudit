import { Flame } from 'lucide-react';
import type { ReactNode } from 'react';
import { TitleBar } from '../../components/TitleBar';
import { AuthBackground } from './AuthBackground';

/** Strip Electron IPC wrappers so users see a clean message. */
export function formatAuthError(err: unknown, fallback = 'Something went wrong.'): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : fallback;
  const unwrapped = raw
    .replace(/^Error invoking remote method '[^']+':\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();

  if (/incorrect password/i.test(unwrapped)) return 'Password incorrect.';
  return unwrapped || fallback;
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="ba-auth-shell relative flex h-screen flex-col overflow-hidden">
      <AuthBackground />

      <TitleBar />
      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="ba-auth-logo mx-auto mb-4 grid size-14 place-items-center rounded-2xl">
              <Flame className="size-7 text-flame-500" />
            </div>
            <h1 className="ba-auth-title text-2xl font-semibold">{title}</h1>
            <p className="ba-auth-subtitle mt-2 text-sm">{subtitle}</p>
          </div>
          <div className="ba-auth-card rounded-2xl border p-6 backdrop-blur-md">{children}</div>
        </div>
      </div>
    </div>
  );
}

export const authInputCls = 'ba-auth-input w-full rounded-lg border px-3 py-2.5 text-sm outline-none';

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="ba-auth-error mb-4 rounded-lg border px-3 py-2 text-sm">{message}</div>;
}

export function AuthSubmit({
  label,
  loading,
  disabled,
}: {
  label: string;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="mt-2 w-full rounded-lg bg-flame-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-flame-600 disabled:opacity-50"
    >
      {loading ? 'Please wait…' : label}
    </button>
  );
}
