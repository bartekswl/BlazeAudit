import { formatIsoDateLocal, parseIsoDateLocal } from '../dates';
export const DEFICIENCIES_DEVICE_ROWS = 6;
export const DEFICIENCIES_CONTROL_ROWS = 5;

export interface DeficiencyRepairFields {
  dateCorrected: string;
  workOrder: string;
  serviceProvider: string;
  technician: string;
}

export interface DeficiencyDeviceRow {
  itemNumber: string;
  deviceType: string;
  deviceLocation: string;
  deficiency: string;
  ulcClause: string;
  repair: DeficiencyRepairFields;
}

export interface DeficiencyControlRow {
  itemNumber: string;
  controlFunction: string;
  deficiency: string;
  ulcClause: string;
  repair: DeficiencyRepairFields;
}

export interface DeficienciesValue {
  deviceRows: DeficiencyDeviceRow[];
  controlRows: DeficiencyControlRow[];
  compliancePrintedName: string;
  complianceSignature: string;
  complianceDateMm: string;
  complianceDateDd: string;
  complianceDateYy: string;
}

function emptyRepair(): DeficiencyRepairFields {
  return { dateCorrected: '', workOrder: '', serviceProvider: '', technician: '' };
}

function emptyDeviceRow(): DeficiencyDeviceRow {
  return {
    itemNumber: '',
    deviceType: '',
    deviceLocation: '',
    deficiency: '',
    ulcClause: '',
    repair: emptyRepair(),
  };
}

function emptyControlRow(): DeficiencyControlRow {
  return {
    itemNumber: '',
    controlFunction: '',
    deficiency: '',
    ulcClause: '',
    repair: emptyRepair(),
  };
}

export function emptyDeficienciesValue(): DeficienciesValue {
  return {
    deviceRows: Array.from({ length: DEFICIENCIES_DEVICE_ROWS }, emptyDeviceRow),
    controlRows: Array.from({ length: DEFICIENCIES_CONTROL_ROWS }, emptyControlRow),
    compliancePrintedName: '',
    complianceSignature: '',
    complianceDateMm: '',
    complianceDateDd: '',
    complianceDateYy: '',
  };
}

function normalizeRepair(raw: unknown): DeficiencyRepairFields {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    dateCorrected: String(row.dateCorrected ?? ''),
    workOrder: String(row.workOrder ?? ''),
    serviceProvider: String(row.serviceProvider ?? ''),
    technician: String(row.technician ?? ''),
  };
}

function normalizeDeviceRow(raw: unknown): DeficiencyDeviceRow {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    itemNumber: String(row.itemNumber ?? ''),
    deviceType: String(row.deviceType ?? ''),
    deviceLocation: String(row.deviceLocation ?? ''),
    deficiency: String(row.deficiency ?? ''),
    ulcClause: String(row.ulcClause ?? ''),
    repair: normalizeRepair(row.repair),
  };
}

function normalizeControlRow(raw: unknown): DeficiencyControlRow {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    itemNumber: String(row.itemNumber ?? ''),
    controlFunction: String(row.controlFunction ?? ''),
    deficiency: String(row.deficiency ?? ''),
    ulcClause: String(row.ulcClause ?? ''),
    repair: normalizeRepair(row.repair),
  };
}

export function normalizeDeficienciesValue(raw: unknown): DeficienciesValue {
  const base = emptyDeficienciesValue();
  if (!raw || typeof raw !== 'object') return base;
  const value = raw as Record<string, unknown>;
  const deviceRows = Array.isArray(value.deviceRows)
    ? value.deviceRows.map(normalizeDeviceRow)
    : base.deviceRows;
  const controlRows = Array.isArray(value.controlRows)
    ? value.controlRows.map(normalizeControlRow)
    : base.controlRows;

  while (deviceRows.length < DEFICIENCIES_DEVICE_ROWS) deviceRows.push(emptyDeviceRow());
  while (controlRows.length < DEFICIENCIES_CONTROL_ROWS) controlRows.push(emptyControlRow());

  return {
    deviceRows: deviceRows.slice(0, DEFICIENCIES_DEVICE_ROWS),
    controlRows: controlRows.slice(0, DEFICIENCIES_CONTROL_ROWS),
    compliancePrintedName: String(value.compliancePrintedName ?? ''),
    complianceSignature: String(value.complianceSignature ?? ''),
    complianceDateMm: String(value.complianceDateMm ?? ''),
    complianceDateDd: String(value.complianceDateDd ?? ''),
    complianceDateYy: String(value.complianceDateYy ?? ''),
  };
}

export function formatDeficiencyMetaDate(iso: string): string {
  const date = parseIsoDateLocal(iso);
  if (!date) return iso.trim();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

/** ISO date → MM/DD/YY parts for compliance footer. */
export function isoToMmDdYy(iso: string): { mm: string; dd: string; yy: string } {
  const date = parseIsoDateLocal(iso);
  if (!date) return { mm: '', dd: '', yy: '' };
  return {
    mm: String(date.getMonth() + 1).padStart(2, '0'),
    dd: String(date.getDate()).padStart(2, '0'),
    yy: String(date.getFullYear()).slice(-2),
  };
}

export function todayMmDdYy(): { mm: string; dd: string; yy: string } {
  return isoToMmDdYy(formatIsoDateLocal(new Date()));
}