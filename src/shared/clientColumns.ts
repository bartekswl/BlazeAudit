import type { Client, ClientInput } from './types';

/** Spreadsheet / import column order — matches current client fields (see ClientInput). */
export const CLIENT_SPREADSHEET_COLUMNS = [
  { key: 'name', header: 'Building Name', required: true },
  { key: 'street', header: 'Street' },
  { key: 'unit', header: 'Unit' },
  { key: 'city', header: 'City' },
  { key: 'postCode', header: 'Post Code' },
  { key: 'province', header: 'Province' },
  { key: 'country', header: 'Country' },
  { key: 'contactName', header: 'Contact Person' },
  { key: 'phone', header: 'Phone' },
  { key: 'email', header: 'Email' },
  { key: 'ownerManagerName', header: 'Owner / Manager' },
  { key: 'ownerManagerPhone', header: 'Owner / Manager Phone' },
  { key: 'signalReceivingCenterName', header: 'Signal Receiving Center' },
  { key: 'signalReceivingCenterPhone', header: 'Signal Receiving Center Phone' },
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
    ownerManagerName: client.ownerManagerName,
    ownerManagerPhone: client.ownerManagerPhone,
    signalReceivingCenterName: client.signalReceivingCenterName,
    signalReceivingCenterPhone: client.signalReceivingCenterPhone,
    notes: client.notes,
  };
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Map CSV header + data rows onto ClientInput records using spreadsheet column headers.
 * Rows with an empty building name are omitted.
 */
export function clientInputsFromSpreadsheetCsv(
  headers: string[],
  rows: string[][],
): ClientInput[] {
  const headerIndex = new Map<string, number>();
  headers.forEach((header, index) => {
    headerIndex.set(normalizeHeader(header), index);
  });

  const columnIndexes = CLIENT_SPREADSHEET_COLUMNS.map((col) => ({
    key: col.key,
    index: headerIndex.get(normalizeHeader(col.header)) ?? -1,
  }));

  const nameCol = columnIndexes.find((c) => c.key === 'name');
  if (!nameCol || nameCol.index < 0) {
    throw new Error(
      'CSV is missing the required "Building Name" column. Export customers from BlazeAudit for a template.',
    );
  }

  const inputs: ClientInput[] = [];
  for (const cells of rows) {
    const get = (key: ClientSpreadsheetKey): string => {
      const col = columnIndexes.find((c) => c.key === key);
      if (!col || col.index < 0) return '';
      return (cells[col.index] ?? '').trim();
    };
    const name = get('name');
    if (!name) continue;
    inputs.push({
      name,
      street: get('street'),
      unit: get('unit'),
      city: get('city'),
      postCode: get('postCode'),
      province: get('province'),
      country: get('country'),
      contactName: get('contactName'),
      phone: get('phone'),
      email: get('email'),
      ownerManagerName: get('ownerManagerName'),
      ownerManagerPhone: get('ownerManagerPhone'),
      signalReceivingCenterName: get('signalReceivingCenterName'),
      signalReceivingCenterPhone: get('signalReceivingCenterPhone'),
      notes: get('notes'),
    });
  }
  return inputs;
}
