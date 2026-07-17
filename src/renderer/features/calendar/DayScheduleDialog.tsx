import { useEffect, useState, type FormEvent } from 'react';
import { Clock, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  compareCalendarTasks,
  formatTaskTimeLabel,
  type CalendarTask,
  type CalendarTaskInput,
} from '../../../shared/calendarTasks';
import { ConfirmDialog } from '../../components/ConfirmDialog';

type FormMode = { kind: 'idle' } | { kind: 'create' } | { kind: 'edit'; task: CalendarTask };

function emptyForm(): { title: string; notes: string; startTime: string; endTime: string } {
  return { title: '', notes: '', startTime: '', endTime: '' };
}

function formFromTask(task: CalendarTask) {
  return {
    title: task.title,
    notes: task.notes,
    startTime: task.startTime ?? '',
    endTime: task.endTime ?? '',
  };
}

export function DayScheduleDialog({
  taskDate,
  dateLabel,
  onClose,
  onChanged,
}: {
  taskDate: string;
  dateLabel: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<FormMode>({ kind: 'idle' });
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<CalendarTask | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await window.blazeaudit.calendarTasks.listForDate(taskDate);
      setTasks([...rows].sort(compareCalendarTasks));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [taskDate]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (deleteTarget) {
          setDeleteTarget(null);
          return;
        }
        if (mode.kind !== 'idle') {
          setMode({ kind: 'idle' });
          setForm(emptyForm());
          setError(null);
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteTarget, mode.kind, onClose]);

  const startCreate = () => {
    setMode({ kind: 'create' });
    setForm(emptyForm());
    setError(null);
  };

  const startEdit = (task: CalendarTask) => {
    setMode({ kind: 'edit', task });
    setForm(formFromTask(task));
    setError(null);
  };

  const cancelForm = () => {
    setMode({ kind: 'idle' });
    setForm(emptyForm());
    setError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const input: CalendarTaskInput = {
      title: form.title,
      notes: form.notes,
      taskDate,
      startTime: form.startTime,
      endTime: form.endTime,
    };
    setSaving(true);
    setError(null);
    try {
      if (mode.kind === 'edit') {
        await window.blazeaudit.calendarTasks.update(mode.task.id, input);
      } else {
        await window.blazeaudit.calendarTasks.create(input);
      }
      setMode({ kind: 'idle' });
      setForm(emptyForm());
      await reload();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save task.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError(null);
    try {
      await window.blazeaudit.calendarTasks.remove(deleteTarget.id);
      if (mode.kind === 'edit' && mode.task.id === deleteTarget.id) {
        cancelForm();
      }
      setDeleteTarget(null);
      await reload();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete task.');
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="ba-modal-overlay fixed inset-0 z-50 grid place-items-center p-4"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          className="ba-modal flex max-h-[min(36rem,90vh)] w-full max-w-lg flex-col overflow-hidden p-0"
          role="dialog"
          aria-labelledby="day-schedule-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--ba-panel-border)] px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ba-text-faint)]">
                Schedule
              </p>
              <h2
                id="day-schedule-title"
                className="mt-0.5 truncate text-base font-semibold text-[var(--ba-text-primary)]"
              >
                {dateLabel}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-[var(--ba-text-muted)] hover:bg-[var(--ba-surface-elevated)] hover:text-[var(--ba-text-primary)]"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {error && mode.kind === 'idle' ? (
              <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            ) : null}

            {loading ? (
              <p className="py-8 text-center text-sm text-[var(--ba-text-muted)]">Loading…</p>
            ) : tasks.length === 0 && mode.kind === 'idle' ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <div className="ba-empty-icon">
                  <Clock className="size-6" />
                </div>
                <p className="text-sm text-[var(--ba-text-muted)]">No tasks scheduled.</p>
                <p className="text-xs text-[var(--ba-text-faint)]">Add one to plan this day.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {tasks.map((task) => {
                  const active = mode.kind === 'edit' && mode.task.id === task.id;
                  return (
                    <li
                      key={task.id}
                      className={`rounded-lg border px-3 py-2.5 ${
                        active
                          ? 'border-flame-500/45 bg-flame-500/10'
                          : 'border-[var(--ba-panel-border)] bg-[var(--ba-surface-elevated)]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-[4.75rem] shrink-0 pt-0.5">
                          <p className="text-[11px] font-semibold tabular-nums text-flame-300">
                            {formatTaskTimeLabel(task.startTime)}
                          </p>
                          {task.startTime && task.endTime ? (
                            <p className="mt-0.5 text-[10px] tabular-nums text-[var(--ba-text-faint)]">
                              – {formatTaskTimeLabel(task.endTime)}
                            </p>
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[var(--ba-text-primary)]">
                            {task.title}
                          </p>
                          {task.notes ? (
                            <p className="mt-0.5 line-clamp-2 text-xs text-[var(--ba-text-muted)]">
                              {task.notes}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(task)}
                            className="rounded-md p-1.5 text-[var(--ba-text-muted)] hover:bg-[var(--ba-panel-bg)] hover:text-[var(--ba-text-primary)]"
                            aria-label={`Edit ${task.title}`}
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(task)}
                            className="rounded-md p-1.5 text-[var(--ba-text-muted)] hover:bg-red-500/10 hover:text-red-300"
                            aria-label={`Delete ${task.title}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {mode.kind !== 'idle' ? (
              <form
                onSubmit={submit}
                className="mt-4 space-y-3 rounded-xl border border-[var(--ba-panel-border)] bg-[var(--ba-panel-bg)] p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ba-text-faint)]">
                  {mode.kind === 'edit' ? 'Edit task' : 'New task'}
                </p>
                {error ? (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {error}
                  </div>
                ) : null}
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-[var(--ba-text-muted)]">
                    Title
                  </span>
                  <input
                    type="text"
                    className="ba-input"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Task name"
                    autoFocus
                    maxLength={200}
                    required
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block min-w-0">
                    <span className="mb-1 block text-xs font-medium text-[var(--ba-text-muted)]">
                      Start
                    </span>
                    <input
                      type="time"
                      className="ba-input"
                      value={form.startTime}
                      onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                    />
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-1 block text-xs font-medium text-[var(--ba-text-muted)]">
                      End
                    </span>
                    <input
                      type="time"
                      className="ba-input"
                      value={form.endTime}
                      onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                    />
                  </label>
                </div>
                <p className="text-[11px] text-[var(--ba-text-faint)]">
                  Leave times empty for an all-day task.
                </p>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-[var(--ba-text-muted)]">
                    Notes
                  </span>
                  <textarea
                    className="ba-input min-h-[4.5rem] resize-y"
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional details"
                    maxLength={2000}
                  />
                </label>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={cancelForm} className="ba-btn-ghost" disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="ba-btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : mode.kind === 'edit' ? 'Save changes' : 'Add task'}
                  </button>
                </div>
              </form>
            ) : null}
          </div>

          {mode.kind === 'idle' ? (
            <div className="flex shrink-0 justify-end border-t border-[var(--ba-panel-border)] px-4 py-3">
              <button type="button" onClick={startCreate} className="ba-btn-primary inline-flex items-center gap-1.5">
                <Plus className="size-4" />
                Add task
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {deleteTarget ? (
        <ConfirmDialog
          title="Delete task?"
          confirmLabel="Delete"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        >
          <p>
            Remove <span className="font-semibold text-[var(--ba-text-primary)]">{deleteTarget.title}</span>{' '}
            from this day?
          </p>
        </ConfirmDialog>
      ) : null}
    </>
  );
}
