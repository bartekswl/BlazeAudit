import type { AddressParts } from './address';

export const BUSINESS_PROFILE_ID = 'default';

/** Max lengths for business profile fields (UI + persistence). */
export const BUSINESS_PROFILE_LIMITS = {
  businessName: 25,
  street: 30,
  unit: 8,
  city: 15,
  province: 4,
  country: 10,
} as const;

export interface BusinessProfile extends AddressParts {
  businessName: string;
  hasLogo: boolean;
  updatedAt: string;
}

export type BusinessProfileInput = Pick<BusinessProfile, 'businessName'> & AddressParts;

export function truncateBusinessProfileInput(input: BusinessProfileInput): BusinessProfileInput {
  const L = BUSINESS_PROFILE_LIMITS;
  return {
    businessName: input.businessName.slice(0, L.businessName),
    street: input.street.slice(0, L.street),
    unit: input.unit.slice(0, L.unit),
    city: input.city.slice(0, L.city),
    postCode: input.postCode,
    province: input.province.slice(0, L.province),
    country: input.country.slice(0, L.country),
  };
}

export interface Inspector {
  id: string;
  name: string;
  licenseNumber: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface InspectorInput {
  name: string;
  licenseNumber: string;
}
