function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** Build a UTF-8 CSV string from headers and row objects keyed by column keys. */
export function buildCsv<T extends string>(
  columns: ReadonlyArray<{ key: T; header: string }>,
  rows: ReadonlyArray<Record<T, string>>,
): string {
  const headerLine = columns.map((c) => escapeCsvCell(c.header)).join(',');
  const body = rows.map((row) => columns.map((c) => escapeCsvCell(row[c.key] ?? '')).join(','));
  return [headerLine, ...body].join('\r\n');
}
