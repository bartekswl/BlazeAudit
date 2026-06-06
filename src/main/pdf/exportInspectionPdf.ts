import { app, BrowserWindow, dialog } from 'electron';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildPdfInspectionExport } from '../../shared/pdf';
import { clients, inspections } from '../db';
import { appendExportPayloadToPdf } from './embed';
import { renderInspectionHtml } from './renderInspectionHtml';

export async function exportInspectionPdf(
  inspectionId: string,
): Promise<{ saved: false } | { saved: true; filePath: string }> {
  const inspection = inspections.getInspection(inspectionId);
  if (!inspection) throw new Error(`Inspection not found: ${inspectionId}`);

  const client = clients.getClient(inspection.clientId);
  const exportPayload = buildPdfInspectionExport(inspection, app.getVersion());
  const html = renderInspectionHtml(inspection, client, exportPayload);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blazeaudit-pdf-'));
  const htmlPath = path.join(tmpDir, 'report.html');
  fs.writeFileSync(htmlPath, html, 'utf8');

  const win = new BrowserWindow({
    show: false,
    width: 794,
    height: 1123,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  try {
    await win.loadFile(htmlPath);
    await new Promise((resolve) => setTimeout(resolve, 250));

    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { marginType: 'default' },
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
