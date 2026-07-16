import { LifeBuoy } from 'lucide-react';

export function SupportScreen() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="ba-panel-hero p-6">
        <div className="flex items-start gap-4">
          <div className="ba-empty-icon shrink-0">
            <LifeBuoy className="size-7" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[var(--ba-text-primary)]">Support</h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--ba-text-muted)]">
              Help and contact options will appear here.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
