import {
  emptyReportGridValue,
  normalizeReportGridValue,
  type ReportGridColumnDef,
  type ReportGridValue,
} from './reportRecordGrid';

export const FIRE_EXTINGUISHER_TEST_RECORD_ROW_COUNT = 28;

export const FIRE_EXTINGUISHER_TEST_RECORD_COLUMNS: readonly ReportGridColumnDef[] = [
  { key: 'location', title: 'LOCATION', widthPercent: 22, orientation: 'horizontal', kind: 'text' },
  { key: 'type', title: 'TYPE', widthPercent: 8, orientation: 'horizontal', kind: 'text' },
  { key: 'make', title: 'MAKE', widthPercent: 10, orientation: 'horizontal', kind: 'text' },
  { key: 'size', title: 'SIZE', widthPercent: 8, orientation: 'horizontal', kind: 'text' },
  {
    key: 'requires6YearMaintenance',
    title: 'REQUIRES 6 YEAR\nMAINTENANCE',
    widthPercent: 10,
    orientation: 'horizontal',
    kind: 'choice',
  },
  {
    key: 'requiresHydrostaticTesting',
    title: 'REQUIRES\nHYDROSTATIC\nTESTING',
    widthPercent: 10,
    orientation: 'horizontal',
    kind: 'choice',
  },
  {
    key: 'requiresRecharging',
    title: 'REQUIRES\nRECHARGING',
    widthPercent: 9,
    orientation: 'horizontal',
    kind: 'choice',
  },
  { key: 'deficiency', title: 'DEFICIENCY', widthPercent: 23, orientation: 'horizontal', kind: 'text' },
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
