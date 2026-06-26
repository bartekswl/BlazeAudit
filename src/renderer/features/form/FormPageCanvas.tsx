import type { DocumentContext } from '../../../shared/document';
import {
  FORM_FOOTER_HEIGHT_PERCENT,
  formSectionAnchorId,
  formSectionHeading,
  pageBodyPercent,
  resolveFormBinding,
  type BuiltinTemplate,
  type FormDefinition,
  type FormPage,
} from '../../../shared/form';
import { cn } from '../../lib/cn';
import { FormPageMetaHeader } from './FormPageMetaHeader';
import { FormElementView } from './FormElementView';

export function FormPageCanvas({
  form,
  page,
  pageIndex,
  template,
  context,
  values,
  readOnly,
  onValueChange,
  fixedPageLayout = false,
  linedNotesVisibleLines,
  linedNotesRowHeights,
}: {
  form: FormDefinition;
  page: FormPage;
  pageIndex: number;
  template?: Pick<BuiltinTemplate, 'code' | 'title' | 'name'>;
  context?: DocumentContext | null;
  values?: Record<string, unknown>;
  readOnly?: boolean;
  onValueChange?: (elementId: string, value: unknown) => void;
  /** True for PDF export — A4 percent heights. False for screen — sheet hugs content. */
  fixedPageLayout?: boolean;
  /** Visible ruled-line counts from the document editor — keeps PDF rows aligned with screen. */
  linedNotesVisibleLines?: Record<string, number>;
  /** PDF — pixel height per ruled row (measured from fixed A4 layout). */
  linedNotesRowHeights?: Record<string, number>;
}) {
  const bodyPercent = pageBodyPercent(page);
  const totalPages = form.pages.length;
  const isLandscape = page.orientation === 'landscape';
  const useMetaHeader = page.header === 'codeNameMeta';
  const hasLinedNotes = page.sections.some((section) =>
    section.elements.some(
      (element) => element.kind === 'recommendations' || element.kind === 'testingNotes',
    ),
  );
  const hasAttendanceLog = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'attendanceLog'),
  );
  const hasDocumentation = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'documentation'),
  );
  const hasControlUnitTest = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'controlUnitTest'),
  );
  const hasControlUnitRecord = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'controlUnitRecord'),
  );
  const hasVoiceCommunicationTest = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'voiceCommunicationTest'),
  );
  const hasPowerSupplyInspectionPage = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'powerSupplyInspection'),
  );
  const hasEmergencyPowerSupplyTestPage = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'emergencyPowerSupplyTest'),
  );
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
    section.elements.some((element) => element.kind === 'fireSignalReceivingCentreInterconnection'),
  );
  const hasDclFaultTolerancePage = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'dataCommunicationLinkFaultTolerance'),
  );
  const hasFieldDeviceLegendPage = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'fieldDeviceTestingLegend'),
  );
  const hasFieldDeviceTestingNotesPage = page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'fieldDeviceTestingNotes'),
  );

  return (
    <div
      data-form-page-index={pageIndex}
      className={cn(
        'form-page-sheet',
        isLandscape && 'form-page-sheet--landscape',
        hasLinedNotes && 'form-page-sheet--lined-notes',
        hasAttendanceLog && 'form-page-sheet--attendance-log',
        hasDocumentation && 'form-page-sheet--documentation',
        hasControlUnitTest && 'form-page-sheet--control-unit-test',
        hasControlUnitRecord && 'form-page-sheet--control-unit-record',
        hasVoiceCommunicationTest && 'form-page-sheet--voice-communication-test',
        hasEmergencyPowerSupplyTestOnlyPage && 'form-page-sheet--emergency-power-supply-test',
        hasAnnunciatorTestPage && 'form-page-sheet--annunciator-device-test',
        hasRtsuPrinterTestPage && 'form-page-sheet--rtsu-printer-test',
        hasAncillaryDeviceCircuitTestPage && 'form-page-sheet--ancillary-device-circuit-test',
        hasFsrcInterconnectionPage && 'form-page-sheet--fsrc-interconnection',
        hasDclFaultTolerancePage && 'form-page-sheet--dcl-fault-tolerance',
        hasFieldDeviceLegendPage && 'form-page-sheet--field-device-legend',
        hasFieldDeviceTestingNotesPage && 'form-page-sheet--field-device-testing-notes',
        fixedPageLayout && 'form-page-sheet--fixed',
      )}
    >
      <div
        className="form-page-body"
        style={fixedPageLayout ? { minHeight: `${bodyPercent}%` } : undefined}
      >
        {useMetaHeader ? (
          <FormPageMetaHeader context={context} template={template} />
        ) : (
          page.regions.length > 0 && (
            <div className="form-page-header">
              {page.regions.map((region) => {
                if (region.content.kind === 'spacer') {
                  return (
                    <div
                      key={region.id}
                      className="shrink-0"
                      style={{ height: `${region.heightPercent}%` }}
                    />
                  );
                }
                const text = resolveFormBinding(region.content.binding, context ?? null, template);
                return (
                  <div
                    key={region.id}
                    className={cn(
                      'form-page-header-line font-semibold text-[var(--ba-text-primary)]',
                      region.content.align === 'center' && 'text-center',
                      region.content.align === 'right' && 'text-right',
                    )}
                  >
                    {text || (
                      <span className="text-[var(--ba-text-muted)]">{region.content.binding}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        <div
          className={cn(
            'form-page-content',
            isLandscape && 'form-page-content--landscape',
            hasLinedNotes && 'form-page-content--lined-notes',
            hasAttendanceLog && 'form-page-content--attendance-log',
            hasDocumentation && 'form-page-content--documentation',
            hasControlUnitTest && 'form-page-content--control-unit-test',
            hasControlUnitRecord && 'form-page-content--control-unit-record',
            hasVoiceCommunicationTest && 'form-page-content--voice-communication-test',
            hasEmergencyPowerSupplyTestOnlyPage && 'form-page-content--emergency-power-supply-test',
            hasAnnunciatorTestPage && 'form-page-content--annunciator-device-test',
            hasAncillaryDeviceCircuitTestPage && 'form-page-content--ancillary-device-circuit-test',
            hasFsrcInterconnectionPage && 'form-page-content--fsrc-interconnection',
            hasDclFaultTolerancePage && 'form-page-content--dcl-fault-tolerance',
            hasFieldDeviceLegendPage && 'form-page-content--field-device-legend',
            hasFieldDeviceTestingNotesPage && 'form-page-content--field-device-testing-notes',
          )}
        >
          {page.sections.map((section) => {
            const heading = formSectionHeading(section);
            const isUlcSection =
              section.elements.length === 1 && section.elements[0]?.kind === 'ulcSection1';
            const isLinedNotesSection = section.elements.some(
              (element) => element.kind === 'recommendations' || element.kind === 'testingNotes',
            );
            const isAttendanceLogSection = section.elements.some(
              (element) => element.kind === 'attendanceLog',
            );
            const isAncillaryDeviceCircuitTestSection = section.elements.some(
              (element) => element.kind === 'ancillaryDeviceCircuitTest',
            );
            const isFsrcInterconnectionSection = section.elements.some(
              (element) => element.kind === 'fireSignalReceivingCentreInterconnection',
            );
            const isDclFaultToleranceSection = section.elements.some(
              (element) => element.kind === 'dataCommunicationLinkFaultTolerance',
            );
            const isFieldDeviceLegendSection = section.elements.some(
              (element) => element.kind === 'fieldDeviceTestingLegend',
            );
            const isFieldDeviceChapterSection =
              hasFieldDeviceLegendPage && section.id === 'section-field-device-records';
            const isFieldDeviceLegendTitleSection =
              hasFieldDeviceLegendPage && section.id === 'section-field-device-testing-legend';
            const isDocumentationSection = section.elements.some(
              (element) => element.kind === 'documentation',
            );
            const isControlUnitTestSection = section.elements.some(
              (element) => element.kind === 'controlUnitTest',
            );
            const isControlUnitRecordSection = section.elements.some(
              (element) => element.kind === 'controlUnitRecord',
            );
            const isVoiceCommunicationTestSection = section.elements.some(
              (element) => element.kind === 'voiceCommunicationTest',
            );
            const isPowerSupplyInspectionSection = section.elements.some(
              (element) => element.kind === 'powerSupplyInspection',
            );
            const isEmergencyPowerSupplyTestSection = section.elements.some(
              (element) => element.kind === 'emergencyPowerSupplyTest',
            );
            const isEmergencyPowerSupplyTestOnlySection =
              isEmergencyPowerSupplyTestSection && !isPowerSupplyInspectionSection;
            const isAnnunciatorDeviceTestSection = section.elements.some(
              (element) => element.kind === 'annunciatorDeviceTest',
            );
            const isSequentialDisplayTestSection = section.elements.some(
              (element) => element.kind === 'sequentialDisplayTest',
            );
            const isAnnunciatorTestSection =
              isAnnunciatorDeviceTestSection || isSequentialDisplayTestSection;
            const isPowerSuppliesSection =
              isPowerSupplyInspectionSection || isEmergencyPowerSupplyTestSection;
            const sectionHeightStyle =
              fixedPageLayout && section.heightPercent
                ? { minHeight: `${section.heightPercent}%` }
                : undefined;
            return (
            <section
              key={section.id}
              id={formSectionAnchorId(section.id)}
              className={cn(
                'form-page-section scroll-mt-3',
                isUlcSection && 'flex flex-col',
                isLinedNotesSection && 'flex min-h-0 flex-col',
                isAttendanceLogSection && 'flex min-h-0 flex-col',
                isDocumentationSection && 'flex min-h-0 flex-col',
                isControlUnitTestSection && 'flex min-h-0 flex-col',
                isControlUnitRecordSection && 'flex min-h-0 flex-col',
                isVoiceCommunicationTestSection && 'flex min-h-0 flex-col',
                isPowerSuppliesSection && 'flex min-h-0 flex-col',
                isAnnunciatorTestSection && 'flex min-h-0 flex-col',
                isEmergencyPowerSupplyTestOnlySection &&
                  'form-page-section--emergency-power-supply-test',
                isFieldDeviceChapterSection && 'form-page-section--field-device-chapter',
                isFieldDeviceLegendTitleSection && 'form-page-section--field-device-legend-sub',
              )}
              style={sectionHeightStyle}
            >
              {heading && (
                <h3 className="form-page-section-title">{heading}</h3>
              )}
              <div
                className={cn(
                  (isUlcSection || isLinedNotesSection || isAttendanceLogSection || isDocumentationSection || isControlUnitTestSection || isControlUnitRecordSection || isVoiceCommunicationTestSection || isPowerSuppliesSection || isAnnunciatorTestSection || isFieldDeviceLegendTitleSection) &&
                    'flex flex-1 flex-col',
                  !isUlcSection &&
                    !isLinedNotesSection &&
                    !isAttendanceLogSection &&
                    !isAncillaryDeviceCircuitTestSection &&
                    !isFsrcInterconnectionSection &&
                    !isDclFaultToleranceSection &&
                    !isFieldDeviceLegendSection &&
                    !isDocumentationSection &&
                    !isControlUnitTestSection &&
                    !isControlUnitRecordSection &&
                    !isVoiceCommunicationTestSection &&
                    !isPowerSuppliesSection &&
                    !isAnnunciatorTestSection &&
                    'space-y-3',
                )}
              >
                {section.elements.map((element) => (
                  <FormElementView
                    key={element.id}
                    element={element}
                    value={values?.[element.id]}
                    readOnly={readOnly}
                    context={context ?? null}
                    totalPages={totalPages}
                    bindingText={
                      element.kind === 'text' && element.binding
                        ? resolveFormBinding(element.binding, context ?? null, template)
                        : undefined
                    }
                    onChange={
                      onValueChange
                        ? (next) => onValueChange(element.id, next)
                        : undefined
                    }
                    linedNotesVisibleLines={linedNotesVisibleLines}
                    linedNotesRowHeights={linedNotesRowHeights}
                  />
                ))}
              </div>
            </section>
            );
          })}
        </div>
      </div>

      <footer
        className="form-page-footer"
        style={fixedPageLayout ? { height: `${FORM_FOOTER_HEIGHT_PERCENT}%` } : undefined}
      >
        <div className="form-page-footer-count">
          Page {pageIndex + 1} of {totalPages}
        </div>
        <p className="form-page-footer-disclaimer">{form.disclaimer}</p>
      </footer>
    </div>
  );
}
