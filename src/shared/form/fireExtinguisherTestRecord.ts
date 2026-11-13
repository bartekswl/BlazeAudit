import {
  emptyReportGridValue,
  normalizeReportGridValue,
  type ReportGridColumnDef,
  type ReportGridValue,
} from './reportRecordGrid';

export const FIRE_EXTINGUISHER_TEST_RECORD_ROW_COUNT = 28;

const fetCenter = { align: 'center' as const };

export const FIRE_EXTINGUISHER_TEST_RECORD_COLUMNS: readonly ReportGridColumnDef[] = [
  { key: 'location', title: 'LOCATION', widthPercent: 26, orientation: 'horizontal', kind: 'text', ...fetCenter },
  { key: 'type', title: 'TYPE', widthPercent: 8, orientation: 'horizontal', kind: 'text', ...fetCenter },
  { key: 'make', title: 'MAKE', widthPercent: 10, orientation: 'horizontal', kind: 'text', ...fetCenter },
  { key: 'size', title: 'SIZE', widthPercent: 8, orientation: 'horizontal', kind: 'text', ...fetCenter },
  {
    key: 'requires6YearMaintenance',
    title: 'REQUIRES 6 YEAR\nMAINTENANCE',
    widthPercent: 10,
    orientation: 'horizontal',
    kind: 'choice',
    ...fetCenter,
  },
  {
    key: 'requiresHydrostaticTesting',
    title: 'REQUIRES\nHYDROSTATIC\nTESTING',
    widthPercent: 10,
    orientation: 'horizontal',
    kind: 'choice',
    ...fetCenter,
  },
  {
    key: 'requiresRecharging',
    title: 'REQUIRES\nRECHARGING',
    widthPercent: 9,
    orientation: 'horizontal',
    kind: 'choice',
    ...fetCenter,
  },
  { key: 'deficiency', title: 'NOTES', widthPercent: 19, orientation: 'horizontal', kind: 'text', ...fetCenter },
];

export type FireExtinguisherTestRecordValue = ReportGridValue;

export function emptyFireExtinguisherTestRecordValue(): FireExtinguisherTestRecordValue {
  return emptyReportGridValue(
    FIRE_EXTINGUISHER_TEST_RECORD_COLUMNS,
    FIRE_EXTINGUISHER_TEST_RECORD_ROW_COUNT,
  );
}

export function normalizeFireExtinguisherTestRecordValue(
  raw: unknown,
): FireExtinguisherTestRecordValue {
  return normalizeReportGridValue(
    raw,
    FIRE_EXTINGUISHER_TEST_RECORD_COLUMNS,
    FIRE_EXTINGUISHER_TEST_RECORD_ROW_COUNT,
  );
}
