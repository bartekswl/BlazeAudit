/** Shared fixed-row working-table helpers for portable extinguisher / emergency lighting forms. */

export type ReportGridChoice = 'yes' | 'no' | null;

export type ReportGridColumnKind = 'text' | 'choice';

export type ReportGridColumnDef = {
  key: string;
  title: string;
  widthPercent: number;
  orientation: 'horizontal' | 'vertical';
  kind: ReportGridColumnKind;
};

export type ReportGridRow = Record<string, string | ReportGridChoice>;

export type ReportGridValue = {
  rows: ReportGridRow[];
};

export function emptyReportGridRow(columns: readonly ReportGridColumnDef[]): ReportGridRow {
  const row: ReportGridRow = {};
  for (const col of columns) {
    row[col.key] = col.kind === 'choice' ? null : '';
  }
  return row;
}

export function emptyReportGridValue(
  columns: readonly ReportGridColumnDef[],
  rowCount: number,
): ReportGridValue {
  return {
    rows: Array.from({ length: rowCount }, () => emptyReportGridRow(columns)),
  };
}

export function normalizeReportGridValue(
  raw: unknown,
  columns: readonly ReportGridColumnDef[],
  rowCount: number,
): ReportGridValue {
  const base = emptyReportGridValue(columns, rowCount);
  if (!raw || typeof raw !== 'object') return base;
  const record = raw as { rows?: unknown };
  if (!Array.isArray(record.rows)) return base;

  const rawRows = record.rows as unknown[];

  return {
    rows: base.rows.map((emptyRow, index) => {
      const row = rawRows[index];
      if (!row || typeof row !== 'object') return emptyRow;
      const cells = row as Record<string, unknown>;
      const next = { ...emptyRow };
      for (const col of columns) {
        const cell = cells[col.key];
        if (col.kind === 'choice') {
          if (cell === 'yes' || cell === 'no' || cell === null) next[col.key] = cell;
          else if (cell === 'y' || cell === 'Y' || cell === true) next[col.key] = 'yes';
          else if (cell === 'n' || cell === 'N' || cell === false) next[col.key] = 'no';
        } else if (typeof cell === 'string') {
          next[col.key] = cell;
        }
      }
      return next;
    }),
  };
}

export function setReportGridTextCell(
  value: ReportGridValue,
  rowIndex: number,
  columnKey: string,
  next: string,
): ReportGridValue {
  return {
    rows: value.rows.map((row, index) =>
      index === rowIndex ? { ...row, [columnKey]: next } : row,
    ),
  };
}

export function cycleReportGridChoice(current: ReportGridChoice): ReportGridChoice {
  if (current === null) return 'yes';
  if (current === 'yes') return 'no';
  return null;
}

export function setReportGridChoiceCell(
  value: ReportGridValue,
  rowIndex: number,
  columnKey: string,
  next: ReportGridChoice,
): ReportGridValue {
  return {
    rows: value.rows.map((row, index) =>
      index === rowIndex ? { ...row, [columnKey]: next } : row,
    ),
  };
}
