import type { AddressParts } from './address';

export const BUSINESS_PROFILE_ID = 'default';

export interface BusinessProfile extends AddressParts {
  businessName: string;
  hasLogo: boolean;
  updatedAt: string;
}

export type BusinessProfileInput = Pick<BusinessProfile, 'businessName'> & AddressParts;

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
