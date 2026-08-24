import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

function keyBytesFromKeyX(keyX: string): Buffer {
  if (!/^[0-9a-f]{64}$/i.test(keyX)) {
    throw new Error('Database key is malformed.');
  }
  return Buffer.from(keyX, 'hex');
}

/** AES-256-GCM using key X. Returns iv(12) || tag(16) || ciphertext. */
export function encryptWithKeyX(plaintext: Buffer, keyX: string): Buffer {
  const key = keyBytesFromKeyX(keyX);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]);
}

export function decryptWithKeyX(payload: Buffer, keyX: string): Buffer {
  if (payload.length < 12 + 16 + 1) {
    throw new Error('Backup file is corrupt or incomplete.');
  }
  const key = keyBytesFromKeyX(keyX);
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new Error(
      'This backup cannot be opened with the current account. Import only works for the same email.',
    );
  }
}
