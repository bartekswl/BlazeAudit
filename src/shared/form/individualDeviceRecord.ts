export const INDIVIDUAL_DEVICE_RECORD_ROW_COUNT = 22;

export const INDIVIDUAL_DEVICE_RECORD_BODY_ROW_HEIGHT = '0.8125rem';

export type IndividualDeviceRecordChoice = 'yes' | 'no' | 'na';

export type IndividualDeviceRecordColumnKind = 'text' | 'choice';

export type IndividualDeviceRecordColumnDef = {
  key: keyof IndividualDeviceRecordRow;
  title: string;
  widthPercent: number;
  orientation: 'horizontal' | 'vertical';
  kind: IndividualDeviceRecordColumnKind;
};

export type IndividualDeviceRecordRow = {
  deviceLocation: string;
  annunciationLabel: string;
  deviceType: string;
  requiresService: IndividualDeviceRecordChoice | null;
  circuitNumber: string;
  fireZone: string;
  correctlyInstalled: IndividualDeviceRecordChoice | null;
  measurements: string;
  alarmConfirmed: IndividualDeviceRecordChoice | null;
  annunciatorIndication: IndividualDeviceRecordChoice | null;
  supervisedCircuitTrouble: IndividualDeviceRecordChoice | null;
  comments: string;
};

export const INDIVIDUAL_DEVICE_RECORD_COLUMNS: readonly IndividualDeviceRecordColumnDef[] = [
  {
    key: 'deviceLocation',
    title: 'Device Location',
    widthPercent: 26,
    orientation: 'horizontal',
    kind: 'text',
  },
  {
    key: 'annunciationLabel',
    title: 'Annunciation Label or LCD Text Displayed (if applicable)',
    widthPercent: 10,
    orientation: 'horizontal',
    kind: 'text',
  },
  {
    key: 'deviceType',
    title: 'Device Type',
    widthPercent: 5,
    orientation: 'vertical',
    kind: 'text',
  },
  {
    key: 'requiresService',
    title: 'Requires Service, Repairs, Cleaning or Missing',
    widthPercent: 7,
    orientation: 'vertical',
    kind: 'choice',
  },
  {
    key: 'circuitNumber',
    title: 'Circuit Number or Address',
    widthPercent: 10,
    orientation: 'vertical',
    kind: 'text',
  },
  {
    key: 'fireZone',
    title: 'Annunciated FIRE ZONE',
    widthPercent: 6,
    orientation: 'vertical',
    kind: 'text',
  },
  {
    key: 'correctlyInstalled',
    title: 'Correctly Installed',
    widthPercent: 3,
    orientation: 'vertical',
    kind: 'choice',
  },
  {
    key: 'measurements',
    title: 'Measurement',
    widthPercent: 8,
    orientation: 'vertical',
    kind: 'text',
  },
  {
    key: 'alarmConfirmed',
    title: 'Alarm /\nActivation\nConfirmed',
    widthPercent: 4,
    orientation: 'vertical',
    kind: 'choice',
  },
  {
    key: 'annunciatorIndication',
    title: 'Annunciator Indication',
    widthPercent: 3,
    orientation: 'vertical',
    kind: 'choice',
  },
  {
    key: 'supervisedCircuitTrouble',
    title: 'Supervised Circuit Trouble Signal',
    widthPercent: 5,
    orientation: 'vertical',
    kind: 'choice',
  },
  {
    key: 'comments',
    title: 'Comments',
    widthPercent: 13,
    orientation: 'horizontal',
    kind: 'text',
  },
] as const;

export type IndividualDeviceRecordValue = {
  rows: IndividualDeviceRecordRow[];
};

export const INDIVIDUAL_DEVICE_RECORD_LEGEND = [
  { tone: 'yes' as const, legendSymbol: '✓', label: 'Yes - Acceptable' },
  {
    tone: 'no' as const,
    legendSymbol: 'X',
    label: 'No - Unacceptable (See Section 20.2 Deficiencies)',
  },
  { tone: 'na' as const, legendSymbol: 'Dash', label: 'Not Applicable' },
] as const;

export function emptyIndividualDeviceRecordRow(): IndividualDeviceRecordRow {
  return {
    deviceLocation: '',
    annunciationLabel: '',
    deviceType: '',
    requiresService: null,
    circuitNumber: '',
    fireZone: '',
    correctlyInstalled: null,
    measurements: '',
    alarmConfirmed: null,
    annunciatorIndication: null,
    supervisedCircuitTrouble: null,
    comments: '',
  };
}

export function emptyIndividualDeviceRecordValue(): IndividualDeviceRecordValue {
  return {
    rows: Array.from({ length: INDIVIDUAL_DEVICE_RECORD_ROW_COUNT }, () =>
      emptyIndividualDeviceRecordRow(),
    ),
  };
}

function parseChoice(value: unknown): IndividualDeviceRecordChoice | null {
  if (value === 'yes' || value === 'no' || value === 'na') return value;
  return null;
}

export function normalizeIndividualDeviceRecordValue(raw: unknown): IndividualDeviceRecordValue {
  const base = emptyIndividualDeviceRecordValue();
  if (!raw || typeof raw !== 'object') return base;

  const record = raw as { rows?: unknown };
  if (!Array.isArray(record.rows)) return base;
  const rows = record.rows as unknown[];

  return {
    rows: base.rows.map((emptyRow, index) => {
      const row = rows[index];
      if (!row || typeof row !== 'object') return emptyRow;
      const cells = row as Record<string, unknown>;
      const next: IndividualDeviceRecordRow = { ...emptyRow };
      for (const col of INDIVIDUAL_DEVICE_RECORD_COLUMNS) {
        if (col.kind === 'choice') {
          const key = col.key as keyof Pick<
            IndividualDeviceRecordRow,
            | 'requiresService'
            | 'correctlyInstalled'
            | 'alarmConfirmed'
            | 'annunciatorIndication'
            | 'supervisedCircuitTrouble'
          >;
          next[key] = parseChoice(cells[col.key]);
        } else if (typeof cells[col.key] === 'string') {
          const key = col.key as keyof Omit<
            IndividualDeviceRecordRow,
            | 'requiresService'
            | 'correctlyInstalled'
            | 'alarmConfirmed'
            | 'annunciatorIndication'
            | 'supervisedCircuitTrouble'
          >;
          next[key] = cells[col.key] as string;
        }
      }
      return next;
    }),
  };
}

/** True when any cell on the sheet has text or a Yes/No/N/A choice set. */
export function individualDeviceRecordHasContent(raw: unknown): boolean {
  const data = normalizeIndividualDeviceRecordValue(raw);
  return data.rows.some((row) =>
    INDIVIDUAL_DEVICE_RECORD_COLUMNS.some((col) => {
      if (col.kind === 'choice') {
        return row[col.key] !== null;
      }
      const text = row[col.key];
      return typeof text === 'string' && text.trim().length > 0;
    }),
  );
}

export function setIndividualDeviceRecordText(
  value: IndividualDeviceRecordValue,
  rowIndex: number,
  key: Extract<keyof IndividualDeviceRecordRow, string>,
  next: string,
): IndividualDeviceRecordValue {
  return {
    rows: value.rows.map((row, index) =>
      index === rowIndex ? { ...row, [key]: next } : row,
    ),
  };
}

export function setIndividualDeviceRecordChoice(
  value: IndividualDeviceRecordValue,
  rowIndex: number,
  key: Extract<keyof IndividualDeviceRecordRow, string>,
  next: IndividualDeviceRecordChoice | null,
): IndividualDeviceRecordValue {
  return {
    rows: value.rows.map((row, index) =>
      index === rowIndex ? { ...row, [key]: next } : row,
    ),
  };
}

export function cycleIndividualDeviceRecordChoice(
  current: IndividualDeviceRecordChoice | null,
): IndividualDeviceRecordChoice | null {
  if (current === null) return 'yes';
  if (current === 'yes') return 'no';
  if (current === 'no') return 'na';
  return null;
}

export function individualDeviceRecordChoiceSymbol(
  choice: IndividualDeviceRecordChoice | null,
): string {
  if (choice === 'yes') return '✓';
  if (choice === 'no') return 'X';
  if (choice === 'na') return '—';
  return '';
}
