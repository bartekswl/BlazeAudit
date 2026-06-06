import { hashRaw } from '@node-rs/argon2';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
  algorithm: 2, // Argon2id
} as const;

export interface PasswordWrap {
  salt: string;
  ciphertext: string;
  iv: string;
  authTag: string;
}

/** Wrap key X (64-char hex) with a password-derived key (Argon2id + AES-256-GCM). */
export async function wrapKeyWithPassword(keyX: string, password: string): Promise<PasswordWrap> {
  const salt = randomBytes(16);
  const derived = await hashRaw(password, { salt, ...ARGON2_OPTIONS });

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', derived, iv);
  const ciphertext = Buffer.concat([cipher.update(keyX, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    salt: salt.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

export async function unwrapKeyWithPassword(wrap: PasswordWrap, password: string): Promise<string> {
  const salt = Buffer.from(wrap.salt, 'base64');

  try {
    const derived = await hashRaw(password, { salt, ...ARGON2_OPTIONS });
    const decipher = createDecipheriv('aes-256-gcm', derived, Buffer.from(wrap.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(wrap.authTag, 'base64'));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(wrap.ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');

    if (!/^[0-9a-f]{64}$/i.test(plain)) {
      throw new Error('Incorrect password.');
    }
    return plain;
  } catch {
    throw new Error('Incorrect password.');
  }
}
