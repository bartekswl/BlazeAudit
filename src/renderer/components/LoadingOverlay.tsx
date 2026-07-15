import { cn } from '../lib/cn';
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
        'ba-loading-overlay inset-0 z-50 flex flex-col bg-neutral-950/92 backdrop-blur-[2px]',
        position === 'fixed' ? 'fixed' : 'absolute',
        className,
      )}
      aria-busy="true"
      role="status"
    >
      <StartupLoader label={label} />
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
