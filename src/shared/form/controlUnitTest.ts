export type ControlUnitTestChoice = 'yes' | 'no' | 'na';

export type ControlUnitTestRowDef = {
  id: string;
  letter: string;
  text: string;
  kind?: 'checklist' | 'firmware';
};

export const CONTROL_UNIT_TEST_INTRO =
  '22.1 Control Unit or Transponder Inspection';

export const CONTROL_UNIT_TEST_REF =
  '(Reference Clause 8.2) Complete section for each control unit or transponder.';

export const CONTROL_UNIT_TEST_FIELD_LOCATION_LABEL =
  'Control Unit/Transponder Field Location:';

export const CONTROL_UNIT_TEST_IDENTIFICATION_LABEL =
  'Control Unit/Transponder Identification:';

export const CONTROL_UNIT_TEST_FIRMWARE_PROMPT =
  'Record the date, revision and version of firmware:';

export const CONTROL_UNIT_TEST_SOFTWARE_PROMPT =
  'Record the date, revision and version of the program software:';

export const CONTROL_UNIT_TEST_ROWS: ControlUnitTestRowDef[] = [
  {
    id: 'cut-a',
    letter: 'A',
    text: 'Input circuit designations correctly identified in relation to connected field devices.',
  },
  {
    id: 'cut-b',
    letter: 'B',
    text: 'Output circuit designations correctly identified in relation to connected field devices.',
  },
  {
    id: 'cut-c',
    letter: 'C',
    text: 'Correct designations for common control functions and indicators.',
  },
  {
    id: 'cut-d',
    letter: 'D',
    text: 'Plug-in components and modules securely in place.',
  },
  {
    id: 'cut-e',
    letter: 'E',
    text: 'Plug-in cables securely in place.',
  },
  {
    id: 'cut-f',
    letter: 'F',
    text: '',
    kind: 'firmware',
  },
  {
    id: 'cut-g',
    letter: 'G',
    text: 'Control unit/transponder is clean and free of dust and dirt.',
  },
  {
    id: 'cut-h',
    letter: 'H',
    text: 'Fuses in accordance with the manufacturer’s specification.',
  },
  {
    id: 'cut-i',
    letter: 'I',
    text: 'Control unit/transponder lock is functional.',
  },
  {
    id: 'cut-j',
    letter: 'J',
    text: 'Termination points for wiring to field devices secure.',
  },
];

export const CONTROL_UNIT_TEST_CHECKLIST_ROW_IDS = CONTROL_UNIT_TEST_ROWS.filter(
  (row) => row.kind !== 'firmware',
).map((row) => row.id);

export type ControlUnitTestVersionFields = {
  date: string;
  revision: string;
  version: string;
};

export type ControlUnitTestChecklistRowValue = {
  choice: ControlUnitTestChoice | null;
};

export type ControlUnitTestValue = {
  fieldLocation: string;
  identification: string;
  checklist: Record<string, ControlUnitTestChecklistRowValue>;
  firmware: ControlUnitTestVersionFields;
  software: ControlUnitTestVersionFields;
};

function emptyVersionFields(): ControlUnitTestVersionFields {
  return { date: '', revision: '', version: '' };
}

export function emptyControlUnitTestValue(): ControlUnitTestValue {
  return {
    fieldLocation: '',
    identification: '',
    checklist: Object.fromEntries(
      CONTROL_UNIT_TEST_CHECKLIST_ROW_IDS.map((id) => [id, { choice: null }]),
    ),
    firmware: emptyVersionFields(),
    software: emptyVersionFields(),
  };
}

function normalizeVersionFields(raw: unknown): ControlUnitTestVersionFields {
  const base = emptyVersionFields();
  if (!raw || typeof raw !== 'object') return base;
  const record = raw as Record<string, unknown>;
  return {
    date: typeof record.date === 'string' ? record.date : '',
    revision: typeof record.revision === 'string' ? record.revision : '',
    version: typeof record.version === 'string' ? record.version : '',
  };
}

export function normalizeControlUnitTestValue(raw: unknown): ControlUnitTestValue {
  const base = emptyControlUnitTestValue();
  if (!raw || typeof raw !== 'object') return base;

  const record = raw as Partial<ControlUnitTestValue>;
  const next = { ...base };

  if (typeof record.fieldLocation === 'string') {
    next.fieldLocation = record.fieldLocation;
  }
  if (typeof record.identification === 'string') {
    next.identification = record.identification;
  }
  next.firmware = normalizeVersionFields(record.firmware);
  next.software = normalizeVersionFields(record.software);

  if (record.checklist && typeof record.checklist === 'object') {
    const checklist = record.checklist as Record<string, unknown>;
    for (const rowId of CONTROL_UNIT_TEST_CHECKLIST_ROW_IDS) {
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

  return next;
}

export function setControlUnitTestChoice(
  value: ControlUnitTestValue,
  rowId: string,
  choice: ControlUnitTestChoice | null,
): ControlUnitTestValue {
  return {
    ...value,
    checklist: {
      ...value.checklist,
      [rowId]: { choice },
    },
  };
}

export function setControlUnitTestFieldLocation(
  value: ControlUnitTestValue,
  fieldLocation: string,
): ControlUnitTestValue {
  return { ...value, fieldLocation };
}

export function setControlUnitTestIdentification(
  value: ControlUnitTestValue,
  identification: string,
): ControlUnitTestValue {
  return { ...value, identification };
}

export function setControlUnitTestFirmware(
  value: ControlUnitTestValue,
  firmware: ControlUnitTestVersionFields,
): ControlUnitTestValue {
  return { ...value, firmware };
}

export function setControlUnitTestSoftware(
  value: ControlUnitTestValue,
  software: ControlUnitTestVersionFields,
): ControlUnitTestValue {
  return { ...value, software };
}
