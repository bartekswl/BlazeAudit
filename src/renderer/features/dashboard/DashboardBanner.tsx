import { useEffect, useState } from 'react';

export function DashboardBanner() {
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  useEffect(() => {
    void window.blazeaudit.app.getTitleBarIconUrl().then(setIconUrl);
  }, []);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[var(--ba-panel-border)] bg-[linear-gradient(135deg,rgba(23,23,23,0.95)_0%,rgba(10,10,10,1)_55%,rgba(15,15,15,1)_100%)] px-5 py-4 sm:px-6 sm:py-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
      >
        <div className="absolute -left-8 top-1/2 size-40 -translate-y-1/2 rounded-full bg-flame-500/10 blur-3xl" />
        <div className="absolute right-0 top-0 size-32 rounded-full bg-orange-600/10 blur-2xl" />
      </div>

      <div className="relative flex items-center gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-flame-500/20 bg-flame-500/[0.08] sm:size-14">
          {iconUrl ? (
            <img src={iconUrl} alt="" className="size-8 object-contain sm:size-9" draggable={false} />
          ) : (
            <div className="size-8 rounded-md bg-flame-500/30 sm:size-9" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--ba-text-primary)] sm:text-2xl">
            BlazeAudit
          </h1>
          <p className="mt-0.5 text-sm text-[var(--ba-text-muted)]">
            Fire inspection documentation — offline, encrypted, field-ready.
          </p>
        </div>
      </div>
    </section>
  );
}
