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
import { renderVoiceCommunicationTestHtml } from '../../shared/form/voiceCommunicationTestHtml';
import { renderPowerSupplyInspectionHtml } from '../../shared/form/powerSupplyInspectionHtml';
import { renderEmergencyPowerSupplyTestHtml } from '../../shared/form/emergencyPowerSupplyTestHtml';
import { renderAnnunciatorDeviceTestHtml } from '../../shared/form/annunciatorDeviceTestHtml';
import { renderSequentialDisplayTestHtml } from '../../shared/form/sequentialDisplayTestHtml';
import { renderRemoteTroubleSignalUnitTestHtml } from '../../shared/form/remoteTroubleSignalUnitTestHtml';
import { renderPrinterTestHtml } from '../../shared/form/printerTestHtml';
import { renderAncillaryDeviceCircuitTestHtml } from '../../shared/form/ancillaryDeviceCircuitTestHtml';
import { renderFireSignalReceivingCentreInterconnectionHtml } from '../../shared/form/fireSignalReceivingCentreInterconnectionHtml';
import { renderDataCommunicationLinkFaultToleranceHtml } from '../../shared/form/dataCommunicationLinkFaultToleranceHtml';
import { renderFieldDeviceTestingLegendHtml } from '../../shared/form/fieldDeviceTestingLegendHtml';
import { renderFieldDeviceTestingNotesHtml } from '../../shared/form/fieldDeviceTestingNotesHtml';
import { renderIndividualDeviceRecordHtml } from '../../shared/form/individualDeviceRecordHtml';
import { renderCircuitFaultToleranceTestSheetHtml } from '../../shared/form/circuitFaultToleranceTestSheetHtml';
import { renderDocumentationHtml } from '../../shared/form/documentationHtml';
import { renderRecommendationsHtml, renderTestingNotesHtml } from '../../shared/form/linedNotesHtml';
import { renderUlcSection1Html } from '../../shared/form/ulcSection1Html';
import { renderYesNoSummaryHtml } from '../../shared/form/yesNoSummaryHtml';
import { CFAA_MEMBER_LOGO_DATA_URL } from '../../shared/form/cfaaHeaderAsset';

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

function brandedHeaderHtml(inner: string, context: DocumentContext, page1 = false): string {
  const companyLogo = context.business.logoDataUrl
    ? `<img src="${escapeHtml(context.business.logoDataUrl)}" alt="Company logo" class="form-page-header-brand-img" />`
    : '';
  const brandingClass = page1
    ? 'form-page-header-branding form-page-header-branding--page1'
    : 'form-page-header-branding';
  return `<div class="${brandingClass}"><div class="form-page-header-brand form-page-header-brand--company">${companyLogo}</div><div class="form-page-header-branding-content">${inner}</div><div class="form-page-header-brand form-page-header-brand--cfaa"><img src="${escapeHtml(CFAA_MEMBER_LOGO_DATA_URL)}" alt="Canadian Fire Alarm Association member" class="form-page-header-brand-img" /></div></div>`;
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
    case 'voiceCommunicationTest':
      return framed(renderVoiceCommunicationTestHtml(value), true);
    case 'powerSupplyInspection':
      return framed(renderPowerSupplyInspectionHtml(value), true);
    case 'emergencyPowerSupplyTest':
      return framed(renderEmergencyPowerSupplyTestHtml(value), true);
    case 'annunciatorDeviceTest':
      return framed(renderAnnunciatorDeviceTestHtml(value), true);
    case 'sequentialDisplayTest':
      return framed(renderSequentialDisplayTestHtml(value), true);
    case 'remoteTroubleSignalUnitTest':
      return framed(renderRemoteTroubleSignalUnitTestHtml(value), true);
    case 'printerTest':
      return framed(renderPrinterTestHtml(value), true);
    case 'ancillaryDeviceCircuitTest':
      return framed(renderAncillaryDeviceCircuitTestHtml(value), true);
    case 'fireSignalReceivingCentreInterconnection':
      return framed(renderFireSignalReceivingCentreInterconnectionHtml(value), true);
    case 'dataCommunicationLinkFaultTolerance':
      return framed(renderDataCommunicationLinkFaultToleranceHtml(value), true);
    case 'fieldDeviceTestingLegend':
      return framed(renderFieldDeviceTestingLegendHtml(value), true);
    case 'fieldDeviceTestingNotes':
      return framed(renderFieldDeviceTestingNotesHtml(), true);
    case 'individualDeviceRecord':
      return framed(renderIndividualDeviceRecordHtml(value), true);
    case 'circuitFaultToleranceTestSheet':
      return framed(renderCircuitFaultToleranceTestSheetHtml(value), true);
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
  const isUlc536 = /ULC\s*536/i.test(context.template?.code ?? '');

  const metaHeaderInner =
    page.header === 'codeNameMeta'
      ? `<div class="form-page-meta-code">${headerValue(meta.codeName)}</div>
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
          </table>`
      : '';
  const metaHeaderHtml =
    page.header === 'codeNameMeta'
      ? `<div class="form-page-header form-page-header--meta">${isUlc536 ? brandedHeaderHtml(metaHeaderInner, context) : metaHeaderInner}</div>`
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
        ? `<div class="form-page-header">${isUlc536 ? brandedHeaderHtml(headerInner, context, true) : headerInner}</div>`
        : '';

  const hasFieldDeviceLegendPage = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'fieldDeviceTestingLegend'),
  );
  const hasControlUnitTestPage = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'controlUnitTest'),
  );
  const hasFieldDeviceTestingNotesPage = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'fieldDeviceTestingNotes'),
  );

  const sections = page.sections
    .map((section) => {
      const isUlcSection =
        section.elements.length === 1 && section.elements[0]?.kind === 'ulcSection1';
      const isEmergencyPowerSupplyTestSection = section.elements.some(
        (element) => element.kind === 'emergencyPowerSupplyTest',
      );
      const isEmergencyPowerSupplyTestOnlySection =
        isEmergencyPowerSupplyTestSection &&
        !page.sections.some((s) =>
          s.elements.some((element) => element.kind === 'powerSupplyInspection'),
        );
      const elements = section.elements
        .map((el) => renderElementHtml(el, values[el.id], context, totalPages))
        .join('');
      const height = section.heightPercent
        ? isEmergencyPowerSupplyTestOnlySection
          ? ` style="min-height:${section.heightPercent}%"`
          : ` style="height:${section.heightPercent}%;min-height:${section.heightPercent}%;max-height:${section.heightPercent}%"`
        : '';
      const isFieldDeviceChapterSection =
        hasFieldDeviceLegendPage && section.id === 'section-field-device-records';
      const isFieldDeviceLegendTitleSection =
        hasFieldDeviceLegendPage && section.id === 'section-field-device-testing-legend';
      const isControlUnitChapterSection =
        hasControlUnitTestPage && section.id === 'section-control-unit-chapter';
      const isControlUnitTestTitleSection =
        hasControlUnitTestPage && section.id === 'section-control-unit-test';
      const sectionCls = [
        isUlcSection ? 'form-page-section form-page-section--ulc' : 'form-page-section',
        isEmergencyPowerSupplyTestOnlySection
          ? 'form-page-section--emergency-power-supply-test'
          : '',
        isFieldDeviceChapterSection ? 'form-page-section--field-device-chapter' : '',
        isFieldDeviceLegendTitleSection ? 'form-page-section--field-device-legend-sub' : '',
        isControlUnitChapterSection ? 'form-page-section--control-unit-chapter' : '',
        isControlUnitTestTitleSection ? 'form-page-section--control-unit-test-sub' : '',
      ]
        .filter(Boolean)
        .join(' ');
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

  const hasVoiceCommunicationTest = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'voiceCommunicationTest'),
  );
  const hasPowerSupplyInspectionPage = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'powerSupplyInspection'),
  );
  const hasEmergencyPowerSupplyTestPage = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'emergencyPowerSupplyTest'),
  );
  const hasPowerSuppliesPage =
    hasPowerSupplyInspectionPage && hasEmergencyPowerSupplyTestPage;
  const hasEmergencyPowerSupplyTestOnlyPage =
    hasEmergencyPowerSupplyTestPage && !hasPowerSupplyInspectionPage;
  const hasAnnunciatorTestPage = page.sections.some((section) =>
    section.elements.some(
      (element) =>
        element.kind === 'annunciatorDeviceTest' || element.kind === 'sequentialDisplayTest',
    ),
  );
  const hasRtsuPrinterTestPage = page.sections.some((section) =>
    section.elements.some(
      (element) =>
        element.kind === 'remoteTroubleSignalUnitTest' || element.kind === 'printerTest',
    ),
  );
  const hasAncillaryDeviceCircuitTestPage = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'ancillaryDeviceCircuitTest'),
  );
  const hasFsrcInterconnectionPage = page.sections.some((section) =>
    section.elements.some(
      (element) => element.kind === 'fireSignalReceivingCentreInterconnection',
    ),
  );
  const hasDclFaultTolerancePage = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'dataCommunicationLinkFaultTolerance'),
  );
  const hasIndividualDeviceRecordPage = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'individualDeviceRecord'),
  );
  const hasCircuitFaultToleranceTestSheetPage = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'circuitFaultToleranceTestSheet'),
  );

  const sheetClasses = [
    'form-page',
    'form-page-sheet',
    'form-page-sheet--fixed',
    page.orientation === 'landscape' ? 'form-page-sheet--landscape' : '',
    hasVoiceCommunicationTest ? 'form-page-sheet--voice-communication-test' : '',
    hasPowerSuppliesPage ? 'form-page-sheet--power-supplies' : '',
    hasEmergencyPowerSupplyTestOnlyPage ? 'form-page-sheet--emergency-power-supply-test' : '',
    hasAnnunciatorTestPage ? 'form-page-sheet--annunciator-device-test' : '',
    hasRtsuPrinterTestPage ? 'form-page-sheet--rtsu-printer-test' : '',
    hasAncillaryDeviceCircuitTestPage ? 'form-page-sheet--ancillary-device-circuit-test' : '',
    hasFsrcInterconnectionPage ? 'form-page-sheet--fsrc-interconnection' : '',
    hasDclFaultTolerancePage ? 'form-page-sheet--dcl-fault-tolerance' : '',
    hasFieldDeviceLegendPage ? 'form-page-sheet--field-device-legend' : '',
    hasFieldDeviceTestingNotesPage ? 'form-page-sheet--field-device-testing-notes' : '',
    hasIndividualDeviceRecordPage ? 'form-page-sheet--individual-device-record' : '',
    hasCircuitFaultToleranceTestSheetPage
      ? 'form-page-sheet--circuit-fault-tolerance-test-sheet'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  const contentClasses = [
    'form-page-content',
    hasVoiceCommunicationTest ? 'form-page-content--voice-communication-test' : '',
    hasPowerSuppliesPage ? 'form-page-content--power-supplies' : '',
    hasEmergencyPowerSupplyTestOnlyPage ? 'form-page-content--emergency-power-supply-test' : '',
    hasAnnunciatorTestPage ? 'form-page-content--annunciator-device-test' : '',
    hasAncillaryDeviceCircuitTestPage ? 'form-page-content--ancillary-device-circuit-test' : '',
    hasFsrcInterconnectionPage ? 'form-page-content--fsrc-interconnection' : '',
    hasDclFaultTolerancePage ? 'form-page-content--dcl-fault-tolerance' : '',
    hasFieldDeviceLegendPage ? 'form-page-content--field-device-legend' : '',
    hasFieldDeviceTestingNotesPage ? 'form-page-content--field-device-testing-notes' : '',
    hasIndividualDeviceRecordPage ? 'form-page-content--individual-device-record' : '',
    hasCircuitFaultToleranceTestSheetPage
      ? 'form-page-content--circuit-fault-tolerance-test-sheet'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `
    <section class="${sheetClasses}">
      <div class="form-page-body" style="height:${bodyPercent}%">
        ${headerHtml}
        <div class="${contentClasses}">${sections}</div>
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
