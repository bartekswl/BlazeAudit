import { randomUUID } from 'node:crypto';
import {
  formatAddressForList,
  normalizeAddressParts,
  validateAddressFields,
  validatePhone,
} from '../../shared/address';
import type { Client, ClientInput } from '../../shared/types';
import { getDatabase } from './connection';

// Raw row shape as stored (snake_case columns).
interface ClientRow {
  id: string;
  name: string;
  address: string;
  street: string;
  unit: string;
  city: string;
  post_code: string;
  country: string;
  province: string;
  contact_name: string;
  phone: string;
  email: string;
  owner_manager_name: string;
  owner_manager_phone: string;
  signal_receiving_center_name: string;
  signal_receiving_center_phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

function toClient(row: ClientRow): Client {
  const street = row.street ?? '';
  const unit = row.unit ?? '';
  const city = row.city ?? '';
  const postCode = row.post_code ?? '';
  const country = row.country ?? '';
  const province = row.province ?? '';

  const parts = { street, unit, city, postCode, country, province };
  const formatted = formatAddressForList(parts);
  // Legacy rows: only the old `address` column was populated.
  const address = formatted || row.address || '';

  return {
    id: row.id,
    name: row.name,
    street,
    unit,
    city,
    postCode,
    country,
    province,
    address,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    ownerManagerName: row.owner_manager_name ?? '',
    ownerManagerPhone: row.owner_manager_phone ?? '',
    signalReceivingCenterName: row.signal_receiving_center_name ?? '',
    signalReceivingCenterPhone: row.signal_receiving_center_phone ?? '',
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalize(input: ClientInput) {
  const name = input.name?.trim();
  if (!name) throw new Error('Building name is required.');

  const parts = normalizeAddressParts(input);
  const addressError = validateAddressFields(parts);
  if (addressError) throw new Error(addressError);

  for (const [label, value] of [
    ['Contact phone', input.phone],
    ['Owner / manager phone', input.ownerManagerPhone],
    ['Signal receiving center phone', input.signalReceivingCenterPhone],
  ] as const) {
    const phoneError = validatePhone(value ?? '');
    if (phoneError) throw new Error(`${label}: ${phoneError}`);
  }

  const formattedAddress = formatAddressForList(parts);

  return {
    name,
    ...parts,
    formattedAddress,
    contactName: input.contactName?.trim() ?? '',
    phone: input.phone?.trim() ?? '',
    email: input.email?.trim() ?? '',
    ownerManagerName: input.ownerManagerName?.trim() ?? '',
    ownerManagerPhone: input.ownerManagerPhone?.trim() ?? '',
    signalReceivingCenterName: input.signalReceivingCenterName?.trim() ?? '',
    signalReceivingCenterPhone: input.signalReceivingCenterPhone?.trim() ?? '',
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
      `INSERT INTO clients (
         id, name, address, street, unit, city, post_code, country, province,
         contact_name, phone, email,
         owner_manager_name, owner_manager_phone,
         signal_receiving_center_name, signal_receiving_center_phone,
         notes, created_at, updated_at
       ) VALUES (
         @id, @name, @formattedAddress, @street, @unit, @city, @postCode, @country, @province,
         @contactName, @phone, @email,
         @ownerManagerName, @ownerManagerPhone,
         @signalReceivingCenterName, @signalReceivingCenterPhone,
         @notes, @createdAt, @updatedAt
       )`,
    )
    .run({
      id,
      name: fields.name,
      formattedAddress: fields.formattedAddress,
      street: fields.street,
      unit: fields.unit,
      city: fields.city,
      postCode: fields.postCode,
      country: fields.country,
      province: fields.province,
      contactName: fields.contactName,
      phone: fields.phone,
      email: fields.email,
      ownerManagerName: fields.ownerManagerName,
      ownerManagerPhone: fields.ownerManagerPhone,
      signalReceivingCenterName: fields.signalReceivingCenterName,
      signalReceivingCenterPhone: fields.signalReceivingCenterPhone,
      notes: fields.notes,
      createdAt: now,
      updatedAt: now,
    });

  return getClient(id)!;
}

export function updateClient(id: string, input: ClientInput): Client {
  const fields = normalize(input);
  const now = new Date().toISOString();

  const result = getDatabase()
    .prepare(
      `UPDATE clients
         SET name = @name, address = @formattedAddress,
             street = @street, unit = @unit, city = @city,
             post_code = @postCode, country = @country, province = @province,
             contact_name = @contactName, phone = @phone, email = @email,
             owner_manager_name = @ownerManagerName,
             owner_manager_phone = @ownerManagerPhone,
             signal_receiving_center_name = @signalReceivingCenterName,
             signal_receiving_center_phone = @signalReceivingCenterPhone,
             notes = @notes, updated_at = @updatedAt
       WHERE id = @id`,
    )
    .run({
      id,
      name: fields.name,
      formattedAddress: fields.formattedAddress,
      street: fields.street,
      unit: fields.unit,
      city: fields.city,
      postCode: fields.postCode,
      country: fields.country,
      province: fields.province,
      contactName: fields.contactName,
      phone: fields.phone,
      email: fields.email,
      ownerManagerName: fields.ownerManagerName,
      ownerManagerPhone: fields.ownerManagerPhone,
      signalReceivingCenterName: fields.signalReceivingCenterName,
      signalReceivingCenterPhone: fields.signalReceivingCenterPhone,
      notes: fields.notes,
      updatedAt: now,
    });

  if (result.changes === 0) throw new Error(`Client not found: ${id}`);
  return getClient(id)!;
}

export function deleteClient(id: string): void {
  const db = getDatabase();
  const linked = db
    .prepare('SELECT COUNT(*) AS n FROM inspections WHERE client_id = ?')
    .get(id) as { n: number };
  if (linked.n > 0) {
    throw new Error('This customer still has documents. Delete them first.');
  }

  const result = db.prepare('DELETE FROM clients WHERE id = ?').run(id);
  if (result.changes === 0) throw new Error(`Client not found: ${id}`);
}
