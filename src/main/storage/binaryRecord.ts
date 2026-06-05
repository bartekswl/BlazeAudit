import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';
import { openSealed, RecordTamperError, sealPayload } from './recordSeal';

/** Legacy unsigned envelope (migrated forward on read). */
const UNSIGNED_MAGIC = Buffer.from('BA\x01');

function encodePayload(value: unknown): Buffer {
  const json = Buffer.from(JSON.stringify(value), 'utf8');
  return deflateSync(json);
}

function decodePayload(payload: Buffer): unknown {
  return JSON.parse(inflateSync(payload).toString('utf8'));
}

function decodeLegacyUnsigned(file: Buffer): unknown {
  if (file.length < UNSIGNED_MAGIC.length || !file.subarray(0, UNSIGNED_MAGIC.length).equals(UNSIGNED_MAGIC)) {
    throw new RecordTamperError();
  }
  return decodePayload(file.subarray(UNSIGNED_MAGIC.length));
}

export function writeSignedBinaryRecord(path: string, value: unknown, secret: string): void {
  const sealed = sealPayload(encodePayload(value), secret);
  writeFileSync(path, sealed, { mode: 0o600 });
}

export function readSignedBinaryRecord<T>(
  binPath: string,
  jsonPath: string,
  secret: string,
): T | null {
  if (existsSync(binPath)) {
    const file = readFileSync(binPath);
    let value: T;

    if (file.subarray(0, 3).equals(Buffer.from('BA\x02'))) {
      const payload = openSealed(file, secret);
      value = decodePayload(payload) as T;
    } else if (file.subarray(0, 3).equals(UNSIGNED_MAGIC)) {
      value = decodeLegacyUnsigned(file) as T;
      writeSignedBinaryRecord(binPath, value, secret);
    } else {
      throw new RecordTamperError();
    }

    return value;
  }

  if (!existsSync(jsonPath)) return null;

  const value = JSON.parse(readFileSync(jsonPath, 'utf8')) as T;
  writeSignedBinaryRecord(binPath, value, secret);
  unlinkSync(jsonPath);
  return value;
}
