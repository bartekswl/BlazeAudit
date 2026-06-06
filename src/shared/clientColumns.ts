import type { Client, ClientInput } from './types';

/** Spreadsheet / import column order — matches current client fields (see ClientInput). */
export const CLIENT_SPREADSHEET_COLUMNS = [
  { key: 'name', header: 'Name', required: true },
  { key: 'street', header: 'Street' },
  { key: 'unit', header: 'Unit' },
  { key: 'city', header: 'City' },
  { key: 'postCode', header: 'Post Code' },
  { key: 'province', header: 'Province' },
  { key: 'country', header: 'Country' },
  { key: 'contactName', header: 'Contact' },
  { key: 'phone', header: 'Phone' },
  { key: 'email', header: 'Email' },
  { key: 'notes', header: 'Notes' },
] as const satisfies ReadonlyArray<{
  key: keyof ClientInput;
  header: string;
  required?: boolean;
}>;

export type ClientSpreadsheetKey = (typeof CLIENT_SPREADSHEET_COLUMNS)[number]['key'];

export function clientToSpreadsheetRow(client: Client): Record<ClientSpreadsheetKey, string> {
  return {
    name: client.name,
    street: client.street,
    unit: client.unit,
    city: client.city,
    postCode: client.postCode,
    province: client.province,
    country: client.country,
    contactName: client.contactName,
    phone: client.phone,
    email: client.email,
    notes: client.notes,
  };
}
