import type { DocumentContext } from '../../shared/document';
import {
  FORM_FOOTER_HEIGHT_PERCENT,
  pageBodyPercent,
  resolveFormBinding,
  type ChecklistElementValue,
  type FormDefinition,
  type FormElement,
  type FormInspectionDocument,
  type FormPage,
  type SignatureElementValue,
  type TableElementValue,
} from '../../shared/form';
import type { PdfInspectionExport } from '../../shared/pdf';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? escapeHtml(trimmed) : '&nbsp;';
}

function renderElementHtml(
  element: FormElement,
  value: unknown,
  context: DocumentContext,
): string {
  switch (element.kind) {
    case 'text': {
      const text = element.binding
        ? resolveFormBinding(element.binding, context)
        : typeof value === 'string'
          ? value
          : '';
      return `
        <div class="element text">
          ${element.label ? `<div class="element-label">${escapeHtml(element.label)}</div>` : ''}
          <div class="element-value">${dash(text)}</div>
        </div>`;
    }
    case 'table': {
      const tableValue = (value as TableElementValue | undefined) ?? { rows: [] };
      const rows = tableValue.rows.length > 0 ? tableValue.rows : [{}];
      const head = element.columns.map((c) => `<th>${escapeHtml(c.title)}</th>`).join('');
      const body = rows
        .map(
          (row) =>
            `<tr>${element.columns.map((c) => `<td>${dash(row[c.key])}</td>`).join('')}</tr>`,
        )
        .join('');
      return `
        <div class="element table">
          ${element.label ? `<div class="element-label">${escapeHtml(element.label)}</div>` : ''}
          <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
        </div>`;
    }
    case 'checklist': {
      const checklistValue = (value as ChecklistElementValue | undefined) ?? {};
      const options =
        element.columns === 'yesNo'
          ? [
              { id: 'yes', label: 'Yes' },
              { id: 'no', label: 'No' },
            ]
          : [
              { id: 'pass', label: 'Pass' },
              { id: 'fail', label: 'Fail' },
              { id: 'na', label: 'N/A' },
            ];
      const body = element.items
        .map((item) => {
          const cells = options
            .map((opt) => `<td class="check">${checklistValue[item.id] === opt.id ? '●' : '○'}</td>`)
            .join('');
          return `<tr><td>${escapeHtml(item.label)}</td>${cells}</tr>`;
        })
        .join('');
      const head = options.map((o) => `<th>${o.label}</th>`).join('');
      return `
        <div class="element checklist">
          ${element.label ? `<div class="element-label">${escapeHtml(element.label)}</div>` : ''}
          <table><thead><tr><th>Item</th>${head}</tr></thead><tbody>${body}</tbody></table>
        </div>`;
    }
    case 'signature': {
      const sig = (value as SignatureElementValue | undefined) ?? { name: '', date: null };
      return `
        <div class="element signature">
          ${element.label ? `<div class="element-label">${escapeHtml(element.label)}</div>` : ''}
          <div class="sig-grid">
            <span>Name: ${dash(sig.name)}</span>
            <span>Date: ${dash(sig.date ?? undefined)}</span>
          </div>
        </div>`;
    }
    default:
      return '';
  }
}

function renderPageHtml(
  form: FormDefinition,
  page: FormPage,
  pageIndex: number,
  context: DocumentContext,
  values: Record<string, unknown>,
): string {
  const bodyPercent = pageBodyPercent(page);
  const totalPages = form.pages.length;

  const headerInner = page.regions
    .map((region) => {
      if (region.content.kind === 'spacer') {
        return `<div class="region spacer" style="height:${region.heightPercent}%"></div>`;
      }
      const text = resolveFormBinding(region.content.binding, context);
      const align = region.content.align ?? 'left';
      return `<div class="header-line align-${align}">${dash(text)}</div>`;
    })
    .join('');

  const headerHtml = page.regions.length > 0 ? `<div class="page-header">${headerInner}</div>` : '';

  const sections = page.sections
    .map((section) => {
      const elements = section.elements
        .map((el) => renderElementHtml(el, values[el.id], context))
        .join('');
      const height = section.heightPercent ? ` style="min-height:${section.heightPercent}%"` : '';
      return `
        <section class="form-section"${height}>
          <h3 class="section-title">${section.number}${section.title ? `. ${escapeHtml(section.title)}` : ''}</h3>
          ${elements}
        </section>`;
    })
    .join('');

  return `
    <section class="form-page">
      <div class="page-body" style="min-height:${bodyPercent}%">
        ${headerHtml}
        <div class="page-sections">${sections}</div>
      </div>
      <footer class="page-footer" style="min-height:${FORM_FOOTER_HEIGHT_PERCENT}%">
        <div class="page-count">Page ${pageIndex + 1} of ${totalPages}</div>
        <div class="disclaimer">${escapeHtml(form.disclaimer)}</div>
      </footer>
    </section>`;
}

export function renderFormHtml(
  formDoc: FormInspectionDocument,
  context: DocumentContext,
  exportPayload: PdfInspectionExport,
  title: string,
): string {
  const embedJson = JSON.stringify(exportPayload).replace(/</g, '\\u003c');
  const pages = formDoc.form.pages
    .map((page, index) => renderPageHtml(formDoc.form, page, index, context, formDoc.values))
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: letter; margin: 0; }
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", Arial, sans-serif; font-size: 10pt; color: #171717; margin: 0; background: #fff; }
    .form-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #fff;
    }
    .form-page:last-child { page-break-after: auto; }
    .page-body {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: ${100 - FORM_FOOTER_HEIGHT_PERCENT}%;
      padding: 9pt 12pt 0;
    }
    .page-header {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 1.5pt;
      flex-shrink: 0;
    }
    .header-line {
      font-size: 11.5pt;
      font-weight: 600;
      line-height: 1.25;
      color: #171717;
    }
    .header-line.align-center { text-align: center; }
    .header-line.align-right { text-align: right; }
    .page-sections {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 9pt;
      margin-top: 12pt;
    }
    .form-section {
      display: flex;
      flex-direction: column;
      gap: 9pt;
      padding: 0;
      margin: 0;
    }
    .section-title {
      margin: 0;
      font-size: 12.5pt;
      font-weight: 700;
      color: #171717;
      text-align: center;
    }
    .element {
      border: 1px solid #e5e5e5;
      border-radius: 4pt;
      padding: 5pt;
      background: #fff;
      color: #171717;
    }
    .element-label {
      font-size: 9pt;
      font-weight: 500;
      color: #525252;
      margin-bottom: 3pt;
    }
    .element-value {
      border: 1px solid #d4d4d4;
      border-radius: 3pt;
      padding: 4pt 6pt;
      min-height: 1.4em;
      background: #fff;
      color: #171717;
    }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; color: #171717; }
    th, td { border: 1px solid #e5e5e5; padding: 3pt 5pt; vertical-align: top; }
    th {
      background: linear-gradient(180deg, #f5f5f5 0%, #ebebeb 100%);
      font-weight: 600;
      color: #262626;
    }
    .check { text-align: center; width: 36pt; }
    .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9pt; font-size: 9pt; }
    .page-footer {
      display: flex;
      flex-direction: column;
      justify-content: center;
      flex-shrink: 0;
      min-height: ${FORM_FOOTER_HEIGHT_PERCENT}%;
      border-top: 1px solid #e5e5e5;
      padding: 3pt 12pt 5pt;
      margin-top: auto;
    }
    .page-count {
      font-size: 8.25pt;
      font-weight: 600;
      color: #171717;
      text-align: right;
      padding-bottom: 1.5pt;
    }
    .disclaimer {
      font-size: 7.5pt;
      color: #737373;
      line-height: 1.4;
      text-align: center;
    }
    .embed { display: none; }
  </style>
</head>
<body>
  ${pages}
  <script type="application/json" id="blazeaudit-document" class="embed">${embedJson}</script>
</body>
</html>`;
}
