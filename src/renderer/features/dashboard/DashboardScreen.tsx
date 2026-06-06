import { useEffect, useState } from 'react';
import { CalendarClock, CalendarDays, CheckCircle2, Plus, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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

export function DashboardScreen() {
  const now = useNow();
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
        <StatTile label="Clients" value="—" icon={Users} />
        <StatTile label="Done this year" value="—" icon={CheckCircle2} />
        <StatTile label="Due this week" value="—" icon={CalendarClock} />
        <StatTile label="Due this month" value="—" icon={CalendarDays} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 lg:col-span-2">
          <h3 className="text-sm font-medium text-neutral-300">Recently used</h3>
          <p className="mt-2 text-sm text-neutral-500">
            Recent clients and documents will appear here once data lands (Phases 2 & 5).
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h3 className="text-sm font-medium text-neutral-300">Reminders</h3>
          <p className="mt-2 text-sm text-neutral-500">Quick notes you add will pop out here.</p>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-flame-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-flame-500/20 transition-colors hover:bg-flame-600"
        >
          <Plus className="size-4" />
          New Inspection
        </button>
      </div>
    </div>
  );
}
