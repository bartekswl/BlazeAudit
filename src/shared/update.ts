/** Update lifecycle status broadcast from main → renderer. */
export type UpdateStatus =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'available'; version: string; notes: string | null }
  | { phase: 'not-available'; version: string }
  | {
      phase: 'downloading';
      version: string;
      percent: number;
      transferred: number;
      total: number;
      bytesPerSecond: number;
    }
  | { phase: 'downloaded'; version: string; notes: string | null }
  | { phase: 'installing'; version: string }
  | { phase: 'error'; message: string };

export type UpdatePhase = UpdateStatus['phase'];

export type RollbackInfo = {
  currentVersion: string;
  /** Version before the last upgrade — only set when current is newer. */
  previousVersion: string | null;
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Decode a few rounds of HTML entities (GitHub often serves notes as &lt;p&gt;…). */
function decodeHtmlEntities(value: string): string {
  let text = value;
  for (let i = 0; i < 3; i += 1) {
    const next = text
      .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
        const key = entity.toLowerCase();
        if (key.startsWith('#x')) {
          const code = Number.parseInt(key.slice(2), 16);
          return Number.isFinite(code) ? String.fromCodePoint(code) : match;
        }
        if (key.startsWith('#')) {
          const code = Number.parseInt(key.slice(1), 10);
          return Number.isFinite(code) ? String.fromCodePoint(code) : match;
        }
        return NAMED_ENTITIES[key] ?? match;
      })
      .replace(/\u00a0/g, ' ');
    if (next === text) break;
    text = next;
  }
  return text;
}

function stripHtmlToPlainText(raw: string): string {
  return decodeHtmlEntities(raw)
    .replace(/\r\n/g, '\n')
    // Block / break tags → newlines before stripping
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|ul|ol|blockquote)>/gi, '\n')
    .replace(/<(br|hr)\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<p[^>]*>/gi, '\n')
    // Drop remaining tags
    .replace(/<\/?[^>]+>/g, '')
    // Catch any leftover angle-bracket crumbs (malformed / partial tags)
    .replace(/<\/?[a-z][\w:-]*\b[^>]*>/gi, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * Turn GitHub / electron-updater release notes into plain text.
 * Returns null when there is nothing useful to show (empty HTML, tags only, etc.).
 */
export function sanitizeReleaseNotes(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const text = stripHtmlToPlainText(raw);

  const lines = text
    .split('\n')
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .filter((line) => line.length > 0)
    // Drop leftover markup fragments or empty tag leftovers
    .filter((line) => !/^<\/?[a-z][\w:-]*\b[^>]*>?$/i.test(line))
    .filter((line) => !/^<\/?[a-z]+$/i.test(line))
    // Never show lines that still look like HTML tags
    .map((line) => line.replace(/<\/?[a-z][^>]*>/gi, '').trim())
    .filter((line) => line.length > 0);

  return lines.length > 0 ? lines.join('\n') : null;
}

/** Bullet lines for the Update UI — empty when notes are unknown/unusable. */
export function releaseNotesToLines(notes: string | null | undefined): string[] {
  const cleaned = sanitizeReleaseNotes(notes);
  if (!cleaned) return [];
  return cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/<\/?[a-z]/i.test(line));
}
