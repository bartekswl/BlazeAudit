export type VoiceCommunicationTestChoice = 'yes' | 'no' | 'na';

export type VoiceCommunicationTestRowDef = {
  id: string;
  letter: string;
  text: string;
};

export const VOICE_COMMUNICATION_TEST_TITLE = '22.3 Voice Communication Test';

export const VOICE_COMMUNICATION_TEST_NOT_APPLICABLE_TEXT =
  'There are no Voice Communication capabilities on this system.';

export const VOICE_COMMUNICATION_TEST_NOT_APPLICABLE_SUFFIX =
  '(This Section is Not Applicable)';

export const VOICE_COMMUNICATION_TEST_REF = '(Reference Subsection 8.5)';

export const VOICE_COMMUNICATION_TEST_LOCATION_LABEL = 'Location:';

export const VOICE_COMMUNICATION_TEST_IDENTIFICATION_LABEL = 'Identification:';

export const VOICE_COMMUNICATION_TEST_ROWS: VoiceCommunicationTestRowDef[] = [
  { id: 'vct-a', letter: 'A', text: "Power 'on' visual indicator operates." },
  { id: 'vct-b', letter: 'B', text: 'Common visual trouble signal operates.' },
  { id: 'vct-c', letter: 'C', text: 'Common audible trouble signal operates.' },
  { id: 'vct-d', letter: 'D', text: 'Trouble signal silence switch operates.' },
  {
    id: 'vct-e',
    letter: 'E',
    text: 'All-call voice paging, including visual indicator, operates.',
  },
  {
    id: 'vct-f',
    letter: 'F',
    text: 'Output circuits for selective voice paging, including visual indication, operates.',
  },
  {
    id: 'vct-g',
    letter: 'G',
    text: 'Output circuits for selective voice paging trouble operation, including visual indication, operates.',
  },
  {
    id: 'vct-h',
    letter: 'H',
    text: 'Microphone, including press to talk switch, operates.',
  },
  {
    id: 'vct-i',
    letter: 'I',
    text: 'Operation of voice paging does not interfere with initial inhibit time of alert signal and alarm signal.',
  },
  {
    id: 'vct-j',
    letter: 'J',
    text: 'All-call voice paging operates (on emergency power supply).',
  },
  {
    id: 'vct-k',
    letter: 'K',
    text: 'Where the system uses back-up amplifiers, the automatic transfer feature operates.',
  },
  {
    id: 'vct-l',
    letter: 'L',
    text: 'Circuits for emergency telephone call-in operation, including audible and visual indication operates.',
  },
  {
    id: 'vct-m',
    letter: 'M',
    text: 'Circuits for emergency telephones for operation, including two-way voice communication, operates.',
  },
  {
    id: 'vct-n',
    letter: 'N',
    text: 'Circuits for emergency telephone trouble operation, including visual indication, operates.',
  },
  {
    id: 'vct-o',
    letter: 'O',
    text: 'Emergency telephone verbal communication operates.',
  },
  {
    id: 'vct-p',
    letter: 'P',
    text: 'Emergency telephone operable or in-use tone at handset operates.',
  },
  {
    id: 'vct-q',
    letter: 'Q',
    text: 'In standby mode, a short, or open on a paging, alert, alarm, or emergency telephone voice communication buss results in a buss specific trouble condition.',
  },
];

export const VOICE_COMMUNICATION_TEST_CHECKLIST_ROW_IDS = VOICE_COMMUNICATION_TEST_ROWS.map(
  (row) => row.id,
);

export type VoiceCommunicationTestRowValue = {
  choice: VoiceCommunicationTestChoice | null;
};

export type VoiceCommunicationTestValue = {
  sectionNotApplicable: boolean;
  fieldLocation: string;
  identification: string;
  checklist: Record<string, VoiceCommunicationTestRowValue>;
};

export function emptyVoiceCommunicationTestValue(): VoiceCommunicationTestValue {
  return {
    sectionNotApplicable: false,
    fieldLocation: '',
    identification: '',
    checklist: Object.fromEntries(
      VOICE_COMMUNICATION_TEST_CHECKLIST_ROW_IDS.map((id) => [id, { choice: null }]),
    ),
  };
}

export function normalizeVoiceCommunicationTestValue(raw: unknown): VoiceCommunicationTestValue {
  const base = emptyVoiceCommunicationTestValue();
  if (!raw || typeof raw !== 'object') return base;

  const record = raw as Partial<VoiceCommunicationTestValue>;
  const next = { ...base };

  if (typeof record.sectionNotApplicable === 'boolean') {
    next.sectionNotApplicable = record.sectionNotApplicable;
  }
  if (typeof record.fieldLocation === 'string') {
    next.fieldLocation = record.fieldLocation;
  }
  if (typeof record.identification === 'string') {
    next.identification = record.identification;
  }

  if (record.checklist && typeof record.checklist === 'object') {
    const checklist = record.checklist as Record<string, unknown>;
    for (const rowId of VOICE_COMMUNICATION_TEST_CHECKLIST_ROW_IDS) {
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

export function setVoiceCommunicationTestSectionNotApplicable(
  value: VoiceCommunicationTestValue,
  sectionNotApplicable: boolean,
): VoiceCommunicationTestValue {
  if (!sectionNotApplicable) {
    return {
      ...value,
      sectionNotApplicable: false,
      checklist: Object.fromEntries(
        VOICE_COMMUNICATION_TEST_CHECKLIST_ROW_IDS.map((id) => [id, { choice: null }]),
      ),
    };
  }

  return {
    ...value,
    sectionNotApplicable: true,
    checklist: Object.fromEntries(
      VOICE_COMMUNICATION_TEST_CHECKLIST_ROW_IDS.map((id) => [id, { choice: 'na' as const }]),
    ),
  };
}

export function setVoiceCommunicationTestChoice(
  value: VoiceCommunicationTestValue,
  rowId: string,
  choice: VoiceCommunicationTestChoice,
): VoiceCommunicationTestValue {
  return {
    ...value,
    sectionNotApplicable: false,
    checklist: {
      ...value.checklist,
      [rowId]: {
        ...value.checklist[rowId],
        choice,
      },
    },
  };
}

export function setVoiceCommunicationTestFieldLocation(
  value: VoiceCommunicationTestValue,
  fieldLocation: string,
): VoiceCommunicationTestValue {
  return { ...value, fieldLocation };
}

export function setVoiceCommunicationTestIdentification(
  value: VoiceCommunicationTestValue,
  identification: string,
): VoiceCommunicationTestValue {
  return { ...value, identification };
}
