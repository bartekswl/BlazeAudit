/** Flex grow ratio for recommendations vs testing-notes panels on page 3. */
export const RECOMMENDATIONS_ROW_COUNT = 10;
export const TESTING_NOTES_ROW_COUNT = 18;

export const LINED_NOTES_LINE_HEIGHT_REM = 1.375;

export type LinedNotesValue = string;

export function emptyLinedNotesValue(): LinedNotesValue {
  return '';
}

/** Accepts legacy per-row string arrays from earlier snapshots. */
export function normalizeLinedNotesValue(raw: unknown): LinedNotesValue {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    return raw.map((cell) => (typeof cell === 'string' ? cell : '')).join('\n');
  }
  return '';
}

export function linedNotesLineCount(text: string): number {
  return text.split('\n').length;
}

export function clampLinedNotesToMaxLines(text: string, maxLines: number): LinedNotesValue {
  if (maxLines < 1) return '';
  const lines = text.split('\n');
  if (lines.length <= maxLines) return text;
  return lines.slice(0, maxLines).join('\n');
}

export function visibleLineCountFromHeights(stackHeightPx: number, lineHeightPx: number): number {
  if (!Number.isFinite(stackHeightPx) || !Number.isFinite(lineHeightPx) || lineHeightPx <= 0) {
    return 1;
  }
  return Math.max(1, Math.floor(stackHeightPx / lineHeightPx));
}
