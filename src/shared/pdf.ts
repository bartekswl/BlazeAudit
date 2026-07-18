// BlazeAudit PDF round-trip payload (see Phase 6 / TEMPLATES.md §3.3).

import type { Inspection } from './inspection';
import type { Client } from './types';

export const PDF_EMBED_MARKER = '\n%BLAZEAUDIT_JSON_V1%\n';

/**
 * Export envelope versions:
 * - 1: inspection only (legacy)
 * - 2: inspection + optional client snapshot for auto-create on import
 *
 * This is NOT the SQLite `user_version` and NOT the form document schemaVersion.
 */
export type PdfExportSchemaVersion = 1 | 2;

export interface PdfInspectionExport {
  kind: 'blazeaudit-inspection';
  schemaVersion: PdfExportSchemaVersion;
  inspectionId: string;
  exportedAt: string;
  appVersion: string;
  inspection: Inspection;
  /** Present from schemaVersion 2 — used to create the client if missing on import. */
  client?: Client;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function buildPdfInspectionExport(
  inspection: Inspection,
  appVersion: string,
  client?: Client | null,
): PdfInspectionExport {
  return {
    kind: 'blazeaudit-inspection',
    schemaVersion: 2,
    inspectionId: inspection.id,
    exportedAt: new Date().toISOString(),
    appVersion,
    inspection: structuredClone(inspection),
    client: client ? structuredClone(client) : undefined,
  };
}

export function parsePdfInspectionExport(data: unknown): PdfInspectionExport {
  if (!isRecord(data)) {
    throw new Error('Embedded PDF data is not a valid BlazeAudit export.');
  }
  if (data.kind !== 'blazeaudit-inspection') {
    throw new Error('This PDF does not contain a BlazeAudit inspection export.');
  }
  const schemaVersion = data.schemaVersion;
  if (schemaVersion !== 1 && schemaVersion !== 2) {
    throw new Error(`Unsupported export schema version: ${String(schemaVersion)}`);
  }
  if (!isRecord(data.inspection)) {
    throw new Error('Export is missing inspection data.');
  }
  const inspection = data.inspection as unknown as Inspection;
  if (typeof inspection.title !== 'string' || !isRecord(inspection.document)) {
    throw new Error('Export inspection payload is incomplete.');
  }

  let client: Client | undefined;
  if (schemaVersion === 2 && isRecord(data.client) && typeof data.client.id === 'string') {
    client = data.client as unknown as Client;
  }

  return {
    kind: 'blazeaudit-inspection',
    schemaVersion,
    inspectionId: String(data.inspectionId ?? inspection.id),
    exportedAt: String(data.exportedAt ?? ''),
    appVersion: String(data.appVersion ?? ''),
    inspection,
    client,
  };
}
