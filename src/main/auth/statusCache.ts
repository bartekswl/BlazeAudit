import type { AuthStatus } from '../../shared/auth';

let cachedStatus: AuthStatus | null = null;

export function readCachedAuthStatus(): AuthStatus | null {
  return cachedStatus;
}

export function writeCachedAuthStatus(status: AuthStatus): void {
  cachedStatus = status;
}

export function clearAuthStatusCache(): void {
  cachedStatus = null;
}
