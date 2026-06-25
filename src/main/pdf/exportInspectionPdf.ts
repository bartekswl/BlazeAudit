import { app, BrowserWindow, dialog } from 'electron';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildPdfInspectionExport } from '../../shared/pdf';
import { inspections, resolveDocumentContext } from '../db';
import { appendExportPayloadToPdf } from './embed';
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

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blazeaudit-pdf-'));
  const htmlPath = path.join(tmpDir, 'report.html');
  fs.writeFileSync(htmlPath, html, 'utf8');

  const win = new BrowserWindow({
    show: false,
    width: 816,
    height: 1056,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  try {
    await win.loadFile(htmlPath);
    await win.webContents.executeJavaScript(`
      (async () => {
        if (document.fonts?.ready) await document.fonts.ready;
        await Promise.all(Array.from(document.images).map((img) =>
          img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; })
        ));
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      })()
    `);

    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      pageSize: 'A4',
      margins: { marginType: 'none' },
    });

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

    const withEmbed = appendExportPayloadToPdf(Buffer.from(pdf), exportPayload);
    fs.writeFileSync(filePath, withEmbed);
    return { saved: true as const, filePath };
  } finally {
    win.destroy();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
