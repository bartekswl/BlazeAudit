/** Local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function formatIsoDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayLocalIsoDate(): string {
  return formatIsoDateLocal(new Date());
}

/** Compact local date+time for document meta (e.g. 8/24/26, 2:19 PM). */
export function formatDateTimeCompact(iso: string | null | undefined): string {
  if (!iso?.trim()) return '—';
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleString(undefined, {
    year: '2-digit',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Two-line list cells: date then time (e.g. 8/24/26 · 2:19 PM). */
export function formatDateTimeListParts(iso: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!iso?.trim()) return { date: '—', time: '' };
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return { date: '—', time: '' };
  const d = new Date(ms);
  return {
    date: d.toLocaleDateString(undefined, {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric',
    }),
    time: d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

export function parseIsoDateLocal(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

export function inspectionDateBounds(): { min: string; max: string } {
  const max = todayLocalIsoDate();
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 20);
  return { min: formatIsoDateLocal(minDate), max };
}

export function validateInspectionDate(iso: string): string | null {
  if (!iso.trim()) return 'Inspection date is required.';
  const date = parseIsoDateLocal(iso);
  if (!date) return 'Enter a valid inspection date.';
  const { min, max } = inspectionDateBounds();
  if (iso < min) return 'Inspection date cannot be more than 20 years ago.';
  if (iso > max) return 'Inspection date cannot be in the future.';
  return null;
}

export function formatInspectionDateLabel(iso: string): string {
  const date = parseIsoDateLocal(iso);
  if (!date) return iso;
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function compareIsoDates(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function isoDateInRange(iso: string, min: string, max: string): boolean {
  return compareIsoDates(iso, min) >= 0 && compareIsoDates(iso, max) <= 0;
}

/** Coerce inspection or binding text to YYYY-MM-DD when possible. */
export function normalizeIsoDateInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const head = trimmed.slice(0, 10);
  if (parseIsoDateLocal(head)) return head;
  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) return formatIsoDateLocal(date);
  return trimmed;
}

function twoDigitYearToFull(yy: number): number {
  if (!Number.isFinite(yy)) return NaN;
  return yy >= 70 ? 1900 + yy : 2000 + yy;
}

/** Parse MM/DD/YY or MM/DD/YYYY to ISO, or '' when not parseable. */
export function parseMmDdYyDate(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(trimmed);
  if (slash) {
    const month = Number(slash[1]);
    const day = Number(slash[2]);
    const yearRaw = Number(slash[3]);
    const year = slash[3].length === 4 ? yearRaw : twoDigitYearToFull(yearRaw);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return '';
    }
    return formatIsoDateLocal(date);
  }
  return normalizeIsoDateInput(trimmed);
}

export function formatMmDdYyFromIso(iso: string): string {
  const parsed = parseIsoDateLocal(iso);
  if (!parsed) return '';
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  const yy = String(parsed.getFullYear() % 100).padStart(2, '0');
  return `${mm}/${dd}/${yy}`;
}

/** Best ISO for InspectionDateField from stored form text (ISO, MM/DD/YY, etc.). */
export function datePickerValueFromStored(stored: string): string {
  const trimmed = stored.trim();
  if (!trimmed) return '';
  if (parseIsoDateLocal(trimmed)) return trimmed;
  return parseMmDdYyDate(trimmed) || '';
}

export function complianceDatePartsFromIso(iso: string): {
  mm: string;
  dd: string;
  yy: string;
} {
  const parsed = parseIsoDateLocal(iso);
  if (!parsed) return { mm: '', dd: '', yy: '' };
  return {
    mm: String(parsed.getMonth() + 1).padStart(2, '0'),
    dd: String(parsed.getDate()).padStart(2, '0'),
    yy: String(parsed.getFullYear() % 100).padStart(2, '0'),
  };
}

export function complianceDateIsoFromParts(mm: string, dd: string, yy: string): string {
  const month = Number.parseInt(mm, 10);
  const day = Number.parseInt(dd, 10);
  const year = twoDigitYearToFull(Number.parseInt(yy, 10));
  if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) return '';
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return '';
  }
  return formatIsoDateLocal(date);
}

export function complianceDatePickerValue(mm: string, dd: string, yy: string): string {
  if (!mm.trim() && !dd.trim() && !yy.trim()) return '';
  return complianceDateIsoFromParts(mm, dd, yy);
}

/** True when a grid/checklist column key is a date field (not free text). */
export function isFormDateFieldKey(key: string): boolean {
  return key === 'date';
}
