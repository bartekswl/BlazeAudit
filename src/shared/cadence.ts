// Inspection cadence presets and next-due date math (offline, see TEMPLATES.md §4).

export type CadencePreset = 'monthly' | 'quarterly' | 'annual' | 'none';

export const CADENCE_PRESETS: { id: CadencePreset; label: string }[] = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'annual', label: 'Annual' },
  { id: 'none', label: 'No repeat' },
];

/** A preset id or ISO-8601 duration (e.g. P6M, P1Y). */
export type Cadence = CadencePreset | string;

export function cadenceLabel(cadence: Cadence): string {
  const preset = CADENCE_PRESETS.find((item) => item.id === cadence);
  if (preset) return preset.label;
  if (/^P\d+[MYD]$/i.test(cadence)) return `Every ${cadence.slice(1)}`;
  return cadence;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function parseIsoDuration(cadence: string): { months: number; days: number; years: number } | null {
  const match = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?$/i.exec(cadence.trim());
  if (!match) return null;
  return {
    years: Number(match[1] ?? 0),
    months: Number(match[2] ?? 0),
    days: Number(match[3] ?? 0),
  };
}

/** Returns ISO date (YYYY-MM-DD) for the next due date, or null when not repeating. */
export function computeNextDueAt(inspectedAt: string | null, cadence: Cadence): string | null {
  if (!inspectedAt || cadence === 'none') return null;

  const base = new Date(`${inspectedAt}T12:00:00`);
  if (Number.isNaN(base.getTime())) return null;

  let next = base;
  switch (cadence) {
    case 'monthly':
      next = addMonths(base, 1);
      break;
    case 'quarterly':
      next = addMonths(base, 3);
      break;
    case 'annual':
      next = addMonths(base, 12);
      break;
    default: {
      const duration = parseIsoDuration(cadence);
      if (!duration) return null;
      next = new Date(base);
      if (duration.years) next.setFullYear(next.getFullYear() + duration.years);
      if (duration.months) next = addMonths(next, duration.months);
      if (duration.days) next.setDate(next.getDate() + duration.days);
      break;
    }
  }

  return next.toISOString().slice(0, 10);
}

export function isOverdue(nextDueAt: string | null, today = new Date()): boolean {
  if (!nextDueAt) return false;
  const due = new Date(`${nextDueAt}T23:59:59`);
  return due.getTime() < today.getTime();
}

export function isDueWithinDays(nextDueAt: string | null, days: number, today = new Date()): boolean {
  if (!nextDueAt) return false;
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  const due = new Date(`${nextDueAt}T12:00:00`);
  return due >= start && due <= end;
}
