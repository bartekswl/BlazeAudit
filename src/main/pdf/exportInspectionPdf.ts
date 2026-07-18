import { app } from 'electron';
import fs from 'node:fs/promises';
import { buildPdfInspectionExport } from '../../shared/pdf';
import { clients, inspections, resolveDocumentContext } from '../db';
import { appendExportPayloadToPdf } from './embed';
import { pickPdfSavePath } from './pickPdfSavePath';
import { printMixedOrientationHtmlToPdf } from './printMixedOrientationHtml';
import { renderInspectionHtmlForExport } from './renderInspectionHtmlForExport';

export async function pickInspectionPdfPath(inspectionId: string): Promise<string | null> {
  const inspection = inspections.getInspection(inspectionId);
  if (!inspection) throw new Error(`Inspection not found: ${inspectionId}`);
  const safeName = inspection.title.replace(/[^\w\-]+/g, '-').replace(/-+/g, '-');
  return pickPdfSavePath({
    title: 'Save inspection as PDF',
    defaultFilename: safeName || 'inspection',
  });
}

export async function exportInspectionPdf(
  inspectionId: string,
  prebuiltHtml?: string,
  targetPath?: string,
): Promise<{ saved: false } | { saved: true; filePath: string }> {
  const inspection = inspections.getInspection(inspectionId);
  if (!inspection) throw new Error(`Inspection not found: ${inspectionId}`);

  const filePath =
    targetPath ??
    (await pickInspectionPdfPath(inspectionId));
  if (!filePath) return { saved: false as const };

  const context = resolveDocumentContext(inspection);
  const client = clients.getClient(inspection.clientId);
  const exportPayload = buildPdfInspectionExport(inspection, app.getVersion(), client);
  // Prefer HTML rendered by the renderer from the live document components/CSS
  // (guaranteed to match the on-screen document). Fall back to server-side HTML.
  const html =
    prebuiltHtml ??
    renderInspectionHtmlForExport(inspection, context.client, context, exportPayload);

  const pdf = await printMixedOrientationHtmlToPdf(html);
  const withEmbed = appendExportPayloadToPdf(pdf, exportPayload);
  await fs.writeFile(filePath, withEmbed);
  return { saved: true as const, filePath };
}
