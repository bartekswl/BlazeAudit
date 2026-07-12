export const PRINTER_TEST_TITLE = '22.9 Printer Test';

export const PRINTER_TEST_NOT_APPLICABLE_TEXT = 'There are no printers on this system.';

export const PRINTER_TEST_NOT_APPLICABLE_SUFFIX = '(This Section is Not Applicable)';

export const PRINTER_TEST_REF =
  'If the fire alarm system DOES utilize printers, complete 22.9 for each printer unit.';

export const PRINTER_TEST_LOCATION_LABEL = 'Printer Location:';

export const PRINTER_TEST_IDENTIFICATION_LABEL = 'Printer Identification:';

export interface PrinterTestRow {
  id: string;
  letter: string;
  text: string;
}

export const PRINTER_TEST_ROWS: PrinterTestRow[] = [
  {
    id: 'a',
    letter: 'A',
    text: 'Operates as per design and specification, or in accordance with documentation as detailed in Annex D, Description of Fire Alarm System for Inspection and Test Procedures.',
  },
  { id: 'b', letter: 'B', text: 'Zone of each alarm initiating device is correctly printed.' },
];

export type PrinterTestChoice = 'yes' | 'no' | 'na';

export interface PrinterTestRowValue {
  choice: PrinterTestChoice | null;
}

export interface PrinterTestValue {
  sectionNotApplicable: boolean;
  fieldLocation: string;
  identification: string;
  checklist: Record<string, PrinterTestRowValue>;
}

function emptyChecklist(): Record<string, PrinterTestRowValue> {
  return Object.fromEntries(PRINTER_TEST_ROWS.map((row) => [row.id, { choice: null }]));
}

export function emptyPrinterTestValue(): PrinterTestValue {
  return {
    sectionNotApplicable: false,
    fieldLocation: '',
    identification: '',
    checklist: emptyChecklist(),
  };
}

export function normalizePrinterTestValue(value: unknown): PrinterTestValue {
  const base = emptyPrinterTestValue();
  if (!value || typeof value !== 'object') return base;

  const record = value as Record<string, unknown>;
  const checklistRaw = record.checklist;
  const checklist =
    checklistRaw && typeof checklistRaw === 'object'
      ? { ...base.checklist, ...(checklistRaw as Record<string, PrinterTestRowValue>) }
      : base.checklist;

  return {
    sectionNotApplicable: record.sectionNotApplicable === true,
    fieldLocation: typeof record.fieldLocation === 'string' ? record.fieldLocation : '',
    identification: typeof record.identification === 'string' ? record.identification : '',
    checklist,
  };
}

export function setPrinterTestSectionNotApplicable(
  value: PrinterTestValue,
  sectionNotApplicable: boolean,
): PrinterTestValue {
  if (!sectionNotApplicable) {
    return {
      ...value,
      sectionNotApplicable: false,
      checklist: Object.fromEntries(
        PRINTER_TEST_ROWS.map((row) => [row.id, { choice: null }]),
      ),
    };
  }

  return {
    ...value,
    sectionNotApplicable: true,
    checklist: Object.fromEntries(
      PRINTER_TEST_ROWS.map((row) => [row.id, { choice: 'na' as const }]),
    ),
  };
}

export function setPrinterTestFieldLocation(
  value: PrinterTestValue,
  fieldLocation: string,
): PrinterTestValue {
  return { ...value, fieldLocation };
}

export function setPrinterTestIdentification(
  value: PrinterTestValue,
  identification: string,
): PrinterTestValue {
  return { ...value, identification };
}

export function setPrinterTestChoice(
  value: PrinterTestValue,
  rowId: string,
  choice: PrinterTestChoice | null,
): PrinterTestValue {
  const row = value.checklist[rowId] ?? { choice: null };
  return {
    ...value,
    sectionNotApplicable: false,
    checklist: {
      ...value.checklist,
      [rowId]: { ...row, choice },
    },
  };
}
