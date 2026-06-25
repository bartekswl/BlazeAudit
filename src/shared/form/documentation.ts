export type DocumentationChoice = 'yes' | 'no' | 'na';

export type DocumentationRowKind = 'checklist' | 'notes';

export type DocumentationRowDef = {
  id: string;
  letter: string;
  kind: DocumentationRowKind;
  text?: string;
  fillIn?: { before: string; after: string };
  naDisabled?: boolean;
  noteLines?: number;
};

export type DocumentationISubitem = {
  id: string;
  letter: string;
  text: string;
  naDisabled?: boolean;
};

export const DOCUMENTATION_INTRO =
  '21.1 Documentation for the fire alarm system is available or accessible on site and includes the following description of the fire alarm system:';

export const DOCUMENTATION_NOTE = '(Note: Reference Section 7 Documentation)';

export const DOCUMENTATION_LOCATION_LINES = 3;

export const DOCUMENTATION_ANNEX_LINES = 11;

export const DOCUMENTATION_I_HEADER = 'Description of fire alarm system:';

export const DOCUMENTATION_MAIN_ROWS: DocumentationRowDef[] = [
  {
    id: 'doc-a',
    letter: 'A',
    kind: 'checklist',
    text: 'Instructions for resetting the system and silencing alarm signals.',
    naDisabled: true,
  },
  {
    id: 'doc-b',
    letter: 'B',
    kind: 'checklist',
    text: 'Instructions for silencing the trouble signal and action to be taken when the trouble signal sounds.',
    naDisabled: true,
  },
  {
    id: 'doc-c',
    letter: 'C',
    kind: 'checklist',
    text: 'Description of the function of each operating control and indicator on the fire alarm control unit.',
    naDisabled: true,
  },
  {
    id: 'doc-d',
    letter: 'D',
    kind: 'checklist',
    text: 'Description of the area or fire zone protected by each alarm detection circuit (this may be in the form of a list or plan drawing).',
    naDisabled: true,
  },
  {
    id: 'doc-e',
    letter: 'E',
    kind: 'checklist',
    text: 'Description of alarm signal operation.',
    naDisabled: true,
  },
  {
    id: 'doc-f',
    letter: 'F',
    kind: 'checklist',
    text: 'Description of ancillary equipment controlled by the fire alarm system.',
    naDisabled: true,
  },
  {
    id: 'doc-g',
    letter: 'G',
    kind: 'checklist',
    fillIn: {
      before:
        'In systems that provide logical control of a smoke control system, documentation is on site and includes a sequence of operation of the smoke control system. Smoke control is installed in accordance with Measure:',
      after: 'as specified in NRCC No. 13366',
    },
  },
  {
    id: 'doc-h',
    letter: 'H',
    kind: 'checklist',
    text: 'Building diagrams are on site that clearly indicate the type and location of all smoke control equipment (fans, dampers, etc.).',
  },
];

export const DOCUMENTATION_I_SUBITEMS: DocumentationISubitem[] = [
  {
    id: 'doc-i-i',
    letter: 'i',
    text: 'Sequence of Operation (See Annex D.)',
    naDisabled: true,
  },
  {
    id: 'doc-i-ii',
    letter: 'ii',
    text: 'Operating instructions (See Annex D.)',
    naDisabled: true,
  },
  {
    id: 'doc-i-iii',
    letter: 'iii',
    text: 'Description of each type of field device.',
    naDisabled: true,
  },
  {
    id: 'doc-i-iv',
    letter: 'iv',
    text: 'Details of input to programmed output functions for programmed systems.',
    naDisabled: true,
  },
  {
    id: 'doc-i-v',
    letter: 'v',
    text: 'Connection to fire signal receiving centre, if required by applicable codes and regulations.',
    naDisabled: true,
  },
  {
    id: 'doc-i-vi',
    letter: 'vi',
    text: 'Previous verification report(s) and all documentation related to any modification showing approval of such modifications by the AHJ, if applicable',
  },
  {
    id: 'doc-i-vii',
    letter: 'vii',
    text: 'The plans of the building showing the fire alarm zoning, device address and location of each control unit, transponder, remote power supply, field device of the fire alarm system including fault isolators, ancillary devices and annunciators, or display and control centres.',
  },
  {
    id: 'doc-i-viii',
    letter: 'viii',
    text: 'Copy of site-specific software (if applicable)',
  },
];

export const DOCUMENTATION_J_ROW: DocumentationRowDef = {
  id: 'doc-j',
  letter: 'J',
  kind: 'notes',
  text: 'Indicate location(s) and media type(s) of documentation on site:',
  noteLines: DOCUMENTATION_LOCATION_LINES,
};

/** @deprecated Use DOCUMENTATION_MAIN_ROWS + I subitems + J row. */
export const DOCUMENTATION_ROWS = [...DOCUMENTATION_MAIN_ROWS, DOCUMENTATION_J_ROW];

export const DOCUMENTATION_CHECKLIST_ROW_IDS = [
  ...DOCUMENTATION_MAIN_ROWS.filter((row) => row.kind === 'checklist').map((row) => row.id),
  ...DOCUMENTATION_I_SUBITEMS.map((row) => row.id),
];

export type DocumentationChecklistRowValue = {
  choice: DocumentationChoice | null;
  measure?: string;
};

export type DocumentationValue = {
  checklist: Record<string, DocumentationChecklistRowValue>;
  locationNotes: string;
  annexContents: string;
};

export function emptyDocumentationValue(): DocumentationValue {
  return {
    checklist: Object.fromEntries(
      DOCUMENTATION_CHECKLIST_ROW_IDS.map((id) => [
        id,
        { choice: null, ...(id === 'doc-g' ? { measure: '' } : {}) },
      ]),
    ),
    locationNotes: '',
    annexContents: '',
  };
}

export function normalizeDocumentationValue(raw: unknown): DocumentationValue {
  const base = emptyDocumentationValue();
  if (!raw || typeof raw !== 'object') return base;

  const record = raw as Partial<DocumentationValue>;
  const next = { ...base };

  if (typeof record.locationNotes === 'string') {
    next.locationNotes = record.locationNotes;
  }
  if (typeof record.annexContents === 'string') {
    next.annexContents = record.annexContents;
  }

  if (record.checklist && typeof record.checklist === 'object') {
    const checklist = record.checklist as Record<string, unknown>;
    for (const rowId of DOCUMENTATION_CHECKLIST_ROW_IDS) {
      const entry = checklist[rowId];
      if (!entry || typeof entry !== 'object') continue;
      const row = entry as Record<string, unknown>;
      const choice = row.choice;
      next.checklist[rowId] = {
        choice:
          choice === 'yes' || choice === 'no' || choice === 'na' ? choice : null,
        ...(rowId === 'doc-g'
          ? { measure: typeof row.measure === 'string' ? row.measure : '' }
          : {}),
      };
    }
  }

  return next;
}

export function setDocumentationChoice(
  value: DocumentationValue,
  rowId: string,
  choice: DocumentationChoice,
): DocumentationValue {
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

export function setDocumentationMeasure(
  value: DocumentationValue,
  measure: string,
): DocumentationValue {
  return {
    ...value,
    checklist: {
      ...value.checklist,
      'doc-g': {
        ...value.checklist['doc-g'],
        measure,
      },
    },
  };
}

export function setDocumentationLocationNotes(
  value: DocumentationValue,
  locationNotes: string,
): DocumentationValue {
  return { ...value, locationNotes };
}

export function setDocumentationAnnexContents(
  value: DocumentationValue,
  annexContents: string,
): DocumentationValue {
  return { ...value, annexContents };
}
