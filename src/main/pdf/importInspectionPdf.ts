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
      documentAlreadyExists: boolean;
      existingInspectionId: string | null;
    };

function exportInspectionId(payload: PdfInspectionExport): string {
  const fromEnvelope = payload.inspectionId?.trim();
  if (fromEnvelope) return fromEnvelope;
  const fromRow = payload.inspection?.id?.trim();
  return fromRow || '';
}

function previewFromPayload(
  filePath: string,
  payload: PdfInspectionExport,
): Exclude<InspectionPdfImportPreview, { canceled: true }> {
  const src = payload.inspection;
  const preferredId = exportInspectionId(payload);
  const existingInspection = preferredId ? inspections.getInspection(preferredId) : null;
  const existingClient = clients.getClient(src.clientId);
  const clientName =
    existingInspection?.clientName?.trim() ||
    payload.client?.name?.trim() ||
    src.clientName?.trim() ||
    'Unknown client';
  const documentTitle =
    existingInspection?.title?.trim() || src.title?.trim() || 'Imported inspection';
  return {
    canceled: false,
    filePath,
    needsNewClient: !existingClient,
    clientName,
    clientId: src.clientId,
    documentTitle,
    hasClientSnapshot: Boolean(payload.client?.id),
    documentAlreadyExists: Boolean(existingInspection),
    existingInspectionId: existingInspection?.id ?? null,
  };
}

/** Pick a BlazeAudit PDF and describe client / duplicate status before commit. */
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

export type ConfirmInspectionPdfImportOptions = {
  /** When the export id already exists, overwrite that inspection with the PDF contents. */
  replaceExisting?: boolean;
};

/** Commit a previously inspected PDF into the DB (creates client when snapshot present). */
export async function confirmInspectionPdfImport(
  filePath: string,
  options: ConfirmInspectionPdfImportOptions = {},
): Promise<{ imported: false } | { imported: true; inspectionId: string; filePath: string }> {
  const bytes = fs.readFileSync(filePath);
  const payload = extractExportPayloadFromPdf(bytes);
  const preview = previewFromPayload(filePath, payload);
  if (preview.needsNewClient && !preview.hasClientSnapshot) {
    throw new Error(
      `Client "${preview.clientName}" is not in this database and this PDF has no client snapshot. Create the client first, or re-export from a newer BlazeAudit.`,
    );
  }
  if (preview.documentAlreadyExists && !options.replaceExisting) {
    throw new Error(
      `Document "${preview.documentTitle}" already exists for ${preview.clientName}. Choose Replace to keep only the uploaded version.`,
    );
  }
  const created = inspections.createInspectionFromPdfExport(payload, {
    replaceExisting: Boolean(options.replaceExisting),
  });
  return { imported: true as const, inspectionId: created.id, filePath };
}
