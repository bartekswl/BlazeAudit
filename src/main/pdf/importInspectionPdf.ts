import { dialog } from 'electron';
import fs from 'node:fs';
import { clients, inspections } from '../db';
import { extractExportPayloadFromPdf } from './embed';
import type { PdfInspectionExport } from '../../shared/pdf';

export type InspectionPdfImportPreview =
  | { canceled: true }
  | {
      canceled: false;
      filePath: string;
      needsNewClient: boolean;
      clientName: string;
      clientId: string;
      documentTitle: string;
      hasClientSnapshot: boolean;
    };

function previewFromPayload(
  filePath: string,
  payload: PdfInspectionExport,
): Exclude<InspectionPdfImportPreview, { canceled: true }> {
  const src = payload.inspection;
  const existing = clients.getClient(src.clientId);
  const clientName =
    payload.client?.name?.trim() || src.clientName?.trim() || 'Unknown client';
  return {
    canceled: false,
    filePath,
    needsNewClient: !existing,
    clientName,
    clientId: src.clientId,
    documentTitle: src.title?.trim() || 'Imported inspection',
    hasClientSnapshot: Boolean(payload.client?.id),
  };
}

/** Pick a BlazeAudit PDF and describe whether a new client would be created. */
export async function inspectInspectionPdfImport(): Promise<InspectionPdfImportPreview> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Import BlazeAudit PDF',
    properties: ['openFile'],
    filters: [
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'All files', extensions: ['*'] },
    ],
  });

  if (canceled || filePaths.length === 0) return { canceled: true as const };

  const filePath = filePaths[0];
  const bytes = fs.readFileSync(filePath);
  const payload = extractExportPayloadFromPdf(bytes);
  return previewFromPayload(filePath, payload);
}

/** Commit a previously inspected PDF into the DB (creates client when snapshot present). */
export async function confirmInspectionPdfImport(
  filePath: string,
): Promise<{ imported: false } | { imported: true; inspectionId: string; filePath: string }> {
  const bytes = fs.readFileSync(filePath);
  const payload = extractExportPayloadFromPdf(bytes);
  const preview = previewFromPayload(filePath, payload);
  if (preview.needsNewClient && !preview.hasClientSnapshot) {
    throw new Error(
      `Client "${preview.clientName}" is not in this database and this PDF has no client snapshot. Create the client first, or re-export from a newer BlazeAudit.`,
    );
  }
  const created = inspections.createInspectionFromPdfExport(payload);
  return { imported: true as const, inspectionId: created.id, filePath };
}

/** Legacy one-shot import (Database screen): pick file and import immediately. */
export async function importInspectionPdf(): Promise<
  { imported: false } | { imported: true; inspectionId: string; filePath: string }
> {
  const preview = await inspectInspectionPdfImport();
  if (preview.canceled) return { imported: false as const };
  return confirmInspectionPdfImport(preview.filePath);
}
