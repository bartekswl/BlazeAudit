import { randomBytes } from 'node:crypto';
import { issueDevActivationToken } from '../auth/token';
import type { ActivateRequest, ActivateResponse, LicenseClient, ValidateRequest, ValidateResponse } from './types';

const DEV_KEYS = new Set(['DEV-TEST-KEY']);

function isDevActivationKey(key: string): boolean {
  const trimmed = key.trim();
  return DEV_KEYS.has(trimmed) || trimmed.startsWith('BLZ-');
}

export function createDevLicenseClient(resolveKeyX: () => string): LicenseClient {
  return {
    async activate(request: ActivateRequest): Promise<ActivateResponse> {
      if (!isDevActivationKey(request.activationKey)) {
        throw new Error('Invalid activation key. Use DEV-TEST-KEY or a BLZ- prefixed key in development.');
      }

      const email = request.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Enter a valid email address.');
      }

      // Dev: local resolver; Phase 8 server issues a unique key X per email+instance.
      const keyX = resolveKeyX();
      const token = issueDevActivationToken({
        email,
        instanceId: request.instanceId,
        issuedAt: new Date().toISOString(),
      });

      return { keyX, token };
    },

    async validate(request: ValidateRequest): Promise<ValidateResponse> {
      // Dev stub always reports valid until Phase 8 server exists.
      void request;
      return { valid: true, revoked: false };
    },
  };
}

/** Fresh random key X for brand-new installs with no legacy data. */
export function generateKeyX(): string {
  return randomBytes(32).toString('hex');
}
