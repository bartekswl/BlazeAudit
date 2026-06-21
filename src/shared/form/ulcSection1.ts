import type { BindingPath, BusinessContextSlice, DocumentContext } from '../document/context';
import { resolveBinding } from '../document/context';

export interface BusinessCompanyDisplay {
  name: string | null;
  phone: string | null;
  email: string | null;
  addressProvince: string | null;
  postCountry: string | null;
}

export function formatBusinessCompanyDisplay(
  business: Pick<
    BusinessContextSlice,
    | 'businessName'
    | 'phone'
    | 'email'
    | 'addressLine1'
    | 'street'
    | 'unit'
    | 'city'
    | 'province'
    | 'postCode'
    | 'country'
  >,
): BusinessCompanyDisplay | null {
  const name = business.businessName?.trim() || null;
  const phone = business.phone?.trim() || null;
  const email = business.email?.trim() || null;

  const addressLine =
    business.addressLine1?.trim() ||
    [business.street, business.unit].filter(Boolean).join(', ').trim() ||
    null;

  const addressProvince =
    [addressLine, business.city?.trim(), business.province?.trim()].filter(Boolean).join(', ') ||
    null;

  const postCountry =
    [business.postCode?.trim(), business.country?.trim()].filter(Boolean).join(', ') || null;

  if (!name && !phone && !email && !addressProvince && !postCountry) return null;

  return { name, phone, email, addressProvince, postCountry };
}

export interface UlcSection1Value {
  dateOfService: string;
  lastServiceDate: string;
  workOrderNumber: string;
  stageSingle: boolean;
  stageTwo: boolean;
  stageOther: boolean;
  stageOtherText: string;
  systemAddressable: boolean;
  systemConventional: boolean;
  systemWireless: boolean;
  systemHybrid: boolean;
  circuitsInitiating: string;
  circuitsNotification: string;
  circuitsVoicePaging: string;
  manufacturer: string;
  modelNumber: string;
  ulcSerialNumber: string;
  buildingName: string;
  contactPerson: string;
  contactPhone: string;
  contactFax: string;
  address: string;
  ownerPropertyManager: string;
  ownerPhone: string;
  ownerFax: string;
  city: string;
  postalCode: string;
  fireSignalCentre: string;
  fireSignalPhone: string;
  fireSignalFax: string;
}

export function emptyUlcSection1Value(): UlcSection1Value {
  return {
    dateOfService: '',
    lastServiceDate: '',
    workOrderNumber: '',
    stageSingle: false,
    stageTwo: false,
    stageOther: false,
    stageOtherText: '',
    systemAddressable: false,
    systemConventional: false,
    systemWireless: false,
    systemHybrid: false,
    circuitsInitiating: '',
    circuitsNotification: '',
    circuitsVoicePaging: '',
    manufacturer: '',
    modelNumber: '',
    ulcSerialNumber: '',
    buildingName: '',
    contactPerson: '',
    contactPhone: '',
    contactFax: '',
    address: '',
    ownerPropertyManager: '',
    ownerPhone: '',
    ownerFax: '',
    city: '',
    postalCode: '',
    fireSignalCentre: '',
    fireSignalPhone: '',
    fireSignalFax: '',
  };
}

const FIELD_BINDINGS: Partial<Record<keyof UlcSection1Value, BindingPath>> = {
  dateOfService: 'inspection.inspectedAt',
  buildingName: 'client.name',
  contactPerson: 'client.contactName',
  contactPhone: 'client.phone',
  address: 'client.addressFormatted',
  ownerPropertyManager: 'client.ownerManagerName',
  ownerPhone: 'client.ownerManagerPhone',
  city: 'client.city',
  postalCode: 'client.postCode',
  fireSignalCentre: 'client.signalReceivingCenterName',
  fireSignalPhone: 'client.signalReceivingCenterPhone',
};

export function resolveUlcSection1Field(
  key: keyof UlcSection1Value,
  value: UlcSection1Value,
  context: DocumentContext | null,
): string {
  const stored = value[key];
  if (typeof stored === 'string' && stored.trim()) return stored;
  const binding = FIELD_BINDINGS[key];
  if (binding && context) return resolveBinding(context, binding);
  return typeof stored === 'string' ? stored : '';
}

export function normalizeUlcSection1Value(value: unknown): UlcSection1Value {
  const base = emptyUlcSection1Value();
  if (typeof value !== 'object' || value === null) return base;
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(base) as (keyof UlcSection1Value)[]) {
    const incoming = record[key];
    if (typeof incoming === 'boolean') {
      base[key] = incoming as never;
    } else if (typeof incoming === 'string') {
      base[key] = incoming as never;
    }
  }
  return base;
}
