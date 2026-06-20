import { isFormInspectionDocument } from '../../shared/form';
import type { Inspection } from '../../shared/inspection';
import type { Client } from '../../shared/types';
import type { DocumentContext } from '../../shared/document';
import type { PdfInspectionExport } from '../../shared/pdf';
import { renderFormHtml } from './renderFormHtml';
import { renderInspectionHtml } from './renderInspectionHtml';

export function renderInspectionHtmlForExport(
  inspection: Inspection,
  client: Client | null,
  context: DocumentContext,
  exportPayload: PdfInspectionExport,
): string {
  if (isFormInspectionDocument(inspection.document)) {
    return renderFormHtml(inspection.document, context, exportPayload, inspection.title);
  }
  return renderInspectionHtml(inspection, client, exportPayload);
}
