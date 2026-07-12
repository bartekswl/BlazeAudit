export const SEQUENTIAL_DISPLAY_TEST_TITLE = '22.7 Annunciators or Sequential Displays';

export const SEQUENTIAL_DISPLAY_TEST_NOT_APPLICABLE_TEXT =
  'No Annunciator or Sequential Display is installed in this system.';

export const SEQUENTIAL_DISPLAY_TEST_NOT_APPLICABLE_SUFFIX = '(This Section is Not Applicable)';

export const SEQUENTIAL_DISPLAY_TEST_REF_LINES = [
  'See Section 10.2',
  'If the fire alarm system DOES utilize remote annunciators, complete 22.7 for each annunciator or sequential display.',
] as const;

export const SEQUENTIAL_DISPLAY_TEST_LOCATION_LABEL = 'Annunciator/Sequential Display Location:';

export const SEQUENTIAL_DISPLAY_TEST_IDENTIFICATION_LABEL =
  'Annunciator/Sequential Display Identification:';

export interface SequentialDisplayTestRow {
  id: string;
  letter: string;
  text: string;
}

export const SEQUENTIAL_DISPLAY_TEST_ROWS: SequentialDisplayTestRow[] = [
  { id: 'a', letter: 'A', text: 'Power "on" indicator operates.' },
  {
    id: 'b',
    letter: 'B',
    text: 'Individual alarm and supervisory zone designation labels are properly identified.',
  },
  {
    id: 'c',
    letter: 'C',
    text: 'Where individual devices are also annunciated confirm the individual alarm and supervisory indications are properly identified.',
  },
  {
    id: 'd',
    letter: 'D',
    text: 'Where active and supporting field devices are utilized, the device location and programmed device label/descriptor shall be confirmed.',
  },
  { id: 'e', letter: 'E', text: 'Common trouble signal operates.' },
  { id: 'f', letter: 'F', text: 'Visual indicator test (lamp test) operates.' },
  {
    id: 'g',
    letter: 'G',
    text: 'Input wiring from control unit or transponder is supervised.',
  },
  { id: 'h', letter: 'H', text: 'Alarm signal silence visual indicator operates.' },
  {
    id: 'i',
    letter: 'I',
    text: 'Switches for ancillary functions operate as per design and specification, or in accordance with documentation as detailed in Section 21. (See Section 7.)',
  },
  { id: 'j', letter: 'J', text: 'Ancillary functions visual indicators operate.' },
  {
    id: 'k',
    letter: 'K',
    text: 'Manual activation of alarm signal and indication operates.',
  },
  { id: 'l', letter: 'L', text: 'Displays are visible in the installed location.' },
  {
    id: 'm',
    letter: 'M',
    text: 'Multi-line sequential display operates as per 10.2, where utilized.',
  },
];

export type SequentialDisplayTestChoice = 'yes' | 'no' | 'na';

export interface SequentialDisplayTestRowValue {
  choice: SequentialDisplayTestChoice | null;
}

export interface SequentialDisplayTestValue {
  sectionNotApplicable: boolean;
  fieldLocation: string;
  identification: string;
  checklist: Record<string, SequentialDisplayTestRowValue>;
}

function emptyChecklist(): Record<string, SequentialDisplayTestRowValue> {
  return Object.fromEntries(
    SEQUENTIAL_DISPLAY_TEST_ROWS.map((row) => [row.id, { choice: null }]),
  );
}

export function emptySequentialDisplayTestValue(): SequentialDisplayTestValue {
  return {
    sectionNotApplicable: false,
    fieldLocation: '',
    identification: '',
    checklist: emptyChecklist(),
  };
}

export function normalizeSequentialDisplayTestValue(value: unknown): SequentialDisplayTestValue {
  const base = emptySequentialDisplayTestValue();
  if (!value || typeof value !== 'object') return base;

  const record = value as Record<string, unknown>;
  const checklistRaw = record.checklist;
  const checklist =
    checklistRaw && typeof checklistRaw === 'object'
      ? { ...base.checklist, ...(checklistRaw as Record<string, SequentialDisplayTestRowValue>) }
      : base.checklist;

  return {
    sectionNotApplicable: record.sectionNotApplicable === true,
    fieldLocation: typeof record.fieldLocation === 'string' ? record.fieldLocation : '',
    identification: typeof record.identification === 'string' ? record.identification : '',
    checklist,
  };
}

export function setSequentialDisplayTestSectionNotApplicable(
  value: SequentialDisplayTestValue,
  sectionNotApplicable: boolean,
): SequentialDisplayTestValue {
  if (!sectionNotApplicable) {
    return {
      ...value,
      sectionNotApplicable: false,
      checklist: Object.fromEntries(
        SEQUENTIAL_DISPLAY_TEST_ROWS.map((row) => [row.id, { choice: null }]),
      ),
    };
  }

  return {
    ...value,
    sectionNotApplicable: true,
    checklist: Object.fromEntries(
      SEQUENTIAL_DISPLAY_TEST_ROWS.map((row) => [row.id, { choice: 'na' as const }]),
    ),
  };
}

export function setSequentialDisplayTestFieldLocation(
  value: SequentialDisplayTestValue,
  fieldLocation: string,
): SequentialDisplayTestValue {
  return { ...value, fieldLocation };
}

export function setSequentialDisplayTestIdentification(
  value: SequentialDisplayTestValue,
  identification: string,
): SequentialDisplayTestValue {
  return { ...value, identification };
}

export function setSequentialDisplayTestChoice(
  value: SequentialDisplayTestValue,
  rowId: string,
  choice: SequentialDisplayTestChoice | null,
): SequentialDisplayTestValue {
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
