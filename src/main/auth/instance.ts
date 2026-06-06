import { createHash, randomUUID } from 'node:crypto';
import { hostname, userInfo } from 'node:os';

/** Per-install id for licensing (UUID + coarse machine fingerprint). */
export function createInstanceId(): string {
  const fingerprint = createHash('sha256')
    .update([hostname(), userInfo().username, process.platform].join('|'))
    .digest('hex')
    .slice(0, 16);

  return `${randomUUID()}-${fingerprint}`;
}
