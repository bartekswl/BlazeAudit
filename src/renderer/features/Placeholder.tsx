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
      <div className="grid size-14 place-items-center rounded-2xl bg-white/5 text-neutral-500">
        <Icon className="size-7" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-neutral-200">{title}</h2>
        <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
      </div>
      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-500">
        Coming in a later phase
      </span>
    </div>
  );
}
