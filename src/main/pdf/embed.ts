import { PDF_EMBED_MARKER, parsePdfInspectionExport, type PdfInspectionExport } from '../../shared/pdf';

export function appendExportPayloadToPdf(pdf: Buffer, payload: PdfInspectionExport): Buffer {
  const json = Buffer.from(JSON.stringify(payload), 'utf8');
  const encoded = json.toString('base64');
  return Buffer.concat([pdf, Buffer.from(PDF_EMBED_MARKER, 'utf8'), Buffer.from(encoded, 'utf8')]);
}

export function extractExportPayloadFromPdf(file: Buffer): PdfInspectionExport {
  const marker = Buffer.from(PDF_EMBED_MARKER, 'utf8');
  const idx = file.lastIndexOf(marker);
  if (idx === -1) {
    throw new Error(
      'No BlazeAudit data found in this PDF. Only PDFs exported by BlazeAudit can be re-imported.',
    );
  }

  const encoded = file.subarray(idx + marker.length).toString('utf8').trim();
  if (!encoded) {
    throw new Error('BlazeAudit export marker found but payload is empty.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  } catch {
    throw new Error('BlazeAudit export payload is corrupted or unreadable.');
  }

  return parsePdfInspectionExport(parsed);
}
