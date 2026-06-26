export const DATA_COMMUNICATION_LINK_FAULT_TOLERANCE_TITLE =
  '22.12 Operation Test Circuit Fault Tolerance';

export const DCLFT_NOT_APPLICABLE_SUFFIX = '(This Section is Not Applicable)';

export const DCLFT_NOT_APPLICABLE_PRIMARY_TEXT =
  'There are no Data Communication Link (DCL) circuits on this system.';

export const DCLFT_NOT_APPLICABLE_ADDITIONAL_TEXT =
  'There are no additional Data Communication Link (DCL) circuits on this system.';

export const DCLFT_REF =
  'Refer to Section 12, Operation Tests for Data Communication Link (DCL), and 23.3 Circuit Fault Tolerance Test Sheet.';

export const DCLFT_CONTROL_UNIT_LOCATION_LABEL = 'Control Unit or Transponder Location:';

export const DCLFT_CONTROL_UNIT_IDENTIFICATION_LABEL =
  'Control Unit or Transponder Identification:';

export const DCLFT_DCL_CIRCUIT_IDENTIFICATION_LABEL =
  'Data Communication Link Circuit Identification:';

export type DclftChoice = 'yes' | 'no' | 'na';

export type DclftBlockId = 'primary' | 'additional';

export type DclftRowDef = {
  id: string;
  letter: string;
  text: string;
};

export const DCLFT_ROWS: DclftRowDef[] = [
  {
    id: 'dclft-a',
    letter: 'A',
    text: 'Each system abnormal condition specified in Table 3.1 tested for each data communication link at the control unit or transponder.',
  },
  {
    id: 'dclft-b',
    letter: 'B',
    text: 'Tests for alarm and trouble received under a single ground fault condition conducted on each conductor of that data communication independently.',
  },
  {
    id: 'dclft-c',
    letter: 'C',
    text: 'Each conductor in a data communication link, Class A (DCLA) tested for the capability of providing an alarm signal on each side of a single open circuit fault condition.',
  },
  {
    id: 'dclft-d',
    letter: 'D',
    text: 'Where data communication link(s) are installed without fault isolation, impose a wire-to-wire short circuit fault on each data communication link during a non-fire alarm condition and confirm receipt of trouble and alarm conditions from each adjacent data communication link (record results in 23.3, Circuit Fault Tolerance Test Sheet).',
  },
  {
    id: 'dclft-e',
    letter: 'E',
    text: 'Where fault isolators are installed in data communication links serving field devices, impose wire-to-wire short on the isolated side during non-fire alarm condition, confirm annunciation of the fault, and then operate a device on the source side, and confirm activation at the control unit or transponder (record results in 23.3, Circuit Fault Tolerance Test Sheet).',
  },
  {
    id: 'dclft-f',
    letter: 'F',
    text: 'Where fault isolation in data communication links is provided between control units or transponders, the field wiring shorted between each pair of control units or transponders, in turn, annunciation of the fault confirmed and operation outside the shorted section confirmed (record results in 23.3, Circuit Fault Tolerance Test Sheet).',
  },
];

export interface DclftRowValue {
  choice: DclftChoice | null;
}

export interface DclftBlockValue {
  sectionNotApplicable: boolean;
  controlUnitLocation: string;
  controlUnitIdentification: string;
  dclCircuitIdentification: string;
  checklist: Record<string, DclftRowValue>;
}

export interface DataCommunicationLinkFaultToleranceValue {
  primary: DclftBlockValue;
  additional: DclftBlockValue;
}

function emptyChecklist(): Record<string, DclftRowValue> {
  return Object.fromEntries(DCLFT_ROWS.map((row) => [row.id, { choice: null }]));
}

function emptyBlock(): DclftBlockValue {
  return {
    sectionNotApplicable: false,
    controlUnitLocation: '',
    controlUnitIdentification: '',
    dclCircuitIdentification: '',
    checklist: emptyChecklist(),
  };
}

export function emptyDataCommunicationLinkFaultToleranceValue(): DataCommunicationLinkFaultToleranceValue {
  return {
    primary: emptyBlock(),
    additional: emptyBlock(),
  };
}

function normalizeBlock(value: unknown): DclftBlockValue {
  const base = emptyBlock();
  if (!value || typeof value !== 'object') return base;

  const record = value as Record<string, unknown>;
  const checklistRaw = record.checklist;
  const checklist =
    checklistRaw && typeof checklistRaw === 'object'
      ? { ...base.checklist, ...(checklistRaw as Record<string, DclftRowValue>) }
      : base.checklist;

  return {
    sectionNotApplicable: record.sectionNotApplicable === true,
    controlUnitLocation:
      typeof record.controlUnitLocation === 'string' ? record.controlUnitLocation : '',
    controlUnitIdentification:
      typeof record.controlUnitIdentification === 'string'
        ? record.controlUnitIdentification
        : '',
    dclCircuitIdentification:
      typeof record.dclCircuitIdentification === 'string'
        ? record.dclCircuitIdentification
        : '',
    checklist,
  };
}

export function normalizeDataCommunicationLinkFaultToleranceValue(
  value: unknown,
): DataCommunicationLinkFaultToleranceValue {
  const base = emptyDataCommunicationLinkFaultToleranceValue();
  if (!value || typeof value !== 'object') return base;

  const record = value as Record<string, unknown>;
  return {
    primary: normalizeBlock(record.primary),
    additional: normalizeBlock(record.additional),
  };
}

function setBlockSectionNotApplicable(
  block: DclftBlockValue,
  sectionNotApplicable: boolean,
): DclftBlockValue {
  if (!sectionNotApplicable) {
    return {
      ...block,
      sectionNotApplicable: false,
      checklist: emptyChecklist(),
    };
  }

  return {
    ...block,
    sectionNotApplicable: true,
    checklist: Object.fromEntries(
      DCLFT_ROWS.map((row) => [row.id, { choice: 'na' as const }]),
    ),
  };
}

export function setDclftSectionNotApplicable(
  value: DataCommunicationLinkFaultToleranceValue,
  blockId: DclftBlockId,
  sectionNotApplicable: boolean,
): DataCommunicationLinkFaultToleranceValue {
  return {
    ...value,
    [blockId]: setBlockSectionNotApplicable(value[blockId], sectionNotApplicable),
  };
}

export function setDclftControlUnitLocation(
  value: DataCommunicationLinkFaultToleranceValue,
  blockId: DclftBlockId,
  controlUnitLocation: string,
): DataCommunicationLinkFaultToleranceValue {
  return {
    ...value,
    [blockId]: { ...value[blockId], controlUnitLocation },
  };
}

export function setDclftControlUnitIdentification(
  value: DataCommunicationLinkFaultToleranceValue,
  blockId: DclftBlockId,
  controlUnitIdentification: string,
): DataCommunicationLinkFaultToleranceValue {
  return {
    ...value,
    [blockId]: { ...value[blockId], controlUnitIdentification },
  };
}

export function setDclftDclCircuitIdentification(
  value: DataCommunicationLinkFaultToleranceValue,
  blockId: DclftBlockId,
  dclCircuitIdentification: string,
): DataCommunicationLinkFaultToleranceValue {
  return {
    ...value,
    [blockId]: { ...value[blockId], dclCircuitIdentification },
  };
}

export function setDclftChoice(
  value: DataCommunicationLinkFaultToleranceValue,
  blockId: DclftBlockId,
  rowId: string,
  choice: DclftChoice,
): DataCommunicationLinkFaultToleranceValue {
  const block = value[blockId];
  const row = block.checklist[rowId] ?? { choice: null };
  return {
    ...value,
    [blockId]: {
      ...block,
      sectionNotApplicable: false,
      checklist: {
        ...block.checklist,
        [rowId]: { ...row, choice },
      },
    },
  };
}

export function dclftNotApplicableText(blockId: DclftBlockId): string {
  return blockId === 'primary'
    ? DCLFT_NOT_APPLICABLE_PRIMARY_TEXT
    : DCLFT_NOT_APPLICABLE_ADDITIONAL_TEXT;
}
