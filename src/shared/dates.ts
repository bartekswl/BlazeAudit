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
