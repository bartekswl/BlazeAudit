import { cn } from '../lib/cn';

export function StartupLoader({
  label = 'Loading…',
  inline = false,
  className,
}: {
  label?: string;
  /** When true, omit flex-1 so the loader can sit inside centered containers. */
  inline?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn('boot-loader', !inline && 'boot-loader--fill', className)}
      role="status"
      aria-live="polite"
    >
      <div className="boot-loader-spinner" aria-hidden="true" />
      <span className="boot-loader-label">{label}</span>
    </div>
  );
}
