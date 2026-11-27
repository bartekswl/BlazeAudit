import type { ReportGridColumnDef, ReportGridValue } from './reportRecordGrid';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cellText(value: string | null | undefined): string {
  if (value == null) return '';
  if (value === 'yes') return 'Y';
  if (value === 'no') return 'N';
  return value;
}

/** Print table for the fixed-row emergency-lighting and extinguisher grids. */
export function renderReportGridHtml(
  columns: readonly ReportGridColumnDef[],
  raw: unknown,
): string {
  const value =
    raw && typeof raw === 'object' && Array.isArray((raw as ReportGridValue).rows)
      ? (raw as ReportGridValue)
      : undefined;
  const rows = value?.rows ?? [];
  const head = columns
    .map(
      (column) =>
        `<th style="width:${column.widthPercent}%">${escapeHtml(column.title).replace(/\n/g, '<br>')}</th>`,
    )
    .join('');
  const body = rows
    .map((row) => {
      const cells = columns
        .map((column) => {
          const text = cellText(typeof row[column.key] === 'string' ? row[column.key] : '');
          return `<td>${text ? escapeHtml(text) : '&nbsp;'}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  return `<table class="form-print-grid"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}
