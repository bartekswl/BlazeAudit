// Canonical data available when rendering or exporting a document.
// Values are resolved at view/PDF time from live records — not copied into block JSON.
//
// See docs/BUILTIN_TEMPLATE_BUILD.md for how bindings are used when authoring templates.

import type { AddressParts } from '../address';
import type { Cadence } from '../cadence';
import type { InspectionStatus } from '../inspection';
import type { BusinessProfile, Inspector } from '../profile';
import type { Client } from '../types';

/** Short standard/form id and formal report title for built-in templates. */
export interface BuiltinTemplateMeta {
  /** Reference code shown in margins, footers, cross-refs (not required to be unique). */
  code: string;
  /** Formal document title for cover and main headings. */
  title: string;
}

/** Template-side fields exposed through bindings (metadata only — document body is a snapshot). */
export interface TemplateContextSlice {
  kind: 'builtin' | 'custom';
  name: string;
  description: string;
  /** Built-in only — empty strings for custom until we choose to support them. */
  code: string;
  title: string;
  inspectionType: string;
}

export interface ClientContextSlice extends Client {
  addressFormatted: string;
  addressLine1: string;
  addressLocality: string;
}

export interface InspectionContextSlice {
  title: string;
  status: InspectionStatus;
  inspector: string;
  inspectedAt: string | null;
  cadence: Cadence;
  nextDueAt: string | null;
}

export interface BusinessContextSlice extends BusinessProfile {
  addressFormatted: string;
  addressLine1: string;
  addressLocality: string;
  /** Populated when logo is available at render time. */
  logoDataUrl: string | null;
}

export interface InspectorContextSlice {
  name: string;
  licenseNumber: string;
}

/**
 * Merged view of all sources for binding resolution.
 * `resolveDocumentContext()` (main process, not wired yet) will build this from DB rows.
 */
export interface DocumentContext {
  template: TemplateContextSlice | null;
  client: ClientContextSlice;
  inspection: InspectionContextSlice;
  business: BusinessContextSlice;
  /** Null when inspection.inspector is a free-text name with no linked inspector row. */
  inspector: InspectorContextSlice | null;
}

/** Dot-path into {@link DocumentContext}. Used by blocks and PDF layout regions. */
export type BindingPath =
  // Template (from linked template metadata — not live document body)
  | 'template.name'
  | 'template.description'
  | 'template.code'
  | 'template.title'
  | 'template.inspectionType'
  // Client
  | 'client.name'
  | 'client.address'
  | 'client.addressFormatted'
  | 'client.addressLine1'
  | 'client.addressLocality'
  | 'client.street'
  | 'client.unit'
  | 'client.city'
  | 'client.postCode'
  | 'client.country'
  | 'client.province'
  | 'client.contactName'
  | 'client.phone'
  | 'client.email'
  | 'client.ownerManagerName'
  | 'client.ownerManagerPhone'
  | 'client.signalReceivingCenterName'
  | 'client.signalReceivingCenterPhone'
  | 'client.notes'
  // Inspection row
  | 'inspection.title'
  | 'inspection.status'
  | 'inspection.inspector'
  | 'inspection.inspectedAt'
  | 'inspection.cadence'
  | 'inspection.nextDueAt'
  // Business profile
  | 'business.businessName'
  | 'business.phone'
  | 'business.email'
  | 'business.addressFormatted'
  | 'business.addressLine1'
  | 'business.addressLocality'
  | 'business.street'
  | 'business.unit'
  | 'business.city'
  | 'business.postCode'
  | 'business.country'
  | 'business.province'
  // Inspector (linked record, or derived from inspection.inspector string)
  | 'inspector.name'
  | 'inspector.licenseNumber';

/** Block or layout region that displays a resolved binding instead of stored value. */
export interface BindingRef {
  path: BindingPath;
  /** Shown when the resolved value is empty. */
  fallback?: string;
}

export const BINDING_PATH_LABELS: Record<BindingPath, string> = {
  'template.name': 'Template name',
  'template.description': 'Template description',
  'template.code': 'Template code',
  'template.title': 'Template title',
  'template.inspectionType': 'Inspection type',
  'client.name': 'Building name',
  'client.address': 'Client address (legacy line)',
  'client.addressFormatted': 'Client address (full)',
  'client.addressLine1': 'Client street line',
  'client.addressLocality': 'Client city / province / post code',
  'client.street': 'Client street',
  'client.unit': 'Client unit',
  'client.city': 'Client city',
  'client.postCode': 'Client post code',
  'client.country': 'Client country',
  'client.province': 'Client province',
  'client.contactName': 'Contact person',
  'client.phone': 'Contact phone',
  'client.email': 'Client email',
  'client.ownerManagerName': 'Owner / manager',
  'client.ownerManagerPhone': 'Owner / manager phone',
  'client.signalReceivingCenterName': 'Signal receiving center',
  'client.signalReceivingCenterPhone': 'Signal receiving center phone',
  'client.notes': 'Client notes',
  'inspection.title': 'Document title',
  'inspection.status': 'Document status',
  'inspection.inspector': 'Inspector name',
  'inspection.inspectedAt': 'Inspection date',
  'inspection.cadence': 'Cadence',
  'inspection.nextDueAt': 'Next due date',
  'business.businessName': 'Company name',
  'business.phone': 'Company phone',
  'business.email': 'Company email',
  'business.addressFormatted': 'Company address (full)',
  'business.addressLine1': 'Company street line',
  'business.addressLocality': 'Company city / province / post code',
  'business.street': 'Company street',
  'business.unit': 'Company unit',
  'business.city': 'Company city',
  'business.postCode': 'Company post code',
  'business.country': 'Company country',
  'business.province': 'Company province',
  'inspector.name': 'Inspector name',
  'inspector.licenseNumber': 'Inspector license number',
};

/** Resolve a binding path against a context object. Pure — safe for renderer tests. */
export function resolveBinding(context: DocumentContext, path: BindingPath): string {
  const parts = path.split('.');
  const root = parts[0] as keyof DocumentContext;
  const slice = context[root];
  if (slice == null) return '';

  let value: unknown = slice;
  for (let i = 1; i < parts.length; i++) {
    if (value == null || typeof value !== 'object') return '';
    value = (value as Record<string, unknown>)[parts[i]!];
  }

  if (value == null) return '';
  return String(value);
}

/** Address helpers used when building {@link ClientContextSlice} / {@link BusinessContextSlice}. */
export function addressContextExtras(parts: AddressParts): Pick<
  ClientContextSlice,
  'addressFormatted' | 'addressLine1' | 'addressLocality'
> {
  const line1 = [parts.street, parts.unit].filter(Boolean).join(', ');
  const locality = [parts.city, parts.province, parts.postCode].filter(Boolean).join(', ');
  const addressFormatted = [line1, locality, parts.country].filter(Boolean).join(', ');
  return { addressFormatted, addressLine1: line1, addressLocality: locality };
}

/** Placeholder inspector slice when only a name string is known. */
export function inspectorSliceFromName(name: string): InspectorContextSlice {
  return { name, licenseNumber: '' };
}

export function inspectorSliceFromRecord(row: Inspector): InspectorContextSlice {
  return { name: row.name, licenseNumber: row.licenseNumber };
}
