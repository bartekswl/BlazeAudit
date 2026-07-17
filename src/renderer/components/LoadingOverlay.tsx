import { cn } from '../lib/cn';
import { AuthBackground } from '../features/auth/AuthBackground';
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
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <StartupLoader label={label} />
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
