import {
  ATTENDANCE_LOG_COLUMNS,
  ATTENDANCE_LOG_ROW_COUNT,
  normalizeAttendanceLogValue,
} from './attendanceLog';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cellValue(value: string): string {
  const trimmed = value.trim();
  return trimmed ? escapeHtml(trimmed) : '&nbsp;';
}

export function renderAttendanceLogHtml(value: unknown): string {
  const data = normalizeAttendanceLogValue(value);
  const header = ATTENDANCE_LOG_COLUMNS.map(
    (col) =>
      `<th class="att-th${col.align === 'center' ? ' att-th--center' : ''}" style="width:${col.widthPercent}%">${escapeHtml(col.title)}</th>`,
  ).join('');
  const body = data.rows
    .map(
      (row) =>
        `<tr class="att-row">${ATTENDANCE_LOG_COLUMNS.map(
          (col) =>
            `<td class="att-td${col.align === 'center' ? ' att-td--center' : ''}"><span class="att-cell-value">${cellValue(row[col.key])}</span></td>`,
        ).join('')}</tr>`,
    )
    .join('');

  return `<div class="att-table-wrap" style="--att-row-count:${ATTENDANCE_LOG_ROW_COUNT}">
    <div class="att-accent-bar" aria-hidden="true"></div>
    <table class="att-table" data-row-count="${ATTENDANCE_LOG_ROW_COUNT}">
      <thead><tr>${header}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  </div>`;
}
