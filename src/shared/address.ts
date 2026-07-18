// Address formatting + basic validation shared across main and renderer.

export interface AddressParts {
  street: string;
  unit: string;
  city: string;
  postCode: string;
  country: string;
  province: string;
}

/** Build a single-line address including country (storage / exports). */
export function formatAddress(parts: AddressParts): string {
  const list = formatAddressForList(parts);
  return [list, parts.country].filter(Boolean).join(', ');
}

/** List/table display — omits country (country is editor-only). */
export function formatAddressForList(parts: AddressParts): string {
  const line1 = [parts.street, parts.unit].filter(Boolean).join(', ');
  const locality = [parts.city, parts.province, parts.postCode].filter(Boolean).join(', ');
  return [line1, locality].filter(Boolean).join(', ');
}

/** Compact customers-table address: street + city only. */
export function formatStreetCity(parts: Pick<AddressParts, 'street' | 'city'>): string {
  return [parts.street?.trim(), parts.city?.trim()].filter(Boolean).join(', ');
}

const CA_POSTAL = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
const US_ZIP = /^\d{5}(-\d{4})?$/;
const GENERIC_POSTAL = /^[A-Za-z0-9 -]{3,10}$/;

export function validatePostCode(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (CA_POSTAL.test(v) || US_ZIP.test(v) || GENERIC_POSTAL.test(v)) return null;
  return 'Post code looks invalid (e.g. A1A 1A1 or 12345).';
}

export function validateCountry(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (!/^[A-Za-z][A-Za-z .'-]{1,55}$/.test(v)) {
    return 'Country should be letters only (e.g. Canada).';
  }
  return null;
}

export function validateProvince(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^[A-Za-z]{2}$/.test(v)) return null;
  if (/^[A-Za-z][A-Za-z .'-]{0,31}$/.test(v)) return null;
  return 'Province should be letters (e.g. ON or Ontario).';
}

/** Optional email — basic format check when non-empty. */
export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (v.length > 254) return 'Email is too long.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return 'Enter a valid email address.';
  }
  return null;
}

/** Optional phone — digits plus common formatting characters; 10–15 digits when stripped. */
export function validatePhone(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (!/^[+]?[\d\s().-]+$/.test(v)) {
    return 'Phone may only include digits, spaces, and ()-.';
  }
  const digits = v.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return 'Phone should be 10–15 digits (e.g. 416-555-0100).';
  }
  return null;
}

export function validateAddressFields(parts: AddressParts): string | null {
  return (
    validatePostCode(parts.postCode) ??
    validateCountry(parts.country) ??
    validateProvince(parts.province)
  );
}

export function normalizeAddressParts(input: Partial<AddressParts>): AddressParts {
  return {
    street: input.street?.trim() ?? '',
    unit: input.unit?.trim() ?? '',
    city: input.city?.trim() ?? '',
    postCode: input.postCode?.trim() ?? '',
    country: input.country?.trim() ?? '',
    province: input.province?.trim() ?? '',
  };
}
