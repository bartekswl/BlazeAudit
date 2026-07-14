import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarClock, CalendarDays, CheckCircle2, ImagePlus, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { DashboardStats } from '../../../shared/inspection';
import type { BusinessProfile } from '../../../shared/profile';

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

type StatVariant = 'flame' | 'emerald' | 'sky' | 'violet';

function StatTile({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  variant: StatVariant;
}) {
  return (
    <div className={cn('ba-stat-tile', `ba-stat-tile--${variant}`)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-[var(--ba-text-muted)]">{label}</span>
        <div className={cn('ba-stat-icon', `ba-stat-icon--${variant}`)}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-[var(--ba-text-primary)]">
        {value}
      </div>
    </div>
  );
}

export function DashboardScreen({
  onOpenInspection,
}: {
  onOpenInspection: (inspectionId: string) => void;
}) {
  const now = useNow();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  useEffect(() => {
    void window.blazeaudit.inspections
      .getDashboard()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void Promise.all([
      window.blazeaudit.profile.getBusiness(),
      window.blazeaudit.profile.getLogo(),
    ]).then(([profile, logo]) => {
      setBusiness(profile);
      setLogoDataUrl(logo);
    });
  }, []);

  const businessName = business?.businessName.trim() ?? '';
  const streetLine = [business?.street?.trim(), business?.unit?.trim()].filter(Boolean).join(', ');
  const province = business?.province.trim() ?? '';
  const locationLine = [streetLine, province].filter(Boolean).join(' · ');

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-4">
      <section className="ba-panel-hero flex items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <div className="text-2xl font-semibold tabular-nums tracking-tight text-[var(--ba-text-primary)]">
            {time}
          </div>
          <div className="text-xs text-[var(--ba-text-muted)]">{date}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 text-right">
          <div className="min-w-0 max-w-[14rem] sm:max-w-xs">
            <div className="truncate text-base font-semibold text-[var(--ba-text-primary)]">
              {businessName || 'Business name not set'}
            </div>
            {locationLine ? (
              <div className="truncate text-xs text-[var(--ba-text-muted)]">{locationLine}</div>
            ) : (
              <div className="text-xs text-[var(--ba-text-faint)]">No address on file</div>
            )}
          </div>
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-[var(--ba-chrome-border)] bg-white p-1.5">
            {logoDataUrl ? (
              <img
                src={logoDataUrl}
                alt=""
                className="size-full scale-[1.35] object-contain"
              />
            ) : (
              <ImagePlus className="size-5 text-[var(--ba-text-faint)]" aria-hidden />
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Clients"
          value={loading ? '—' : String(stats?.clientCount ?? 0)}
          icon={Users}
          variant="flame"
        />
        <StatTile
          label="Done this year"
          value={loading ? '—' : String(stats?.completedThisYear ?? 0)}
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatTile
          label="Due this week"
          value={loading ? '—' : String(stats?.dueThisWeek ?? 0)}
          icon={CalendarClock}
          variant="sky"
        />
        <StatTile
          label="Due this month"
          value={loading ? '—' : String(stats?.dueThisMonth ?? 0)}
          icon={CalendarDays}
          variant="violet"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="ba-panel p-4 lg:col-span-2">
          <h3 className="ba-section-title">Recently used</h3>
          {loading ? (
            <p className="mt-3 text-sm text-[var(--ba-text-muted)]">Loading…</p>
          ) : stats?.recentInspections.length ? (
            <ul className="mt-3 space-y-2">
              {stats.recentInspections.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => onOpenInspection(row.id)}
                    className="ba-list-item w-full px-3 py-2 text-left"
                  >
                    <span className="block truncate text-sm font-medium text-[var(--ba-text-primary)]">
                      {row.title}
                    </span>
                    <span className="block truncate text-xs text-[var(--ba-text-muted)]">
                      {row.clientName} · {row.status}
                      {row.inspectedAt ? ` · ${row.inspectedAt}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[var(--ba-text-muted)]">No inspections yet.</p>
          )}
        </div>
        <div className="ba-panel p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="ba-section-title">Due reminders</h3>
            {!loading && stats && stats.overdueCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400">
                <AlertTriangle className="size-3" />
                {stats.overdueCount} overdue
              </span>
            )}
          </div>
          {loading ? (
            <p className="mt-3 text-sm text-[var(--ba-text-muted)]">Loading…</p>
          ) : stats?.dueReminders.length ? (
            <ul className="mt-3 space-y-2">
              {stats.dueReminders.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => onOpenInspection(row.id)}
                    className="ba-list-item w-full px-3 py-2 text-left"
                  >
                    <span className="block truncate text-sm font-medium text-[var(--ba-text-primary)]">
                      {row.clientName}
                    </span>
                    <span
                      className={`block truncate text-xs ${row.overdue ? 'text-red-400' : 'text-[var(--ba-text-muted)]'}`}
                    >
                      {row.title} · due {row.nextDueAt}
                      {row.overdue ? ' · overdue' : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[var(--ba-text-muted)]">No due or overdue inspections.</p>
          )}
        </div>
      </section>
    </div>
  );
}
