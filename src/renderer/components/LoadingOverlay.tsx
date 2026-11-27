import { cn } from '../lib/cn';
import { ENABLE_BRANDED_LOADING_SCREEN } from '../../shared/bootSplash';
import { AuthBackground } from '../features/auth/AuthBackground';
import { LoadingBrandMark, LoadingBrandPhotos } from './LoadingBrandBackdrop';
import { StartupLoader } from './StartupLoader';

type LoadingOverlayProps = {
  label?: string;
  /** `fixed` for full-viewport overlays; `absolute` for in-panel overlays. */
  position?: 'fixed' | 'absolute';
  className?: string;
};

export function LoadingOverlay({
  label = 'Loading…',
  position = 'fixed',
  className,
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'ba-loading-overlay inset-0 z-50 flex flex-col',
        position === 'fixed' ? 'fixed' : 'absolute',
        className,
      )}
      aria-busy="true"
      role="status"
    >
      <AuthBackground />
      <LoadingBrandPhotos variant="boot" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <StartupLoader label={label} branded />
      </div>
    </div>
  );
}

/**
 * Dedicated 3/4-size PDF export loading window:
 * pulsating BlazeAudit logo, distinct fire-safety photos, "Creating PDF...", and a bottom Cancel button.
 */
export function PdfExportOverlay({
  label = 'Creating PDF...',
  onCancel,
}: {
  label?: string;
  onCancel?: () => void;
}) {
  if (!ENABLE_BRANDED_LOADING_SCREEN) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/70">
        <StartupLoader label={label} inline />
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-neutral-600 bg-neutral-900/90 px-4 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:bg-neutral-800"
          >
            Cancel
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-6 backdrop-blur-[5px]"
      aria-busy="true"
      aria-label={label}
      role="status"
    >
      <div className="ba-pdf-export-window relative flex h-[75vh] w-[75vw] max-h-[45rem] max-w-[68rem] flex-col items-center justify-center overflow-hidden rounded-3xl border border-orange-500/25 bg-[#0a0a0a] shadow-[0_32px_90px_rgba(0,0,0,0.82),0_0_52px_rgba(249,115,22,0.15)]">
        <AuthBackground />
        <LoadingBrandPhotos variant="pdf" />

        <div className="relative z-10 flex flex-col items-center justify-center gap-3">
          <LoadingBrandMark logoOnly />
          <div className="boot-loader-spinner" aria-hidden="true" />
          <span
            className="text-xs font-semibold tracking-[0.14em] text-zinc-300"
            style={{ fontFamily: "'Bahnschrift', 'Segoe UI', system-ui, sans-serif" }}
          >
            {label}
          </span>
        </div>

        {onCancel ? (
          <div className="absolute inset-x-0 bottom-7 z-20 flex justify-center">
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer rounded-full border border-orange-500/35 bg-zinc-950/80 px-6 py-2 text-xs font-semibold tracking-[0.16em] uppercase text-zinc-200 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:border-orange-400/65 hover:bg-orange-500/15 hover:text-white active:scale-[0.98]"
              style={{ fontFamily: "'Bahnschrift', 'Segoe UI', system-ui, sans-serif" }}
            >
              Cancel
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function InlineLoader({
  label = 'Loading…',
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'ba-inline-loader flex flex-1 items-center justify-center',
        compact ? 'min-h-[4rem] py-4' : 'min-h-[12rem]',
      )}
    >
      <StartupLoader label={label} inline />
    </div>
  );
}
