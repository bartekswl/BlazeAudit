export const ANNUNCIATOR_DEVICE_TEST_TITLE =
  '22.6 Annunciator, Remote Trouble Signal Unit, Display & Control Centre Test and Inspection';

export const ANNUNCIATOR_DEVICE_TEST_NOT_APPLICABLE_TEXT =
  'No Annunciator or Remote Trouble Unit is installed on this system.';

export const ANNUNCIATOR_DEVICE_TEST_NOT_APPLICABLE_SUFFIX = '(This Section is Not Applicable)';

export const ANNUNCIATOR_DEVICE_TEST_REF_LINES = [
  'See Section 10',
  'Complete section for each device.',
] as const;

export const ANNUNCIATOR_DEVICE_TEST_LOCATION_LABEL = 'Annunciator Location:';

export const ANNUNCIATOR_DEVICE_TEST_IDENTIFICATION_LABEL = 'Annunciator Identification:';

export interface AnnunciatorDeviceTestRow {
  id: string;
  letter: string;
  text: string;
}

export const ANNUNCIATOR_DEVICE_TEST_ROWS: AnnunciatorDeviceTestRow[] = [
  { id: 'a', letter: 'A', text: 'Power "on" indicator operates.' },
  {
    id: 'b',
    letter: 'B',
    text: 'Individual alarm and supervisory input zone clearly indicated and separately designated.',
  },
  {
    id: 'c',
    letter: 'C',
    text: 'Individual alarm and supervisory input zone designation labels are properly identified.',
  },
  {
    id: 'd',
    letter: 'D',
    text: 'Where active and supporting field devices are utilized, device labels correspond with actual field location.',
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
    text: 'Switches for ancillary functions operate as per design and specification, or in accordance with the documentation detailed in Annex D, Description of Fire Alarm System for Inspection and Test Procedures.',
  },
  { id: 'j', letter: 'J', text: 'Ancillary functions visual indicators operate.' },
  {
    id: 'k',
    letter: 'K',
    text: 'Manual activation of alarm signal and indication operates.',
  },
  { id: 'l', letter: 'L', text: 'Displays are visible in the installed location.' },
  { id: 'm', letter: 'M', text: 'Operates on emergency power.' },
];

export type AnnunciatorDeviceTestChoice = 'yes' | 'no' | 'na';

export interface AnnunciatorDeviceTestRowValue {
  choice: AnnunciatorDeviceTestChoice | null;
}

export interface AnnunciatorDeviceTestValue {
  sectionNotApplicable: boolean;
  fieldLocation: string;
  identification: string;
  checklist: Record<string, AnnunciatorDeviceTestRowValue>;
}

function emptyChecklist(): Record<string, AnnunciatorDeviceTestRowValue> {
  return Object.fromEntries(
    ANNUNCIATOR_DEVICE_TEST_ROWS.map((row) => [row.id, { choice: null }]),
  );
}

export function emptyAnnunciatorDeviceTestValue(): AnnunciatorDeviceTestValue {
  return {
    sectionNotApplicable: false,
    fieldLocation: '',
    identification: '',
    checklist: emptyChecklist(),
  };
}

export function normalizeAnnunciatorDeviceTestValue(value: unknown): AnnunciatorDeviceTestValue {
  const base = emptyAnnunciatorDeviceTestValue();
  if (!value || typeof value !== 'object') return base;

  const record = value as Record<string, unknown>;
  const checklistRaw = record.checklist;
  const checklist =
    checklistRaw && typeof checklistRaw === 'object'
      ? { ...base.checklist, ...(checklistRaw as Record<string, AnnunciatorDeviceTestRowValue>) }
      : base.checklist;

  return {
    sectionNotApplicable: record.sectionNotApplicable === true,
    fieldLocation: typeof record.fieldLocation === 'string' ? record.fieldLocation : '',
    identification: typeof record.identification === 'string' ? record.identification : '',
    checklist,
  };
}

export function setAnnunciatorDeviceTestSectionNotApplicable(
  value: AnnunciatorDeviceTestValue,
  sectionNotApplicable: boolean,
): AnnunciatorDeviceTestValue {
  if (!sectionNotApplicable) {
    return {
      ...value,
      sectionNotApplicable: false,
      checklist: Object.fromEntries(
        ANNUNCIATOR_DEVICE_TEST_ROWS.map((row) => [row.id, { choice: null }]),
      ),
    };
  }

  return {
    ...value,
    sectionNotApplicable: true,
    checklist: Object.fromEntries(
      ANNUNCIATOR_DEVICE_TEST_ROWS.map((row) => [row.id, { choice: 'na' as const }]),
    ),
  };
}

export function setAnnunciatorDeviceTestFieldLocation(
  value: AnnunciatorDeviceTestValue,
  fieldLocation: string,
): AnnunciatorDeviceTestValue {
  return { ...value, fieldLocation };
}

export function setAnnunciatorDeviceTestIdentification(
  value: AnnunciatorDeviceTestValue,
  identification: string,
): AnnunciatorDeviceTestValue {
  return { ...value, identification };
}

export function setAnnunciatorDeviceTestChoice(
  value: AnnunciatorDeviceTestValue,
  rowId: string,
  choice: AnnunciatorDeviceTestChoice | null,
): AnnunciatorDeviceTestValue {
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
