import type { LucideIcon } from 'lucide-react';

export function Placeholder({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="ba-empty-icon">
        <Icon className="size-7" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[var(--ba-text-primary)]">{title}</h2>
        <p className="mt-1 max-w-sm text-sm text-[var(--ba-text-muted)]">{description}</p>
      </div>
      <span className="rounded-full border border-[var(--ba-panel-border)] bg-[var(--ba-flame-soft)] px-3 py-1 text-xs text-[var(--ba-nav-active-text)]">
        Coming in a later phase
      </span>
    </div>
  );
}
