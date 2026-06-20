import { resolveBinding, type DocumentContext } from '../../shared/document';
import {
  FORM_FOOTER_HEIGHT_PERCENT,
  pageBodyPercent,
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
        ? resolveBinding(context, element.binding)
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
  const headerHeightPercent = page.regions.reduce((sum, region) => sum + region.heightPercent, 0);

  const headerInner = page.regions
    .map((region) => {
      if (region.content.kind === 'spacer') {
        return `<div class="region spacer" style="height:${region.heightPercent}%"></div>`;
      }
      const text = resolveBinding(context, region.content.binding);
      const align = region.content.align ?? 'left';
      return `<div class="header-line align-${align}">${dash(text)}</div>`;
    })
    .join('');

  const headerHtml =
    page.regions.length > 0
      ? `<div class="page-header" style="min-height:${headerHeightPercent}%">${headerInner}</div>`
      : '';

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
    @page { size: letter; margin: 12mm 10mm; }
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", Arial, sans-serif; font-size: 10pt; color: #000; margin: 0; }
    .form-page { page-break-after: always; display: flex; flex-direction: column; min-height: 100vh; }
    .form-page:last-child { page-break-after: auto; }
    .page-body { display: flex; flex-direction: column; flex: 1; }
    .page-header {
      display: flex; flex-direction: column; justify-content: flex-start; gap: 2px;
      flex-shrink: 0;
    }
    .header-line { font-weight: 700; line-height: 1.25; padding: 1px 4px; color: #000; }
    .header-line.align-center { text-align: center; }
    .header-line.align-right { text-align: right; }
    .page-sections { flex: 1; display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
    .form-section { padding: 0; margin-bottom: 4px; }
    .section-title { margin: 0 0 6px; font-size: 11pt; color: #000; text-align: center; }
    .element {
      margin-bottom: 8px; border: 1px solid #ccc; padding: 8px; background: #fff; color: #000;
    }
    .element-label { font-size: 8pt; font-weight: 700; text-transform: uppercase; color: #333; margin-bottom: 4px; }
    .element-value { border: 1px solid #ddd; padding: 6px 8px; min-height: 1.4em; color: #000; }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; color: #000; }
    th, td { border: 1px solid #ccc; padding: 4px 6px; vertical-align: top; color: #000; }
    th { background: #f0f0f0; font-weight: 700; }
    .check { text-align: center; width: 40px; }
    .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 9pt; color: #000; }
    .page-footer {
      display: flex; flex-direction: column; justify-content: center;
      border-top: 1px solid #ccc; padding: 4px 0 6px; margin-top: auto;
    }
    .page-count { font-size: 9pt; font-weight: 600; color: #000; text-align: right; padding: 0 4px 2px; }
    .disclaimer { font-size: 7.5pt; color: #666; line-height: 1.35; text-align: center; padding: 0 8px; }
    .embed { display: none; }
  </style>
</head>
<body>
  ${pages}
  <script type="application/json" id="blazeaudit-document" class="embed">${embedJson}</script>
</body>
</html>`;
}
