// BlazeAudit PDF round-trip payload (see Phase 6 / TEMPLATES.md §3.3).

import type { Inspection } from './inspection';

export const PDF_EMBED_MARKER = '\n%BLAZEAUDIT_JSON_V1%\n';

export interface PdfInspectionExport {
  kind: 'blazeaudit-inspection';
  schemaVersion: 1;
  inspectionId: string;
  exportedAt: string;
  appVersion: string;
  inspection: Inspection;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function buildPdfInspectionExport(
  inspection: Inspection,
  appVersion: string,
): PdfInspectionExport {
  return {
    kind: 'blazeaudit-inspection',
    schemaVersion: 1,
    inspectionId: inspection.id,
    exportedAt: new Date().toISOString(),
    appVersion,
    inspection: structuredClone(inspection),
  };
}

export function parsePdfInspectionExport(data: unknown): PdfInspectionExport {
  if (!isRecord(data)) {
    throw new Error('Embedded PDF data is not a valid BlazeAudit export.');
  }
  if (data.kind !== 'blazeaudit-inspection') {
    throw new Error('This PDF does not contain a BlazeAudit inspection export.');
  }
  if (data.schemaVersion !== 1) {
    throw new Error(`Unsupported export schema version: ${String(data.schemaVersion)}`);
  }
  if (!isRecord(data.inspection)) {
    throw new Error('Export is missing inspection data.');
  }
  const inspection = data.inspection as unknown as Inspection;
  if (typeof inspection.title !== 'string' || !isRecord(inspection.document)) {
    throw new Error('Export inspection payload is incomplete.');
  }
  return {
    kind: 'blazeaudit-inspection',
    schemaVersion: 1,
    inspectionId: String(data.inspectionId ?? inspection.id),
    exportedAt: String(data.exportedAt ?? ''),
    appVersion: String(data.appVersion ?? ''),
    inspection,
  };
}
