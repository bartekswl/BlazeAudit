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
  | { phase: 'error'; message: string };

export type UpdatePhase = UpdateStatus['phase'];
