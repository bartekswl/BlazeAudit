import path from 'node:path';
import { accountIdFromEmail } from '../../shared/accountId';
import { ensureProfileRecordSecret } from './profileSecret';
import { readSignedBinaryRecord, writeSignedBinaryRecord } from '../storage/binaryRecord';
import { RecordTamperError } from '../storage/recordSeal';
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

export class RegistryTamperedError extends Error {
  constructor() {
    super('Account registry was modified outside BlazeAudit.');
    this.name = 'RegistryTamperedError';
  }
}

const registryBin = () => path.join(dataDir(), 'registry.bin');
const registryJson = () => path.join(dataDir(), 'registry.json');

function emptyRegistry(): AccountRegistry {
  return { version: 1, accounts: [], lastActiveAccountId: null };
}

function readRegistry(): AccountRegistry {
  try {
    return (
      readSignedBinaryRecord<AccountRegistry>(
        registryBin(),
        registryJson(),
        ensureProfileRecordSecret(),
      ) ?? emptyRegistry()
    );
  } catch (e) {
    if (e instanceof RecordTamperError) throw new RegistryTamperedError();
    throw e;
  }
}

function writeRegistry(registry: AccountRegistry): void {
  ensureProfileRecordSecret();
  writeSignedBinaryRecord(registryBin(), registry, ensureProfileRecordSecret());
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

export function findAccountById(accountId: string): AccountEntry | null {
  return readRegistry().accounts.find((a) => a.id === accountId) ?? null;
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
