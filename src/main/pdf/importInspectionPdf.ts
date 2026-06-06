import { dialog } from 'electron';
import fs from 'node:fs';
import { inspections } from '../db';
import { extractExportPayloadFromPdf } from './embed';

export async function importInspectionPdf(): Promise<
  { imported: false } | { imported: true; inspectionId: string; filePath: string }
> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Import BlazeAudit PDF',
    properties: ['openFile'],
    filters: [
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'All files', extensions: ['*'] },
    ],
  });

  if (canceled || filePaths.length === 0) return { imported: false as const };

  const filePath = filePaths[0];
  const bytes = fs.readFileSync(filePath);
  const payload = extractExportPayloadFromPdf(bytes);
  const created = inspections.createInspectionFromPdfExport(payload);

  return { imported: true as const, inspectionId: created.id, filePath };
}
