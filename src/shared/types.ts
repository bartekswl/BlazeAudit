// Domain types shared across processes. Pure data — no Node/DOM dependencies.

/** A client/site that inspections are performed for (see DATA_MODEL.md §1). */
export interface Client {
  id: string;
  name: string;
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
  address?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
}
