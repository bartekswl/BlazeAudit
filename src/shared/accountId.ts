import { createHash } from 'node:crypto';

/** Opaque per-account folder id derived from email — never use email in paths. */
export function accountIdFromEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}
