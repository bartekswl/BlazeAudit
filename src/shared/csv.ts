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

/** Parse one CSV line with RFC-style quotes (`""` escapes). */
export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      cells.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  cells.push(cur);
  return cells;
}

/**
 * Parse a CSV document into header + data rows.
 * Strips a leading UTF-8 BOM. Blank trailing lines are ignored.
 */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').filter((line, index, all) => {
    if (line.trim().length > 0) return true;
    // Keep blank lines only if they're not trailing.
    return index < all.length - 1 && all.slice(index + 1).some((l) => l.trim().length > 0);
  });
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => parseCsvLine(line));
  return { headers, rows };
}
