import path from 'node:path';
import { ensureDpapiSecret } from '../storage/dpapiSecret';
import { accountDir } from '../db/paths';

const accountSecretFile = () => path.join(accountDir(), 'auth', 'records.mac.dpapi');

/** Per-account HMAC key — DPAPI-held; edits to .bin without this fail verification. */
export function ensureAccountRecordSecret(): string {
  return ensureDpapiSecret(accountSecretFile());
}
