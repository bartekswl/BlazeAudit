import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { accountIdFromEmail } from '../../shared/accountId';
import { dataDir } from '../db/paths';

export interface AccountEntry {
  id: string;
  email: string;
  addedAt: string;
}

interface AccountRegistry {
  version: 1;
  accounts: AccountEntry[];
  lastActiveAccountId: string | null;
}

const REGISTRY_FILE = () => path.join(dataDir(), 'registry.json');

function readRegistry(): AccountRegistry {
  const file = REGISTRY_FILE();
  if (!existsSync(file)) {
    return { version: 1, accounts: [], lastActiveAccountId: null };
  }
  return JSON.parse(readFileSync(file, 'utf8')) as AccountRegistry;
}

function writeRegistry(registry: AccountRegistry): void {
  writeFileSync(REGISTRY_FILE(), JSON.stringify(registry, null, 2), { mode: 0o600 });
}

export function listAccounts(): AccountEntry[] {
  return readRegistry().accounts;
}

export function accountExists(accountId: string): boolean {
  return readRegistry().accounts.some((a) => a.id === accountId);
}

export function findAccountByEmail(email: string): AccountEntry | null {
  const id = accountIdFromEmail(email);
  return readRegistry().accounts.find((a) => a.id === id) ?? null;
}

export function registerAccount(email: string): AccountEntry {
  const registry = readRegistry();
  const id = accountIdFromEmail(email);
  const existing = registry.accounts.find((a) => a.id === id);
  if (existing) return existing;

  const entry: AccountEntry = {
    id,
    email: email.trim().toLowerCase(),
    addedAt: new Date().toISOString(),
  };
  registry.accounts.push(entry);
  registry.lastActiveAccountId = id;
  writeRegistry(registry);
  return entry;
}

export function getLastActiveAccountId(): string | null {
  return readRegistry().lastActiveAccountId;
}

export function setLastActiveAccountId(accountId: string | null): void {
  const registry = readRegistry();
  registry.lastActiveAccountId = accountId;
  writeRegistry(registry);
}

export function hasAnyAccount(): boolean {
  return readRegistry().accounts.length > 0;
}
