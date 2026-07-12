export const ANCILLARY_DEVICE_CIRCUIT_TEST_TITLE = '22.10 Ancillary Device Circuit Test';

export const ANCILLARY_DEVICE_CIRCUIT_TEST_ROW_COUNT = 48;

/** Fixed body-row height — same on template, document, PDF, and fallback HTML. */
export const ANCILLARY_DEVICE_CIRCUIT_TEST_BODY_ROW_HEIGHT = '1.0625rem';

/** Fallback HTML print row height — PDF export uses flex-fill (see PRINT_OVERRIDES). */
export const ANCILLARY_DEVICE_CIRCUIT_TEST_BODY_ROW_HEIGHT_PRINT = '5.5pt';

/** Data-column widths (must sum to 100). Shared by React view, fallback HTML, and print CSS. */
export const ANCILLARY_DEVICE_CIRCUIT_TEST_DATA_COLUMNS = [
  { key: 'identify', widthPercent: 40 },
  { key: 'facu', widthPercent: 5 },
  { key: 'other', widthPercent: 15 },
  { key: 'yes', widthPercent: 8 },
  { key: 'no', widthPercent: 8 },
  { key: 'method', widthPercent: 24 },
] as const;

export const ANCILLARY_DEVICE_CIRCUIT_TEST_IDENTIFY_HEADER =
  'Identify Ancillary Circuit and Device';

export const ANCILLARY_DEVICE_CIRCUIT_TEST_POWERED_BY_HEADER =
  'Ancillary Circuit is Powered by:';

export const ANCILLARY_DEVICE_CIRCUIT_TEST_OPERATION_HEADER =
  'Operation of Ancillary Circuit Confirmed';

export const ANCILLARY_DEVICE_CIRCUIT_TEST_FACU_HEADER = 'FACU';

export const ANCILLARY_DEVICE_CIRCUIT_TEST_OTHER_HEADER = 'Other (Specify)';

export const ANCILLARY_DEVICE_CIRCUIT_TEST_YES_HEADER = 'Yes';

export const ANCILLARY_DEVICE_CIRCUIT_TEST_NO_HEADER = 'No';

export const ANCILLARY_DEVICE_CIRCUIT_TEST_METHOD_HEADER =
  'Confirmation Method (See Annex A, A22.10)';

export const ANCILLARY_DEVICE_CIRCUIT_TEST_FOOTNOTE_FACU =
  '*FACU - Fire Alarm Control Unit';

export const ANCILLARY_DEVICE_CIRCUIT_TEST_FOOTNOTE_NOTE =
  'Note: The tests reported on this form may not include the actual operational test of ancillary devices except when noted in the Confirmation Method column. See Annex A, A22.10.';

export type AncillaryDeviceCircuitOperationChoice = 'yes' | 'no';

export interface AncillaryDeviceCircuitRow {
  identify: string;
  poweredByFacu: boolean;
  poweredByOther: string;
  operationConfirmed: AncillaryDeviceCircuitOperationChoice | null;
  confirmationMethod: string;
}

export interface AncillaryDeviceCircuitTestValue {
  rows: AncillaryDeviceCircuitRow[];
}

export function emptyAncillaryDeviceCircuitRow(): AncillaryDeviceCircuitRow {
  return {
    identify: '',
    poweredByFacu: false,
    poweredByOther: '',
    operationConfirmed: null,
    confirmationMethod: '',
  };
}

export function emptyAncillaryDeviceCircuitTestValue(): AncillaryDeviceCircuitTestValue {
  return {
    rows: Array.from({ length: ANCILLARY_DEVICE_CIRCUIT_TEST_ROW_COUNT }, () =>
      emptyAncillaryDeviceCircuitRow(),
    ),
  };
}

export function normalizeAncillaryDeviceCircuitTestValue(
  value: unknown,
): AncillaryDeviceCircuitTestValue {
  const base = emptyAncillaryDeviceCircuitTestValue();
  if (!value || typeof value !== 'object') return base;

  const record = value as { rows?: unknown };
  if (!Array.isArray(record.rows)) return base;
  const rows = record.rows as unknown[];

  return {
    rows: base.rows.map((emptyRow, index) => {
      const row = rows[index];
      if (!row || typeof row !== 'object') return emptyRow;
      const cells = row as Record<string, unknown>;
      return {
        identify: typeof cells.identify === 'string' ? cells.identify : '',
        poweredByFacu: cells.poweredByFacu === true,
        poweredByOther: typeof cells.poweredByOther === 'string' ? cells.poweredByOther : '',
        operationConfirmed:
          cells.operationConfirmed === 'yes' || cells.operationConfirmed === 'no'
            ? cells.operationConfirmed
            : null,
        confirmationMethod:
          typeof cells.confirmationMethod === 'string' ? cells.confirmationMethod : '',
      };
    }),
  };
}

export function setAncillaryDeviceCircuitIdentify(
  value: AncillaryDeviceCircuitTestValue,
  rowIndex: number,
  identify: string,
): AncillaryDeviceCircuitTestValue {
  return {
    rows: value.rows.map((row, index) => (index === rowIndex ? { ...row, identify } : row)),
  };
}

export function setAncillaryDeviceCircuitPoweredByFacu(
  value: AncillaryDeviceCircuitTestValue,
  rowIndex: number,
  poweredByFacu: boolean,
): AncillaryDeviceCircuitTestValue {
  return {
    rows: value.rows.map((row, index) =>
      index === rowIndex ? { ...row, poweredByFacu } : row,
    ),
  };
}

export function setAncillaryDeviceCircuitPoweredByOther(
  value: AncillaryDeviceCircuitTestValue,
  rowIndex: number,
  poweredByOther: string,
): AncillaryDeviceCircuitTestValue {
  return {
    rows: value.rows.map((row, index) =>
      index === rowIndex ? { ...row, poweredByOther } : row,
    ),
  };
}

export function setAncillaryDeviceCircuitOperationConfirmed(
  value: AncillaryDeviceCircuitTestValue,
  rowIndex: number,
  operationConfirmed: AncillaryDeviceCircuitOperationChoice | null,
): AncillaryDeviceCircuitTestValue {
  return {
    rows: value.rows.map((row, index) =>
      index === rowIndex ? { ...row, operationConfirmed } : row,
    ),
  };
}

export function setAncillaryDeviceCircuitConfirmationMethod(
  value: AncillaryDeviceCircuitTestValue,
  rowIndex: number,
  confirmationMethod: string,
): AncillaryDeviceCircuitTestValue {
  return {
    rows: value.rows.map((row, index) =>
      index === rowIndex ? { ...row, confirmationMethod } : row),
  };
}
