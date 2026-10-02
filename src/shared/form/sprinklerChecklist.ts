/** Annual Sprinkler Inspection Report — Y / N / N/A question groups (sections 1–8). */

export type SprinklerChoice = 'yes' | 'no' | 'na';

export type SprinklerFieldDef = {
  key: string;
  label: string;
};

export type SprinklerOptionDef = {
  value: string;
  label: string;
};

export type SprinklerChecklistRowDef =
  | { type: 'heading'; id: string; text: string }
  | {
      type: 'item';
      id: string;
      letter?: string;
      text: string;
      /** Indented sub-question (no letter). */
      indent?: boolean;
      /** Default true — false renders a merged blocked Y/N/NA cell. */
      choice?: boolean;
      fields?: readonly SprinklerFieldDef[];
      options?: readonly SprinklerOptionDef[];
    };

export type SprinklerChecklistGroupId =
  | 'general'
  | 'controlValves'
  | 'waterSupplies'
  | 'tanks'
  | 'wetSystems'
  | 'drySystems'
  | 'alarms'
  | 'piping';

export type SprinklerChecklistValue = {
  answers: Record<string, SprinklerChoice | null>;
  /** Keyed `${rowId}.${fieldKey}`. */
  fields: Record<string, string>;
  options: Record<string, string | null>;
};

export const SPRINKLER_CHECKLIST_GROUPS: Record<
  SprinklerChecklistGroupId,
  readonly SprinklerChecklistRowDef[]
> = {
  general: [
    {
      type: 'heading',
      id: 'owner',
      text: "A. To be answered by the owner or owner's representative",
    },
    {
      type: 'item',
      id: 'a-occupancy',
      letter: 'a',
      text: 'Have there been any changes in the occupancy classification, machinery or operations since the last inspection?',
    },
    {
      type: 'item',
      id: 'a-changes',
      letter: 'b',
      text: 'Have there been any changes or repairs to the fire protection system since the last inspection?',
    },
    {
      type: 'item',
      id: 'a-fire',
      letter: 'c',
      text: 'If a fire has occurred since the last inspection, have all damaged sprinkler components been replaced?',
    },
    {
      type: 'item',
      id: 'a-dry-pitch',
      letter: 'd',
      text: 'Has the piping in all dry systems been checked for proper pitch within the past 5 years?',
      fields: [{ key: 'date', label: 'Date last checked' }],
    },
    {
      type: 'item',
      id: 'a-obstruction',
      letter: 'e',
      text: 'Has the piping in all systems been checked for obstructive materials?',
      fields: [{ key: 'date', label: 'Date last checked' }],
    },
    {
      type: 'item',
      id: 'a-fire-pumps',
      letter: 'f',
      text: 'Have all fire pumps been tested to their full capacity through the use of hose streams or flow meters within the past 12 months?',
    },
    {
      type: 'item',
      id: 'a-tanks-freezing',
      letter: 'g',
      text: 'Are gravity, surface or pressure tanks protected from freezing?',
    },
    {
      type: 'item',
      id: 'a-sprinklers-50',
      letter: 'h',
      text: 'Are any of the sprinklers 50 years or older? Testing and/or replacement is recommended.',
    },
    {
      type: 'item',
      id: 'a-piping-50',
      letter: 'i',
      text: 'Is the piping 50 years old or older? Internal inspection and flushing is recommended.',
    },
    {
      type: 'item',
      id: 'a-solder',
      letter: 'j',
      text: 'Are any extra high temperature solder sprinklers regularly exposed to temperatures near 300 degrees F?',
    },
    { type: 'heading', id: 'inspector', text: 'B. To be answered by the inspector' },
    { type: 'item', id: 'b-occupied', letter: 'a', text: 'Is the building occupied?' },
    {
      type: 'item',
      id: 'b-extended',
      letter: 'b',
      text: 'Have the sprinkler systems been extended to all visible areas of the building?',
    },
    {
      type: 'item',
      id: 'b-clearance',
      letter: 'c',
      text: 'Does there appear to be proper clearance between the top of all storage and the sprinkler deflector?',
    },
    {
      type: 'item',
      id: 'b-heated',
      letter: 'd',
      text: 'Are the building areas protected by a wet system heated, including its blind attics and perimeter areas, where accessible?',
    },
    {
      type: 'item',
      id: 'b-openings',
      letter: 'e',
      text: 'Are all visible exterior openings protected against the entrance of cold air?',
    },
    { type: 'item', id: 'b-in-operation', letter: 'f', text: 'Are all systems in operation?' },
  ],
  controlValves: [
    {
      type: 'item',
      id: 'position',
      letter: 'a',
      text: 'Are all valves in the appropriate open or closed position?',
    },
    {
      type: 'item',
      id: 'sealed',
      letter: 'b',
      text: 'Are all the control valves sealed or supervised in the open position?',
    },
  ],
  waterSupplies: [
    {
      type: 'item',
      id: 'source',
      letter: 'a',
      text: 'Water Supply Source',
      choice: false,
      options: [
        { value: 'city', label: 'City' },
        { value: 'private', label: 'Private' },
      ],
      fields: [
        { key: 'supplyPressure', label: 'Supply Pressure' },
        { key: 'systemPressure', label: 'System Pressure' },
      ],
    },
    {
      type: 'item',
      id: 'main-drain',
      letter: 'b',
      text: 'Main Drain Water Flow Test Results:',
      choice: false,
    },
    { type: 'item', id: 'operational', indent: true, text: 'Operational' },
    { type: 'item', id: 'full-flow', indent: true, text: 'Drain able to carry away full flow' },
    { type: 'item', id: 'pump-city', indent: true, text: 'Pressure — fire pump & city' },
    { type: 'item', id: 'riser-flow', indent: true, text: 'Water flow test at sprinkler riser' },
    { type: 'item', id: 'pumps-tanks', indent: true, text: 'Pressure — fire pumps & tanks' },
  ],
  tanks: [
    {
      type: 'item',
      id: 'condition',
      letter: 'a',
      text: 'Do gravity, surface or pressure tanks appear to be in good external condition?',
    },
    {
      type: 'item',
      id: 'levels',
      letter: 'b',
      text: 'Are gravity, surface and pressure tanks at the proper pressure and/or water levels?',
    },
    {
      type: 'item',
      id: 'fdc-condition',
      letter: 'c',
      text: 'Are fire department connections in satisfactory condition, couplings free, caps or plugs in place and check valves tight?',
    },
    {
      type: 'item',
      id: 'fdc-visible',
      letter: 'd',
      text: 'Are fire department connections visible and accessible?',
    },
  ],
  wetSystems: [
    {
      type: 'item',
      id: 'test-valves',
      letter: 'a',
      text: "Are inspector's test valves properly located and in proper working order?",
    },
    {
      type: 'item',
      id: 'cold-weather',
      letter: 'b',
      text: 'Are cold weather valves in the appropriate open or closed position?',
    },
    {
      type: 'item',
      id: 'antifreeze-tested',
      letter: 'c',
      text: 'Have all antifreeze systems been tested?',
    },
    {
      type: 'item',
      id: 'antifreeze-location',
      letter: 'd',
      text: 'Location of antifreeze protection',
      choice: false,
      fields: [{ key: 'location', label: '' }],
    },
    {
      type: 'item',
      id: 'alarm-valves',
      letter: 'e',
      text: "Did alarm valves, waterflow alarms, indicators and excess pressure pumps test satisfactorily when the inspector's test pipe was opened?",
    },
    {
      type: 'item',
      id: 'excess-pumps',
      letter: 'f',
      text: 'Excess pressure pumps',
      choice: false,
      options: [
        { value: 'manual', label: 'Manual' },
        { value: 'auto', label: 'Auto' },
      ],
      fields: [{ key: 'quantity', label: 'Quantity' }],
    },
  ],
  drySystems: [
    {
      type: 'item',
      id: 'previous-trip',
      letter: 'a',
      text: 'Date of previous trip tests?',
      choice: false,
      fields: [{ key: 'date', label: '' }],
    },
    {
      type: 'item',
      id: 'air-priming',
      letter: 'b',
      text: 'Are the air pressure and priming water levels normal?',
    },
    {
      type: 'item',
      id: 'air-system',
      letter: 'c',
      text: 'Has the operation of the air or nitrogen system been tested?',
    },
    { type: 'item', id: 'in-service', letter: 'd', text: 'Is it in service?' },
    {
      type: 'item',
      id: 'low-points',
      letter: 'e',
      text: 'Were all low points drained during this inspection?',
    },
    {
      type: 'item',
      id: 'quick-opening',
      letter: 'f',
      text: 'Did all quick opening devices operate satisfactorily?',
    },
    {
      type: 'item',
      id: 'dry-valves',
      letter: 'g',
      text: 'Did all dry pipe valves operate satisfactorily?',
    },
    {
      type: 'item',
      id: 'dry-freezing',
      letter: 'h',
      text: 'Do dry pipe valves appear to be protected from freezing?',
    },
    {
      type: 'item',
      id: 'trip-full',
      letter: 'i',
      text: 'Were dry pipe valves tripped with the control valve fully open?',
    },
    {
      type: 'item',
      id: 'trip-partial',
      letter: 'j',
      text: 'Were dry pipe valves tripped with the control valve partially open?',
    },
  ],
  alarms: [
    { type: 'item', id: 'gongs', letter: 'a', text: 'Did all water gongs operate?' },
    { type: 'item', id: 'electric', letter: 'b', text: 'Did all the electric alarms operate?' },
    {
      type: 'item',
      id: 'supervisory',
      letter: 'c',
      text: 'Did all the supervisory alarms operate?',
    },
    {
      type: 'item',
      id: 'flow-switches',
      letter: 'd',
      text: "Were all zone flow switches tested for alarm through an inspector's test valve?",
    },
  ],
  piping: [
    {
      type: 'item',
      id: 'external',
      letter: 'a',
      text: 'Do sprinklers generally appear to be in good external condition?',
    },
    {
      type: 'item',
      id: 'corrosion',
      letter: 'b',
      text: 'Do sprinklers generally appear to be free of corrosion, paint, or loading and visible obstructions?',
    },
    {
      type: 'item',
      id: 'spares',
      letter: 'c',
      text: 'Are extra sprinklers and wrenches available on the premises?',
    },
    {
      type: 'item',
      id: 'piping-condition',
      letter: 'd',
      text: 'Does the exterior condition of piping, drain valves, hangers, pressure gauges, open sprinklers and strainers appear to be satisfactory?',
    },
    {
      type: 'item',
      id: 'temperature',
      letter: 'e',
      text: 'Do sprinklers have proper temperature ratings for their locations?',
    },
    {
      type: 'item',
      id: 'range-hood',
      letter: 'f',
      text: 'Have all sprinklers in range hood protection been replaced within the last year?',
    },
  ],
};

/**
 * Groups whose Yes / No / N/A column header sits on a body row instead of the top of the panel.
 * The top strip and blocked cells in these groups render blue.
 */
export const SPRINKLER_CHECKLIST_INLINE_HEADER_ROW: Partial<
  Record<SprinklerChecklistGroupId, string>
> = {
  waterSupplies: 'main-drain',
};

export const SPRINKLER_RECOMMENDATIONS_INTRO =
  'The inspector recommends the following improvements to comply with the Fire Code; however, these suggestions are not the result of an engineering survey.';

export function sprinklerChecklistRows(
  group: SprinklerChecklistGroupId,
): readonly SprinklerChecklistRowDef[] {
  return SPRINKLER_CHECKLIST_GROUPS[group] ?? [];
}

export function sprinklerRowHasChoice(row: SprinklerChecklistRowDef): boolean {
  return row.type === 'item' && row.choice !== false;
}

export function sprinklerFieldKey(rowId: string, fieldKey: string): string {
  return `${rowId}.${fieldKey}`;
}

export function emptySprinklerChecklistValue(): SprinklerChecklistValue {
  return { answers: {}, fields: {}, options: {} };
}

function normalizeChoice(raw: unknown): SprinklerChoice | null {
  if (raw === 'yes' || raw === 'no' || raw === 'na') return raw;
  return null;
}

export function normalizeSprinklerChecklistValue(raw: unknown): SprinklerChecklistValue {
  const base = emptySprinklerChecklistValue();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const answers: SprinklerChecklistValue['answers'] = {};
  const fields: SprinklerChecklistValue['fields'] = {};
  const options: SprinklerChecklistValue['options'] = {};
  if (r.answers && typeof r.answers === 'object') {
    for (const [key, value] of Object.entries(r.answers as Record<string, unknown>)) {
      answers[key] = normalizeChoice(value);
    }
  }
  if (r.fields && typeof r.fields === 'object') {
    for (const [key, value] of Object.entries(r.fields as Record<string, unknown>)) {
      if (typeof value === 'string') fields[key] = value;
    }
  }
  if (r.options && typeof r.options === 'object') {
    for (const [key, value] of Object.entries(r.options as Record<string, unknown>)) {
      options[key] = typeof value === 'string' ? value : null;
    }
  }
  return { answers, fields, options };
}

export function setSprinklerChecklistChoice(
  value: SprinklerChecklistValue,
  rowId: string,
  choice: SprinklerChoice | null,
): SprinklerChecklistValue {
  return { ...value, answers: { ...value.answers, [rowId]: choice } };
}

export function setSprinklerChecklistField(
  value: SprinklerChecklistValue,
  rowId: string,
  fieldKey: string,
  next: string,
): SprinklerChecklistValue {
  return { ...value, fields: { ...value.fields, [sprinklerFieldKey(rowId, fieldKey)]: next } };
}

export function setSprinklerChecklistOption(
  value: SprinklerChecklistValue,
  rowId: string,
  option: string | null,
): SprinklerChecklistValue {
  return { ...value, options: { ...value.options, [rowId]: option } };
}

export function sprinklerChecklistHasContent(value: SprinklerChecklistValue): boolean {
  return (
    Object.values(value.answers).some((choice) => choice != null) ||
    Object.values(value.fields).some((text) => text.trim() !== '') ||
    Object.values(value.options).some((option) => option != null)
  );
}
