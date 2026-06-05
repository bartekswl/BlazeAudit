import type { TableValue } from './types';

export const DEFAULT_TABLE_COL_WIDTH = 140;
export const DEFAULT_TABLE_ROW_HEIGHT = 36;
export const MIN_TABLE_COL_WIDTH = 72;
export const MAX_TABLE_COL_WIDTH = 480;
export const MIN_TABLE_ROW_HEIGHT = 28;
export const MAX_TABLE_ROW_HEIGHT = 240;

export function clampTableColWidth(width: number): number {
  return Math.max(MIN_TABLE_COL_WIDTH, Math.min(MAX_TABLE_COL_WIDTH, Math.round(width)));
}

export function clampTableRowHeight(height: number): number {
  return Math.max(MIN_TABLE_ROW_HEIGHT, Math.min(MAX_TABLE_ROW_HEIGHT, Math.round(height)));
}

export function readTableValue(value: unknown): TableValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { rows: [] };
  }
  const record = value as Record<string, unknown>;
  const rows = Array.isArray(record.rows)
    ? (record.rows as Record<string, string>[])
    : [];
  const rowHeights = Array.isArray(record.rowHeights)
    ? record.rowHeights.filter((h): h is number => typeof h === 'number')
    : undefined;
  return { rows, rowHeights };
}

export function rowHeightAt(
  rowHeights: number[] | undefined,
  rowIndex: number,
  fallback = DEFAULT_TABLE_ROW_HEIGHT,
): number {
  const height = rowHeights?.[rowIndex];
  return typeof height === 'number' ? height : fallback;
}

export function tableTotalWidth(
  columns: { width?: number }[],
  fallback = DEFAULT_TABLE_COL_WIDTH,
): number {
  return columns.reduce((sum, col) => sum + (col.width ?? fallback), 0);
}
