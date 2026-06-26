export const REMOTE_TROUBLE_SIGNAL_UNIT_TEST_TITLE =
  '22.8 Remote Trouble Signal Unit Test and Inspection';

export const REMOTE_TROUBLE_SIGNAL_UNIT_TEST_NOT_APPLICABLE_TEXT =
  'No Remote Trouble Signal Unit is installed in this system.';

export const REMOTE_TROUBLE_SIGNAL_UNIT_TEST_NOT_APPLICABLE_SUFFIX =
  '(This Section is Not Applicable)';

export const REMOTE_TROUBLE_SIGNAL_UNIT_TEST_REF =
  'If the fire alarm system DOES utilize remote trouble signal unit, complete 22.8 for each remote trouble signal unit.';

export const REMOTE_TROUBLE_SIGNAL_UNIT_TEST_LOCATION_LABEL =
  'Remote trouble signal unit location:';

export const REMOTE_TROUBLE_SIGNAL_UNIT_TEST_IDENTIFICATION_LABEL =
  'Remote trouble signal unit identification:';

export interface RemoteTroubleSignalUnitTestRow {
  id: string;
  letter: string;
  text: string;
}

export const REMOTE_TROUBLE_SIGNAL_UNIT_TEST_ROWS: RemoteTroubleSignalUnitTestRow[] = [
  {
    id: 'a',
    letter: 'A',
    text: 'Input wiring from control unit or transponder is supervised.',
  },
  { id: 'b', letter: 'B', text: 'Visual trouble signal operates.' },
  { id: 'c', letter: 'C', text: 'Audible trouble signal operates.' },
  { id: 'd', letter: 'D', text: 'Audible trouble signal silence operates.' },
];

export type RemoteTroubleSignalUnitTestChoice = 'yes' | 'no' | 'na';

export interface RemoteTroubleSignalUnitTestRowValue {
  choice: RemoteTroubleSignalUnitTestChoice | null;
}

export interface RemoteTroubleSignalUnitTestValue {
  sectionNotApplicable: boolean;
  fieldLocation: string;
  identification: string;
  checklist: Record<string, RemoteTroubleSignalUnitTestRowValue>;
}

function emptyChecklist(): Record<string, RemoteTroubleSignalUnitTestRowValue> {
  return Object.fromEntries(
    REMOTE_TROUBLE_SIGNAL_UNIT_TEST_ROWS.map((row) => [row.id, { choice: null }]),
  );
}

export function emptyRemoteTroubleSignalUnitTestValue(): RemoteTroubleSignalUnitTestValue {
  return {
    sectionNotApplicable: false,
    fieldLocation: '',
    identification: '',
    checklist: emptyChecklist(),
  };
}

export function normalizeRemoteTroubleSignalUnitTestValue(
  value: unknown,
): RemoteTroubleSignalUnitTestValue {
  const base = emptyRemoteTroubleSignalUnitTestValue();
  if (!value || typeof value !== 'object') return base;

  const record = value as Record<string, unknown>;
  const checklistRaw = record.checklist;
  const checklist =
    checklistRaw && typeof checklistRaw === 'object'
      ? {
          ...base.checklist,
          ...(checklistRaw as Record<string, RemoteTroubleSignalUnitTestRowValue>),
        }
      : base.checklist;

  return {
    sectionNotApplicable: record.sectionNotApplicable === true,
    fieldLocation: typeof record.fieldLocation === 'string' ? record.fieldLocation : '',
    identification: typeof record.identification === 'string' ? record.identification : '',
    checklist,
  };
}

export function setRemoteTroubleSignalUnitTestSectionNotApplicable(
  value: RemoteTroubleSignalUnitTestValue,
  sectionNotApplicable: boolean,
): RemoteTroubleSignalUnitTestValue {
  return { ...value, sectionNotApplicable };
}

export function setRemoteTroubleSignalUnitTestFieldLocation(
  value: RemoteTroubleSignalUnitTestValue,
  fieldLocation: string,
): RemoteTroubleSignalUnitTestValue {
  return { ...value, fieldLocation };
}

export function setRemoteTroubleSignalUnitTestIdentification(
  value: RemoteTroubleSignalUnitTestValue,
  identification: string,
): RemoteTroubleSignalUnitTestValue {
  return { ...value, identification };
}

export function setRemoteTroubleSignalUnitTestChoice(
  value: RemoteTroubleSignalUnitTestValue,
  rowId: string,
  choice: RemoteTroubleSignalUnitTestChoice,
): RemoteTroubleSignalUnitTestValue {
  const row = value.checklist[rowId] ?? { choice: null };
  return {
    ...value,
    checklist: {
      ...value.checklist,
      [rowId]: { ...row, choice },
    },
  };
}
