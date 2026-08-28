import { useEffect, useState } from 'react';
import { CalendarClock, CalendarDays, CheckCircle2, ImagePlus, Trash2, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import {
  compareCalendarTasks,
  formatTaskTimeLabel,
  type CalendarTask,
} from '../../../shared/calendarTasks';
import { formatIsoDateLocal, todayLocalIsoDate } from '../../../shared/dates';
import {
  shortInspectionDisplayName,
  type DashboardStats,
  type InspectionSummary,
} from '../../../shared/inspection';
import type { BusinessProfile } from '../../../shared/profile';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CompanyLogoMark } from '../../components/CompanyLogoMark';
import { DashboardBanner } from './DashboardBanner';

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

function formatUpcomingDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function DashboardScreen({
  onOpenInspection,
  onOpenCalendar,
}: {
  onOpenInspection: (inspectionId: string) => void;
  onOpenCalendar?: () => void;
}) {
  const now = useNow();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<InspectionSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refreshStats = () => {
    setLoading(true);
    void window.blazeaudit.inspections
      .getDashboard()
      .then(setStats)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshStats();
  }, []);

  useEffect(() => {
    const from = todayLocalIsoDate();
    const end = new Date();
    end.setDate(end.getDate() + 90);
    const to = formatIsoDateLocal(end);
    void window.blazeaudit.calendarTasks
      .listInRange(from, to)
      .then((rows) => {
        const sorted = [...rows].sort((a, b) => {
          const byDate = a.taskDate.localeCompare(b.taskDate);
          if (byDate !== 0) return byDate;
          return compareCalendarTasks(a, b);
        });
        setUpcomingTasks(sorted.slice(0, 12));
      })
      .catch(() => setUpcomingTasks([]))
      .finally(() => setTasksLoading(false));
  }, []);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await window.blazeaudit.inspections.remove(pendingDelete.id);
      setPendingDelete(null);
      refreshStats();
    } catch {
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

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
      <DashboardBanner />

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
          <CompanyLogoMark
            src={logoDataUrl}
            size="lg"
            fallback={<ImagePlus className="size-5 text-[var(--ba-text-faint)]" aria-hidden />}
          />
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
                <li
                  key={row.id}
                  className="ba-list-item flex items-center gap-1 px-1 py-1"
                >
                  <button
                    type="button"
                    onClick={() => onOpenInspection(row.id)}
                    className="min-w-0 flex-1 px-2 py-1 text-left"
                  >
                    <span className="block truncate text-sm font-medium text-[var(--ba-text-primary)]">
                      {shortInspectionDisplayName(row.title, row.clientName)}
                    </span>
                    <span className="block truncate text-xs text-[var(--ba-text-muted)]">
                      {row.clientName} · {row.status}
                      {row.inspectedAt ? ` · ${row.inspectedAt}` : ''}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${shortInspectionDisplayName(row.title, row.clientName)}`}
                    title="Delete document"
                    onClick={() => setPendingDelete(row)}
                    className="shrink-0 rounded-md border border-transparent p-1.5 text-[var(--ba-text-muted)] transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[var(--ba-text-muted)]">No inspections yet.</p>
          )}
        </div>
        <div className="ba-panel p-4">
          <h3 className="ba-section-title">Upcoming Tasks</h3>
          {tasksLoading ? (
            <p className="mt-3 text-sm text-[var(--ba-text-muted)]">Loading…</p>
          ) : upcomingTasks.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {upcomingTasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => onOpenCalendar?.()}
                    className="ba-list-item w-full px-3 py-2 text-left"
                  >
                    <span className="block truncate text-sm font-medium text-[var(--ba-text-primary)]">
                      {task.title}
                    </span>
                    <span className="block truncate text-xs text-[var(--ba-text-muted)]">
                      {formatUpcomingDateLabel(task.taskDate)} · {formatTaskTimeLabel(task.startTime)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[var(--ba-text-muted)]">No upcoming tasks.</p>
          )}
        </div>
      </section>

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete document?"
          icon={Trash2}
          confirmLabel={deleting ? 'Deleting…' : 'Delete'}
          onCancel={() => {
            if (!deleting) setPendingDelete(null);
          }}
          onConfirm={() => void confirmDelete()}
        >
          <p>
            <span className="font-medium text-[var(--ba-text-primary)]">
              {shortInspectionDisplayName(pendingDelete.title, pendingDelete.clientName)}
            </span>{' '}
            will be permanently deleted.
          </p>
          <p>This cannot be undone.</p>
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
