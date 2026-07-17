import { randomUUID } from 'node:crypto';
import {
  compareCalendarTasks,
  normalizeTaskTime,
  type CalendarTask,
  type CalendarTaskInput,
} from '../../shared/calendarTasks';
import { parseIsoDateLocal } from '../../shared/dates';
import { getDatabase } from './connection';

interface CalendarTaskRow {
  id: string;
  title: string;
  notes: string;
  task_date: string;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function toTask(row: CalendarTaskRow): CalendarTask {
  return {
    id: row.id,
    title: row.title ?? '',
    notes: row.notes ?? '',
    taskDate: row.task_date,
    startTime: row.start_time?.trim() || null,
    endTime: row.end_time?.trim() || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getRow(id: string): CalendarTaskRow {
  const row = getDatabase()
    .prepare(`SELECT * FROM calendar_tasks WHERE id = ?`)
    .get(id) as CalendarTaskRow | undefined;
  if (!row) throw new Error('Task not found.');
  return row;
}

function normalizeInput(input: CalendarTaskInput): {
  title: string;
  notes: string;
  taskDate: string;
  startTime: string | null;
  endTime: string | null;
} {
  const title = input.title.trim();
  if (!title) throw new Error('Task title is required.');
  if (title.length > 200) throw new Error('Task title is too long.');

  const taskDate = input.taskDate.trim();
  if (!parseIsoDateLocal(taskDate)) throw new Error('Enter a valid task date.');

  const startTime = normalizeTaskTime(input.startTime);
  const endTime = normalizeTaskTime(input.endTime);
  if (endTime && !startTime) {
    throw new Error('Set a start time before an end time.');
  }
  if (startTime && endTime && endTime < startTime) {
    throw new Error('End time must be after start time.');
  }

  const notes = (input.notes ?? '').trim();
  if (notes.length > 2000) throw new Error('Notes are too long.');

  return { title, notes, taskDate, startTime, endTime };
}

export function listCalendarTasksForDate(taskDate: string): CalendarTask[] {
  if (!parseIsoDateLocal(taskDate)) throw new Error('Enter a valid task date.');
  const rows = getDatabase()
    .prepare(
      `SELECT * FROM calendar_tasks
       WHERE task_date = ?
       ORDER BY
         CASE WHEN start_time IS NULL OR start_time = '' THEN 0 ELSE 1 END,
         start_time ASC,
         title ASC`,
    )
    .all(taskDate) as CalendarTaskRow[];
  return rows.map(toTask).sort(compareCalendarTasks);
}

/** Inclusive YYYY-MM-DD range — used for month markers. */
export function listCalendarTasksInRange(fromDate: string, toDate: string): CalendarTask[] {
  if (!parseIsoDateLocal(fromDate) || !parseIsoDateLocal(toDate)) {
    throw new Error('Enter a valid date range.');
  }
  const rows = getDatabase()
    .prepare(
      `SELECT * FROM calendar_tasks
       WHERE task_date >= ? AND task_date <= ?
       ORDER BY task_date ASC, start_time ASC, title ASC`,
    )
    .all(fromDate, toDate) as CalendarTaskRow[];
  return rows.map(toTask);
}

export function createCalendarTask(input: CalendarTaskInput): CalendarTask {
  const normalized = normalizeInput(input);
  const id = randomUUID();
  const createdAt = nowIso();

  getDatabase()
    .prepare(
      `INSERT INTO calendar_tasks
         (id, title, notes, task_date, start_time, end_time, created_at, updated_at)
       VALUES
         (@id, @title, @notes, @taskDate, @startTime, @endTime, @createdAt, @updatedAt)`,
    )
    .run({
      id,
      title: normalized.title,
      notes: normalized.notes,
      taskDate: normalized.taskDate,
      startTime: normalized.startTime,
      endTime: normalized.endTime,
      createdAt,
      updatedAt: createdAt,
    });

  return toTask(getRow(id));
}

export function updateCalendarTask(id: string, input: CalendarTaskInput): CalendarTask {
  const existing = getDatabase().prepare(`SELECT id FROM calendar_tasks WHERE id = ?`).get(id);
  if (!existing) throw new Error('Task not found.');

  const normalized = normalizeInput(input);
  const updatedAt = nowIso();

  getDatabase()
    .prepare(
      `UPDATE calendar_tasks
       SET title = @title,
           notes = @notes,
           task_date = @taskDate,
           start_time = @startTime,
           end_time = @endTime,
           updated_at = @updatedAt
       WHERE id = @id`,
    )
    .run({
      id,
      title: normalized.title,
      notes: normalized.notes,
      taskDate: normalized.taskDate,
      startTime: normalized.startTime,
      endTime: normalized.endTime,
      updatedAt,
    });

  return toTask(getRow(id));
}

export function deleteCalendarTask(id: string): void {
  const result = getDatabase().prepare(`DELETE FROM calendar_tasks WHERE id = ?`).run(id);
  if (result.changes === 0) throw new Error('Task not found.');
}
