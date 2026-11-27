import type { OcrLine, OcrWord } from './ocrTypes';
import {
  assignLinesToRows,
  choiceOnLine,
  clusterOcrLines,
  normalizeOcr,
  parseChoiceCell,
  parseMark,
  textAfterLabel,
  readFieldBlank,
  type ReadChoice,
} from './text';

type ChecklistRow = { id: string; text?: string };

type GridColumn = {
  key: string;
  title: string;
  widthPercent: number;
  kind: 'text' | 'choice';
};

const CHOICES: ReadChoice[] = ['yes', 'no', 'na'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function fillLabeledStrings(
  value: unknown,
  lines: OcrLine[],
  fields: readonly { key: string; label: string }[],
): { value: unknown; filled: number } {
  if (!isRecord(value)) return { value, filled: 0 };
  let filled = 0;
  const next = { ...value };
  for (const field of fields) {
    const current = next[field.key];
    if (typeof current !== 'string' || current.trim()) continue;
    const read = textAfterLabel(lines, field.label);
    if (!read) continue;
    next[field.key] = read;
    filled += 1;
  }
  return { value: next, filled };
}

export function fillChecklistChoices(
  value: unknown,
  rows: readonly ChecklistRow[],
  lines: OcrLine[],
  allowed: readonly ReadChoice[] = CHOICES,
): { value: unknown; filled: number } {
  if (!isRecord(value) || !isRecord(value.checklist)) return { value, filled: 0 };
  const assigned = assignLinesToRows(rows, lines);
  const checklist = { ...value.checklist };
  let filled = 0;
  for (const [rowId, line] of assigned) {
    const current = checklist[rowId];
    if (!isRecord(current) || current.choice != null) continue;
    const choice = choiceOnLine(line, allowed);
    if (!choice) continue;
    checklist[rowId] = { ...current, choice };
    filled += 1;
  }
  return { value: { ...value, checklist }, filled };
}

function allWords(lines: OcrLine[]): OcrLine['words'] {
  return lines.flatMap((line) => (line.words.length > 0 ? line.words : []));
}

/** Printed Yes / No column headers on the left of the summary table. */
function findYesNoHeaders(lines: OcrLine[]): { yesX: number; noX: number; headerY: number } | null {
  const words = allWords(lines);
  const yeses = words.filter((word) => normalizeOcr(word.text) === 'yes' && word.x < 0.22);
  const nos = words.filter((word) => normalizeOcr(word.text) === 'no' && word.x < 0.28);
  let best: { yesX: number; noX: number; headerY: number; gap: number } | null = null;
  for (const yes of yeses) {
    for (const no of nos) {
      const gap = no.x - yes.x;
      if (gap < 0.02 || gap > 0.14) continue;
      if (Math.abs(yes.y - no.y) > 0.02) continue;
      if (!best || yes.x < best.yesX) {
        best = { yesX: yes.x + yes.w / 2, noX: no.x + no.w / 2, headerY: Math.min(yes.y, no.y), gap };
      }
    }
  }
  return best ? { yesX: best.yesX, noX: best.noX, headerY: best.headerY } : null;
}

/** One band per printed summary question, top to bottom, when every question was seen. */
function summaryQuestionBands(
  lines: OcrLine[],
  headerY: number,
  noX: number,
  count: number,
): { top: number; bottom: number }[] | null {
  const tops = lines
    .filter((line) => line.y > headerY + 0.012 && line.x > noX + 0.02 && line.x < 0.4 && line.text !== '✓')
    .map((line) => line.y)
    .sort((a, b) => a - b);
  const bands: { top: number; bottom: number }[] = [];
  for (const y of tops) {
    const last = bands[bands.length - 1];
    if (last && y - last.bottom > 0.06) break;
    if (last && y - last.bottom < 0.028) last.bottom = y;
    else bands.push({ top: y, bottom: y });
  }
  return bands.length === count ? bands : null;
}

function markInYesNoColumns(
  lines: OcrLine[],
  row: OcrLine,
  headers: { yesX: number; noX: number },
): 'yes' | 'no' | null {
  const top = row.y;
  const bottom = row.y + Math.max(row.h, 0.012);
  const reach = Math.abs(headers.noX - headers.yesX) * 0.65;
  let yesHit = false;
  let noHit = false;
  for (const word of allWords(lines)) {
    const centerY = word.y + word.h / 2;
    if (centerY < top || centerY > bottom) continue;
    const centerX = word.x + word.w / 2;
    const normal = normalizeOcr(word.text);
    if (normal === 'yes' || normal === 'no') continue;
    const scribble = word.text === '✓' || parseMark(word.text) != null;
    if (!scribble) continue;
    if (Math.abs(centerX - headers.yesX) <= reach) yesHit = true;
    if (Math.abs(centerX - headers.noX) <= reach) noHit = true;
  }
  if (yesHit && !noHit) return 'yes';
  if (noHit && !yesHit) return 'no';
  return null;
}

function summaryRowBox(lines: OcrLine[], text: string): { top: number; bottom: number } | null {
  const tokens = normalizeOcr(text).split(' ').filter((token) => token.length >= 4);
  if (tokens.length < 3) return null;
  const words = allWords(lines);
  let best: { top: number; bottom: number; hits: number } | null = null;
  for (let start = 0; start < words.length; start += 1) {
    let tokenIndex = 0;
    let top = Infinity;
    let bottom = 0;
    let previousY = words[start].y;
    for (let index = start; index < words.length && tokenIndex < tokens.length; index += 1) {
      const word = words[index];
      if (word.y - previousY > 0.05) break;
      const got = normalizeOcr(word.text);
      if (got !== tokens[tokenIndex]) continue;
      top = Math.min(top, word.y);
      bottom = Math.max(bottom, word.y + word.h);
      previousY = word.y;
      tokenIndex += 1;
    }
    if (tokenIndex >= Math.min(tokens.length, 4) && tokenIndex / tokens.length >= 0.55) {
      if (!best || tokenIndex > best.hits) best = { top, bottom, hits: tokenIndex };
    }
  }
  return best ? { top: best.top, bottom: best.bottom } : null;
}

export function fillYesNoSummary(
  value: unknown,
  items: readonly { id: string; text: string }[],
  lines: OcrLine[],
): { value: unknown; filled: number } {
  if (!isRecord(value)) return { value, filled: 0 };
  const headers = findYesNoHeaders(lines);
  if (!headers) return { value, filled: 0 };
  const bands = summaryQuestionBands(lines, headers.headerY, headers.noX, items.length);
  const rows = (bands
    ? items.map((item, index) => ({ id: item.id, box: bands[index]! }))
    : items
        .map((item) => ({ id: item.id, box: summaryRowBox(lines, item.text) }))
        .filter((row): row is { id: string; box: { top: number; bottom: number } } => row.box != null)
        .sort((a, b) => a.box.top - b.box.top));
  const next = { ...value };
  let filled = 0;
  rows.forEach((row, index) => {
    const current = next[row.id];
    if (!isRecord(current) || current.choice != null) return;
    const following = rows[index + 1];
    const line: OcrLine = {
      text: '',
      x: 0,
      y: row.box.top,
      w: 0,
      h: Math.max(0.012, (following ? following.box.top : row.box.bottom + 0.02) - row.box.top),
      words: [],
    };
    const choice = markInYesNoColumns(lines, line, headers);
    if (!choice) return;
    next[row.id] = { ...current, choice };
    filled += 1;
  });
  return { value: next, filled };
}

export function fillBlankFields(
  value: unknown,
  lines: OcrLine[],
  fields: readonly { key: string; label: string; placement?: 'under' | 'beside' }[],
  labels: readonly string[],
): { value: unknown; filled: number } {
  if (!isRecord(value)) return { value, filled: 0 };
  let filled = 0;
  const next = { ...value };
  for (const field of fields) {
    const current = next[field.key];
    if (typeof current !== 'string' || current.trim()) continue;
    const read = readFieldBlank(lines, field.label, labels, field.placement ?? 'under');
    if (!read || read.length > 48) continue;
    const normal = normalizeOcr(read);
    if (labels.some((label) => normalizeOcr(label) === normal)) continue;
    next[field.key] = read;
    filled += 1;
  }
  return { value: next, filled };
}

/** Yes/No fields stored as `'yes' | 'no' | null` (not booleans). */
export function fillChoiceLabels(
  value: unknown,
  lines: OcrLine[],
  fields: readonly { key: string; label: string }[],
): { value: unknown; filled: number } {
  if (!isRecord(value)) return { value, filled: 0 };
  const next = { ...value };
  let filled = 0;
  for (const field of fields) {
    if (next[field.key] != null) continue;
    const wanted = normalizeOcr(field.label);
    const line = lines.find((entry) => normalizeOcr(entry.text).includes(wanted));
    if (!line) continue;
    const mark = choiceOnLine(line, ['yes', 'no']);
    if (!mark) continue;
    next[field.key] = mark;
    filled += 1;
  }
  return { value: next, filled };
}

export function fillBooleanLabels(
  value: unknown,
  lines: OcrLine[],
  fields: readonly { key: string; label: string }[],
): { value: unknown; filled: number } {
  if (!isRecord(value)) return { value, filled: 0 };
  const next = { ...value };
  let filled = 0;
  for (const field of fields) {
    if (next[field.key] === true) continue;
    const wanted = normalizeOcr(field.label);
    const line = lines.find((entry) => normalizeOcr(entry.text).includes(wanted));
    if (!line) continue;
    const mark = choiceOnLine(line, ['yes', 'no']);
    if (mark !== 'yes') continue;
    next[field.key] = true;
    filled += 1;
  }
  return { value: next, filled };
}

function titleScore(line: OcrLine, columns: readonly GridColumn[]): number {
  const text = normalizeOcr(line.text);
  if (!text) return 0;
  let hits = 0;
  for (const column of columns) {
    const tokens = normalizeOcr(column.title).split(' ').filter((token) => token.length >= 4);
    if (tokens.length === 0) continue;
    const found = tokens.filter((token) => text.includes(token)).length;
    if (found >= Math.min(2, tokens.length) || (tokens.length === 1 && found === 1)) hits += 1;
  }
  return hits;
}

function bandsFor(
  columns: readonly GridColumn[],
  start: number,
  end: number,
): { key: string; x: number; w: number; kind: 'text' | 'choice' }[] {
  const total = columns.reduce((sum, column) => sum + column.widthPercent, 0) || 1;
  const span = Math.max(0.2, end - start);
  let x = start;
  return columns.map((column) => {
    const w = (column.widthPercent / total) * span;
    const band = { key: column.key, x, w, kind: column.kind };
    x += w;
    return band;
  });
}

function wordsOf(line: OcrLine): OcrWord[] {
  if (line.words.length > 0) return line.words;
  return [{ text: line.text, x: line.x, y: line.y, w: line.w, h: line.h }];
}

export type ExtractedCells = Record<string, string>;

export function extractGridRows(lines: OcrLine[], columns: readonly GridColumn[]): ExtractedCells[] {
  const clustered = clusterOcrLines(lines);
  let headerIndex = -1;
  let headerScore = 0;
  const scan = Math.min(clustered.length, 8);
  for (let index = 0; index < scan; index += 1) {
    const score = titleScore(clustered[index], columns);
    if (score > headerScore) {
      headerScore = score;
      headerIndex = index;
    }
  }
  if (headerScore < 3) headerIndex = -1;

  const spanSource = headerIndex >= 0 ? wordsOf(clustered[headerIndex]) : clustered.flatMap((line) => wordsOf(line));
  let start = 0.02;
  let end = 0.98;
  if (spanSource.length > 0) {
    const minX = Math.min(...spanSource.map((word) => word.x));
    const maxX = Math.max(...spanSource.map((word) => word.x + word.w));
    if (maxX - minX >= 0.35) {
      start = minX;
      end = maxX;
    }
  }
  const bands = bandsFor(columns, start, end);
  const rows: ExtractedCells[] = [];
  clustered.forEach((line, lineIndex) => {
    if (lineIndex === headerIndex) return;
    const cells: ExtractedCells = {};
    for (const word of wordsOf(line)) {
      if (word.text === '✓') {
        const center = word.x + word.w / 2;
        const band = bands.find((item) => center >= item.x && center < item.x + item.w);
        if (!band || band.kind !== 'choice') continue;
      }
      const center = word.x + word.w / 2;
      let index = bands.findIndex((band) => center >= band.x && center < band.x + band.w);
      if (index < 0) index = center < bands[0].x ? 0 : bands.length - 1;
      const band = bands[index];
      cells[band.key] = `${cells[band.key] ?? ''} ${word.text}`.trim();
    }
    const useful = Object.values(cells).some((cell) => cell.trim().length > 0);
    if (useful) rows.push(cells);
  });
  return rows;
}

export function cellText(raw: string, kind: 'text' | 'choice'): string | ReadChoice | null {
  const text = raw.trim();
  if (!text) return kind === 'choice' ? null : '';
  if (kind === 'choice') {
    const mark = parseChoiceCell(text);
    return mark === 'na' ? 'na' : mark;
  }
  return text.replace(/\s*✓\s*/g, ' ').trim();
}

export function emptyGridRow(row: Record<string, unknown>, columns: readonly { key: string }[]): boolean {
  return columns.every((column) => {
    const value = row[column.key];
    return value == null || value === '';
  });
}

export function linedNotesFromLines(lines: OcrLine[], headings: readonly string[]): string {
  const skip = headings.map((heading) => normalizeOcr(heading));
  const kept = lines
    .map((line) => line.text.trim())
    .filter((text) => {
      if (!text || text.length > 180) return false;
      const normal = normalizeOcr(text);
      return !skip.some((heading) => heading && (normal === heading || normal.includes(heading)));
    });
  return kept.join('\n').trim();
}
