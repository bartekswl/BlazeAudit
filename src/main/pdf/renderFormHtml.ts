import type { DocumentContext } from '../../shared/document';
import {
  FORM_FOOTER_HEIGHT_PERCENT,
  formSectionHeading,
  pageBodyPercent,
  resolveFormBinding,
  resolveFormPageMetaHeader,
  type ChecklistElementValue,
  type FormDefinition,
  type FormElement,
  type FormInspectionDocument,
  type FormPage,
  type SignatureElementValue,
  type TableElementValue,
} from '../../shared/form';
import { loadFormPrintCss } from './loadFormPrintCss';
import type { PdfInspectionExport } from '../../shared/pdf';
import { renderAffirmationHtml } from '../../shared/form/affirmationHtml';
import { renderAttendanceLogHtml } from '../../shared/form/attendanceLogHtml';
import { renderControlUnitTestHtml } from '../../shared/form/controlUnitTestHtml';
import { renderControlUnitRecordHtml } from '../../shared/form/controlUnitRecordHtml';
import { renderDocumentationHtml } from '../../shared/form/documentationHtml';
import { renderRecommendationsHtml, renderTestingNotesHtml } from '../../shared/form/linedNotesHtml';
import { renderUlcSection1Html } from '../../shared/form/ulcSection1Html';
import { renderYesNoSummaryHtml } from '../../shared/form/yesNoSummaryHtml';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fieldValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? escapeHtml(trimmed) : '—';
}

function headerValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? escapeHtml(trimmed) : '';
}

function framed(inner: string, flush = false): string {
  const cls = flush
    ? 'form-element-frame form-element-frame--flush'
    : 'form-element-frame';
  return `<div class="${cls}">${inner}</div>`;
}

function renderElementHtml(
  element: FormElement,
  value: unknown,
  context: DocumentContext,
  totalPages: number,
): string {
  switch (element.kind) {
    case 'text': {
      const text = element.binding
        ? resolveFormBinding(element.binding, context)
        : typeof value === 'string'
          ? value
          : '';
      return framed(`
        <div class="form-pdf-text">
          ${element.label ? `<p class="form-pdf-label">${escapeHtml(element.label)}</p>` : ''}
          <p class="form-pdf-value">${fieldValue(text)}</p>
        </div>`);
    }
    case 'table': {
      const tableValue = (value as TableElementValue | undefined) ?? { rows: [] };
      const rows = tableValue.rows.length > 0 ? tableValue.rows : [{}];
      const head = element.columns.map((c) => `<th>${escapeHtml(c.title)}</th>`).join('');
      const body = rows
        .map(
          (row) =>
            `<tr>${element.columns.map((c) => `<td>${fieldValue(row[c.key])}</td>`).join('')}</tr>`,
        )
        .join('');
      return framed(`
        <div class="form-pdf-text">
          ${element.label ? `<p class="form-pdf-label">${escapeHtml(element.label)}</p>` : ''}
          <table class="form-pdf-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
        </div>`);
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
            .map(
              (opt) =>
                `<td class="check">${checklistValue[item.id] === opt.id ? '●' : '○'}</td>`,
            )
            .join('');
          return `<tr><td>${escapeHtml(item.label)}</td>${cells}</tr>`;
        })
        .join('');
      const head = options.map((o) => `<th>${o.label}</th>`).join('');
      return framed(`
        <div class="form-pdf-text">
          ${element.label ? `<p class="form-pdf-label">${escapeHtml(element.label)}</p>` : ''}
          <table class="form-pdf-table"><thead><tr><th>Item</th>${head}</tr></thead><tbody>${body}</tbody></table>
        </div>`);
    }
    case 'signature': {
      const sig = (value as SignatureElementValue | undefined) ?? { name: '', date: null };
      return framed(`
        <div class="form-pdf-text">
          ${element.label ? `<p class="form-pdf-label">${escapeHtml(element.label)}</p>` : ''}
          <div class="form-pdf-sig-grid">
            <div><span class="form-pdf-label">Name</span><p class="form-pdf-value">${fieldValue(sig.name)}</p></div>
            <div><span class="form-pdf-label">Date</span><p class="form-pdf-value">${fieldValue(sig.date ?? undefined)}</p></div>
          </div>
        </div>`);
    }
    case 'ulcSection1':
      return framed(renderUlcSection1Html(value, context), true);
    case 'yesNoSummary':
      return framed(renderYesNoSummaryHtml(element.items, value), true);
    case 'affirmation':
      return framed(
        renderAffirmationHtml(value, {
          totalPages,
        }),
        true,
      );
    case 'deficiencies':
      return framed(
        '<p class="form-pdf-value">Deficiencies table — open document and export PDF for full layout.</p>',
        true,
      );
    case 'recommendations':
      return framed(renderRecommendationsHtml(value), true);
    case 'testingNotes':
      return framed(renderTestingNotesHtml(value), true);
    case 'attendanceLog':
      return framed(renderAttendanceLogHtml(value), true);
    case 'documentation':
      return framed(renderDocumentationHtml(value), true);
    case 'controlUnitTest':
      return framed(renderControlUnitTestHtml(value), true);
    case 'controlUnitRecord':
      return framed(renderControlUnitRecordHtml(value), true);
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

  const meta = resolveFormPageMetaHeader(context);

  const metaHeaderHtml =
    page.header === 'codeNameMeta'
      ? `<div class="form-page-header form-page-header--meta">
          <div class="form-page-meta-code">${headerValue(meta.codeName)}</div>
          <table class="form-page-meta-table">
            <tbody>
              <tr>
                <td class="form-page-meta-label">Building Name:</td>
                <td class="form-page-meta-value">${headerValue(meta.buildingName)}</td>
                <td class="form-page-meta-label">Date:</td>
                <td class="form-page-meta-value">${headerValue(meta.date)}</td>
              </tr>
              <tr>
                <td class="form-page-meta-label">Address:</td>
                <td class="form-page-meta-value">${headerValue(meta.address)}</td>
                <td class="form-page-meta-label">City:</td>
                <td class="form-page-meta-value">${headerValue(meta.city)}</td>
              </tr>
            </tbody>
          </table>
        </div>`
      : '';

  const headerInner = page.regions
    .map((region) => {
      if (region.content.kind === 'spacer') {
        return `<div style="height:${region.heightPercent}%"></div>`;
      }
      const text = resolveFormBinding(region.content.binding, context);
      const align = region.content.align ?? 'left';
      const alignClass =
        align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
      return `<div class="form-page-header-line ${alignClass}">${headerValue(text)}</div>`;
    })
    .join('');

  const headerHtml =
    page.header === 'codeNameMeta'
      ? metaHeaderHtml
      : page.regions.length > 0
        ? `<div class="form-page-header">${headerInner}</div>`
        : '';

  const sections = page.sections
    .map((section) => {
      const isUlcSection =
        section.elements.length === 1 && section.elements[0]?.kind === 'ulcSection1';
      const elements = section.elements
        .map((el) => renderElementHtml(el, values[el.id], context, totalPages))
        .join('');
      const height = section.heightPercent
        ? ` style="min-height:${section.heightPercent}%"`
        : '';
      const sectionCls = isUlcSection
        ? 'form-page-section form-page-section--ulc'
        : 'form-page-section';
      const elementsCls = isUlcSection
        ? 'form-page-section-elements--ulc'
        : 'form-page-section-elements';
      const titleHtml = formSectionHeading(section)
        ? `<h3 class="form-page-section-title">${escapeHtml(formSectionHeading(section)!)}</h3>`
        : '';
      return `
        <section class="${sectionCls}"${height}>
          ${titleHtml}
          <div class="${elementsCls}">${elements}</div>
        </section>`;
    })
    .join('');

  const orientationCls = page.orientation === 'landscape' ? ' form-page-sheet--landscape' : '';

  return `
    <section class="form-page form-page-sheet${orientationCls}">
      <div class="form-page-body" style="height:${bodyPercent}%">
        ${headerHtml}
        <div class="form-page-content">${sections}</div>
      </div>
      <footer class="form-page-footer" style="height:${FORM_FOOTER_HEIGHT_PERCENT}%">
        <div class="form-page-footer-count">Page ${pageIndex + 1} of ${totalPages}</div>
        <p class="form-page-footer-disclaimer">${escapeHtml(form.disclaimer)}</p>
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
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    ${loadFormPrintCss()}
  </style>
</head>
<body>
  ${pages}
  <script type="application/json" id="blazeaudit-document" class="embed">${embedJson}</script>
</body>
</html>`;
}
