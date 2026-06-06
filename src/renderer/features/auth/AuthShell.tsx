import { Flame } from 'lucide-react';
import type { ReactNode } from 'react';

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
    <div className="flex h-screen flex-col bg-neutral-950 text-neutral-200">
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-flame-500/10">
              <Flame className="size-7 text-flame-500" />
            </div>
            <h1 className="text-2xl font-semibold text-neutral-100">{title}</h1>
            <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export const authInputCls =
  'w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-flame-500';

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {message}
    </div>
  );
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
