import { cn } from '../lib/cn';
import { LoadingBrandMark } from './LoadingBrandBackdrop';

export function StartupLoader({
  label = 'Loading…',
  inline = false,
  branded = false,
  className,
}: {
  label?: string;
  /** When true, omit flex-1 so the loader can sit inside centered containers. */
  inline?: boolean;
  /** When true, show the translucent BlazeAudit shield logo and brand lockup above the spinner. */
  branded?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn('boot-loader', !inline && 'boot-loader--fill', className)}
      role="status"
      aria-live="polite"
    >
      {branded ? <LoadingBrandMark /> : null}
      <div className="boot-loader-spinner" aria-hidden="true" />
      <span className="boot-loader-label">{label}</span>
    </div>
  );
}
