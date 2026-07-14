import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

type CalendarView = 'month' | 'year';

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

function dayCellCls({
  inCurrentMonth,
  isToday,
  isSelected,
  compact = false,
}: {
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  compact?: boolean;
}) {
  return cn(
    compact
      ? 'min-h-[1.35rem] rounded px-0.5 py-0 text-[10px] font-medium'
      : 'min-h-0 rounded-lg text-sm font-semibold',
    'relative flex items-center justify-center border tabular-nums transition-colors',
    inCurrentMonth
      ? 'border-[var(--ba-panel-border)] bg-[var(--ba-surface-elevated)] text-[var(--ba-text-primary)] hover:border-flame-500/35 hover:bg-flame-500/8'
      : 'border-transparent bg-transparent text-[var(--ba-text-faint)] opacity-45 hover:opacity-70',
    isSelected &&
      'border-flame-500/50 bg-flame-500/14 shadow-[inset_0_0_0_1px_rgb(249_115_22_/_0.25)]',
    isToday && !isSelected && 'border-flame-500/35 ring-1 ring-flame-500/25',
  );
}

function MonthGrid({
  viewYear,
  viewMonth,
  today,
  selectedDate,
  onSelectDate,
  compact = false,
  showWeekdays = true,
}: {
  viewYear: number;
  viewMonth: number;
  today: Date;
  selectedDate: Date;
  onSelectDate: (day: Date) => void;
  compact?: boolean;
  showWeekdays?: boolean;
}) {
  const days = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  return (
    <div className={cn('flex min-h-0 flex-col', compact ? 'gap-1' : 'min-h-0 flex-1 gap-2')}>
      {showWeekdays ? (
        <div className="grid shrink-0 grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className={cn(
                'text-center font-semibold uppercase tracking-[0.1em] text-[var(--ba-text-faint)]',
                compact ? 'text-[8px]' : 'text-[11px]',
              )}
            >
              {compact ? label.charAt(0) : label}
            </div>
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          'grid min-h-0 grid-cols-7 gap-1',
          compact ? 'auto-rows-fr flex-1' : 'min-h-0 flex-1 grid-rows-6',
        )}
      >
        {days.map((day) => {
          const inCurrentMonth = day.getMonth() === viewMonth;
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate(startOfDay(day))}
              className={dayCellCls({ inCurrentMonth, isToday, isSelected, compact })}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarScreen() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewMode, setViewMode] = useState<CalendarView>('month');
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date(today));

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const headerLabel =
    viewMode === 'month'
      ? viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      : String(viewYear);

  const selectedLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const goPrev = () => {
    if (viewMode === 'month') {
      setViewDate(new Date(viewYear, viewMonth - 1, 1));
    } else {
      setViewDate(new Date(viewYear - 1, viewMonth, 1));
    }
  };

  const goNext = () => {
    if (viewMode === 'month') {
      setViewDate(new Date(viewYear, viewMonth + 1, 1));
    } else {
      setViewDate(new Date(viewYear + 1, viewMonth, 1));
    }
  };

  const goToToday = () => {
    const now = startOfDay(new Date());
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  const openMonth = (monthIndex: number) => {
    setViewDate(new Date(viewYear, monthIndex, 1));
    setViewMode('month');
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <section className="ba-panel flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ba-text-faint)]">
            Calendar
          </p>
          <h2 className="mt-0.5 truncate text-xl font-semibold tracking-tight text-[var(--ba-text-primary)]">
            {headerLabel}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-[var(--ba-panel-border)] p-0.5">
            {(['month', 'year'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                  viewMode === mode
                    ? 'bg-flame-500/15 text-flame-300'
                    : 'text-[var(--ba-text-muted)] hover:text-[var(--ba-text-primary)]',
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={goPrev}
            className="ba-btn ba-btn--secondary inline-flex size-9 items-center justify-center p-0"
            aria-label={viewMode === 'month' ? 'Previous month' : 'Previous year'}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" onClick={goToToday} className="ba-btn ba-btn--secondary px-3 py-1.5 text-xs">
            Today
          </button>
          <button
            type="button"
            onClick={goNext}
            className="ba-btn ba-btn--secondary inline-flex size-9 items-center justify-center p-0"
            aria-label={viewMode === 'month' ? 'Next month' : 'Next year'}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </section>

      <section className="ba-panel flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        {viewMode === 'month' ? (
          <MonthGrid
            viewYear={viewYear}
            viewMonth={viewMonth}
            today={today}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {MONTH_NAMES.map((name, monthIndex) => {
              const isCurrentMonth =
                today.getFullYear() === viewYear && today.getMonth() === monthIndex;
              const isSelectedMonth =
                selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === monthIndex;

              return (
                <div
                  key={name}
                  className={cn(
                    'flex min-h-[10rem] flex-col rounded-xl border p-2',
                    'border-[var(--ba-panel-border)] bg-[var(--ba-surface-elevated)]',
                    isSelectedMonth && 'border-flame-500/45 ring-1 ring-flame-500/20',
                    isCurrentMonth && !isSelectedMonth && 'border-flame-500/25',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => openMonth(monthIndex)}
                    className="mb-1 shrink-0 rounded px-1 py-0.5 text-left text-xs font-semibold text-[var(--ba-text-primary)] transition-colors hover:text-flame-300"
                  >
                    {name}
                  </button>
                  <MonthGrid
                    viewYear={viewYear}
                    viewMonth={monthIndex}
                    today={today}
                    selectedDate={selectedDate}
                    onSelectDate={(day) => {
                      setSelectedDate(day);
                      setViewDate(new Date(day.getFullYear(), day.getMonth(), 1));
                      setViewMode('month');
                    }}
                    compact
                    showWeekdays={false}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="ba-panel shrink-0 px-4 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ba-text-faint)]">
          Selected date
        </p>
        <p className="mt-0.5 text-sm font-semibold text-[var(--ba-text-primary)]">{selectedLabel}</p>
      </section>
    </div>
  );
}
