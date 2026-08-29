import {
  ANCILLARY_DEVICE_CIRCUIT_TEST_ROW_COUNT,
  emptyAncillaryDeviceCircuitRow,
  normalizeAncillaryDeviceCircuitTestValue,
  type AncillaryDeviceCircuitRow,
} from './ancillaryDeviceCircuitTest';
import {
  emptyAttendanceLogRow,
  normalizeAttendanceLogValue,
  type AttendanceLogRow,
} from './attendanceLog';
import {
  emptyCircuitFaultToleranceTestSheetRow,
  normalizeCircuitFaultToleranceTestSheetValue,
  type CircuitFaultToleranceTestSheetRow,
} from './circuitFaultToleranceTestSheet';
import {
  EMERGENCY_LIGHTING_INSPECTION_RECORD_COLUMNS,
  EMERGENCY_LIGHTING_INSPECTION_RECORD_ROW_COUNT,
  normalizeEmergencyLightingInspectionRecordValue,
} from './emergencyLightingInspectionRecord';
import {
  FIRE_EXTINGUISHER_TEST_RECORD_COLUMNS,
  FIRE_EXTINGUISHER_TEST_RECORD_ROW_COUNT,
  normalizeFireExtinguisherTestRecordValue,
} from './fireExtinguisherTestRecord';
import {
  addIndividualDeviceRecordPage,
  getIndividualDeviceRecordElementId,
  getIndividualDeviceRecordPageIndices,
} from './individualDeviceRecordPages';
import {
  emptyIndividualDeviceRecordRow,
  INDIVIDUAL_DEVICE_RECORD_ROW_COUNT,
  normalizeIndividualDeviceRecordValue,
  type IndividualDeviceRecordRow,
} from './individualDeviceRecord';
import { walkFormElements } from './layout';
import {
  addRepeatableFormPage,
  getRepeatablePageIndices,
  type RepeatableFormPageKind,
} from './repeatableFormPages';
import { emptyReportGridRow, type ReportGridRow } from './reportRecordGrid';
import { setElementValue } from './values';
import type { FormElement, FormInspectionDocument, FormPage } from './types';

export type InsertTableRowsTarget = {
  elementId: string;
  pageIndex: number;
  /** 0-based data-row index within the page table. */
  rowIndex: number;
};

function findElement(
  document: FormInspectionDocument,
  elementId: string,
): FormElement | null {
  let found: FormElement | null = null;
  walkFormElements(document.form, (element) => {
    if (element.id === elementId) found = element;
  });
  return found;
}

function elementIdOfKind(page: FormPage, kind: FormElement['kind']): string | null {
  for (const section of page.sections) {
    for (const element of section.elements) {
      if (element.kind === kind) return element.id;
    }
  }
  return null;
}

function insertIntoFixedRows<T>(rows: T[], afterIndex: number, count: number, empty: () => T): T[] {
  const at = Math.max(0, Math.min(rows.length, afterIndex + 1));
  const next = [...rows.slice(0, at), ...Array.from({ length: count }, empty), ...rows.slice(at)];
  return next.slice(0, rows.length);
}

function insertAcrossPageChain<T>(args: {
  document: FormInspectionDocument;
  pageIndices: number[];
  getElementId: (page: FormPage) => string | null;
  rowCount: number;
  emptyRow: () => T;
  readRows: (raw: unknown) => T[];
  afterPageIndex: number;
  localRowIndex: number;
  count: number;
  refreshIndices: (doc: FormInspectionDocument) => number[];
  addPage: (doc: FormInspectionDocument, afterPageIndex: number) => FormInspectionDocument;
}): FormInspectionDocument | null {
  const {
    getElementId,
    rowCount,
    emptyRow,
    readRows,
    afterPageIndex,
    localRowIndex,
    count,
    refreshIndices,
    addPage,
  } = args;

  let document = args.document;
  let pageIndices = args.pageIndices;
  const seq = pageIndices.indexOf(afterPageIndex);
  if (seq < 0) return null;
  if (localRowIndex < 0 || localRowIndex >= rowCount) return null;

  const flattened: T[] = [];
  for (const pageIndex of pageIndices) {
    const page = document.form.pages[pageIndex];
    const elementId = page ? getElementId(page) : null;
    const rows = elementId
      ? readRows(document.values[elementId])
      : Array.from({ length: rowCount }, emptyRow);
    for (let i = 0; i < rowCount; i += 1) {
      flattened.push(rows[i] ?? emptyRow());
    }
  }

  const insertAt = seq * rowCount + localRowIndex + 1;
  let stream = [
    ...flattened.slice(0, insertAt),
    ...Array.from({ length: count }, emptyRow),
    ...flattened.slice(insertAt),
  ];

  while (pageIndices.length * rowCount < stream.length) {
    const last = pageIndices[pageIndices.length - 1];
    if (last == null) return null;
    document = addPage(document, last);
    pageIndices = refreshIndices(document);
  }

  while (stream.length < pageIndices.length * rowCount) {
    stream.push(emptyRow());
  }

  let values = document.values;
  for (let i = 0; i < pageIndices.length; i += 1) {
    const pageIndex = pageIndices[i]!;
    const page = document.form.pages[pageIndex];
    if (!page) continue;
    const elementId = getElementId(page);
    if (!elementId) continue;
    const chunk = stream.slice(i * rowCount, (i + 1) * rowCount);
    values = setElementValue(values, elementId, { rows: chunk });
  }

  return { ...document, values };
}

function insertSinglePageRows<T>(
  document: FormInspectionDocument,
  elementId: string,
  rowIndex: number,
  count: number,
  readRows: (raw: unknown) => T[],
  emptyRow: () => T,
): FormInspectionDocument {
  const rows = readRows(document.values[elementId]);
  const next = insertIntoFixedRows(rows, rowIndex, count, emptyRow);
  return {
    ...document,
    values: setElementValue(document.values, elementId, { rows: next }),
  };
}

function insertRepeatableGridRows(
  document: FormInspectionDocument,
  kind: RepeatableFormPageKind,
  elementKind: FormElement['kind'],
  afterPageIndex: number,
  localRowIndex: number,
  count: number,
  rowCount: number,
  emptyRow: () => ReportGridRow | AncillaryDeviceCircuitRow,
  readRows: (raw: unknown) => Array<ReportGridRow | AncillaryDeviceCircuitRow>,
): FormInspectionDocument | null {
  const pageIndices = getRepeatablePageIndices(document.form, kind);
  if (!pageIndices.includes(afterPageIndex)) return null;

  return insertAcrossPageChain({
    document,
    pageIndices,
    getElementId: (page) => elementIdOfKind(page, elementKind),
    rowCount,
    emptyRow,
    readRows,
    afterPageIndex,
    localRowIndex,
    count,
    refreshIndices: (doc) => getRepeatablePageIndices(doc.form, kind),
    addPage: (doc, after) => addRepeatableFormPage(doc, after),
  });
}

/**
 * Insert `count` empty data rows below the target row. For multi-page grids
 * (IDR / ADC / extinguisher / EL), content below shifts across pages and new
 * pages are added when needed (same as the page "+" control). Single-page
 * fixed tables shift within the page (bottom rows may fall off).
 */
export function insertEmptyTableRows(
  document: FormInspectionDocument,
  target: InsertTableRowsTarget,
  count: number,
): FormInspectionDocument | null {
  if (!Number.isInteger(count) || count < 1 || count > 10) return null;

  const element = findElement(document, target.elementId);
  if (!element) return null;

  switch (element.kind) {
    case 'individualDeviceRecord': {
      const pageIndices = getIndividualDeviceRecordPageIndices(document.form);
      return insertAcrossPageChain<IndividualDeviceRecordRow>({
        document,
        pageIndices,
        getElementId: getIndividualDeviceRecordElementId,
        rowCount: INDIVIDUAL_DEVICE_RECORD_ROW_COUNT,
        emptyRow: emptyIndividualDeviceRecordRow,
        readRows: (raw) => normalizeIndividualDeviceRecordValue(raw).rows,
        afterPageIndex: target.pageIndex,
        localRowIndex: target.rowIndex,
        count,
        refreshIndices: (doc) => getIndividualDeviceRecordPageIndices(doc.form),
        addPage: (doc, after) => addIndividualDeviceRecordPage(doc, after),
      });
    }
    case 'circuitFaultToleranceTestSheet':
      return insertSinglePageRows<CircuitFaultToleranceTestSheetRow>(
        document,
        target.elementId,
        target.rowIndex,
        count,
        (raw) => normalizeCircuitFaultToleranceTestSheetValue(raw).rows,
        emptyCircuitFaultToleranceTestSheetRow,
      );
    case 'attendanceLog':
      return insertSinglePageRows<AttendanceLogRow>(
        document,
        target.elementId,
        target.rowIndex,
        count,
        (raw) => normalizeAttendanceLogValue(raw).rows,
        emptyAttendanceLogRow,
      );
    case 'fireExtinguisherTestRecord':
      return insertRepeatableGridRows(
        document,
        'fireExtinguisherTestRecord',
        'fireExtinguisherTestRecord',
        target.pageIndex,
        target.rowIndex,
        count,
        FIRE_EXTINGUISHER_TEST_RECORD_ROW_COUNT,
        () => emptyReportGridRow(FIRE_EXTINGUISHER_TEST_RECORD_COLUMNS),
        (raw) => normalizeFireExtinguisherTestRecordValue(raw).rows,
      );
    case 'emergencyLightingInspectionRecord':
      return insertRepeatableGridRows(
        document,
        'emergencyLightingInspectionRecord',
        'emergencyLightingInspectionRecord',
        target.pageIndex,
        target.rowIndex,
        count,
        EMERGENCY_LIGHTING_INSPECTION_RECORD_ROW_COUNT,
        () => emptyReportGridRow(EMERGENCY_LIGHTING_INSPECTION_RECORD_COLUMNS),
        (raw) => normalizeEmergencyLightingInspectionRecordValue(raw).rows,
      );
    case 'ancillaryDeviceCircuitTest':
      return insertRepeatableGridRows(
        document,
        'ancillaryDeviceCircuitTest',
        'ancillaryDeviceCircuitTest',
        target.pageIndex,
        target.rowIndex,
        count,
        ANCILLARY_DEVICE_CIRCUIT_TEST_ROW_COUNT,
        emptyAncillaryDeviceCircuitRow,
        (raw) => normalizeAncillaryDeviceCircuitTestValue(raw).rows,
      );
    default:
      return null;
  }
}

/** True when this element kind supports structured Insert Line. */
export function supportsInsertTableRows(kind: FormElement['kind']): boolean {
  return (
    kind === 'individualDeviceRecord' ||
    kind === 'circuitFaultToleranceTestSheet' ||
    kind === 'attendanceLog' ||
    kind === 'fireExtinguisherTestRecord' ||
    kind === 'emergencyLightingInspectionRecord' ||
    kind === 'ancillaryDeviceCircuitTest'
  );
}
