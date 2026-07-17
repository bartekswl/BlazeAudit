/** Calendar day tasks (local account DB). */

export interface CalendarTask {
  id: string;
  title: string;
  notes: string;
  /** YYYY-MM-DD (local calendar date). */
  taskDate: string;
  /** HH:mm 24h, or null for untimed / all-day. */
  startTime: string | null;
  /** HH:mm 24h, or null. */
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarTaskInput {
  title: string;
  notes?: string;
  taskDate: string;
  startTime?: string | null;
  endTime?: string | null;
}

/** Normalize "9:5" / "09:05" → "HH:mm", or null if empty/invalid. */
export function normalizeTaskTime(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTaskTimeLabel(time: string | null): string {
  if (!time) return 'All day';
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function compareCalendarTasks(a: CalendarTask, b: CalendarTask): number {
  if (!a.startTime && !b.startTime) return a.title.localeCompare(b.title);
  if (!a.startTime) return -1;
  if (!b.startTime) return 1;
  const byTime = a.startTime.localeCompare(b.startTime);
  if (byTime !== 0) return byTime;
  return a.title.localeCompare(b.title);
}
