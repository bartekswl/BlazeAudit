let activeAccountId: string | null = null;
let addingNewAccount = false;

export function setActiveAccountId(id: string | null): void {
  activeAccountId = id;
}

export function setAddingNewAccount(value: boolean): void {
  addingNewAccount = value;
}

export function isAddingNewAccount(): boolean {
  return addingNewAccount;
}

export function getActiveAccountId(): string | null {
  return activeAccountId;
}

export function requireActiveAccountId(): string {
  if (!activeAccountId) throw new Error('No account selected.');
  return activeAccountId;
}
