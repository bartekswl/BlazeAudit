import path from 'node:path';
import { ensureDpapiSecret } from '../storage/dpapiSecret';
import { dataDir } from '../db/paths';

const profileSecretFile = () => path.join(dataDir(), 'profile.mac.dpapi');

/** Profile-wide HMAC key for registry.bin. */
export function ensureProfileRecordSecret(): string {
  return ensureDpapiSecret(profileSecretFile());
}
