import type { FormElement } from './types';

/** Per-document replacements for fixed checklist row wording, keyed by row id. */
export type RowTextOverrides = Record<string, string>;

export const ROW_TEXT_OVERRIDES_KEY = 'rowText';

/** Document-only checklist rows removed via line select (collapsed on single-page panels). */
export const HIDDEN_TEMPLATE_LINES_KEY = 'hiddenTemplateLines';

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

/** Keeps `rowText` / `hiddenTemplateLines` when persisting normalized checklist payloads. */
export function mergeElementValuePatch(raw: unknown, patch: unknown): unknown {
  if (!isPlainObject(patch)) return patch;
  if (!isPlainObject(raw)) return patch;

  const merged: Record<string, unknown> = { ...raw, ...patch };

  const rawOverrides = readRowTextOverrides(raw);
  const patchOverrides = readRowTextOverrides(patch);
  const mergedOverrides =
    Object.keys(rawOverrides).length > 0 || Object.keys(patchOverrides).length > 0
      ? { ...rawOverrides, ...patchOverrides }
      : null;
  if (mergedOverrides && Object.keys(mergedOverrides).length > 0) {
    merged[ROW_TEXT_OVERRIDES_KEY] = mergedOverrides;
  } else if (!(ROW_TEXT_OVERRIDES_KEY in patch)) {
    delete merged[ROW_TEXT_OVERRIDES_KEY];
  }

  const hidden = new Set([
    ...readHiddenTemplateLineIds(raw),
    ...readHiddenTemplateLineIds(patch),
  ]);
  if (hidden.size > 0) {
    merged[HIDDEN_TEMPLATE_LINES_KEY] = [...hidden];
  } else if (!(HIDDEN_TEMPLATE_LINES_KEY in patch)) {
    delete merged[HIDDEN_TEMPLATE_LINES_KEY];
  }

  return merged;
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

/** Sets (or clears, when `text` is null) one row's wording. Empty string is kept as a blank override. */
export function setRowTextOverride(
  overrides: RowTextOverrides,
  rowId: string,
  text: string | null,
): RowTextOverrides {
  const { [rowId]: _previous, ...rest } = overrides;
  return text === null ? rest : { ...rest, [rowId]: text };
}

export function resolveRowText(
  overrides: RowTextOverrides,
  rowId: string,
  templateText: string,
): string {
  return rowId in overrides ? overrides[rowId] : templateText;
}

const ROW_LETTER_SUFFIX = '.letter';

export function rowLetterOverrideId(baseRowId: string): string {
  return `${baseRowId}${ROW_LETTER_SUFFIX}`;
}

/**
 * Applies a row/letter override. Clearing either column blank removes the whole row (letter + text).
 * `null` restores template defaults for that field.
 */
export function readHiddenTemplateLineIds(value: unknown): ReadonlySet<string> {
  if (!isPlainObject(value)) return new Set();
  const raw = value[HIDDEN_TEMPLATE_LINES_KEY];
  if (!Array.isArray(raw)) return new Set();
  const out = new Set<string>();
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) out.add(item);
  }
  return out;
}

export function isTemplateLineHidden(value: unknown, lineId: string): boolean {
  const hidden = readHiddenTemplateLineIds(value);
  if (hidden.has(lineId)) return true;
  // Older line removes stored `fdtl-*.device` instead of the device id.
  if (hidden.has(`${lineId}.device`)) return true;
  return false;
}

/** 23.1 legend: hide device block (1 or 3 physical rows) when removed or fully cleared. */
export function isFdtlDeviceRowHidden(value: unknown, deviceId: string): boolean {
  if (isTemplateLineHidden(value, deviceId)) return true;
  return isLogicalTemplateLineCollapsed(value, deviceId);
}

/** True when a logical line is removed (stored hide) or template text was cleared to blank. */
export function isLogicalTemplateLineCollapsed(value: unknown, lineId: string): boolean {
  if (isTemplateLineHidden(value, lineId)) return true;
  const overrides = readRowTextOverrides(value);
  const descCleared = lineId in overrides && overrides[lineId] === '';
  if (!descCleared) return false;
  const letterId = rowLetterOverrideId(lineId);
  if (letterId in overrides && overrides[letterId] === '') return true;
  const deviceKey = `${lineId}.device`;
  if (deviceKey in overrides && overrides[deviceKey] === '') return true;
  return false;
}

export function withHiddenTemplateLineIds(value: unknown, lineIds: Iterable<string>): unknown {
  if (!isPlainObject(value)) return value;
  const ids = [...new Set([...readHiddenTemplateLineIds(value), ...lineIds])];
  const { [HIDDEN_TEMPLATE_LINES_KEY]: _drop, ...rest } = value;
  return ids.length > 0 ? { ...rest, [HIDDEN_TEMPLATE_LINES_KEY]: ids } : rest;
}

export function addHiddenTemplateLine(value: unknown, lineId: string): unknown {
  if (!lineId.trim()) return value;
  return withHiddenTemplateLineIds(value, [lineId]);
}

export function applyRowTextOverride(
  overrides: RowTextOverrides,
  rowId: string,
  text: string | null,
): RowTextOverrides {
  if (text === '') {
    if (rowId.endsWith(ROW_LETTER_SUFFIX)) {
      const baseId = rowId.slice(0, -ROW_LETTER_SUFFIX.length);
      let next = setRowTextOverride(overrides, rowId, '');
      return setRowTextOverride(next, baseId, '');
    }
    let next = setRowTextOverride(overrides, rowId, '');
    return setRowTextOverride(next, rowLetterOverrideId(rowId), '');
  }

  if (text === null) {
    let next = setRowTextOverride(overrides, rowId, null);
    if (!rowId.endsWith(ROW_LETTER_SUFFIX)) {
      next = setRowTextOverride(next, rowLetterOverrideId(rowId), null);
    }
    return next;
  }

  return setRowTextOverride(overrides, rowId, text);
}
