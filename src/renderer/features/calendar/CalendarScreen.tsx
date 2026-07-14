import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildMonthGrid(viewYear: number, viewMonth: number): Date[] {
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(viewYear, viewMonth, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

export function CalendarScreen() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date(today));

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const days = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const selectedLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const goToMonth = (offset: number) => {
    setViewDate(new Date(viewYear, viewMonth + offset, 1));
  };

  const goToToday = () => {
    const now = startOfDay(new Date());
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <section className="ba-panel-hero flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ba-text-faint)]">
            Calendar
          </p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--ba-text-primary)]">
            {monthLabel}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            className="ba-btn ba-btn--secondary inline-flex size-10 items-center justify-center p-0"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" onClick={goToToday} className="ba-btn ba-btn--secondary px-4">
            Today
          </button>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            className="ba-btn ba-btn--secondary inline-flex size-10 items-center justify-center p-0"
            aria-label="Next month"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </section>

      <section className="ba-panel overflow-hidden p-4 sm:p-5">
        <div className="mb-4 grid grid-cols-7 gap-2">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ba-text-faint)]"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const inCurrentMonth = day.getMonth() === viewMonth;
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDate(startOfDay(day))}
                className={cn(
                  'group relative flex aspect-square min-h-[4.5rem] flex-col items-center justify-center rounded-xl border text-lg font-semibold tabular-nums transition-colors sm:min-h-[5.5rem] sm:text-xl',
                  inCurrentMonth
                    ? 'border-[var(--ba-panel-border)] bg-[var(--ba-surface-elevated)] text-[var(--ba-text-primary)] hover:border-flame-500/35 hover:bg-flame-500/8'
                    : 'border-transparent bg-transparent text-[var(--ba-text-faint)] opacity-55 hover:opacity-80',
                  isSelected &&
                    'border-flame-500/50 bg-flame-500/14 shadow-[inset_0_0_0_1px_rgb(249_115_22_/_0.25)]',
                  isToday && !isSelected && 'border-flame-500/35 ring-1 ring-flame-500/25',
                )}
              >
                <span>{day.getDate()}</span>
                {isToday ? (
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-flame-400">
                    Today
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="ba-panel px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ba-text-faint)]">
          Selected date
        </p>
        <p className="mt-1 text-xl font-semibold text-[var(--ba-text-primary)]">{selectedLabel}</p>
      </section>
    </div>
  );
}
