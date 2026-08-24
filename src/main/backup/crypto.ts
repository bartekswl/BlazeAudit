import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

function keyBytesFromKeyX(keyX: string): Buffer {
  if (!/^[0-9a-f]{64}$/i.test(keyX)) {
    throw new Error('Database key is malformed.');
  }
  return Buffer.from(keyX, 'hex');
}

function aesGcmEncrypt(plaintext: Buffer, key: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]);
}

function aesGcmDecrypt(payload: Buffer, key: Buffer): Buffer {
  if (payload.length < 12 + 16 + 1) {
    throw new Error('Backup file is corrupt or incomplete.');
  }
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/** AES-256-GCM using key X. Returns iv(12) || tag(16) || ciphertext. */
export function encryptWithKeyX(plaintext: Buffer, keyX: string): Buffer {
  return aesGcmEncrypt(plaintext, keyBytesFromKeyX(keyX));
}

export function decryptWithKeyX(payload: Buffer, keyX: string): Buffer {
  try {
    return aesGcmDecrypt(payload, keyBytesFromKeyX(keyX));
  } catch {
    throw new Error(
      'This backup cannot be opened with the current account. Import only works for the same email.',
    );
  }
}

/**
 * Product pepper for email-bound key-X recovery (not escrow-grade secrecy —
 * authorization is "unlocked session whose email matches the backup").
 */
const BACKUP_RECOVERY_PEPPER = 'BlazeAudit.backup.keyx-recovery.v1';

function recoveryKeyFromEmail(email: string): Buffer {
  const normalized = email.trim().toLowerCase();
  return createHash('sha256')
    .update(BACKUP_RECOVERY_PEPPER, 'utf8')
    .update('\0')
    .update(normalized, 'utf8')
    .digest();
}

/** Seal key X so another install with the same email can open the backup body. */
export function sealKeyXForEmailRecovery(keyX: string, email: string): string {
  const sealed = aesGcmEncrypt(Buffer.from(keyX, 'utf8'), recoveryKeyFromEmail(email));
  return sealed.toString('base64');
}

export function openKeyXFromEmailRecovery(sealedBase64: string, email: string): string {
  let sealed: Buffer;
  try {
    sealed = Buffer.from(sealedBase64, 'base64');
  } catch {
    throw new Error('Backup recovery data is corrupt.');
  }
  try {
    const keyX = aesGcmDecrypt(sealed, recoveryKeyFromEmail(email)).toString('utf8');
    if (!/^[0-9a-f]{64}$/i.test(keyX)) {
      throw new Error('invalid');
    }
    return keyX.toLowerCase();
  } catch {
    throw new Error(
      'This backup cannot be opened for this account email. Export a new backup from the source machine.',
    );
  }
}
