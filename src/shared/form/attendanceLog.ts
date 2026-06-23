export const ATTENDANCE_LOG_ROW_COUNT = 28;

export const ATTENDANCE_LOG_COLUMNS = [
  { key: 'date', title: 'Date (MM/DD/YY)', widthPercent: 10.8, align: 'center' as const },
  { key: 'personsAttending', title: 'Person(s) Attending', widthPercent: 20, align: 'left' as const },
  { key: 'timeIn', title: 'Time In', widthPercent: 8, align: 'center' as const },
  { key: 'timeOut', title: 'Time Out', widthPercent: 8, align: 'center' as const },
  { key: 'notes', title: 'Notes (For the Day)', widthPercent: 25.2, align: 'left' as const },
  { key: 'technicianName', title: 'Primary Technician Printed Name', widthPercent: 16, align: 'center' as const },
  { key: 'technicianCert', title: 'Primary Technician Certification No.', widthPercent: 12, align: 'center' as const },
] as const;

export type AttendanceLogColumnKey = (typeof ATTENDANCE_LOG_COLUMNS)[number]['key'];

export type AttendanceLogRow = Record<AttendanceLogColumnKey, string>;

export type AttendanceLogValue = {
  rows: AttendanceLogRow[];
};

export function emptyAttendanceLogRow(): AttendanceLogRow {
  return {
    date: '',
    personsAttending: '',
    timeIn: '',
    timeOut: '',
    notes: '',
    technicianName: '',
    technicianCert: '',
  };
}

export function emptyAttendanceLogValue(): AttendanceLogValue {
  return {
    rows: Array.from({ length: ATTENDANCE_LOG_ROW_COUNT }, () => emptyAttendanceLogRow()),
  };
}

export function normalizeAttendanceLogValue(raw: unknown): AttendanceLogValue {
  const base = emptyAttendanceLogValue();
  if (!raw || typeof raw !== 'object') return base;

  const record = raw as { rows?: unknown };
  if (!Array.isArray(record.rows)) return base;
  const rows = record.rows;

  return {
    rows: base.rows.map((emptyRow, index) => {
      const row = rows[index];
      if (!row || typeof row !== 'object') return emptyRow;
      const cells = row as Record<string, unknown>;
      const next = { ...emptyRow };
      for (const col of ATTENDANCE_LOG_COLUMNS) {
        const cell = cells[col.key];
        if (typeof cell === 'string') next[col.key] = cell;
      }
      return next;
    }),
  };
}

export function setAttendanceLogCell(
  value: AttendanceLogValue,
  rowIndex: number,
  columnKey: AttendanceLogColumnKey,
  next: string,
): AttendanceLogValue {
  return {
    rows: value.rows.map((row, index) =>
      index === rowIndex ? { ...row, [columnKey]: next } : row,
    ),
  };
}
