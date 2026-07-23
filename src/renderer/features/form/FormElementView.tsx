import { memo, useCallback } from 'react';
import type { DocumentContext } from '../../../shared/document';
import type {
  ChecklistElementValue,
  FormElement,
  SignatureElementValue,
  TableElementValue,
} from '../../../shared/form';
import { LazyCommitInput } from '../../components/LazyCommitInput';
import { cn } from '../../lib/cn';
import { formToggleRadioInputProps } from './formToggleRadioInputProps';
import { FormAffirmationView } from './FormAffirmationView';
import { FormAttendanceLogView } from './FormAttendanceLogView';
import { FormControlUnitTestView } from './FormControlUnitTestView';
import { FormControlUnitRecordView } from './FormControlUnitRecordView';
import { FormVoiceCommunicationTestView } from './FormVoiceCommunicationTestView';
import { FormPowerSupplyInspectionView } from './FormPowerSupplyInspectionView';
import { FormEmergencyPowerSupplyTestView } from './FormEmergencyPowerSupplyTestView';
import { FormAnnunciatorDeviceTestView } from './FormAnnunciatorDeviceTestView';
import { FormSequentialDisplayTestView } from './FormSequentialDisplayTestView';
import { FormRemoteTroubleSignalUnitTestView } from './FormRemoteTroubleSignalUnitTestView';
import { FormPrinterTestView } from './FormPrinterTestView';
import { FormAncillaryDeviceCircuitTestView } from './FormAncillaryDeviceCircuitTestView';
import { FormFireSignalReceivingCentreInterconnectionView } from './FormFireSignalReceivingCentreInterconnectionView';
import { FormDataCommunicationLinkFaultToleranceView } from './FormDataCommunicationLinkFaultToleranceView';
import { FormFieldDeviceTestingLegendView } from './FormFieldDeviceTestingLegendView';
import { FormFieldDeviceTestingNotesView } from './FormFieldDeviceTestingNotesView';
import { FormIndividualDeviceRecordView } from './FormIndividualDeviceRecordView';
import { FormCircuitFaultToleranceTestSheetView } from './FormCircuitFaultToleranceTestSheetView';
import { FormDocumentationView } from './FormDocumentationView';
import { FormDeficienciesView } from './FormDeficienciesView';
import { FormLinedNotesView } from './FormLinedNotesView';
import { FormUlcSection1View } from './FormUlcSection1View';
import { FormYesNoSummaryView } from './FormYesNoSummaryView';
import { FormPortableExtinguisherCoverView } from './FormPortableExtinguisherCoverView';
import { FormFireExtinguisherTestRecordView } from './FormFireExtinguisherTestRecordView';
import { FormEmergencyLightingCoverView } from './FormEmergencyLightingCoverView';
import { FormEmergencyLightingDeviceLegendView } from './FormEmergencyLightingDeviceLegendView';
import { FormEmergencyLightingInspectionRecordView } from './FormEmergencyLightingInspectionRecordView';

const inputCls = 'ba-input !px-2 !py-1.5 !text-xs';

const tableHeadCls =
  'border border-[var(--ba-panel-border)] bg-[var(--ba-table-head-bg)] px-2 py-1 font-semibold text-[var(--ba-text-secondary)]';
const tableCellCls = 'border border-[var(--ba-panel-border)] px-1 py-0.5';

function FormElementViewInner({
  element,
  value,
  readOnly,
  bindingText,
  context,
  totalPages,
  linedNotesVisibleLines,
  linedNotesRowHeights,
  onChange,
  onElementValueChange,
}: {
  element: FormElement;
  value: unknown;
  readOnly?: boolean;
  bindingText?: string;
  context?: DocumentContext | null;
  totalPages?: number;
  linedNotesVisibleLines?: Record<string, number>;
  linedNotesRowHeights?: Record<string, number>;
  onChange?: (value: unknown) => void;
  /** Stable dispatcher from FormPageCanvas — avoids per-element callback closures. */
  onElementValueChange?: (elementId: string, value: unknown) => void;
}) {
  const publishChange = useCallback(
    (next: unknown) => {
      if (onElementValueChange) onElementValueChange(element.id, next);
      else onChange?.(next);
    },
    [element.id, onElementValueChange, onChange],
  );

  const flushFrame =
    element.kind === 'ulcSection1' ||
    element.kind === 'yesNoSummary' ||
    element.kind === 'affirmation' ||
    element.kind === 'deficiencies' ||
    element.kind === 'recommendations' ||
    element.kind === 'testingNotes' ||
    element.kind === 'attendanceLog' ||
    element.kind === 'documentation' ||
    element.kind === 'controlUnitTest' ||
    element.kind === 'controlUnitRecord' ||
    element.kind === 'voiceCommunicationTest' ||
    element.kind === 'powerSupplyInspection' ||
    element.kind === 'emergencyPowerSupplyTest' ||
    element.kind === 'annunciatorDeviceTest' ||
    element.kind === 'sequentialDisplayTest' ||
    element.kind === 'remoteTroubleSignalUnitTest' ||
    element.kind === 'printerTest' ||
    element.kind === 'ancillaryDeviceCircuitTest' ||
    element.kind === 'fireSignalReceivingCentreInterconnection' ||
    element.kind === 'dataCommunicationLinkFaultTolerance' ||
    element.kind === 'fieldDeviceTestingLegend' ||
    element.kind === 'fieldDeviceTestingNotes' ||
    element.kind === 'individualDeviceRecord' ||
    element.kind === 'circuitFaultToleranceTestSheet' ||
    element.kind === 'portableExtinguisherCover' ||
    element.kind === 'fireExtinguisherTestRecord' ||
    element.kind === 'emergencyLightingCover' ||
    element.kind === 'emergencyLightingDeviceLegend' ||
    element.kind === 'emergencyLightingInspectionRecord';

  return (
    <div
      className={cn(
        'form-element-frame',
        flushFrame && 'form-element-frame--flush',
        flushFrame &&
          element.kind !== 'ancillaryDeviceCircuitTest' &&
          element.kind !== 'fireSignalReceivingCentreInterconnection' &&
          element.kind !== 'dataCommunicationLinkFaultTolerance' &&
          element.kind !== 'fieldDeviceTestingLegend' &&
          element.kind !== 'fieldDeviceTestingNotes' &&
          'flex min-h-0 flex-1 flex-col',
      )}
    >
      <FormElementBody
        element={element}
        value={value}
        readOnly={readOnly}
        bindingText={bindingText}
        context={context ?? null}
        totalPages={totalPages ?? 1}
        linedNotesVisibleLines={linedNotesVisibleLines}
        linedNotesRowHeights={linedNotesRowHeights}
        onChange={publishChange}
      />
    </div>
  );
}

function FormElementBody({
  element,
  value,
  readOnly,
  bindingText,
  context,
  totalPages,
  linedNotesVisibleLines,
  linedNotesRowHeights,
  onChange,
}: {
  element: FormElement;
  value: unknown;
  readOnly?: boolean;
  bindingText?: string;
  context: DocumentContext | null;
  totalPages: number;
  linedNotesVisibleLines?: Record<string, number>;
  linedNotesRowHeights?: Record<string, number>;
  onChange?: (value: unknown) => void;
}) {
  switch (element.kind) {
    case 'text': {
      const text = bindingText ?? (typeof value === 'string' ? value : '');
      if (readOnly || element.binding) {
        return (
          <div className="text-xs">
            {element.label && (
              <p className="mb-1 font-medium text-[var(--ba-text-muted)]">{element.label}</p>
            )}
            <p className="rounded-lg border border-[var(--ba-input-border)] bg-[var(--ba-input-bg)] px-2 py-1.5 text-[var(--ba-text-primary)] shadow-[var(--ba-input-shadow)]">
              {text || '—'}
            </p>
          </div>
        );
      }
      return (
        <label className="block text-xs">
          {element.label && (
            <span className="mb-1 block font-medium text-[var(--ba-text-muted)]">{element.label}</span>
          )}
          {element.multiline ? (
            <LazyCommitInput
              multiline
              className={cn(inputCls, 'min-h-16 resize-y')}
              value={text}
              placeholder={element.placeholder}
              onCommit={(next) => onChange?.(next)}
            />
          ) : (
            <LazyCommitInput
              className={inputCls}
              value={text}
              placeholder={element.placeholder}
              onCommit={(next) => onChange?.(next)}
            />
          )}
        </label>
      );
    }
    case 'table': {
      const tableValue = (value as TableElementValue | undefined) ?? { rows: [] };
      const rows = tableValue.rows.length > 0 ? tableValue.rows : [{}];
      return (
        <div className="text-xs">
          {element.label && (
            <p className="mb-1 font-medium text-[var(--ba-text-muted)]">{element.label}</p>
          )}
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                {element.columns.map((col) => (
                  <th
                    key={col.key}
                    className={tableHeadCls}
                    style={{ width: col.widthPercent ? `${col.widthPercent}%` : undefined }}
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {element.columns.map((col) => (
                    <td key={col.key} className={tableCellCls}>
                      {readOnly ? (
                        <span className="block px-1 py-1 text-[var(--ba-text-primary)]">
                          {row[col.key] || '—'}
                        </span>
                      ) : (
                        <input
                          className={inputCls}
                          value={row[col.key] ?? ''}
                          onChange={(e) => {
                            const nextRows = rows.map((r, i) =>
                              i === rowIndex ? { ...r, [col.key]: e.target.value } : r,
                            );
                            onChange?.({ rows: nextRows });
                          }}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
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
      return (
        <div className="text-xs">
          {element.label && (
            <p className="mb-1 font-medium text-[var(--ba-text-muted)]">{element.label}</p>
          )}
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={cn(tableHeadCls, 'text-left')}>Item</th>
                {options.map((opt) => (
                  <th key={opt.id} className={cn(tableHeadCls, 'w-14 text-center')}>
                    {opt.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {element.items.map((item) => (
                <tr key={item.id}>
                  <td className={cn(tableCellCls, 'px-2 py-1 text-[var(--ba-text-primary)]')}>
                    {item.label}
                  </td>
                  {options.map((opt) => (
                    <td key={opt.id} className={cn(tableCellCls, 'px-2 py-1 text-center')}>
                      {readOnly ? (
                        <span className="text-[var(--ba-text-primary)]">
                          {checklistValue[item.id] === opt.id ? '●' : '○'}
                        </span>
                      ) : (
                        <input
                          type="radio"
                          className="accent-[var(--ba-flame)]"
                          name={`checklist-${element.id}-${item.id}`}
                          {...formToggleRadioInputProps({
                            choice: checklistValue[item.id] ?? null,
                            variant: opt.id,
                            onSelect: () =>
                              onChange?.({ ...checklistValue, [item.id]: opt.id }),
                            onClear: () =>
                              onChange?.({ ...checklistValue, [item.id]: null }),
                          })}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'signature': {
      const sig = (value as SignatureElementValue | undefined) ?? { name: '', date: null };
      return (
        <div className="text-xs">
          {element.label && (
            <p className="mb-1 font-medium text-[var(--ba-text-muted)]">{element.label}</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[var(--ba-text-muted)]">Name</span>
              {readOnly ? (
                <span className="block rounded-lg border border-[var(--ba-input-border)] bg-[var(--ba-input-bg)] px-2 py-1 text-[var(--ba-text-primary)]">
                  {sig.name || '—'}
                </span>
              ) : (
                <input
                  className={inputCls}
                  value={sig.name}
                  onChange={(e) => onChange?.({ ...sig, name: e.target.value })}
                />
              )}
            </label>
            <label className="block">
              <span className="mb-1 block text-[var(--ba-text-muted)]">Date</span>
              {readOnly ? (
                <span className="block rounded-lg border border-[var(--ba-input-border)] bg-[var(--ba-input-bg)] px-2 py-1 text-[var(--ba-text-primary)]">
                  {sig.date || '—'}
                </span>
              ) : (
                <input
                  type="date"
                  className={inputCls}
                  value={sig.date ?? ''}
                  onChange={(e) => onChange?.({ ...sig, date: e.target.value || null })}
                />
              )}
            </label>
          </div>
        </div>
      );
    }
    case 'ulcSection1':
      return (
        <FormUlcSection1View
          value={value}
          context={context}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'yesNoSummary':
      return (
        <FormYesNoSummaryView
          items={element.items}
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'affirmation':
      return (
        <FormAffirmationView
          value={value}
          context={context}
          totalPages={totalPages}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'deficiencies':
      return (
        <FormDeficienciesView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'recommendations':
      return (
        <FormLinedNotesView
          elementId={element.id}
          variant="green"
          value={value}
          readOnly={readOnly}
          visibleLineCount={linedNotesVisibleLines?.[element.id]}
          pdfRowHeightPx={linedNotesRowHeights?.[element.id]}
          onChange={onChange}
        />
      );
    case 'testingNotes':
      return (
        <FormLinedNotesView
          elementId={element.id}
          variant="blue"
          value={value}
          readOnly={readOnly}
          visibleLineCount={linedNotesVisibleLines?.[element.id]}
          pdfRowHeightPx={linedNotesRowHeights?.[element.id]}
          onChange={onChange}
        />
      );
    case 'attendanceLog':
      return (
        <FormAttendanceLogView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'documentation':
      return (
        <FormDocumentationView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'controlUnitTest':
      return (
        <FormControlUnitTestView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'controlUnitRecord':
      return (
        <FormControlUnitRecordView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'voiceCommunicationTest':
      return (
        <FormVoiceCommunicationTestView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'powerSupplyInspection':
      return (
        <FormPowerSupplyInspectionView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'emergencyPowerSupplyTest':
      return (
        <FormEmergencyPowerSupplyTestView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'annunciatorDeviceTest':
      return (
        <FormAnnunciatorDeviceTestView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'sequentialDisplayTest':
      return (
        <FormSequentialDisplayTestView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'remoteTroubleSignalUnitTest':
      return (
        <FormRemoteTroubleSignalUnitTestView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'printerTest':
      return (
        <FormPrinterTestView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'ancillaryDeviceCircuitTest':
      return (
        <FormAncillaryDeviceCircuitTestView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'fireSignalReceivingCentreInterconnection':
      return (
        <FormFireSignalReceivingCentreInterconnectionView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'dataCommunicationLinkFaultTolerance':
      return (
        <FormDataCommunicationLinkFaultToleranceView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'fieldDeviceTestingLegend':
      return (
        <FormFieldDeviceTestingLegendView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'fieldDeviceTestingNotes':
      return <FormFieldDeviceTestingNotesView />;
    case 'individualDeviceRecord':
      return (
        <FormIndividualDeviceRecordView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'circuitFaultToleranceTestSheet':
      return (
        <FormCircuitFaultToleranceTestSheetView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'portableExtinguisherCover':
      return (
        <FormPortableExtinguisherCoverView
          value={value}
          context={context ?? null}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'fireExtinguisherTestRecord':
      return (
        <FormFireExtinguisherTestRecordView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'emergencyLightingCover':
      return (
        <FormEmergencyLightingCoverView
          value={value}
          context={context ?? null}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'emergencyLightingDeviceLegend':
      return (
        <FormEmergencyLightingDeviceLegendView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    case 'emergencyLightingInspectionRecord':
      return (
        <FormEmergencyLightingInspectionRecordView
          value={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
}

const MemoFormElementView = memo(FormElementViewInner, (prev, next) => {
  return (
    prev.element === next.element &&
    prev.value === next.value &&
    prev.readOnly === next.readOnly &&
    prev.bindingText === next.bindingText &&
    prev.context === next.context &&
    prev.totalPages === next.totalPages &&
    prev.onChange === next.onChange &&
    prev.onElementValueChange === next.onElementValueChange &&
    prev.linedNotesVisibleLines === next.linedNotesVisibleLines &&
    prev.linedNotesRowHeights === next.linedNotesRowHeights
  );
});

export { MemoFormElementView as FormElementView };
