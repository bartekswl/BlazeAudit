import {
  emptyReportGridValue,
  normalizeReportGridValue,
  type ReportGridColumnDef,
  type ReportGridValue,
} from './reportRecordGrid';

export const EMERGENCY_LIGHTING_INSPECTION_RECORD_ROW_COUNT = 28;

/** Columns from the paper form — crossed-out columns omitted. */
const elrCenter = { align: 'center' as const };

export const EMERGENCY_LIGHTING_INSPECTION_RECORD_COLUMNS: readonly ReportGridColumnDef[] = [
  { key: 'unitNumber', title: 'UNIT\nNUMBER', widthPercent: 7.8, orientation: 'horizontal', kind: 'text', ...elrCenter },
  { key: 'floorNumber', title: 'FLOOR\nNUMBER', widthPercent: 6, orientation: 'horizontal', kind: 'text', ...elrCenter },
  { key: 'location', title: 'LOCATION', widthPercent: 25.6, orientation: 'horizontal', kind: 'text' },
  { key: 'deviceType', title: 'DEVICE\nTYPE', widthPercent: 8, orientation: 'horizontal', kind: 'text', ...elrCenter },
  {
    key: 'deviceOperation',
    title: 'DEVICE\nOPERATION',
    widthPercent: 9,
    orientation: 'horizontal',
    kind: 'text',
    ...elrCenter,
  },
  {
    key: 'batterySizeAmpHr',
    title: 'BATTERY SIZE\nAMP/HR',
    widthPercent: 8,
    orientation: 'horizontal',
    kind: 'text',
    ...elrCenter,
  },
  { key: 'voltage', title: 'VOLTAGE', widthPercent: 7, orientation: 'horizontal', kind: 'text', ...elrCenter },
  {
    key: 'serviceRequired',
    title: 'SERVICE\nREQUIRED',
    widthPercent: 8,
    orientation: 'horizontal',
    kind: 'choice',
    ...elrCenter,
  },
  { key: 'remarks', title: 'REMARKS', widthPercent: 20.6, orientation: 'horizontal', kind: 'text', align: 'center' },
];

export type EmergencyLightingInspectionRecordValue = ReportGridValue;

export function emptyEmergencyLightingInspectionRecordValue(): EmergencyLightingInspectionRecordValue {
  return emptyReportGridValue(
    EMERGENCY_LIGHTING_INSPECTION_RECORD_COLUMNS,
    EMERGENCY_LIGHTING_INSPECTION_RECORD_ROW_COUNT,
  );
}

export function normalizeEmergencyLightingInspectionRecordValue(
  raw: unknown,
): EmergencyLightingInspectionRecordValue {
  return normalizeReportGridValue(
    raw,
    EMERGENCY_LIGHTING_INSPECTION_RECORD_COLUMNS,
    EMERGENCY_LIGHTING_INSPECTION_RECORD_ROW_COUNT,
  );
}
