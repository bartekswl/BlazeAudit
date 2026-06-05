// Domain types shared across processes. Pure data — no Node/DOM dependencies.

import type { AddressParts } from './address';

/** A client/site that inspections are performed for (see DATA_MODEL.md §1). */
export interface Client extends AddressParts {
  id: string;
  name: string;
  /** Formatted single-line address for list display. */
  address: string;
  contactName: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** Fields a user supplies when creating or editing a client. */
export interface ClientInput {
  name: string;
  street?: string;
  unit?: string;
  city?: string;
  postCode?: string;
  country?: string;
  province?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
}
