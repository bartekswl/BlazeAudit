/**
 * How alike two client names are, from 0 to 1.
 * 1 is the same name after punctuation and filler words are ignored.
 * A score of at least 0.5 means most of the shorter name's words are in the longer one.
 */
export function clientNameMatchScore(left: string, right: string): number {
  const a = significantTokens(left);
  const b = significantTokens(right);
  if (a.length === 0 || b.length === 0) return 0;
  if (a.join(' ') === b.join(' ')) return 1;

  const setA = new Set(a);
  const setB = new Set(b);
  let shared = 0;
  for (const token of setA) {
    if (setB.has(token)) shared += 1;
  }
  const shorter = Math.min(setA.size, setB.size);
  // A single leftover word ("Queen", "Centre") is not enough to call two clients the same.
  if (shorter < 2) return 0;
  return shared / shorter;
}

const FILLER = new Set([
  'a',
  'an',
  'and',
  'the',
  'of',
  'st',
  'street',
  'ave',
  'avenue',
  'rd',
  'road',
  'blvd',
  'boulevard',
  'dr',
  'drive',
  'e',
  'w',
  'n',
  's',
  'east',
  'west',
  'north',
  'south',
]);

function significantTokens(value: string): string[] {
  const normalized = value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (!normalized) return [];
  const tokens = normalized.split(/\s+/).filter((token) => !FILLER.has(token));
  return tokens.length > 0 ? tokens : normalized.split(/\s+/);
}
