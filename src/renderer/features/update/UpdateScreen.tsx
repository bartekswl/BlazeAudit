import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  RotateCw,
  ShieldCheck,
} from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';

/**
 * Update centre.
 *
 * NOTE: This screen is currently front-end only. The `simulate*` helpers below
 * stand in for the real `electron-updater` flow (check → download → install).
 * When the updater IPC lands, replace the bodies of `runCheck`, `runDownload`,
 * and `restartAndInstall` with the real calls — the phase state machine and the
 * entire UI stay exactly the same.
 */

type Phase =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'error';

// --- Simulation stand-ins (remove once the updater IPC is wired) -------------
const SIMULATED_LATEST_VERSION = '0.1.0';
const SIMULATED_RELEASE_NOTES = [
  'Project Number field on documents and the ULC form',
  'Compact customer detail panel with document search and date filters',
  'Faster startup and various fixes',
];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// ----------------------------------------------------------------------------

export function UpdateScreen() {
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const cancelled = useRef(false);

  useEffect(() => {
    void window.blazeaudit.app.getVersion().then(setCurrentVersion);
    return () => {
      cancelled.current = true;
    };
  }, []);

  const runCheck = useCallback(async () => {
    setError(null);
    setProgress(0);
    setPhase('checking');
    try {
      // TODO(updater): replace with window.blazeaudit.update.check()
      await wait(1200);
      if (cancelled.current) return;
      // Simulation always reports an available update so the flow is visible.
      setPhase('available');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not check for updates.');
      setPhase('error');
    }
  }, []);

  const runDownload = useCallback(async () => {
    setConfirmOpen(false);
    setError(null);
    setProgress(0);
    setPhase('downloading');
    try {
      // TODO(updater): replace with window.blazeaudit.update.download() and
      // subscribe to download-progress events instead of this loop.
      for (let pct = 0; pct <= 100; pct += 10) {
        if (cancelled.current) return;
        setProgress(pct);
        await wait(220);
      }
      setPhase('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed.');
      setPhase('error');
    }
  }, []);

  const restartAndInstall = useCallback(() => {
    // TODO(updater): replace with window.blazeaudit.update.install() which calls
    // autoUpdater.quitAndInstall() in the main process.
    // Simulation: nothing to do yet.
  }, []);

  const busy = phase === 'checking' || phase === 'downloading';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Intro / what this does */}
      <section className="ba-panel-hero p-6">
        <div className="flex items-start gap-4">
          <div className="ba-empty-icon shrink-0">
            <RefreshCw className="size-7" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[var(--ba-text-primary)]">
              Updates
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--ba-text-muted)]">
              Keep BlazeAudit current with the latest features and fixes. Updates install in
              place and restart the app — your accounts, documents, and settings are never
              touched.
            </p>
          </div>
        </div>
      </section>

      {/* Current version + primary action */}
      <section className="ba-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="ba-section-title">Installed version</h3>
            <p className="mt-1 font-mono text-sm text-[var(--ba-text-secondary)]">
              BlazeAudit {currentVersion ? `v${currentVersion}` : '—'}
            </p>
          </div>
          {(phase === 'idle' || phase === 'up-to-date' || phase === 'error') && (
            <button
              type="button"
              className="ba-btn-primary"
              onClick={() => void runCheck()}
              disabled={busy}
            >
              <RefreshCw className="size-4" />
              Check for updates
            </button>
          )}
          {phase === 'checking' && (
            <button type="button" className="ba-btn-primary" disabled>
              <RefreshCw className="size-4 animate-spin" />
              Checking…
            </button>
          )}
        </div>

        {/* Status area */}
        {phase === 'up-to-date' && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--ba-panel-border)] bg-white/5 px-3 py-2.5 text-sm text-[var(--ba-text-secondary)]">
            <CheckCircle2 className="size-4 text-emerald-400" />
            You&apos;re on the latest version.
          </div>
        )}

        {phase === 'available' && (
          <div className="mt-4 rounded-lg border border-[var(--ba-panel-border)] bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--ba-text-primary)]">
                  Update available — v{SIMULATED_LATEST_VERSION}
                </p>
                <p className="mt-0.5 text-xs text-[var(--ba-text-muted)]">
                  Download size is small — only the changed parts are fetched.
                </p>
              </div>
              <button
                type="button"
                className="ba-btn-primary"
                onClick={() => setConfirmOpen(true)}
              >
                <Download className="size-4" />
                Update
              </button>
            </div>
            <ul className="mt-3 space-y-1.5 border-t border-[var(--ba-panel-border)] pt-3 text-xs text-[var(--ba-text-muted)]">
              {SIMULATED_RELEASE_NOTES.map((note) => (
                <li key={note} className="flex gap-2">
                  <span className="mt-1 size-1 shrink-0 rounded-full bg-[var(--ba-flame)]" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {phase === 'downloading' && (
          <div className="mt-4 rounded-lg border border-[var(--ba-panel-border)] bg-white/5 p-4">
            <div className="flex items-center justify-between text-sm text-[var(--ba-text-secondary)]">
              <span className="flex items-center gap-2">
                <Download className="size-4" />
                Downloading v{SIMULATED_LATEST_VERSION}…
              </span>
              <span className="font-mono text-xs text-[var(--ba-text-muted)]">{progress}%</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(135deg,#fb923c_0%,#ea580c_100%)] transition-[width] duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {phase === 'ready' && (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-[var(--ba-text-primary)]">
                <CheckCircle2 className="size-4 text-emerald-400" />
                v{SIMULATED_LATEST_VERSION} is ready to install.
              </div>
              <button type="button" className="ba-btn-primary" onClick={restartAndInstall}>
                <RotateCw className="size-4" />
                Restart &amp; install
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--ba-text-muted)]">
              BlazeAudit will close, install the update, and reopen automatically. This takes a
              few seconds.
            </p>
          </div>
        )}

        {phase === 'error' && error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* How it works / instructions */}
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
              <span className="text-[var(--ba-text-secondary)]">Download.</span> After you
              confirm, the update downloads in the background — only the changed parts, so it
              stays small.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-[var(--ba-panel-border)] text-xs font-semibold text-[var(--ba-text-secondary)]">
              3
            </span>
            <span>
              <span className="text-[var(--ba-text-secondary)]">Restart.</span> BlazeAudit
              closes, installs, and reopens — no setup wizard, no reinstall.
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
          onConfirm={() => void runDownload()}
        >
          <p>
            This downloads and installs{' '}
            <span className="font-semibold text-[var(--ba-text-secondary)]">
              v{SIMULATED_LATEST_VERSION}
            </span>
            , then restarts BlazeAudit.
          </p>
          <p>Your accounts, documents, and settings are kept exactly as they are.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
