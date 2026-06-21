import type { YesNoSummaryItem, YesNoSummaryValue } from './types';

export function emptyYesNoSummaryValue(items: YesNoSummaryItem[]): YesNoSummaryValue {
  return Object.fromEntries(
    items.map((item) => [
      item.id,
      {
        choice: null,
        ...(item.fillIn ? { fillIn: '' } : {}),
      },
    ]),
  );
}

export function normalizeYesNoSummaryValue(
  raw: unknown,
  items: YesNoSummaryItem[],
): YesNoSummaryValue {
  const base = emptyYesNoSummaryValue(items);
  if (!raw || typeof raw !== 'object') return base;

  const record = raw as Record<string, unknown>;
  for (const item of items) {
    const entry = record[item.id];
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as Record<string, unknown>;
    const choice = row.choice;
    base[item.id] = {
      choice: choice === 'yes' || choice === 'no' ? choice : null,
      ...(item.fillIn
        ? { fillIn: typeof row.fillIn === 'string' ? row.fillIn : '' }
        : {}),
    };
  }
  return base;
}

export function setYesNoSummaryChoice(
  value: YesNoSummaryValue,
  itemId: string,
  choice: 'yes' | 'no',
): YesNoSummaryValue {
  return {
    ...value,
    [itemId]: {
      ...value[itemId],
      choice,
    },
  };
}

export function setYesNoSummaryFillIn(
  value: YesNoSummaryValue,
  itemId: string,
  fillIn: string,
): YesNoSummaryValue {
  return {
    ...value,
    [itemId]: {
      ...value[itemId],
      fillIn,
    },
  };
}

/** Built-in ULC annual report summary rows (page 1). */
export const FORM_PROTOTYPE_SUMMARY_ITEMS: YesNoSummaryItem[] = [
  {
    id: 'connected-fsrc',
    text: 'The fire alarm system is connected to a Fire Signal Receiving Centre (name and telephone number recorded above).',
  },
  {
    id: 'inspected-ulc536',
    text: 'The entire fire alarm system has been inspected and tested in accordance with ULC 536:2019 (2024), Standard for Inspection and Testing of Fire Alarm Systems.',
  },
  {
    id: 'fully-functional',
    text: 'The fire alarm system is fully functional.',
  },
  {
    id: 'deficiencies-identified',
    text: 'During the Annual Inspection and Test, deficiencies have been identified (see page 2 if “yes”).',
  },
  {
    id: 'deficiencies-corrected',
    text: 'All identified deficiencies have been corrected as of this date:',
    fillIn: true,
  },
  {
    id: 'recommendations-identified',
    text: 'During the Annual Inspection and test, Recommendations have been identified (see page 3 if “yes”).',
  },
  {
    id: 'report-copy',
    text: 'A copy of this report will be given to:',
    fillIn: true,
    textAfterFill:
      ' (the owner or owner’s representative for the building), and shall be maintained on the premises for examination by the Fire Marshal or Inspector at their request pursuant to the National Fire Code of Canada (as adopted in the jurisdiction applicable to the system’s installation). Division C, Sentence 2.2.1.2.(3).',
  },
];
