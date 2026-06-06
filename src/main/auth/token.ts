import { createHmac, timingSafeEqual } from 'node:crypto';

// Dev-only signing secret. Phase 8 replaces this with asymmetric server signatures.
const DEV_SIGNING_SECRET = 'blazeaudit-dev-signing-v1';

export interface ActivationTokenPayload {
  email: string;
  instanceId: string;
  issuedAt: string;
}

function signPayload(payload: ActivationTokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', DEV_SIGNING_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function issueDevActivationToken(payload: ActivationTokenPayload): string {
  return signPayload(payload);
}

export function verifyActivationToken(token: string): ActivationTokenPayload {
  const [body, sig] = token.split('.');
  if (!body || !sig) throw new Error('Activation token is malformed.');

  const expected = createHmac('sha256', DEV_SIGNING_SECRET).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error('Activation token signature is invalid.');
  }

  const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as ActivationTokenPayload;
  if (!parsed.email || !parsed.instanceId || !parsed.issuedAt) {
    throw new Error('Activation token payload is incomplete.');
  }
  return parsed;
}
