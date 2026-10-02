import {
  emptyReportGridValue,
  normalizeReportGridValue,
  type ReportGridColumnDef,
  type ReportGridValue,
} from './reportRecordGrid';

/** Annual Sprinkler Inspection Report — fixed-row data tables. */

export type SprinklerTableId =
  | 'controlValves'
  | 'mainDrain'
  | 'wetAlarmValves'
  | 'paddleFlowSwitches'
  | 'drySystems';

type SprinklerTableDef = {
  rowCount: number;
  columns: readonly ReportGridColumnDef[];
};

function text(key: string, title: string, widthPercent: number): ReportGridColumnDef {
  return { key, title, widthPercent, orientation: 'horizontal', kind: 'text' };
}

function choice(key: string, title: string, widthPercent: number): ReportGridColumnDef {
  return { key, title, widthPercent, orientation: 'horizontal', kind: 'choice' };
}

export const SPRINKLER_TABLES: Record<SprinklerTableId, SprinklerTableDef> = {
  controlValves: {
    rowCount: 6,
    columns: [
      text('valve', 'VALVE', 24),
      text('type', 'TYPE', 18),
      text('size', 'SIZE', 8),
      choice('valveOpen', 'VALVE\nOPEN', 8),
      choice('valveSecured', 'VALVE\nSECURED', 9),
      choice('valveSigns', 'VALVE\nSIGNS', 8),
      text('remarks', 'REMARKS', 25),
    ],
  },
  mainDrain: {
    rowCount: 3,
    columns: [
      text('waterSource', 'WATER SOURCE\n& SIZE', 18),
      text('date', 'DATE', 12),
      text('location', 'MAIN DRAIN\nLOCATION', 22),
      text('testPipeSize', 'SIZE OF\nTEST PIPE', 12),
      choice('valveOpen', 'VALVE\nOPEN', 10),
      text('staticPressure', 'STATIC\nPRESSURE', 13),
      text('flowingPressure', 'FLOWING\nPRESSURE', 13),
    ],
  },
  wetAlarmValves: {
    rowCount: 6,
    columns: [
      text('systemZone', 'SYSTEM OR\nZONE NUMBER', 12),
      text('description', 'DESCRIPTION OF\nAREA COVERED', 34),
      text('sizeMakeModel', 'SIZE, MAKE\nAND MODEL', 24),
      choice('lowPressure', 'LOW\nPRESSURE', 10),
      text('alarmResponseTime', 'ALARM\nRESPONSE TIME', 10),
      choice('annunciation', 'ANNUNCIATION', 10),
    ],
  },
  paddleFlowSwitches: {
    rowCount: 6,
    columns: [
      text('systemZone', 'SYSTEM OR\nZONE NUMBER', 12),
      text('description', 'DESCRIPTION OF\nAREA COVERED', 38),
      text('sizeMakeModel', 'SIZE, MAKE\nAND MODEL', 28),
      text('alarmResponseTime', 'ALARM\nRESPONSE TIME', 11),
      choice('annunciation', 'ANNUNCIATION', 11),
    ],
  },
  drySystems: {
    rowCount: 5,
    columns: [
      text('systemZone', 'SYSTEM OR\nZONE NUMBER', 9),
      text('description', 'DESCRIPTION OF\nAREA COVERED', 17),
      text('valveSizeMakeModel', 'VALVE SIZE,\nMAKE AND MODEL', 16),
      text('waterPressure', 'WATER\nPRESSURE', 9),
      text('airPressure', 'AIR\nPRESSURE', 9),
      text('tripTime', 'TRIP TEST\nTRIP TIME', 9),
      text('timeToOutlet', 'TRIP TEST\nTIME TO OUTLET', 9),
      text('tripPointAirPressure', 'TRIP TEST\nTRIP POINT AIR', 11),
      choice('alarmOperation', 'ALARM\nOPERATION', 11),
    ],
  },
};

export type SprinklerTableValue = ReportGridValue;

export function sprinklerTableDef(table: SprinklerTableId): SprinklerTableDef {
  return SPRINKLER_TABLES[table];
}

export function emptySprinklerTableValue(table: SprinklerTableId): SprinklerTableValue {
  const def = sprinklerTableDef(table);
  return emptyReportGridValue(def.columns, def.rowCount);
}

export function normalizeSprinklerTableValue(
  table: SprinklerTableId,
  raw: unknown,
): SprinklerTableValue {
  const def = sprinklerTableDef(table);
  return normalizeReportGridValue(raw, def.columns, def.rowCount);
}
