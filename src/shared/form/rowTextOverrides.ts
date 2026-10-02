import type { FormElement } from './types';

/** Per-document replacements for fixed checklist row wording, keyed by row id. */
export type RowTextOverrides = Record<string, string>;

export const ROW_TEXT_OVERRIDES_KEY = 'rowText';

/** Built-in checklist / legend panels whose fixed row wording may be reworded per document. */
export const ROW_TEXT_EDITABLE_KINDS: ReadonlySet<FormElement['kind']> = new Set<FormElement['kind']>([
  'yesNoSummary',
  'documentation',
  'controlUnitTest',
  'controlUnitRecord',
  'voiceCommunicationTest',
  'powerSupplyInspection',
  'emergencyPowerSupplyTest',
  'annunciatorDeviceTest',
  'sequentialDisplayTest',
  'remoteTroubleSignalUnitTest',
  'printerTest',
  'fireSignalReceivingCentreInterconnection',
  'dataCommunicationLinkFaultTolerance',
  'fieldDeviceTestingLegend',
]);

const EMPTY_OVERRIDES: RowTextOverrides = Object.freeze({}) as RowTextOverrides;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function readRowTextOverrides(value: unknown): RowTextOverrides {
  if (!isPlainObject(value)) return EMPTY_OVERRIDES;
  const raw = value[ROW_TEXT_OVERRIDES_KEY];
  if (!isPlainObject(raw)) return EMPTY_OVERRIDES;
  const out: RowTextOverrides = {};
  for (const [rowId, text] of Object.entries(raw)) {
    if (typeof text === 'string') out[rowId] = text;
  }
  return Object.keys(out).length > 0 ? out : EMPTY_OVERRIDES;
}

/** Returns `value` with its row-text map replaced by `overrides` (key dropped when empty). */
export function withRowTextOverrides(value: unknown, overrides: RowTextOverrides): unknown {
  if (!isPlainObject(value)) return value;
  const { [ROW_TEXT_OVERRIDES_KEY]: _previous, ...rest } = value;
  return Object.keys(overrides).length > 0
    ? { ...rest, [ROW_TEXT_OVERRIDES_KEY]: overrides }
    : rest;
}

/** Sets (or clears, when `text` is null) one row's wording. */
export function setRowTextOverride(
  overrides: RowTextOverrides,
  rowId: string,
  text: string | null,
): RowTextOverrides {
  const { [rowId]: _previous, ...rest } = overrides;
  return text === null ? rest : { ...rest, [rowId]: text };
}
