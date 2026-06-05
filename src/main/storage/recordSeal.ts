import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** Signed on-disk envelope: BA\\x02 + zlib(JSON) + HMAC-SHA256 */
export const SIGNED_MAGIC = Buffer.from('BA\x02');
const MAC_LEN = 32;

export class RecordTamperError extends Error {
  constructor(message = 'Local record failed integrity check.') {
    super(message);
    this.name = 'RecordTamperError';
  }
}

function mac(secret: string, payload: Buffer): Buffer {
  return createHmac('sha256', secret).update(payload).digest();
}

export function sealPayload(payload: Buffer, secret: string): Buffer {
  const tag = mac(secret, payload);
  return Buffer.concat([SIGNED_MAGIC, payload, tag]);
}

export function openSealed(file: Buffer, secret: string): Buffer {
  if (
    file.length < SIGNED_MAGIC.length + MAC_LEN ||
    !file.subarray(0, SIGNED_MAGIC.length).equals(SIGNED_MAGIC)
  ) {
    throw new RecordTamperError();
  }

  const payload = file.subarray(SIGNED_MAGIC.length, file.length - MAC_LEN);
  const tag = file.subarray(file.length - MAC_LEN);
  const expected = mac(secret, payload);

  if (tag.length !== expected.length || !timingSafeEqual(tag, expected)) {
    throw new RecordTamperError();
  }

  return payload;
}

export function createRecordSecret(): string {
  return randomBytes(32).toString('base64url');
}
