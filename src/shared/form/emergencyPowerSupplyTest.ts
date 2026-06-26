export type EmergencyPowerSupplyTestChoice = 'yes' | 'no' | 'na';

export type EmergencyPowerSupplyTestRowKind =
  | 'checklist'
  | 'batteryMeasure'
  | 'textFill'
  | 'valueFill'
  | 'valueWithChoice'
  | 'testType';

export type EmergencyPowerSupplyMeasureVariant = 'c' | 'd' | 'e';

export type EmergencyPowerSupplyTestRowDef = {
  id: string;
  letter: string;
  text: string;
  kind?: EmergencyPowerSupplyTestRowKind;
  measureVariant?: EmergencyPowerSupplyMeasureVariant;
  valueUnit?: string;
  valueKey?: 'p' | 'q' | 's';
};

export const EMERGENCY_POWER_SUPPLY_TEST_TITLE =
  '22.5 Emergency Power Supply Test and Inspection';

export const EMERGENCY_POWER_SUPPLY_TEST_SUBTITLE =
  'See 9.2, 9.3, 9.4 and Annex C, Battery Tests';

export const EMERGENCY_POWER_SUPPLY_TEST_REF =
  'Complete section for each emergency power supply';

export const EMERGENCY_POWER_SUPPLY_TEST_FIELD_LOCATION_LABEL =
  'Emergency Power Supply Field Location:';

export const EMERGENCY_POWER_SUPPLY_TEST_IDENTIFICATION_LABEL =
  'Emergency Power Supply Identification:';

export const EMERGENCY_POWER_SUPPLY_PROVIDED_BY_LABEL =
  'Emergency power supply is provided by:';

export const EMERGENCY_POWER_SUPPLY_PROVIDED_BY_OPTIONS = [
  { id: 'batteries', label: 'Batteries' },
  { id: 'generator', label: 'Generator' },
  { id: 'ups', label: 'UPS' },
  { id: 'combination', label: 'Combination' },
] as const;

export const EMERGENCY_POWER_SUPPLY_BATTERY_TYPE_LABEL = 'Battery Type (as installed):';

export const EMERGENCY_POWER_SUPPLY_BATTERY_TYPE_OPTIONS = [
  { id: 'sealedLeadAcid', label: 'Sealed Lead Acid' },
  { id: 'niCad', label: 'Ni-Cad' },
  { id: 'lithiumIon', label: 'Lithium-Ion' },
  { id: 'wetLead', label: 'Wet Lead' },
] as const;

export const EMERGENCY_POWER_SUPPLY_BATTERY_CAPACITY_LABEL =
  'Battery Capacity (as installed):';

export const EMERGENCY_POWER_SUPPLY_NBC_TIME_LABEL =
  'NBC required full load alarm operation time:';

export const EMERGENCY_POWER_SUPPLY_NBC_TIME_OPTIONS = [
  { id: '2h', label: '2 hours' },
  { id: '1h', label: '1 hour' },
  { id: '30m', label: '30 minutes' },
  { id: '5m', label: '5 minutes' },
] as const;

export const EMERGENCY_POWER_SUPPLY_FIELD_WIDTH_CH = 8;

/** DOM `<tr>` count in the main inspection table body (includes O sub-rows). */
export const EMERGENCY_POWER_SUPPLY_TEST_MAIN_TABLE_BODY_ROWS = 25;

export const EMERGENCY_POWER_SUPPLY_TEST_ROWS: EmergencyPowerSupplyTestRowDef[] = [
  {
    id: 'epst-a',
    letter: 'A',
    text: 'Correct battery type as recommended by the manufacturer.',
  },
  {
    id: 'epst-b',
    letter: 'B',
    text: 'Correct battery rating as determined by battery calculations based on full system load.',
  },
  {
    id: 'epst-c',
    letter: 'C',
    text: '',
    kind: 'batteryMeasure',
    measureVariant: 'c',
  },
  {
    id: 'epst-d',
    letter: 'D',
    text: '',
    kind: 'batteryMeasure',
    measureVariant: 'd',
  },
  {
    id: 'epst-e',
    letter: 'E',
    text: '',
    kind: 'batteryMeasure',
    measureVariant: 'e',
  },
  {
    id: 'epst-f',
    letter: 'F',
    text: 'Battery free of physical damage.',
  },
  {
    id: 'epst-g',
    letter: 'G',
    text: 'Battery terminals cleaned and lubricated.',
  },
  {
    id: 'epst-h',
    letter: 'H',
    text: 'Battery terminals clamped tightly.',
  },
  {
    id: 'epst-i',
    letter: 'I',
    text: 'Correct electrolyte level.',
  },
  {
    id: 'epst-j',
    letter: 'J',
    text: "Specific gravity of the electrolyte is within the battery manufacturer's specifications.",
  },
  {
    id: 'epst-k',
    letter: 'K',
    text: 'Inspected for electrolyte leakage.',
  },
  {
    id: 'epst-l',
    letter: 'L',
    text: 'Adequately ventilated.',
  },
  {
    id: 'epst-m',
    letter: 'M',
    text: "Record manufacturer's date code or in-service date:",
    kind: 'textFill',
  },
  {
    id: 'epst-n',
    letter: 'N',
    text: 'Disconnection causes trouble signal.',
  },
  {
    id: 'epst-o',
    letter: 'O',
    text: 'Indicate type of test performed on a fully charged battery (select one):',
    kind: 'testType',
  },
  {
    id: 'epst-p',
    letter: 'P',
    text: 'Record calculated battery capacity (refer to Annex C2).',
    kind: 'valueFill',
    valueUnit: 'AH',
    valueKey: 'p',
  },
  {
    id: 'epst-q',
    letter: 'Q',
    text: 'Record the battery terminal voltage after tests are completed.',
    kind: 'valueFill',
    valueUnit: 'VDC',
    valueKey: 'q',
  },
  {
    id: 'epst-r',
    letter: 'R',
    text: 'Battery voltage not less than 85% of its rated capacity after tests completed.',
  },
  {
    id: 'epst-s',
    letter: 'S',
    text: 'Battery Charging Current:',
    kind: 'valueFill',
    valueUnit: 'A',
    valueKey: 's',
  },
];

export const EMERGENCY_POWER_SUPPLY_TEST_TYPE_OPTIONS = [
  {
    id: 'i',
    key: 'i' as const,
    label: 'Required supervisory load for 24 h followed by the required full load operation;',
  },
  {
    id: 'ii',
    key: 'ii' as const,
    label: 'Silent accelerated test. (Refer to Annex C1, New Silent Accelerated Test Method); or',
  },
  {
    id: 'iii',
    key: 'iii' as const,
    label: "Battery manufacturer's method. Specify:",
  },
] as const;

export const EMERGENCY_POWER_SUPPLY_GENERATOR_TITLE =
  'Emergency Power Generator Tests (Reference 9.3)';

export const EMERGENCY_POWER_SUPPLY_GENERATOR_ROWS = [
  {
    id: 'epst-gen-a',
    letter: 'A',
    text: 'Generator provides power to the AC circuit serving the fire alarm system.',
  },
  {
    id: 'epst-gen-b',
    letter: 'B',
    text: 'Trouble conditions at the emergency generator shall result in an audible common trouble signal and a visual indication at the required annunciator.',
  },
  {
    id: 'epst-gen-c',
    letter: 'C',
    text: 'Generator "Run" condition at the emergency generator shall result in an audible common trouble signal and a visual indication at the required annunciator.',
  },
] as const;

export const EMERGENCY_POWER_SUPPLY_CHECKLIST_ROW_IDS = [
  ...EMERGENCY_POWER_SUPPLY_TEST_ROWS.filter(
    (row) =>
      row.kind !== 'batteryMeasure' &&
      row.kind !== 'textFill' &&
      row.kind !== 'valueFill' &&
      row.kind !== 'testType',
  ).map((row) => row.id),
  ...EMERGENCY_POWER_SUPPLY_GENERATOR_ROWS.map((row) => row.id),
];

export type EmergencyPowerSupplyMeasureFields = {
  voltage: string;
  current: string;
};

export type EmergencyPowerSupplyTestTypeKey = 'i' | 'ii' | 'iii';

export type EmergencyPowerSupplyTestTypeValue = {
  i: EmergencyPowerSupplyTestChoice | null;
  ii: EmergencyPowerSupplyTestChoice | null;
  iii: EmergencyPowerSupplyTestChoice | null;
  specify: string;
};

export type EmergencyPowerSupplyTestRowValue = {
  choice: EmergencyPowerSupplyTestChoice | null;
};

export type EmergencyPowerSupplyTestValue = {
  fieldLocation: string;
  identification: string;
  providedBy: Record<string, boolean>;
  batteryType: Record<string, boolean>;
  batteryCapacity: string;
  nbcAlarmTime: string | null;
  checklist: Record<string, EmergencyPowerSupplyTestRowValue>;
  measures: Record<EmergencyPowerSupplyMeasureVariant, EmergencyPowerSupplyMeasureFields>;
  dateCode: string;
  valueFills: {
    p: string;
    q: string;
    s: string;
  };
  testType: EmergencyPowerSupplyTestTypeValue;
};

function emptyProvidedBy(): Record<string, boolean> {
  return Object.fromEntries(
    EMERGENCY_POWER_SUPPLY_PROVIDED_BY_OPTIONS.map((opt) => [opt.id, false]),
  );
}

function emptyBatteryType(): Record<string, boolean> {
  return Object.fromEntries(
    EMERGENCY_POWER_SUPPLY_BATTERY_TYPE_OPTIONS.map((opt) => [opt.id, false]),
  );
}

function emptyMeasure(): EmergencyPowerSupplyMeasureFields {
  return { voltage: '', current: '' };
}

export function emptyEmergencyPowerSupplyTestValue(): EmergencyPowerSupplyTestValue {
  return {
    fieldLocation: '',
    identification: '',
    providedBy: emptyProvidedBy(),
    batteryType: emptyBatteryType(),
    batteryCapacity: '',
    nbcAlarmTime: null,
    checklist: Object.fromEntries(
      EMERGENCY_POWER_SUPPLY_CHECKLIST_ROW_IDS.map((id) => [id, { choice: null }]),
    ),
    measures: { c: emptyMeasure(), d: emptyMeasure(), e: emptyMeasure() },
    dateCode: '',
    valueFills: { p: '', q: '', s: '' },
    testType: { i: null, ii: null, iii: null, specify: '' },
  };
}

export function normalizeEmergencyPowerSupplyTestValue(
  raw: unknown,
): EmergencyPowerSupplyTestValue {
  const base = emptyEmergencyPowerSupplyTestValue();
  if (!raw || typeof raw !== 'object') return base;

  const record = raw as Partial<EmergencyPowerSupplyTestValue> & {
    testType?: Partial<EmergencyPowerSupplyTestTypeValue> & {
      annexC1?: EmergencyPowerSupplyTestChoice | null;
      annexC2?: EmergencyPowerSupplyTestChoice | null;
      other?: EmergencyPowerSupplyTestChoice | null;
    };
  };
  const next = { ...base };

  if (typeof record.fieldLocation === 'string') next.fieldLocation = record.fieldLocation;
  if (typeof record.identification === 'string') next.identification = record.identification;
  if (typeof record.batteryCapacity === 'string') next.batteryCapacity = record.batteryCapacity;
  if (typeof record.dateCode === 'string') next.dateCode = record.dateCode;
  if (
    record.nbcAlarmTime === '2h' ||
    record.nbcAlarmTime === '1h' ||
    record.nbcAlarmTime === '30m' ||
    record.nbcAlarmTime === '5m'
  ) {
    next.nbcAlarmTime = record.nbcAlarmTime;
  }

  if (record.providedBy && typeof record.providedBy === 'object') {
    for (const opt of EMERGENCY_POWER_SUPPLY_PROVIDED_BY_OPTIONS) {
      const val = (record.providedBy as Record<string, unknown>)[opt.id];
      if (typeof val === 'boolean') next.providedBy[opt.id] = val;
    }
  }

  if (record.batteryType && typeof record.batteryType === 'object') {
    for (const opt of EMERGENCY_POWER_SUPPLY_BATTERY_TYPE_OPTIONS) {
      const val = (record.batteryType as Record<string, unknown>)[opt.id];
      if (typeof val === 'boolean') next.batteryType[opt.id] = val;
    }
  }

  if (record.checklist && typeof record.checklist === 'object') {
    const checklist = record.checklist as Record<string, unknown>;
    for (const rowId of EMERGENCY_POWER_SUPPLY_CHECKLIST_ROW_IDS) {
      const entry = checklist[rowId];
      if (!entry || typeof entry !== 'object') continue;
      const row = entry as Record<string, unknown>;
      const choice = row.choice;
      next.checklist[rowId] = {
        choice:
          choice === 'yes' || choice === 'no' || choice === 'na' ? choice : null,
      };
    }
  }

  if (record.measures && typeof record.measures === 'object') {
    const measures = record.measures as Record<string, unknown>;
    for (const key of ['c', 'd', 'e'] as const) {
      const entry = measures[key];
      if (!entry || typeof entry !== 'object') continue;
      const m = entry as Record<string, unknown>;
      next.measures[key] = {
        voltage: typeof m.voltage === 'string' ? m.voltage : '',
        current: typeof m.current === 'string' ? m.current : '',
      };
    }
  }

  if (record.valueFills && typeof record.valueFills === 'object') {
    const fills = record.valueFills as Record<string, unknown>;
    for (const key of ['p', 'q', 's'] as const) {
      if (typeof fills[key] === 'string') next.valueFills[key] = fills[key];
    }
  }

  if (record.testType && typeof record.testType === 'object') {
    const tt = record.testType;
    const pick = (v: unknown) =>
      v === 'yes' || v === 'no' || v === 'na' ? v : null;
    next.testType = {
      i: pick(tt.i ?? tt.annexC1),
      ii: pick(tt.ii ?? tt.annexC2),
      iii: pick(tt.iii ?? tt.other),
      specify: typeof tt.specify === 'string' ? tt.specify : '',
    };
  }

  return next;
}

export function setEmergencyPowerSupplyTestChoice(
  value: EmergencyPowerSupplyTestValue,
  rowId: string,
  choice: EmergencyPowerSupplyTestChoice,
): EmergencyPowerSupplyTestValue {
  return {
    ...value,
    checklist: {
      ...value.checklist,
      [rowId]: { ...value.checklist[rowId], choice },
    },
  };
}

export function setEmergencyPowerSupplyTestFieldLocation(
  value: EmergencyPowerSupplyTestValue,
  fieldLocation: string,
): EmergencyPowerSupplyTestValue {
  return { ...value, fieldLocation };
}

export function setEmergencyPowerSupplyTestIdentification(
  value: EmergencyPowerSupplyTestValue,
  identification: string,
): EmergencyPowerSupplyTestValue {
  return { ...value, identification };
}

export function toggleEmergencyPowerSupplyProvidedBy(
  value: EmergencyPowerSupplyTestValue,
  optionId: string,
  checked: boolean,
): EmergencyPowerSupplyTestValue {
  return {
    ...value,
    providedBy: { ...value.providedBy, [optionId]: checked },
  };
}

export function toggleEmergencyPowerSupplyBatteryType(
  value: EmergencyPowerSupplyTestValue,
  optionId: string,
  checked: boolean,
): EmergencyPowerSupplyTestValue {
  return {
    ...value,
    batteryType: { ...value.batteryType, [optionId]: checked },
  };
}

export function setEmergencyPowerSupplyBatteryCapacity(
  value: EmergencyPowerSupplyTestValue,
  batteryCapacity: string,
): EmergencyPowerSupplyTestValue {
  return {
    ...value,
    batteryCapacity: batteryCapacity.slice(0, EMERGENCY_POWER_SUPPLY_FIELD_WIDTH_CH),
  };
}

export function setEmergencyPowerSupplyNbcAlarmTime(
  value: EmergencyPowerSupplyTestValue,
  nbcAlarmTime: string | null,
): EmergencyPowerSupplyTestValue {
  return { ...value, nbcAlarmTime };
}

export function setEmergencyPowerSupplyMeasure(
  value: EmergencyPowerSupplyTestValue,
  variant: EmergencyPowerSupplyMeasureVariant,
  field: keyof EmergencyPowerSupplyMeasureFields,
  fieldValue: string,
): EmergencyPowerSupplyTestValue {
  return {
    ...value,
    measures: {
      ...value.measures,
      [variant]: {
        ...value.measures[variant],
        [field]: fieldValue.slice(0, EMERGENCY_POWER_SUPPLY_FIELD_WIDTH_CH),
      },
    },
  };
}

export function setEmergencyPowerSupplyDateCode(
  value: EmergencyPowerSupplyTestValue,
  dateCode: string,
): EmergencyPowerSupplyTestValue {
  return { ...value, dateCode };
}

export function setEmergencyPowerSupplyValueFill(
  value: EmergencyPowerSupplyTestValue,
  key: 'p' | 'q' | 's',
  fill: string,
): EmergencyPowerSupplyTestValue {
  return {
    ...value,
    valueFills: {
      ...value.valueFills,
      [key]: fill.slice(0, EMERGENCY_POWER_SUPPLY_FIELD_WIDTH_CH),
    },
  };
}

export function setEmergencyPowerSupplyTestTypeChoice(
  value: EmergencyPowerSupplyTestValue,
  key: EmergencyPowerSupplyTestTypeKey,
  choice: EmergencyPowerSupplyTestChoice,
): EmergencyPowerSupplyTestValue {
  return {
    ...value,
    testType: { ...value.testType, [key]: choice },
  };
}

export function setEmergencyPowerSupplyTestTypeSpecify(
  value: EmergencyPowerSupplyTestValue,
  specify: string,
): EmergencyPowerSupplyTestValue {
  return {
    ...value,
    testType: { ...value.testType, specify },
  };
}

export function measureCurrentUnit(variant: EmergencyPowerSupplyMeasureVariant): string {
  return variant === 'e' ? 'A' : 'mA';
}

export function measureVoltageLabel(variant: EmergencyPowerSupplyMeasureVariant): string {
  if (variant === 'c') return "Battery voltage (main power 'on'):";
  if (variant === 'd') {
    return "Battery voltage — main power 'off' — FAS in supervisory condition:";
  }
  return "Battery voltage — main power 'off' — FAS in full load ALARM:";
}

export function measureCurrentLabel(variant: EmergencyPowerSupplyMeasureVariant): string {
  if (variant === 'c') return "Battery charging current (main power 'on'):";
  if (variant === 'd') {
    return "Battery current — main power 'off' — FAS in supervisory condition:";
  }
  return "Battery current — main power 'off' — FAS in full load ALARM:";
}
