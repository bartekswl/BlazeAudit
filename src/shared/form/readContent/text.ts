import type { OcrLine } from './ocrTypes';

export type ReadChoice = 'yes' | 'no' | 'na';

export function normalizeOcr(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function phraseHits(ocrText: string, phrase: string): boolean {
  const wanted = normalizeOcr(phrase);
  if (wanted.length < 8) return false;
  const haystack = normalizeOcr(ocrText);
  if (!haystack) return false;
  if (haystack.includes(wanted)) return true;
  if (wanted.length < 24) return false;
  const tokens = wanted.split(' ').filter((token) => token.length >= 4);
  if (tokens.length < 3) return false;
  const haystackHas = (token: string) => haystack.includes(token);
  const longTokens = tokens.filter((token) => token.length >= 10);
  if (longTokens.some((token) => !haystackHas(token))) return false;
  const hits = tokens.filter((token) => haystackHas(token)).length;
  return hits / tokens.length >= 0.72;
}

export function pageText(lines: OcrLine[]): string {
  return lines.map((line) => line.text).join('\n');
}

const MARKS: Record<string, ReadChoice> = {
  y: 'yes',
  yes: 'yes',
  v: 'yes',
  '/': 'yes',
  '\\': 'yes',
  check: 'yes',
  tick: 'yes',
  '✓': 'yes',
  '✔': 'yes',
  '√': 'yes',
  n: 'no',
  no: 'no',
  x: 'no',
  '✗': 'no',
  '✘': 'no',
  na: 'na',
  'n/a': 'na',
  dash: 'na',
  '-': 'na',
  '—': 'na',
};

export function parseMark(raw: string): ReadChoice | null {
  const token = raw.trim().toLowerCase().replace(/[()[\].]/g, '');
  return MARKS[token] ?? null;
}

/** A choice cell: a Y/N/tick, or one scribbled character sitting in that column. */
export function parseChoiceCell(raw: string): ReadChoice | null {
  const text = raw.trim();
  if (!text) return null;
  const direct = parseMark(text);
  if (direct) return direct;
  const tokens = text.split(/\s+/).filter(Boolean);
  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    const mark = parseMark(tokens[index]);
    if (mark) return mark;
  }
  if (tokens.length === 1 && tokens[0].length === 1 && !/\d/.test(tokens[0])) return 'yes';
  return null;
}

/** Mark in the choice area of this line. A tick inside the question text is ignored. */
export function choiceOnLine(line: OcrLine, allowed: readonly ReadChoice[]): ReadChoice | null {
  const words = line.words.length > 0 ? line.words : [{ text: line.text, x: line.x, y: line.y, w: line.w, h: line.h }];
  if (words.length === 0) return null;
  const left = Math.min(...words.map((word) => word.x));
  const right = Math.max(...words.map((word) => word.x + word.w));
  const span = right - left || 1;
  const marks = words.flatMap((word) => {
    const mark = parseMark(word.text);
    if (!mark || !allowed.includes(mark)) return [];
    const onTheRight = word.x >= 0.68 || (word.x - left) / span >= 0.72;
    return onTheRight ? [mark] : [];
  });
  return marks.length > 0 ? marks[marks.length - 1] : null;
}

const CLUSTER_GAP = 0.014;

/** Pull words that sit on the same printed row onto one line, including a check beside the text. */
export function clusterOcrLines(lines: OcrLine[]): OcrLine[] {
  const words: OcrLine['words'] = [];
  for (const line of lines) {
    if (line.words.length > 0) words.push(...line.words);
    else if (line.text.trim()) {
      words.push({ text: line.text, x: line.x, y: line.y, w: line.w, h: line.h });
    }
  }
  if (words.length === 0) return [];
  const sorted = [...words].sort((a, b) => a.y + a.h / 2 - (b.y + b.h / 2) || a.x - b.x);
  const groups: OcrLine['words'][] = [];
  let current: OcrLine['words'] = [];
  let anchorY = 0;
  for (const word of sorted) {
    const y = word.y + word.h / 2;
    if (current.length === 0 || Math.abs(y - anchorY) <= CLUSTER_GAP) {
      if (current.length === 0) anchorY = y;
      current.push(word);
    } else {
      groups.push(current);
      current = [word];
      anchorY = y;
    }
  }
  if (current.length > 0) groups.push(current);
  return groups.map((group) => {
    const ordered = [...group].sort((a, b) => a.x - b.x);
    const minX = Math.min(...ordered.map((word) => word.x));
    const minY = Math.min(...ordered.map((word) => word.y));
    const maxX = Math.max(...ordered.map((word) => word.x + word.w));
    const maxY = Math.max(...ordered.map((word) => word.y + word.h));
    return {
      text: ordered.map((word) => word.text).join(' '),
      x: minX,
      y: minY,
      w: Math.max(0, maxX - minX),
      h: Math.max(0, maxY - minY),
      words: ordered,
    };
  });
}

function tokensOf(value: string): string[] {
  return normalizeOcr(value)
    .split(' ')
    .filter((token) => token.length >= 4);
}

/** How much of `phrase` shows up in `line` (0–1). */
export function lineOverlap(phrase: string, line: string): number {
  const tokens = tokensOf(phrase);
  if (tokens.length === 0) return 0;
  const haystack = normalizeOcr(line);
  const hits = tokens.filter((token) => haystack.includes(token)).length;
  return hits / tokens.length;
}

function lineWords(line: OcrLine): OcrLine['words'] {
  if (line.words.length > 0) return line.words;
  if (!line.text.trim()) return [];
  return [{ text: line.text, x: line.x, y: line.y, w: line.w, h: line.h }];
}

function tokensOfWord(word: string): string[] {
  return normalizeOcr(word).split(' ').filter(Boolean);
}

type LabelHit = { phrase: string; x: number; y: number; r: number; b: number };

function flatWords(lines: OcrLine[]): OcrLine['words'] {
  const words = lines.flatMap((line) => lineWords(line));
  return [...words].sort((a, b) => a.y - b.y || a.x - b.x);
}

/** Printed label boxes. These are the same labels as the form, so they fence each blank. */
function findLabelHits(lines: OcrLine[], labels: readonly string[]): LabelHit[] {
  const words = flatWords(lines);
  const hits: LabelHit[] = [];
  for (const label of labels) {
    const tokens = normalizeOcr(label).split(' ').filter(Boolean);
    if (tokens.length === 0) continue;
    for (let start = 0; start < words.length; start += 1) {
      let tokenIndex = 0;
      let index = start;
      let x = Infinity;
      let y = Infinity;
      let r = 0;
      let b = 0;
      let previous: OcrLine['words'][number] | null = null;
      while (index < words.length && tokenIndex < tokens.length) {
        const word = words[index];
        if (previous) {
          const sameLine =
            Math.abs(word.y - previous.y) < 0.016 &&
            word.x >= previous.x - 0.01 &&
            word.x < previous.x + previous.w + 0.08;
          if (!sameLine) break;
        }
        const got = tokensOfWord(word.text);
        if (got.length === 0 || tokenIndex + got.length > tokens.length) break;
        const matches = got.every((piece, offset) => piece === tokens[tokenIndex + offset]);
        if (!matches) break;
        x = Math.min(x, word.x);
        y = Math.min(y, word.y);
        r = Math.max(r, word.x + word.w);
        b = Math.max(b, word.y + word.h);
        previous = word;
        tokenIndex += got.length;
        index += 1;
      }
      if (tokenIndex === tokens.length) {
        hits.push({ phrase: normalizeOcr(label), x, y, r, b });
      }
    }
  }
  return hits;
}

function insideHit(word: OcrLine['words'][number], hit: LabelHit): boolean {
  const cx = word.x + word.w / 2;
  const cy = word.y + word.h / 2;
  return cx >= hit.x - 0.004 && cx <= hit.r + 0.004 && cy >= hit.y - 0.004 && cy <= hit.b + 0.004;
}

export type BlankBox = { x: number; y: number; w: number; h: number };

/**
 * The empty rectangle for one printed label.
 * `under` — below the label, until the next label.
 * `beside` — to the right of the label, on that same row.
 * The company block and other printed labels are outside this rectangle.
 */
export function blankBox(
  lines: OcrLine[],
  label: string,
  labels: readonly string[],
  placement: 'under' | 'beside',
): BlankBox | null {
  const hits = findLabelHits(lines, labels);
  const mine = hits.find((hit) => hit.phrase === normalizeOcr(label));
  if (!mine) return null;
  const sameRow = (hit: LabelHit) => hit.y < mine.b + 0.012 && hit.b > mine.y - 0.012 && hit !== mine;
  const rightHit = hits
    .filter((hit) => sameRow(hit) && hit.x >= mine.r - 0.01)
    .sort((a, b) => a.x - b.x)[0];
  const columnRight = rightHit?.x ?? mine.r + 0.4;
  const belowHit = hits
    .filter((hit) => {
      if (hit === mine || hit.y < mine.b + 0.006) return false;
      const center = (hit.x + hit.r) / 2;
      return center >= mine.x && center < columnRight;
    })
    .sort((a, b) => a.y - b.y)[0];

  const left = placement === 'beside' ? mine.r + 0.004 : mine.x - 0.01;
  const right = rightHit ? rightHit.x - 0.006 : Math.min(0.98, left + (placement === 'beside' ? 0.22 : 0.34));
  const top = placement === 'beside' ? mine.y - 0.008 : mine.b + 0.002;
  const bottom = placement === 'beside'
    ? mine.b + 0.01
    : belowHit
      ? belowHit.y - 0.002
      : mine.b + 0.045;
  if (right - left < 0.01 || bottom - top < 0.004) return null;
  return { x: left, y: top, w: right - left, h: bottom - top };
}

/**
 * Handwriting in one field.
 * `under` — the blank is below the label, until the next label.
 * `beside` — the blank is to the right of the label, on that same row.
 */
export function readFieldBlank(
  lines: OcrLine[],
  label: string,
  labels: readonly string[],
  placement: 'under' | 'beside',
): string {
  const box = blankBox(lines, label, labels, placement);
  if (!box) return '';
  const hits = findLabelHits(lines, labels);
  const left = box.x;
  const right = box.x + box.w;
  const top = box.y;
  const bottom = box.y + box.h;

  const picked = flatWords(lines)
    .filter((word) => {
      const cx = word.x + word.w / 2;
      const cy = word.y + word.h / 2;
      if (cx < left || cx >= right || cy < top || cy >= bottom) return false;
      return !hits.some((hit) => insideHit(word, hit));
    })
    .sort((a, b) => a.x - b.x);
  return picked
    .map((word) => word.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function textAfterLabel(lines: OcrLine[], label: string): string {
  const wanted = normalizeOcr(label).replace(/:$/, '');
  if (wanted.length < 4) return '';
  const labelTokens = new Set(wanted.split(' '));
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!normalizeOcr(line.text).includes(wanted)) continue;
    const rest = (line.words.length > 0 ? line.words : [{ text: line.text, x: 0, y: 0, w: 0, h: 0 }])
      .filter((word) => {
        const tokens = normalizeOcr(word.text).split(' ').filter(Boolean);
        return tokens.length === 0 || tokens.some((token) => !labelTokens.has(token));
      })
      .map((word) => word.text)
      .join(' ')
      .trim();
    if (rest) return rest;
  }
  return '';
}

export function assignLinesToRows(
  rows: readonly { id: string; text?: string }[],
  lines: OcrLine[],
): Map<string, OcrLine> {
  const pairs: { rowId: string; lineIndex: number; score: number }[] = [];
  rows.forEach((row) => {
    const text = row.text?.trim() ?? '';
    if (text.length < 8) return;
    lines.forEach((line, lineIndex) => {
      const score = lineOverlap(text, line.text);
      const tokens = tokensOf(text).length;
      const strongEnough = tokens <= 2 ? score >= 0.99 : score >= 0.55;
      if (strongEnough) pairs.push({ rowId: row.id, lineIndex, score });
    });
  });
  pairs.sort((a, b) => b.score - a.score);
  const usedLines = new Set<number>();
  const usedRows = new Set<string>();
  const assigned = new Map<string, OcrLine>();
  for (const pair of pairs) {
    if (usedLines.has(pair.lineIndex) || usedRows.has(pair.rowId)) continue;
    usedLines.add(pair.lineIndex);
    usedRows.add(pair.rowId);
    assigned.set(pair.rowId, lines[pair.lineIndex]);
  }
  return assigned;
}
