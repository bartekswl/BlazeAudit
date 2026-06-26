export type PowerSupplyInspectionChoice = 'yes' | 'no' | 'na';

export type PowerSupplyInspectionRowDef = {
  id: string;
  letter: string;
  text: string;
};

export const POWER_SUPPLY_INSPECTION_TITLE = '22.4 Power Supply Inspection';

export const POWER_SUPPLY_INSPECTION_SUBTITLE = 'See 9, Power Supplies';

export const POWER_SUPPLY_INSPECTION_REF =
  'Complete section for each control unit (or transponder) and booster power supply';

export const POWER_SUPPLY_INSPECTION_FIELD_LOCATION_LABEL = 'Power Supply Field Location:';

export const POWER_SUPPLY_INSPECTION_IDENTIFICATION_LABEL = 'Power Supply Identification:';

export const POWER_SUPPLY_INSPECTION_DISCONNECT_LOCATION_LABEL =
  'Circuit Disconnect Means Location:';

export const POWER_SUPPLY_INSPECTION_BREAKER_LABEL = 'Circuit Panel/Breaker Identification:';

export const POWER_SUPPLY_INSPECTION_ROWS: PowerSupplyInspectionRowDef[] = [
  {
    id: 'psi-a',
    letter: 'A',
    text: "Fused in accordance with the manufacturer's marked rating of the system.",
  },
  {
    id: 'psi-b',
    letter: 'B',
    text: 'The primary supply is equipped with identified disconnect means.',
  },
  {
    id: 'psi-c',
    letter: 'C',
    text: 'Adequate to meet the requirements of the system.',
  },
  {
    id: 'psi-d',
    letter: 'D',
    text: 'A short on the isolated side of each power isolation module results in a trouble condition.',
  },
  {
    id: 'psi-e',
    letter: 'E',
    text: 'Operation of a device on the source side of each shorted power isolation module is confirmed.',
  },
  {
    id: 'psi-f',
    letter: 'F',
    text: 'Power for ancillary devices is taken from a source separate from the fire alarm system control unit or transponder power supply.',
  },
  {
    id: 'psi-g',
    letter: 'G',
    text: 'Power for ancillary devices is taken from the control unit or transponder that is designed to provide such power.',
  },
  {
    id: 'psi-h',
    letter: 'H',
    text: 'Ancillary devices, which are powered from the control unit or transponder, are recorded.',
  },
];

export const POWER_SUPPLY_INSPECTION_CHECKLIST_ROW_IDS = POWER_SUPPLY_INSPECTION_ROWS.map(
  (row) => row.id,
);

export type PowerSupplyInspectionRowValue = {
  choice: PowerSupplyInspectionChoice | null;
};

export type PowerSupplyInspectionValue = {
  fieldLocation: string;
  identification: string;
  disconnectLocation: string;
  breakerIdentification: string;
  checklist: Record<string, PowerSupplyInspectionRowValue>;
};

export function emptyPowerSupplyInspectionValue(): PowerSupplyInspectionValue {
  return {
    fieldLocation: '',
    identification: '',
    disconnectLocation: '',
    breakerIdentification: '',
    checklist: Object.fromEntries(
      POWER_SUPPLY_INSPECTION_CHECKLIST_ROW_IDS.map((id) => [id, { choice: null }]),
    ),
  };
}

export function normalizePowerSupplyInspectionValue(raw: unknown): PowerSupplyInspectionValue {
  const base = emptyPowerSupplyInspectionValue();
  if (!raw || typeof raw !== 'object') return base;

  const record = raw as Partial<PowerSupplyInspectionValue>;
  const next = { ...base };

  if (typeof record.fieldLocation === 'string') next.fieldLocation = record.fieldLocation;
  if (typeof record.identification === 'string') next.identification = record.identification;
  if (typeof record.disconnectLocation === 'string') {
    next.disconnectLocation = record.disconnectLocation;
  }
  if (typeof record.breakerIdentification === 'string') {
    next.breakerIdentification = record.breakerIdentification;
  }

  if (record.checklist && typeof record.checklist === 'object') {
    const checklist = record.checklist as Record<string, unknown>;
    for (const rowId of POWER_SUPPLY_INSPECTION_CHECKLIST_ROW_IDS) {
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

export function setPowerSupplyInspectionChoice(
  value: PowerSupplyInspectionValue,
  rowId: string,
  choice: PowerSupplyInspectionChoice,
): PowerSupplyInspectionValue {
  return {
    ...value,
    checklist: {
      ...value.checklist,
      [rowId]: { ...value.checklist[rowId], choice },
    },
  };
}

export function setPowerSupplyInspectionFieldLocation(
  value: PowerSupplyInspectionValue,
  fieldLocation: string,
): PowerSupplyInspectionValue {
  return { ...value, fieldLocation };
}

export function setPowerSupplyInspectionIdentification(
  value: PowerSupplyInspectionValue,
  identification: string,
): PowerSupplyInspectionValue {
  return { ...value, identification };
}

export function setPowerSupplyInspectionDisconnectLocation(
  value: PowerSupplyInspectionValue,
  disconnectLocation: string,
): PowerSupplyInspectionValue {
  return { ...value, disconnectLocation };
}

export function setPowerSupplyInspectionBreakerIdentification(
  value: PowerSupplyInspectionValue,
  breakerIdentification: string,
): PowerSupplyInspectionValue {
  return { ...value, breakerIdentification };
}
