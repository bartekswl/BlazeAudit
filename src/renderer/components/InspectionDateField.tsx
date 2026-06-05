import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  formatInspectionDateLabel,
  formatIsoDateLocal,
  inspectionDateBounds,
  isoDateInRange,
  parseIsoDateLocal,
  todayLocalIsoDate,
  validateInspectionDate,
} from '../../shared/dates';
import { cn } from '../lib/cn';
import { inputCls } from '../features/templates/BlockList';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function monthStart(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function monthMatrix(viewMonth: Date): { iso: string; inMonth: boolean }[] {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const first = monthStart(year, month);
  const startOffset = (first.getDay() + 6) % 7;
  const cells: { iso: string; inMonth: boolean }[] = [];

  for (let i = 0; i < 42; i++) {
    const day = new Date(year, month, 1 - startOffset + i);
    cells.push({
      iso: formatIsoDateLocal(day),
      inMonth: day.getMonth() === month,
    });
  }
  return cells;
}

export function InspectionDateField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
}) {
  const { min, max } = inspectionDateBounds();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = parseIsoDateLocal(value) ?? parseIsoDateLocal(todayLocalIsoDate())!;
  const [viewMonth, setViewMonth] = useState(() => monthStart(selected.getFullYear(), selected.getMonth()));

  useEffect(() => {
    const parsed = parseIsoDateLocal(value);
    if (parsed) setViewMonth(monthStart(parsed.getFullYear(), parsed.getMonth()));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const cells = useMemo(() => monthMatrix(viewMonth), [viewMonth]);
  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const viewMinMonth = monthStart(
    parseIsoDateLocal(min)!.getFullYear(),
    parseIsoDateLocal(min)!.getMonth(),
  );
  const viewMaxMonth = monthStart(
    parseIsoDateLocal(max)!.getFullYear(),
    parseIsoDateLocal(max)!.getMonth(),
  );
  const canPrev = viewMonth.getTime() > viewMinMonth.getTime();
  const canNext = viewMonth.getTime() < viewMaxMonth.getTime();

  const pick = (iso: string) => {
    const validation = validateInspectionDate(iso);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    onChange(iso);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          inputCls,
          'flex w-full items-center justify-between gap-2 text-left',
          disabled && 'opacity-50',
        )}
      >
        <span>{formatInspectionDateLabel(value || todayLocalIsoDate())}</span>
        <Calendar className="size-4 shrink-0 text-neutral-500" />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-2 w-72 rounded-xl border border-white/10 bg-neutral-950 p-3 shadow-2xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => setViewMonth((prev) => addMonths(prev, -1))}
              className="rounded-md p-1 text-neutral-400 hover:bg-white/5 hover:text-neutral-100 disabled:opacity-30"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-sm font-medium text-neutral-100">{monthLabel}</p>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setViewMonth((prev) => addMonths(prev, 1))}
              className="rounded-md p-1 text-neutral-400 hover:bg-white/5 hover:text-neutral-100 disabled:opacity-30"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1 text-center text-[10px] font-medium text-neutral-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const enabled = cell.inMonth && isoDateInRange(cell.iso, min, max);
              const isSelected = cell.iso === value;
              const isToday = cell.iso === todayLocalIsoDate();
              return (
                <button
                  key={`${cell.iso}-${cell.inMonth ? 'in' : 'out'}`}
                  type="button"
                  disabled={!enabled}
                  onClick={() => pick(cell.iso)}
                  className={cn(
                    'rounded-md py-1.5 text-xs transition-colors',
                    !cell.inMonth && 'text-neutral-700',
                    cell.inMonth && !enabled && 'text-neutral-700',
                    enabled && !isSelected && 'text-neutral-200 hover:bg-white/10',
                    isSelected && 'bg-flame-500 font-semibold text-white',
                    isToday && !isSelected && enabled && 'ring-1 ring-flame-500/40',
                    !enabled && 'cursor-not-allowed',
                  )}
                >
                  {parseIsoDateLocal(cell.iso)?.getDate()}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => pick(todayLocalIsoDate())}
            className="mt-3 w-full rounded-lg border border-white/10 py-1.5 text-xs text-neutral-300 hover:bg-white/5"
          >
            Today
          </button>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
