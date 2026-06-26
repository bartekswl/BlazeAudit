export const CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_ROW_COUNT = 11;

export const CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_BODY_ROW_HEIGHT = '1.125rem';

export const CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_TITLE =
  '23.3 Circuit Fault Tolerance Test Sheet';

export type CircuitFaultToleranceTestSheetChoice = 'pass' | 'fail' | 'na';

export type CircuitFaultToleranceTestSheetRow = {
  circuitFaultTestLocation: string;
  short: string;
  open: string;
  ground: string;
  isolationResults: string;
  nonFaultedDeviceLocation: string;
  passOrFail: CircuitFaultToleranceTestSheetChoice | null;
};

export const CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_DATA_COLUMNS = [
  { key: 'circuitFaultTestLocation', widthPercent: 22 },
  { key: 'short', widthPercent: 8 },
  { key: 'open', widthPercent: 8 },
  { key: 'ground', widthPercent: 8 },
  { key: 'isolationResults', widthPercent: 22 },
  { key: 'nonFaultedDeviceLocation', widthPercent: 26 },
  { key: 'passOrFail', widthPercent: 6 },
] as const;

export type CircuitFaultToleranceTestSheetDataColumnKey =
  (typeof CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_DATA_COLUMNS)[number]['key'];

export const CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW1 = {
  location: 'Circuit Fault Test Location',
  faultGroup: 'Type of Fault (Record response time or indicate "N/A")',
  isolation: 'Isolation Results',
  nonFaultedGroup: 'Non-Faulted Circuit Location',
} as const;

export const CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW2 = {
  location:
    'Identify Device Location where circuit fault was introduced and description of affected NBC Fire Alarm zone or area',
  short: 'Short',
  open: 'Open',
  ground: 'Ground',
  isolation:
    'Identify NBC Fire Alarm Zone or area Location where devices failed due to fault condition',
  nonFaultedDevice:
    'Identify Individual Device tested for operation located in Non-Faulted NBC Fire Alarm zone or area',
  passOrFail: 'Pass or Fail',
} as const;

export const CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_LEGEND = [
  { tone: 'pass' as const, legendSymbol: 'P', label: 'Pass - Acceptable' },
  {
    tone: 'fail' as const,
    legendSymbol: 'F',
    label: 'Fail – Unacceptable (See Section 20.2 Deficiencies)',
  },
  { tone: 'na' as const, legendSymbol: 'Dash', label: 'Not applicable' },
] as const;

export type CircuitFaultToleranceTestSheetValue = {
  rows: CircuitFaultToleranceTestSheetRow[];
};

export function emptyCircuitFaultToleranceTestSheetRow(): CircuitFaultToleranceTestSheetRow {
  return {
    circuitFaultTestLocation: '',
    short: '',
    open: '',
    ground: '',
    isolationResults: '',
    nonFaultedDeviceLocation: '',
    passOrFail: null,
  };
}

export function emptyCircuitFaultToleranceTestSheetValue(): CircuitFaultToleranceTestSheetValue {
  return {
    rows: Array.from({ length: CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_ROW_COUNT }, () =>
      emptyCircuitFaultToleranceTestSheetRow(),
    ),
  };
}

function parseChoice(value: unknown): CircuitFaultToleranceTestSheetChoice | null {
  if (value === 'pass' || value === 'fail' || value === 'na') return value;
  return null;
}

export function normalizeCircuitFaultToleranceTestSheetValue(
  raw: unknown,
): CircuitFaultToleranceTestSheetValue {
  const base = emptyCircuitFaultToleranceTestSheetValue();
  if (!raw || typeof raw !== 'object') return base;

  const record = raw as { rows?: unknown };
  if (!Array.isArray(record.rows)) return base;
  const rows = record.rows as unknown[];

  return {
    rows: base.rows.map((emptyRow, index) => {
      const row = rows[index];
      if (!row || typeof row !== 'object') return emptyRow;
      const cells = row as Record<string, unknown>;
      return {
        circuitFaultTestLocation:
          typeof cells.circuitFaultTestLocation === 'string'
            ? cells.circuitFaultTestLocation
            : '',
        short: typeof cells.short === 'string' ? cells.short : '',
        open: typeof cells.open === 'string' ? cells.open : '',
        ground: typeof cells.ground === 'string' ? cells.ground : '',
        isolationResults:
          typeof cells.isolationResults === 'string' ? cells.isolationResults : '',
        nonFaultedDeviceLocation:
          typeof cells.nonFaultedDeviceLocation === 'string'
            ? cells.nonFaultedDeviceLocation
            : '',
        passOrFail: parseChoice(cells.passOrFail),
      };
    }),
  };
}

export function setCircuitFaultToleranceTestSheetText(
  value: CircuitFaultToleranceTestSheetValue,
  rowIndex: number,
  key: Exclude<CircuitFaultToleranceTestSheetDataColumnKey, 'passOrFail'>,
  next: string,
): CircuitFaultToleranceTestSheetValue {
  return {
    rows: value.rows.map((row, index) =>
      index === rowIndex ? { ...row, [key]: next } : row,
    ),
  };
}

export function setCircuitFaultToleranceTestSheetChoice(
  value: CircuitFaultToleranceTestSheetValue,
  rowIndex: number,
  next: CircuitFaultToleranceTestSheetChoice | null,
): CircuitFaultToleranceTestSheetValue {
  return {
    rows: value.rows.map((row, index) =>
      index === rowIndex ? { ...row, passOrFail: next } : row,
    ),
  };
}

export function cycleCircuitFaultToleranceTestSheetChoice(
  current: CircuitFaultToleranceTestSheetChoice | null,
): CircuitFaultToleranceTestSheetChoice | null {
  if (current === null) return 'pass';
  if (current === 'pass') return 'fail';
  if (current === 'fail') return 'na';
  return null;
}

export function circuitFaultToleranceTestSheetChoiceSymbol(
  choice: CircuitFaultToleranceTestSheetChoice | null,
): string {
  if (choice === 'pass') return 'P';
  if (choice === 'fail') return 'F';
  if (choice === 'na') return '—';
  return '';
}
