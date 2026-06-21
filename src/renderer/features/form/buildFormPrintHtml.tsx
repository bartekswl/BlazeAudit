import { renderToStaticMarkup } from 'react-dom/server';
import type { DocumentContext } from '../../../shared/document';
import type { BuiltinTemplate, FormDefinition } from '../../../shared/form';
import { FormPageCanvas } from './FormPageCanvas';

/**
 * Print-only CSS appended after the app's live stylesheet. The goal is to keep
 * the EXACT same layout/components/CSS the user edits, and only reshape the page
 * sheet to true Letter size with page breaks. No layout rules here — those come
 * from the bundled app stylesheet so the PDF can never drift from the document.
 */
const PRINT_OVERRIDES = `
  @page { size: letter; margin: 0; }
  html { font-size: 16px; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .form-print-root { display: block; }
  .form-print-root .form-page-sheet {
    width: 8.5in;
    height: 11in;
    min-height: 11in;
    max-height: 11in;
    aspect-ratio: auto;
    border: none;
    border-radius: 0;
    box-shadow: none;
    overflow: hidden;
    break-after: page;
    page-break-after: always;
  }
  .form-print-root .form-page-sheet:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  /* ULC print hardening: force uniform, visible grid lines in Chromium PDF. */
  .form-print-root .ulc-s1-panel {
    --ulc-line: 0.5px solid #64748b !important;
    border: 2pt solid #334155 !important;
    box-shadow: none !important;
  }
  .form-print-root .ulc-s1-company { flex: 0 0 42% !important; }
  .form-print-root .ulc-s1-bottom-row {
    grid-template-columns: 42% minmax(0, 1fr) minmax(0, 1fr) 8.775rem !important;
  }
  .form-print-root .ulc-s1-circuits .ulc-s1-cell {
    grid-template-columns: 42% minmax(0, 1fr) !important;
  }

  .form-print-root .ulc-s1-top,
  .form-print-root .ulc-s1-service-row,
  .form-print-root .ulc-s1-system-block,
  .form-print-root .ulc-s1-bottom-row,
  .form-print-root .ulc-s1-system-row,
  .form-print-root .ulc-s1-circuits .ulc-s1-cell,
  .form-print-root .ulc-s1-phone-fax .ulc-s1-cell,
  .form-print-root .ulc-s1-city-postal > .ulc-s1-cell {
    border-bottom: 0.5px solid #64748b !important;
  }

  .form-print-root .ulc-s1-company,
  .form-print-root .ulc-s1-system-types,
  .form-print-root .ulc-s1-service-row--header .ulc-s1-cell,
  .form-print-root .ulc-s1-system-row .ulc-s1-check,
  .form-print-root .ulc-s1-circuits .ulc-s1-label,
  .form-print-root .ulc-s1-bottom-row .ulc-s1-cell,
  .form-print-root .ulc-s1-city-postal,
  .form-print-root .ulc-s1-city-postal > .ulc-s1-cell {
    border-right: 0.5px solid #64748b !important;
  }

  .form-print-root .ulc-s1-service-row:last-child,
  .form-print-root .ulc-s1-bottom-row:last-child,
  .form-print-root .ulc-s1-circuits .ulc-s1-cell:last-child,
  .form-print-root .ulc-s1-phone-fax .ulc-s1-cell:last-child,
  .form-print-root .ulc-s1-system-row:last-child {
    border-bottom: 0 !important;
  }
  .form-print-root .ulc-s1-service-row--header .ulc-s1-cell:last-child,
  .form-print-root .ulc-s1-system-row .ulc-s1-check:last-child,
  .form-print-root .ulc-s1-city-postal > .ulc-s1-cell:last-child {
    border-right: 0 !important;
  }

  /*
   * Final PDF grid layer.
   *
   * Chromium can still omit borders when only the parent flex/grid item owns a
   * divider. For export, every visible "table cell" paints its own inset grid
   * line. This makes the ULC block behave like a real bordered table in PDF:
   * no missing row/cell dividers, stable column widths, and consistent color.
   */
  .form-print-root .ulc-s1-cell,
  .form-print-root .ulc-s1-label,
  .form-print-root .ulc-s1-value,
  .form-print-root .ulc-s1-check,
  .form-print-root .ulc-s1-circuits-title,
  .form-print-root .ulc-s1-city-postal,
  .form-print-root .ulc-s1-phone-fax,
  .form-print-root .ulc-s1-system-types,
  .form-print-root .ulc-s1-circuits {
    outline: 0.5px solid #64748b !important;
    outline-offset: -0.5px !important;
    box-shadow: none !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .form-print-root .ulc-s1-label,
  .form-print-root .ulc-s1-value,
  .form-print-root .ulc-s1-check,
  .form-print-root .ulc-s1-circuits-title {
    position: relative;
    z-index: 1;
  }

  .form-print-root .ulc-s1-input,
  .form-print-root .ulc-s1-date-field {
    outline: 0.5px solid #64748b !important;
    outline-offset: -0.5px !important;
    box-shadow: none !important;
  }

  /* PDF tweak: stage row — no boxes around Single Stage / Two Stage / Other ticks. */
  .form-print-root .ulc-s1-service-row--stage .ulc-s1-check,
  .form-print-root .ulc-s1-service-row--stage .ulc-s1-value--inline,
  .form-print-root .ulc-s1-service-row--stage .ulc-s1-value {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
  }

  /* PDF tweak: system-type rows — vertical dividers only; thinner line between rows. */
  .form-print-root .ulc-s1-system-row .ulc-s1-check {
    outline: none !important;
    box-shadow: none !important;
    border-top: none !important;
    border-bottom: none !important;
    border-left: none !important;
  }
  .form-print-root .ulc-s1-system-row:first-child {
    border-bottom: 0.25px solid #64748b !important;
  }

  /* PDF tweak: Phone/Fax column — thinner divider from column on the left. */
  .form-print-root .ulc-s1-bottom-row--3col > :nth-child(2) {
    border-right: none !important;
  }
  .form-print-root .ulc-s1-bottom-row .ulc-s1-phone-fax {
    outline: none !important;
    box-shadow: none !important;
    border-left: 0.25px solid #64748b !important;
    border-top: none !important;
    border-bottom: none !important;
    border-right: none !important;
  }

  /* PDF tweak: City/Postal — thinner bottom edge under value content. */
  .form-print-root .ulc-s1-city-postal {
    outline: none !important;
    box-shadow: none !important;
    border-bottom: none !important;
  }
  .form-print-root .ulc-s1-city-postal > .ulc-s1-cell {
    outline: none !important;
    box-shadow: none !important;
    border-bottom: none !important;
  }
  .form-print-root .ulc-s1-city-postal > .ulc-s1-cell .ulc-s1-label {
    outline: none !important;
    box-shadow: none !important;
    border-bottom: 0.25px solid #64748b !important;
  }
  .form-print-root .ulc-s1-city-postal > .ulc-s1-cell .ulc-s1-value {
    outline: none !important;
    box-shadow: none !important;
    border-bottom: 0.25px solid #64748b !important;
  }

  .form-print-root .form-page-content {
    overflow: visible !important;
    gap: 0.75rem !important;
    margin-top: 0.5rem !important;
  }
  .form-print-root .form-page-section {
    max-height: none !important;
    overflow: visible !important;
    flex-shrink: 0 !important;
  }
  .form-print-root .form-page-content > .form-page-section + .form-page-section {
    padding-top: 0 !important;
  }

  /* Yes/No/Summary table — match ULC panel frame + thin row lines in PDF. */
  .form-print-root .yns-table-wrap {
    --yns-line: 0.5px solid #64748b !important;
    border: 2pt solid #334155 !important;
    border-radius: 0.625rem !important;
    box-shadow: none !important;
    margin-top: 0 !important;
  }
  .form-print-root .form-page-section:has(.yns-table-wrap) .form-element-frame--flush {
    margin-top: 0 !important;
    padding-top: 0 !important;
    border-top: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  .form-print-root .yns-th,
  .form-print-root .yns-td {
    border-color: #64748b !important;
  }
  .form-print-root .yns-row:not(:last-child) .yns-td {
    border-bottom: 0.5px solid #64748b !important;
  }
  .form-print-root .yns-th--summary {
    background: linear-gradient(180deg, #f8fafc 0%, #e8eef4 100%) !important;
    color: #334155 !important;
  }

  /* Affirmation block — match panel frame + thin grid lines in PDF. */
  .form-print-root .aff-panel {
    --aff-line: 0.5px solid #64748b !important;
    border: 2pt solid #334155 !important;
    border-radius: 0.625rem !important;
    box-shadow: none !important;
    margin-top: 0 !important;
  }
  .form-print-root .form-page-section:has(.aff-panel) .form-element-frame--flush {
    margin-top: 0 !important;
    padding-top: 0 !important;
    border-top: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  .form-print-root .aff-title,
  .form-print-root .aff-label {
    background: linear-gradient(180deg, #f8fafc 0%, #e8eef4 100%) !important;
    color: #334155 !important;
  }
  .form-print-root .aff-body {
    background: #f1f5f9 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
  }
  .form-print-root .aff-fields .aff-cell {
    min-height: 3.5rem !important;
  }
  .form-print-root .aff-cell,
  .form-print-root .aff-title,
  .form-print-root .aff-body,
  .form-print-root .aff-label {
    border-color: #64748b !important;
  }
  .form-print-root .aff-tech:not(:last-child) {
    border-bottom: 0.5px solid #64748b !important;
  }
`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Collect every stylesheet the live document uses (Tailwind + theme + components). */
async function collectDocumentCss(): Promise<string> {
  const parts: string[] = [];
  const sheets = Array.from(document.styleSheets);

  for (const sheet of sheets) {
    try {
      const rules = sheet.cssRules;
      let text = '';
      for (let i = 0; i < rules.length; i += 1) {
        text += rules[i].cssText + '\n';
      }
      if (text) parts.push(text);
    } catch {
      // Cross-origin / file:// stylesheets block cssRules — fetch the source.
      if (sheet.href) {
        try {
          const res = await fetch(sheet.href);
          parts.push(await res.text());
        } catch {
          /* skip unreadable sheet */
        }
      }
    }
  }

  return parts.join('\n');
}

export interface FormPrintInput {
  form: FormDefinition;
  values: Record<string, unknown>;
  context: DocumentContext | null;
  template?: Pick<BuiltinTemplate, 'code' | 'title' | 'name'>;
  title: string;
}

/**
 * Build a fully self-contained, print-ready HTML document by rendering the SAME
 * React page components used in the editor (read-only) and embedding the SAME
 * CSS the renderer is using. This guarantees the PDF matches the document view.
 */
export async function buildFormPrintHtml({
  form,
  values,
  context,
  template,
  title,
}: FormPrintInput): Promise<string> {
  const pagesMarkup = form.pages
    .map((page, index) =>
      renderToStaticMarkup(
        <FormPageCanvas
          form={form}
          page={page}
          pageIndex={index}
          template={template}
          context={context}
          values={values}
          readOnly
        />,
      ),
    )
    .join('');

  const css = await collectDocumentCss();

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${css}</style>
  <style>${PRINT_OVERRIDES}</style>
</head>
<body>
  <div class="form-print-root">${pagesMarkup}</div>
</body>
</html>`;
}
