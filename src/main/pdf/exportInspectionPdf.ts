import { app, dialog } from 'electron';
import fs from 'node:fs';
import { buildPdfInspectionExport } from '../../shared/pdf';
import { inspections, resolveDocumentContext } from '../db';
import { appendExportPayloadToPdf } from './embed';
import { printMixedOrientationHtmlToPdf } from './printMixedOrientationHtml';
import { renderInspectionHtmlForExport } from './renderInspectionHtmlForExport';

export async function exportInspectionPdf(
  inspectionId: string,
  prebuiltHtml?: string,
): Promise<{ saved: false } | { saved: true; filePath: string }> {
  const inspection = inspections.getInspection(inspectionId);
  if (!inspection) throw new Error(`Inspection not found: ${inspectionId}`);

  const context = resolveDocumentContext(inspection);
  const exportPayload = buildPdfInspectionExport(inspection, app.getVersion());
  // Prefer HTML rendered by the renderer from the live document components/CSS
  // (guaranteed to match the on-screen document). Fall back to server-side HTML.
  const html =
    prebuiltHtml ??
    renderInspectionHtmlForExport(inspection, context.client, context, exportPayload);

  const pdf = await printMixedOrientationHtmlToPdf(html);

  const safeName = inspection.title.replace(/[^\w\-]+/g, '-').replace(/-+/g, '-');
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save inspection as PDF',
    defaultPath: `${safeName || 'inspection'}.pdf`,
    filters: [
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'All files', extensions: ['*'] },
    ],
  });

  if (canceled || !filePath) return { saved: false as const };

  const withEmbed = appendExportPayloadToPdf(pdf, exportPayload);
  fs.writeFileSync(filePath, withEmbed);
  return { saved: true as const, filePath };
}
