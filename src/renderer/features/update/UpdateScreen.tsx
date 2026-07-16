import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { UpdateStatus } from '../../../shared/update';

function notesToLines(notes: string | null): string[] {
  if (!notes) return [];
  return notes
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

export function UpdateScreen() {
  const [currentVersion, setCurrentVersion] = useState('');
  const [status, setStatus] = useState<UpdateStatus>({ phase: 'idle' });
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    void window.blazeaudit.app.getVersion().then(setCurrentVersion);
    const unsubscribe = window.blazeaudit.update.onStatus(setStatus);
    return unsubscribe;
  }, []);

  const check = useCallback(() => {
    setStatus({ phase: 'checking' });
    void window.blazeaudit.update.check();
  }, []);

  const download = useCallback(() => {
    setConfirmOpen(false);
    const version = status.phase === 'available' ? status.version : '';
    setStatus({
      phase: 'downloading',
      version,
      percent: 0,
      transferred: 0,
      total: 0,
      bytesPerSecond: 0,
    });
    void window.blazeaudit.update.download();
  }, [status]);

  const phase = status.phase;
  const busy =
    phase === 'checking' ||
    phase === 'downloading' ||
    phase === 'downloaded' ||
    phase === 'installing';
  const availableVersion =
    status.phase === 'available' ||
    status.phase === 'downloaded' ||
    status.phase === 'downloading' ||
    status.phase === 'installing'
      ? status.version
      : '';
  const showProgress =
    status.phase === 'downloading' ||
    status.phase === 'downloaded' ||
    status.phase === 'installing';
  const progressPercent =
    status.phase === 'downloading'
      ? status.percent
      : status.phase === 'downloaded' || status.phase === 'installing'
        ? 100
        : 0;
  const progressLabel =
    status.phase === 'installing'
      ? 'Updating BlazeAudit…'
      : status.phase === 'downloaded'
        ? 'Preparing update…'
        : `Downloading${status.phase === 'downloading' && status.version ? ` v${status.version}` : ''}…`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="ba-panel-hero p-6">
        <div className="flex items-start gap-4">
          <div className="ba-empty-icon shrink-0">
            <RefreshCw className="size-7" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[var(--ba-text-primary)]">Updates</h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--ba-text-muted)]">
              Keep BlazeAudit current with the latest features and fixes. Updates install in
              place and restart the app — your accounts, documents, and settings are never
              touched.
            </p>
          </div>
        </div>
      </section>

      <section className="ba-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="ba-section-title">Installed version</h3>
            <p className="mt-1 font-mono text-sm text-[var(--ba-text-secondary)]">
              BlazeAudit {currentVersion ? `v${currentVersion}` : '—'}
            </p>
          </div>
          {phase === 'checking' ? (
            <button type="button" className="ba-btn-primary" disabled>
              <RefreshCw className="size-4 animate-spin" />
              Checking…
            </button>
          ) : (
            !showProgress && (
              <button type="button" className="ba-btn-primary" onClick={check} disabled={busy}>
                <RefreshCw className="size-4" />
                Check for updates
              </button>
            )
          )}
        </div>

        {phase === 'not-available' && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--ba-panel-border)] bg-white/5 px-3 py-2.5 text-sm text-[var(--ba-text-secondary)]">
            <CheckCircle2 className="size-4 text-emerald-400" />
            You&apos;re on the latest version.
          </div>
        )}

        {status.phase === 'available' && (
          <div className="mt-4 rounded-lg border border-[var(--ba-panel-border)] bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--ba-text-primary)]">
                  Update available — v{status.version}
                </p>
                <p className="mt-0.5 text-xs text-[var(--ba-text-muted)]">
                  Download size is small — only the changed parts are fetched.
                </p>
              </div>
              <button type="button" className="ba-btn-primary" onClick={() => setConfirmOpen(true)}>
                <Download className="size-4" />
                Update
              </button>
            </div>
            {notesToLines(status.notes).length > 0 && (
              <ul className="mt-3 space-y-1.5 border-t border-[var(--ba-panel-border)] pt-3 text-xs text-[var(--ba-text-muted)]">
                {notesToLines(status.notes).map((note) => (
                  <li key={note} className="flex gap-2">
                    <span className="mt-1 size-1 shrink-0 rounded-full bg-[var(--ba-flame)]" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {showProgress && (
          <div className="mt-4 rounded-lg border border-[var(--ba-panel-border)] bg-white/5 p-4">
            <div className="flex items-center justify-between text-sm text-[var(--ba-text-secondary)]">
              <span className="flex items-center gap-2">
                {status.phase === 'installing' ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {progressLabel}
              </span>
              <span className="font-mono text-xs text-[var(--ba-text-muted)]">
                {progressPercent}%
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(135deg,#fb923c_0%,#ea580c_100%)] transition-[width] duration-200 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {status.phase === 'error' && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{status.message}</span>
          </div>
        )}
      </section>

      <section className="ba-panel p-5">
        <h3 className="ba-section-title">How updating works</h3>
        <ol className="mt-3 space-y-3 text-sm text-[var(--ba-text-muted)]">
          <li className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-[var(--ba-panel-border)] text-xs font-semibold text-[var(--ba-text-secondary)]">
              1
            </span>
            <span>
              <span className="text-[var(--ba-text-secondary)]">Check.</span> BlazeAudit asks
              whether a newer version is available.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-[var(--ba-panel-border)] text-xs font-semibold text-[var(--ba-text-secondary)]">
              2
            </span>
            <span>
              <span className="text-[var(--ba-text-secondary)]">Update.</span> After you confirm,
              the update downloads — only the changed parts, so it stays small.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-[var(--ba-panel-border)] text-xs font-semibold text-[var(--ba-text-secondary)]">
              3
            </span>
            <span>
              <span className="text-[var(--ba-text-secondary)]">Restart.</span> BlazeAudit closes
              briefly, installs silently, and reopens — no setup wizard.
            </span>
          </li>
        </ol>
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-[var(--ba-panel-border)] bg-white/5 px-3 py-2.5 text-xs text-[var(--ba-text-muted)]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
          <span>
            Your data stays put. Accounts, the encrypted database, and preferences live outside
            the program folder, so updating never removes or changes them.
          </span>
        </div>
      </section>

      {confirmOpen && (
        <ConfirmDialog
          title="Update BlazeAudit?"
          icon={Download}
          confirmLabel="Download & update"
          cancelLabel="Not now"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={download}
        >
          <p>
            This downloads and installs{' '}
            <span className="font-semibold text-[var(--ba-text-secondary)]">
              v{availableVersion}
            </span>
            , then restarts BlazeAudit.
          </p>
          <p>Your accounts, documents, and settings are kept exactly as they are.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
