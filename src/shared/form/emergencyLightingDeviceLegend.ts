import {
  emptyReportGridValue,
  normalizeReportGridValue,
  type ReportGridColumnDef,
  type ReportGridValue,
} from './reportRecordGrid';

export const EMERGENCY_LIGHTING_DEVICE_LEGEND_ROW_COUNT = 10;

export const EMERGENCY_LIGHTING_DEVICE_LEGEND_COLUMNS: readonly ReportGridColumnDef[] = [
  { key: 'device', title: 'DEVICE', widthPercent: 18, orientation: 'horizontal', kind: 'text' },
  { key: 'description', title: 'DESCRIPTION', widthPercent: 34, orientation: 'horizontal', kind: 'text' },
  { key: 'manufacturer', title: 'MANUFACTURER', widthPercent: 24, orientation: 'horizontal', kind: 'text' },
  { key: 'model', title: 'MODEL', widthPercent: 24, orientation: 'horizontal', kind: 'text' },
];

export type EmergencyLightingDeviceLegendValue = ReportGridValue;

export function emptyEmergencyLightingDeviceLegendValue(): EmergencyLightingDeviceLegendValue {
  return emptyReportGridValue(
    EMERGENCY_LIGHTING_DEVICE_LEGEND_COLUMNS,
    EMERGENCY_LIGHTING_DEVICE_LEGEND_ROW_COUNT,
  );
}

export function normalizeEmergencyLightingDeviceLegendValue(
  raw: unknown,
): EmergencyLightingDeviceLegendValue {
  return normalizeReportGridValue(
    raw,
    EMERGENCY_LIGHTING_DEVICE_LEGEND_COLUMNS,
    EMERGENCY_LIGHTING_DEVICE_LEGEND_ROW_COUNT,
  );
}
