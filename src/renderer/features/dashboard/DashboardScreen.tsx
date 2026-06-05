import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarClock, CalendarDays, CheckCircle2, Plus, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DashboardStats } from '../../../shared/inspection';

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function StatTile({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-400">{label}</span>
        <Icon className="size-4 text-neutral-600" />
      </div>
      <div className="mt-2 text-2xl font-semibold text-neutral-100">{value}</div>
    </div>
  );
}

export function DashboardScreen({
  onNewInspection,
  onOpenInspection,
}: {
  onNewInspection: () => void;
  onOpenInspection: (inspectionId: string) => void;
}) {
  const now = useNow();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void window.blazeaudit.inspections
      .getDashboard()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/5 bg-gradient-to-br from-flame-500/10 to-transparent p-6">
        <div className="text-4xl font-semibold tabular-nums text-neutral-100">{time}</div>
        <div className="mt-1 text-sm text-neutral-400">{date}</div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Clients"
          value={loading ? '—' : String(stats?.clientCount ?? 0)}
          icon={Users}
        />
        <StatTile
          label="Done this year"
          value={loading ? '—' : String(stats?.completedThisYear ?? 0)}
          icon={CheckCircle2}
        />
        <StatTile
          label="Due this week"
          value={loading ? '—' : String(stats?.dueThisWeek ?? 0)}
          icon={CalendarClock}
        />
        <StatTile
          label="Due this month"
          value={loading ? '—' : String(stats?.dueThisMonth ?? 0)}
          icon={CalendarDays}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 lg:col-span-2">
          <h3 className="text-sm font-medium text-neutral-300">Recently used</h3>
          {loading ? (
            <p className="mt-2 text-sm text-neutral-500">Loading…</p>
          ) : stats?.recentInspections.length ? (
            <ul className="mt-3 space-y-2">
              {stats.recentInspections.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => onOpenInspection(row.id)}
                    className="w-full rounded-lg border border-white/5 px-3 py-2 text-left transition-colors hover:border-white/10 hover:bg-white/[0.03]"
                  >
                    <span className="block truncate text-sm font-medium text-neutral-100">
                      {row.title}
                    </span>
                    <span className="block truncate text-xs text-neutral-500">
                      {row.clientName} · {row.status}
                      {row.inspectedAt ? ` · ${row.inspectedAt}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-neutral-500">No inspections yet.</p>
          )}
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-neutral-300">Due reminders</h3>
            {!loading && stats && stats.overdueCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300">
                <AlertTriangle className="size-3" />
                {stats.overdueCount} overdue
              </span>
            )}
          </div>
          {loading ? (
            <p className="mt-2 text-sm text-neutral-500">Loading…</p>
          ) : stats?.dueReminders.length ? (
            <ul className="mt-3 space-y-2">
              {stats.dueReminders.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => onOpenInspection(row.id)}
                    className="w-full rounded-lg border border-white/5 px-3 py-2 text-left transition-colors hover:border-white/10 hover:bg-white/[0.03]"
                  >
                    <span className="block truncate text-sm font-medium text-neutral-100">
                      {row.clientName}
                    </span>
                    <span
                      className={`block truncate text-xs ${row.overdue ? 'text-red-300' : 'text-neutral-500'}`}
                    >
                      {row.title} · due {row.nextDueAt}
                      {row.overdue ? ' · overdue' : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-neutral-500">No due or overdue inspections.</p>
          )}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNewInspection}
          className="inline-flex items-center gap-2 rounded-xl bg-flame-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-flame-500/20 transition-colors hover:bg-flame-600"
        >
          <Plus className="size-4" />
          New Inspection
        </button>
      </div>
    </div>
  );
}
