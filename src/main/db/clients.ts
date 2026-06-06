import { randomUUID } from 'node:crypto';
import type { Client, ClientInput } from '../../shared/types';
import { getDatabase } from './connection';

// Raw row shape as stored (snake_case columns).
interface ClientRow {
  id: string;
  name: string;
  address: string;
  contact_name: string;
  phone: string;
  email: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalize(input: ClientInput) {
  const name = input.name?.trim();
  if (!name) throw new Error('Client name is required.');
  return {
    name,
    address: input.address?.trim() ?? '',
    contactName: input.contactName?.trim() ?? '',
    phone: input.phone?.trim() ?? '',
    email: input.email?.trim() ?? '',
    notes: input.notes?.trim() ?? '',
  };
}

export function listClients(): Client[] {
  const rows = getDatabase()
    .prepare('SELECT * FROM clients ORDER BY name COLLATE NOCASE ASC')
    .all() as ClientRow[];
  return rows.map(toClient);
}

export function getClient(id: string): Client | null {
  const row = getDatabase().prepare('SELECT * FROM clients WHERE id = ?').get(id) as
    | ClientRow
    | undefined;
  return row ? toClient(row) : null;
}

export function createClient(input: ClientInput): Client {
  const fields = normalize(input);
  const now = new Date().toISOString();
  const id = randomUUID();

  getDatabase()
    .prepare(
      `INSERT INTO clients (id, name, address, contact_name, phone, email, notes, created_at, updated_at)
       VALUES (@id, @name, @address, @contactName, @phone, @email, @notes, @createdAt, @updatedAt)`,
    )
    .run({ id, ...fields, createdAt: now, updatedAt: now });

  return getClient(id)!;
}

export function updateClient(id: string, input: ClientInput): Client {
  const fields = normalize(input);
  const now = new Date().toISOString();

  const result = getDatabase()
    .prepare(
      `UPDATE clients
         SET name = @name, address = @address, contact_name = @contactName,
             phone = @phone, email = @email, notes = @notes, updated_at = @updatedAt
       WHERE id = @id`,
    )
    .run({ id, ...fields, updatedAt: now });

  if (result.changes === 0) throw new Error(`Client not found: ${id}`);
  return getClient(id)!;
}

export function deleteClient(id: string): void {
  const result = getDatabase().prepare('DELETE FROM clients WHERE id = ?').run(id);
  if (result.changes === 0) throw new Error(`Client not found: ${id}`);
}
