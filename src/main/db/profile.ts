import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { dialog } from 'electron';
import { normalizeAddressParts, validateAddressFields, validateEmail, validatePhone } from '../../shared/address';
import {
  BUSINESS_PROFILE_ID,
  truncateBusinessProfileInput,
  type BusinessProfile,
  type BusinessProfileInput,
  type Inspector,
  type InspectorInput,
} from '../../shared/profile';
import { accountDir } from './paths';
import { getDatabase } from './connection';

interface BusinessProfileRow {
  id: string;
  business_name: string;
  phone: string;
  email: string;
  logo_path: string;
  street: string;
  unit: string;
  city: string;
  post_code: string;
  country: string;
  province: string;
  updated_at: string;
}

interface InspectorRow {
  id: string;
  name: string;
  license_number: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function assetsDir(): string {
  return path.join(accountDir(), 'assets');
}

function toBusinessProfile(row: BusinessProfileRow): BusinessProfile {
  const logoPath = row.logo_path?.trim() ?? '';
  return {
    businessName: row.business_name ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    street: row.street ?? '',
    unit: row.unit ?? '',
    city: row.city ?? '',
    postCode: row.post_code ?? '',
    country: row.country ?? '',
    province: row.province ?? '',
    hasLogo: Boolean(logoPath && fs.existsSync(path.join(accountDir(), logoPath))),
    updatedAt: row.updated_at,
  };
}

function toInspector(row: InspectorRow): Inspector {
  return {
    id: row.id,
    name: row.name ?? '',
    licenseNumber: row.license_number ?? '',
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeBusinessInput(input: BusinessProfileInput) {
  const trimmed = truncateBusinessProfileInput(input);
  const businessName = trimmed.businessName.trim();
  const phone = trimmed.phone.trim();
  const email = trimmed.email.trim();
  const parts = normalizeAddressParts(trimmed);
  const addressError = validateAddressFields(parts);
  if (addressError) throw new Error(addressError);
  const phoneError = validatePhone(phone);
  if (phoneError) throw new Error(phoneError);
  const emailError = validateEmail(email);
  if (emailError) throw new Error(emailError);
  return { businessName, phone, email, ...parts };
}

function getProfileRow(): BusinessProfileRow {
  const db = getDatabase();
  const row = db
    .prepare(`SELECT * FROM business_profile WHERE id = ?`)
    .get(BUSINESS_PROFILE_ID) as BusinessProfileRow | undefined;
  if (!row) throw new Error('Business profile not initialized.');
  return row;
}

export function getBusinessProfile(): BusinessProfile {
  return toBusinessProfile(getProfileRow());
}

export function updateBusinessProfile(input: BusinessProfileInput): BusinessProfile {
  const normalized = normalizeBusinessInput(input);
  const updatedAt = nowIso();
  const db = getDatabase();
  db.prepare(
    `UPDATE business_profile
        SET business_name = @businessName,
            phone = @phone,
            email = @email,
            street = @street,
            unit = @unit,
            city = @city,
            post_code = @postCode,
            country = @country,
            province = @province,
            updated_at = @updatedAt
      WHERE id = @id`,
  ).run({
    id: BUSINESS_PROFILE_ID,
    businessName: normalized.businessName,
    phone: normalized.phone,
    email: normalized.email,
    street: normalized.street,
    unit: normalized.unit,
    city: normalized.city,
    postCode: normalized.postCode,
    country: normalized.country,
    province: normalized.province,
    updatedAt,
  });
  return getBusinessProfile();
}

function mimeForLogo(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'image/png';
  }
}

export function getBusinessLogoDataUrl(): string | null {
  const row = getProfileRow();
  const relative = row.logo_path?.trim();
  if (!relative) return null;
  const full = path.join(accountDir(), relative);
  if (!fs.existsSync(full)) return null;
  const data = fs.readFileSync(full);
  return `data:${mimeForLogo(full)};base64,${data.toString('base64')}`;
}

export async function pickBusinessLogo(): Promise<BusinessProfile> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return getBusinessProfile();

  const src = result.filePaths[0];
  const ext = path.extname(src).toLowerCase() || '.png';
  fs.mkdirSync(assetsDir(), { recursive: true });

  const row = getProfileRow();
  if (row.logo_path) {
    const existing = path.join(accountDir(), row.logo_path);
    if (fs.existsSync(existing)) fs.unlinkSync(existing);
  }

  const relative = path.join('assets', `logo${ext}`);
  const dest = path.join(accountDir(), relative);
  fs.copyFileSync(src, dest);

  const updatedAt = nowIso();
  getDatabase()
    .prepare(`UPDATE business_profile SET logo_path = @logoPath, updated_at = @updatedAt WHERE id = @id`)
    .run({ id: BUSINESS_PROFILE_ID, logoPath: relative, updatedAt });

  return getBusinessProfile();
}

export function removeBusinessLogo(): BusinessProfile {
  const row = getProfileRow();
  if (row.logo_path) {
    const full = path.join(accountDir(), row.logo_path);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  }
  const updatedAt = nowIso();
  getDatabase()
    .prepare(`UPDATE business_profile SET logo_path = '', updated_at = @updatedAt WHERE id = @id`)
    .run({ id: BUSINESS_PROFILE_ID, updatedAt });
  return getBusinessProfile();
}

export function listInspectors(): Inspector[] {
  const db = getDatabase();
  const rows = db
    .prepare(`SELECT * FROM inspectors ORDER BY sort_order ASC, created_at ASC`)
    .all() as InspectorRow[];
  return rows.map(toInspector);
}

function normalizeInspectorInput(input: InspectorInput): InspectorInput {
  return {
    name: input.name.trim(),
    licenseNumber: input.licenseNumber.trim(),
  };
}

function findInspectorDuplicate(
  name: string,
  licenseNumber: string,
  excludeId?: string,
): InspectorRow | undefined {
  const db = getDatabase();
  const rows = db
    .prepare(`SELECT * FROM inspectors WHERE LOWER(name) = LOWER(?) AND LOWER(license_number) = LOWER(?)`)
    .all(name, licenseNumber) as InspectorRow[];
  return rows.find((row) => row.id !== excludeId);
}

function assertInspectorUnique(input: InspectorInput, excludeId?: string): void {
  const normalized = normalizeInspectorInput(input);
  if (!normalized.name || !normalized.licenseNumber) {
    throw new Error('Inspector name and licence number are required.');
  }
  const duplicate = findInspectorDuplicate(normalized.name, normalized.licenseNumber, excludeId);
  if (duplicate) {
    throw new Error('An inspector with this name and licence number already exists.');
  }
}

export function createInspector(input: InspectorInput): Inspector {
  const normalized = normalizeInspectorInput(input);
  assertInspectorUnique(normalized);

  const db = getDatabase();
  const id = randomUUID();
  const createdAt = nowIso();
  const maxOrder =
    (db.prepare(`SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM inspectors`).get() as {
      max_order: number;
    }).max_order + 1;

  db.prepare(
    `INSERT INTO inspectors (id, name, license_number, sort_order, created_at, updated_at)
     VALUES (@id, @name, @licenseNumber, @sortOrder, @createdAt, @updatedAt)`,
  ).run({
    id,
    name: normalized.name,
    licenseNumber: normalized.licenseNumber,
    sortOrder: maxOrder,
    createdAt,
    updatedAt: createdAt,
  });

  return toInspector(
    db.prepare(`SELECT * FROM inspectors WHERE id = ?`).get(id) as InspectorRow,
  );
}

export function updateInspector(id: string, input: InspectorInput): Inspector {
  const db = getDatabase();
  const existing = db.prepare(`SELECT id FROM inspectors WHERE id = ?`).get(id);
  if (!existing) throw new Error('Inspector not found.');

  const normalized = normalizeInspectorInput(input);
  assertInspectorUnique(normalized, id);

  const updatedAt = nowIso();
  db.prepare(
    `UPDATE inspectors
        SET name = @name, license_number = @licenseNumber, updated_at = @updatedAt
      WHERE id = @id`,
  ).run({
    id,
    name: normalized.name,
    licenseNumber: normalized.licenseNumber,
    updatedAt,
  });

  return toInspector(db.prepare(`SELECT * FROM inspectors WHERE id = ?`).get(id) as InspectorRow);
}

export function deleteInspector(id: string): void {
  const db = getDatabase();
  const result = db.prepare(`DELETE FROM inspectors WHERE id = ?`).run(id);
  if (result.changes === 0) throw new Error('Inspector not found.');
}
