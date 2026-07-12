export const FIRE_SIGNAL_RECEIVING_CENTRE_INTERCONNECTION_TITLE =
  '22.11 Interconnection to the Fire Signal Receiving Centre';

export const FSRC_NOT_APPLICABLE_TEXT =
  'There are no interconnections to a Fire Signal Receiving Centre on this system.';

export const FSRC_NOT_APPLICABLE_SUFFIX = '(This Section is Not Applicable)';

export const FSRC_REF =
  'If the fire alarm system DOES have an interconnection to the fire signal receiving centre, complete 22.11 for each transmitter.';

export const FSRC_COMMUNICATOR_LOCATION_LABEL = 'Communicator Location:';

export const FSRC_CIRCUIT_DISCONNECT_LOCATION_LABEL = 'Circuit Disconnect Means Location:';

export const FSRC_CIRCUIT_PANEL_BREAKER_LABEL = 'Circuit Panel/Breaker Identification:';

export const FSRC_FOOTNOTE =
  'Note: Item "A" in this table has been editorially corrected to include both types of fire signal receiving centre transmitters identified in 8.4.1(a).';

export type FsrcChoice = 'yes' | 'no' | 'na';

export type FsrcRowChoiceMode = 'yes-no-na' | 'yes-no-na-blocked' | 'record-fields';

export type FsrcSubitem = {
  id: string;
  text: string;
};

export type FsrcRowDef = {
  id: string;
  letter: string;
  text?: string;
  /** When set, each sub-item gets its own Yes/No(/N/A) choice column group. */
  subItems?: FsrcSubitem[];
  choiceMode: FsrcRowChoiceMode;
};

export const FSRC_ROWS: FsrcRowDef[] = [
  {
    id: 'fsrc-a',
    letter: 'A',
    subItems: [
      {
        id: 'fsrc-a-integral',
        text: 'The fire signal receiving centre transmitter is integral to the fire alarm control unit.',
      },
      {
        id: 'fsrc-a-supervised',
        text: 'A supervised interconnection between the fire alarm control unit and a separately installed fire signal receiving centre transmitter is provided.',
      },
    ],
    choiceMode: 'yes-no-na-blocked',
  },
  {
    id: 'fsrc-b',
    letter: 'B',
    text: 'Confirm that the alarm transmission to the fire signal receiving centre is received.',
    choiceMode: 'yes-no-na-blocked',
  },
  {
    id: 'fsrc-c',
    letter: 'C',
    text: 'Confirm that the supervisory transmission to the fire signal receiving centre is received.',
    choiceMode: 'yes-no-na',
  },
  {
    id: 'fsrc-d',
    letter: 'D',
    text: 'Confirm that the trouble transmission to the fire signal receiving centre is received.',
    choiceMode: 'yes-no-na',
  },
  {
    id: 'fsrc-e',
    letter: 'E',
    text: 'Disabling or disconnecting the fire signal receiving centre transmitter results in a specific trouble signal at the control unit or transmitter.',
    choiceMode: 'yes-no-na',
  },
  {
    id: 'fsrc-f',
    letter: 'F',
    text: 'Disabling or disconnecting the fire signal receiving centre transmitter transmits a trouble signal to the fire signal receiving centre.',
    choiceMode: 'yes-no-na',
  },
  {
    id: 'fsrc-g',
    letter: 'G',
    text: 'Record the name and telephone number of the fire signal receiving centre.',
    choiceMode: 'record-fields',
  },
  {
    id: 'fsrc-h',
    letter: 'H',
    text: 'Operation of the fire signal receiving centre disconnect means transmits a trouble signal to the fire signal receiving centre.',
    choiceMode: 'yes-no-na',
  },
];

export function fsrcChoiceEntryIds(row: FsrcRowDef): string[] {
  if (row.choiceMode === 'record-fields') return [];
  if (row.subItems?.length) return row.subItems.map((item) => item.id);
  return [row.id];
}

function fsrcAllChoiceEntryIds(): string[] {
  return FSRC_ROWS.flatMap(fsrcChoiceEntryIds);
}

function migrateFsrcChecklist(
  checklist: Record<string, FsrcRowValue>,
): Record<string, FsrcRowValue> {
  const next = { ...checklist };
  const legacy = next['fsrc-a'];
  if (legacy && !next['fsrc-a-integral']) {
    next['fsrc-a-integral'] = legacy;
  }
  delete next['fsrc-a'];
  return next;
}

function buildEmptyChecklistChoiceEntries(): Array<[string, FsrcRowValue]> {
  return fsrcAllChoiceEntryIds().map((id): [string, FsrcRowValue] => [id, { choice: null }]);
}

function buildSectionNotApplicableChoiceEntries(): Array<[string, FsrcRowValue]> {
  return FSRC_ROWS.flatMap((row) =>
    fsrcChoiceEntryIds(row).map(
      (id): [string, FsrcRowValue] => [
        id,
        { choice: row.choiceMode === 'yes-no-na' ? 'na' : null },
      ],
    ),
  );
}

export interface FsrcRowValue {
  choice: FsrcChoice | null;
}

export interface FsrcRecordFields {
  company: string;
  address: string;
  telephone: string;
}

export interface FireSignalReceivingCentreInterconnectionValue {
  sectionNotApplicable: boolean;
  communicatorLocation: string;
  circuitDisconnectMeansLocation: string;
  circuitPanelBreakerIdentification: string;
  checklist: Record<string, FsrcRowValue>;
  recordFields: FsrcRecordFields;
}

function emptyChecklist(): Record<string, FsrcRowValue> {
  return Object.fromEntries(buildEmptyChecklistChoiceEntries());
}

export function emptyFireSignalReceivingCentreInterconnectionValue(): FireSignalReceivingCentreInterconnectionValue {
  return {
    sectionNotApplicable: false,
    communicatorLocation: '',
    circuitDisconnectMeansLocation: '',
    circuitPanelBreakerIdentification: '',
    checklist: emptyChecklist(),
    recordFields: { company: '', address: '', telephone: '' },
  };
}

export function normalizeFireSignalReceivingCentreInterconnectionValue(
  value: unknown,
): FireSignalReceivingCentreInterconnectionValue {
  const base = emptyFireSignalReceivingCentreInterconnectionValue();
  if (!value || typeof value !== 'object') return base;

  const record = value as Record<string, unknown>;
  const checklistRaw = record.checklist;
  const checklist =
    checklistRaw && typeof checklistRaw === 'object'
      ? migrateFsrcChecklist({
          ...base.checklist,
          ...(checklistRaw as Record<string, FsrcRowValue>),
        })
      : base.checklist;

  const recordFieldsRaw = record.recordFields;
  const recordFields =
    recordFieldsRaw && typeof recordFieldsRaw === 'object'
      ? {
          company:
            typeof (recordFieldsRaw as FsrcRecordFields).company === 'string'
              ? (recordFieldsRaw as FsrcRecordFields).company
              : '',
          address:
            typeof (recordFieldsRaw as FsrcRecordFields).address === 'string'
              ? (recordFieldsRaw as FsrcRecordFields).address
              : '',
          telephone:
            typeof (recordFieldsRaw as FsrcRecordFields).telephone === 'string'
              ? (recordFieldsRaw as FsrcRecordFields).telephone
              : '',
        }
      : base.recordFields;

  return {
    sectionNotApplicable: record.sectionNotApplicable === true,
    communicatorLocation:
      typeof record.communicatorLocation === 'string' ? record.communicatorLocation : '',
    circuitDisconnectMeansLocation:
      typeof record.circuitDisconnectMeansLocation === 'string'
        ? record.circuitDisconnectMeansLocation
        : '',
    circuitPanelBreakerIdentification:
      typeof record.circuitPanelBreakerIdentification === 'string'
        ? record.circuitPanelBreakerIdentification
        : '',
    checklist,
    recordFields,
  };
}

export function setFsrcSectionNotApplicable(
  value: FireSignalReceivingCentreInterconnectionValue,
  sectionNotApplicable: boolean,
): FireSignalReceivingCentreInterconnectionValue {
  if (!sectionNotApplicable) {
    return {
      ...value,
      sectionNotApplicable: false,
      checklist: Object.fromEntries(buildEmptyChecklistChoiceEntries()),
    };
  }

  return {
    ...value,
    sectionNotApplicable: true,
    checklist: Object.fromEntries(buildSectionNotApplicableChoiceEntries()),
  };
}

export function setFsrcCommunicatorLocation(
  value: FireSignalReceivingCentreInterconnectionValue,
  communicatorLocation: string,
): FireSignalReceivingCentreInterconnectionValue {
  return { ...value, communicatorLocation };
}

export function setFsrcCircuitDisconnectMeansLocation(
  value: FireSignalReceivingCentreInterconnectionValue,
  circuitDisconnectMeansLocation: string,
): FireSignalReceivingCentreInterconnectionValue {
  return { ...value, circuitDisconnectMeansLocation };
}

export function setFsrcCircuitPanelBreakerIdentification(
  value: FireSignalReceivingCentreInterconnectionValue,
  circuitPanelBreakerIdentification: string,
): FireSignalReceivingCentreInterconnectionValue {
  return { ...value, circuitPanelBreakerIdentification };
}

export function setFsrcChoice(
  value: FireSignalReceivingCentreInterconnectionValue,
  rowId: string,
  choice: FsrcChoice | null,
): FireSignalReceivingCentreInterconnectionValue {
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

export function setFsrcRecordField(
  value: FireSignalReceivingCentreInterconnectionValue,
  field: keyof FsrcRecordFields,
  next: string,
): FireSignalReceivingCentreInterconnectionValue {
  return {
    ...value,
    recordFields: {
      ...value.recordFields,
      [field]: next,
    },
  };
}
