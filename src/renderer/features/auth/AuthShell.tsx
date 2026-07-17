import { Flame } from 'lucide-react';
import type { ReactNode } from 'react';
import { TitleBar } from '../../components/TitleBar';

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
    <div className="ba-auth-shell relative flex h-screen flex-col overflow-hidden text-neutral-200">
      <div className="ba-auth-bg" aria-hidden>
        <div className="ba-auth-bg__base" />
        <div className="ba-auth-bg__glow ba-auth-bg__glow--a" />
        <div className="ba-auth-bg__glow ba-auth-bg__glow--b" />
        <div className="ba-auth-bg__glow ba-auth-bg__glow--c" />
        <svg className="ba-auth-bg__lines" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="ba-auth-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(249 115 22)" stopOpacity="0" />
              <stop offset="35%" stopColor="rgb(249 115 22)" stopOpacity="0.55" />
              <stop offset="70%" stopColor="rgb(56 189 248)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="rgb(56 189 248)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ba-auth-line-2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(234 88 12)" stopOpacity="0" />
              <stop offset="40%" stopColor="rgb(251 146 60)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="rgb(14 165 233)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="ba-auth-bg__sweep ba-auth-bg__sweep--1" fill="none" stroke="url(#ba-auth-line)" strokeWidth="1.25">
            <path d="M-80 620 C 180 520, 320 480, 520 500 S 880 620, 1280 420" />
            <path d="M-40 680 C 220 560, 400 540, 600 560 S 960 680, 1320 480" />
            <path d="M-120 540 C 140 460, 360 420, 560 440 S 900 520, 1300 340" />
          </g>
          <g className="ba-auth-bg__sweep ba-auth-bg__sweep--2" fill="none" stroke="url(#ba-auth-line-2)" strokeWidth="1">
            <path d="M-60 200 C 200 280, 380 300, 560 260 S 920 120, 1280 180" />
            <path d="M-100 260 C 160 340, 420 360, 640 300 S 980 160, 1340 220" />
            <path d="M 100 120 C 360 80, 520 140, 720 100 S 1040 40, 1400 90" />
          </g>
          <g className="ba-auth-bg__grid" stroke="rgb(249 115 22 / 0.12)" strokeWidth="0.75">
            <path d="M100 0 V800 M250 0 V800 M400 0 V800 M550 0 V800 M700 0 V800 M850 0 V800 M1000 0 V800" />
            <path d="M0 120 H1200 M0 260 H1200 M0 400 H1200 M0 540 H1200 M0 680 H1200" />
          </g>
          <circle className="ba-auth-bg__pulse" cx="780" cy="360" r="120" fill="none" stroke="rgb(249 115 22 / 0.2)" strokeWidth="1" />
          <circle className="ba-auth-bg__pulse ba-auth-bg__pulse--delay" cx="780" cy="360" r="180" fill="none" stroke="rgb(56 189 248 / 0.12)" strokeWidth="1" />
        </svg>
      </div>

      <TitleBar />
      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl border border-flame-500/25 bg-flame-500/10 shadow-[0_0_40px_rgb(249_115_22_/_0.15)]">
              <Flame className="size-7 text-flame-500" />
            </div>
            <h1 className="text-2xl font-semibold text-neutral-100">{title}</h1>
            <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-neutral-950/70 p-6 shadow-[0_24px_64px_rgb(0_0_0_/_0.45)] backdrop-blur-md">
            {children}
          </div>
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
