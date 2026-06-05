import { createHash, timingSafeEqual } from 'node:crypto';
import type { AuthManifest } from './store';

/** Non-reversible fingerprint stored in manifest — not key X itself. */
export function keyXFingerprint(keyX: string): string {
  return createHash('sha256').update(keyX, 'utf8').digest('hex').slice(0, 16);
}

export function assertKeyXMatchesManifest(keyX: string, manifest: AuthManifest): void {
  if (!manifest.keyXId) return;

  const actual = keyXFingerprint(keyX);
  const a = Buffer.from(actual, 'utf8');
  const b = Buffer.from(manifest.keyXId, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error('Database key does not match this account.');
  }
}

export function manifestWithKeyXId(manifest: AuthManifest, keyX: string): AuthManifest {
  return { ...manifest, keyXId: keyXFingerprint(keyX) };
}
