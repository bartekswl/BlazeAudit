import {
  emptyReportGridValue,
  normalizeReportGridValue,
  type ReportGridColumnDef,
  type ReportGridValue,
} from './reportRecordGrid';

export const EMERGENCY_LIGHTING_INSPECTION_RECORD_ROW_COUNT = 28;

/** Columns from the paper form — crossed-out columns omitted. */
export const EMERGENCY_LIGHTING_INSPECTION_RECORD_COLUMNS: readonly ReportGridColumnDef[] = [
  { key: 'unitNumber', title: 'UNIT NUMBER', widthPercent: 7, orientation: 'vertical', kind: 'text' },
  { key: 'floorNumber', title: 'FLOOR NUMBER', widthPercent: 7, orientation: 'vertical', kind: 'text' },
  { key: 'location', title: 'LOCATION', widthPercent: 16, orientation: 'horizontal', kind: 'text' },
  { key: 'deviceType', title: 'DEVICE TYPE', widthPercent: 8, orientation: 'vertical', kind: 'text' },
  {
    key: 'deviceOperation',
    title: 'DEVICE OPERATION',
    widthPercent: 8,
    orientation: 'vertical',
    kind: 'text',
  },
  {
    key: 'batterySizeAmpHr',
    title: 'BATTERY SIZE AMP/HR',
    widthPercent: 8,
    orientation: 'vertical',
    kind: 'text',
  },
  { key: 'voltage', title: 'VOLTAGE', widthPercent: 7, orientation: 'vertical', kind: 'text' },
  {
    key: 'chargingVoltageAfterTest',
    title: 'CHARGING VOLTAGE AFTER TEST',
    widthPercent: 9,
    orientation: 'vertical',
    kind: 'text',
  },
  {
    key: 'serviceRequired',
    title: 'SERVICE REQUIRED',
    widthPercent: 8,
    orientation: 'vertical',
    kind: 'choice',
  },
  { key: 'remarks', title: 'REMARKS', widthPercent: 22, orientation: 'horizontal', kind: 'text' },
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
