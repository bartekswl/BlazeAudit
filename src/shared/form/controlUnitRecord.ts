export type ControlUnitRecordChoice = 'yes' | 'no' | 'na';

export type ControlUnitRecordRowKind = 'checklist' | 'timeFill';

export type ControlUnitRecordRowDef = {
  id: string;
  letter: string;
  text: string;
  kind?: ControlUnitRecordRowKind;
  yesDisabled?: boolean;
  noDisabled?: boolean;
};

export const CONTROL_UNIT_RECORD_TITLE = '22.2 Control Unit or Transponder Record';

export const CONTROL_UNIT_RECORD_REF =
  '(See 8.3) Complete section for each control unit or transponder.';

export const CONTROL_UNIT_RECORD_FIELD_LOCATION_LABEL =
  'Control Unit/Transponder Field Location:';

export const CONTROL_UNIT_RECORD_IDENTIFICATION_LABEL =
  'Control Unit/Transponder Identification:';

export const CONTROL_UNIT_RECORD_FOOTER_NOTE =
  'Note: This table has been editorially corrected to include the “Time and Date Indication” that is missing in 8.3. This correction displaces 8.3(b) and necessarily adds (ee).';

export const CONTROL_UNIT_RECORD_ROWS: ControlUnitRecordRowDef[] = [
  { id: 'cur-a', letter: 'A', text: "Power 'on' visual indicator operates." },
  {
    id: 'cur-b',
    letter: 'B',
    text: 'Time and date indication corresponds with local time and date.',
  },
  { id: 'cur-c', letter: 'C', text: 'Common visual trouble signal operates.' },
  { id: 'cur-d', letter: 'D', text: 'Common audible trouble signal operates.' },
  { id: 'cur-e', letter: 'E', text: 'Trouble signal silence switch operates.' },
  {
    id: 'cur-f',
    letter: 'F',
    text: 'Main Power supply failure trouble signal operates.',
  },
  {
    id: 'cur-g',
    letter: 'G',
    text: 'Ground fault tested on positive and negative initiates trouble signal.',
  },
  { id: 'cur-h', letter: 'H', text: 'Alert signal operates.' },
  { id: 'cur-i', letter: 'I', text: 'Alarm signal operates.' },
  {
    id: 'cur-j',
    letter: 'J',
    text: 'Automatic transfer from alert signal to alarm signal operates.',
    kind: 'timeFill',
  },
  {
    id: 'cur-k',
    letter: 'K',
    text: 'Manual transfer from alert signal to alarm signal.',
  },
  {
    id: 'cur-l',
    letter: 'L',
    text: 'Automatic transfer from alert to alarm signal cancel (acknowledge) operates on a two-stage system.',
  },
  {
    id: 'cur-m',
    letter: 'M',
    text: 'Alarm signal silence inhibit function operates.',
  },
  { id: 'cur-n', letter: 'N', text: 'Alarm signal manual silence operates.' },
  {
    id: 'cur-o',
    letter: 'O',
    text: 'Alarm signal silence visual indication operates.',
  },
  {
    id: 'cur-p',
    letter: 'P',
    text: 'Alarm signal when silenced, automatically reinitiate only upon subsequent alarm from another NBC required fire alarm zone.',
  },
  {
    id: 'cur-q',
    letter: 'Q',
    text: 'Duration of alarm signal prior to automatic silence.',
    kind: 'timeFill',
    yesDisabled: true,
    noDisabled: true,
  },
  {
    id: 'cur-r',
    letter: 'R',
    text: 'Audible, visual, alert, and alarm signals programmed and operate per design and specification; or documentation as provided in Section 21.',
  },
  {
    id: 'cur-s',
    letter: 'S',
    text: 'Input circuit alarm and supervisory operation including audible and visual indicator operates.',
  },
  {
    id: 'cur-t',
    letter: 'T',
    text: 'Input circuit supervision fault causes a trouble indication.',
  },
  { id: 'cur-u', letter: 'U', text: 'Output circuit alarm indicators operate.' },
  {
    id: 'cur-v',
    letter: 'V',
    text: 'Output circuit supervision fault causes a trouble indication.',
  },
  { id: 'cur-w', letter: 'W', text: 'Visual indicator test (lamp test) operates.' },
  {
    id: 'cur-x',
    letter: 'X',
    text: 'Coded signal sequence operates not less than the required number of times and the correct alarm signal thereafter.',
  },
  {
    id: 'cur-y',
    letter: 'Y',
    text: 'Coded signal sequences are not interrupted by subsequent alarms.',
  },
  {
    id: 'cur-z',
    letter: 'Z',
    text: 'Ancillary device control circuit is rated for the intended purpose.',
  },
  {
    id: 'cur-aa',
    letter: 'AA',
    text: 'Ancillary device bypass results in trouble signal.',
  },
  {
    id: 'cur-bb',
    letter: 'BB',
    text: 'Input circuit to output circuit operation including ancillary device for correct program operation as per design and specification, or documentation as detailed in Annex D, Description of Fire Alarm System for Inspection and Test Procedures.',
  },
  { id: 'cur-cc', letter: 'CC', text: 'System Reset operates.' },
  {
    id: 'cur-dd',
    letter: 'DD',
    text: 'Main power to emergency power supply transfer operates.',
  },
  {
    id: 'cur-ee',
    letter: 'EE',
    text: 'Smoke detector alarm verification (status change confirmation) verified. [Refer to 14.4.3, Smoke Detector Alarm Verification (Status Change Confirmation)].',
  },
];

export const CONTROL_UNIT_RECORD_CHECKLIST_ROW_IDS = CONTROL_UNIT_RECORD_ROWS.map(
  (row) => row.id,
);

export const CONTROL_UNIT_RECORD_TIME_ROW_IDS = CONTROL_UNIT_RECORD_ROWS.filter(
  (row) => row.kind === 'timeFill',
).map((row) => row.id);

export type ControlUnitRecordRowValue = {
  choice: ControlUnitRecordChoice | null;
  time?: string;
};

export type ControlUnitRecordValue = {
  fieldLocation: string;
  identification: string;
  checklist: Record<string, ControlUnitRecordRowValue>;
};

export function emptyControlUnitRecordValue(): ControlUnitRecordValue {
  return {
    fieldLocation: '',
    identification: '',
    checklist: Object.fromEntries(
      CONTROL_UNIT_RECORD_CHECKLIST_ROW_IDS.map((id) => [
        id,
        {
          choice: null,
          ...(CONTROL_UNIT_RECORD_TIME_ROW_IDS.includes(id) ? { time: '' } : {}),
        },
      ]),
    ),
  };
}

export function normalizeControlUnitRecordValue(raw: unknown): ControlUnitRecordValue {
  const base = emptyControlUnitRecordValue();
  if (!raw || typeof raw !== 'object') return base;

  const record = raw as Partial<ControlUnitRecordValue>;
  const next = { ...base };

  if (typeof record.fieldLocation === 'string') {
    next.fieldLocation = record.fieldLocation;
  }
  if (typeof record.identification === 'string') {
    next.identification = record.identification;
  }

  if (record.checklist && typeof record.checklist === 'object') {
    const checklist = record.checklist as Record<string, unknown>;
    for (const rowId of CONTROL_UNIT_RECORD_CHECKLIST_ROW_IDS) {
      const entry = checklist[rowId];
      if (!entry || typeof entry !== 'object') continue;
      const row = entry as Record<string, unknown>;
      const choice = row.choice;
      next.checklist[rowId] = {
        choice:
          choice === 'yes' || choice === 'no' || choice === 'na' ? choice : null,
        ...(CONTROL_UNIT_RECORD_TIME_ROW_IDS.includes(rowId)
          ? { time: typeof row.time === 'string' ? row.time : '' }
          : {}),
      };
    }
  }

  return next;
}

export function setControlUnitRecordChoice(
  value: ControlUnitRecordValue,
  rowId: string,
  choice: ControlUnitRecordChoice,
): ControlUnitRecordValue {
  return {
    ...value,
    checklist: {
      ...value.checklist,
      [rowId]: {
        ...value.checklist[rowId],
        choice,
      },
    },
  };
}

export function setControlUnitRecordTime(
  value: ControlUnitRecordValue,
  rowId: string,
  time: string,
): ControlUnitRecordValue {
  return {
    ...value,
    checklist: {
      ...value.checklist,
      [rowId]: {
        ...value.checklist[rowId],
        time,
      },
    },
  };
}

export function setControlUnitRecordFieldLocation(
  value: ControlUnitRecordValue,
  fieldLocation: string,
): ControlUnitRecordValue {
  return { ...value, fieldLocation };
}

export function setControlUnitRecordIdentification(
  value: ControlUnitRecordValue,
  identification: string,
): ControlUnitRecordValue {
  return { ...value, identification };
}
