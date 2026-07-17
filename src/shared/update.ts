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

/**
 * Turn GitHub / electron-updater release notes into plain text.
 * Returns null when there is nothing useful to show (empty HTML, tags only, etc.).
 */
export function sanitizeReleaseNotes(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const text = raw
    .replace(/\r\n/g, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, '\n')
    .replace(/<(br|hr)\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/\u00a0/g, ' ');

  const lines = text
    .split('\n')
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .filter((line) => line.length > 0)
    // Drop leftover markup fragments or empty tag leftovers
    .filter((line) => !/^<\/?[a-z][\w-]*\s*\/?>$/i.test(line));

  return lines.length > 0 ? lines.join('\n') : null;
}

/** Bullet lines for the Update UI — empty when notes are unknown/unusable. */
export function releaseNotesToLines(notes: string | null | undefined): string[] {
  const cleaned = sanitizeReleaseNotes(notes);
  if (!cleaned) return [];
  return cleaned.split('\n').map((line) => line.trim()).filter(Boolean);
}
