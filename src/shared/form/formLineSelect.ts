import type { FormElement } from './types';
import {
  ROW_TEXT_EDITABLE_KINDS,
  addHiddenTemplateLine,
  applyRowTextOverride,
  readRowTextOverrides,
  withRowTextOverrides,
} from './rowTextOverrides';
import {
  normalizeFieldDeviceTestingLegendValue,
  setFdtlDeviceField,
  type FdtlDeviceEntry,
} from './fieldDeviceTestingLegend';

/** Row attribute: one logical template line (e.g. 23.1 smoke `S` = 3 table rows). */
export const BA_TEMPLATE_LINE_HIDE = 'data-ba-line-row-hide';

export type TemplateLineClearRequest = {
  elementId: string;
  clearIds: string[];
  /** When set, clears the whole 23.1 device block (main + smoke sub-rows). */
  deviceId?: string;
  /** When set, collapses this logical line (`hiddenTemplateLines`). */
  hideLineId?: string;
};

/** Comma-separated row-text override ids for `data-ba-line-row-clear`. */
export function fdtlLegendLineClearIds(deviceId: string): string {
  return [
    `${deviceId}.device`,
    deviceId,
    `${deviceId}.sensitivityTestMethod`,
    `${deviceId}.manufacturerSensitivityRange`,
  ].join(',');
}

export function checklistLineClearIds(rowId: string): string {
  return `${rowId}.letter,${rowId}`;
}

export function parseLineClearIds(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Blank template line wording (document-only `rowText` overrides). */
export function clearRowTextIdsOnValue(value: unknown, clearIds: string[]): unknown {
  let overrides = readRowTextOverrides(value);
  for (const id of clearIds) {
    overrides = applyRowTextOverride(overrides, id, '');
  }
  return withRowTextOverrides(value, overrides);
}

export function resolveTemplateLineHideId(request: TemplateLineClearRequest): string | undefined {
  if (request.hideLineId?.trim()) return request.hideLineId.trim();
  if (request.deviceId?.trim()) return request.deviceId.trim();
  for (const id of request.clearIds) {
    if (id.endsWith('.letter')) continue;
    if (/^fdtl-[a-z0-9-]+$/i.test(id)) return id;
    if (id.endsWith('.device')) return id.slice(0, -'.device'.length);
  }
  const fallback = request.clearIds.find((id) => !id.endsWith('.letter'));
  if (!fallback) return undefined;
  if (fallback.startsWith('fdtl-')) {
    const dot = fallback.indexOf('.');
    if (dot > 0) return fallback.slice(0, dot);
  }
  return fallback;
}

function fdtlDeviceIdForClear(request: TemplateLineClearRequest): string | undefined {
  if (request.deviceId?.trim()) return request.deviceId.trim();
  const hideId = resolveTemplateLineHideId(request);
  if (hideId?.startsWith('fdtl-')) return hideId;
  return undefined;
}

/** Clear fixed line wording and collapse the row on single-page checklist panels. */
export function applyTemplateLineRemove(
  value: unknown,
  request: TemplateLineClearRequest,
  elementKind: FormElement['kind'] | undefined,
): unknown {
  let next: unknown;
  const fdtlDeviceId = fdtlDeviceIdForClear(request);
  if (elementKind === 'fieldDeviceTestingLegend' && fdtlDeviceId) {
    next = clearFdtlLegendLine(value, fdtlDeviceId);
  } else {
    next = clearRowTextIdsOnValue(value, request.clearIds);
  }
  if (elementKind && ROW_TEXT_EDITABLE_KINDS.has(elementKind)) {
    const hideId =
      elementKind === 'fieldDeviceTestingLegend' && fdtlDeviceId ? fdtlDeviceId : resolveTemplateLineHideId(request);
    if (hideId) next = addHiddenTemplateLine(next, hideId);
  }
  return next;
}

export function clearFdtlLegendLine(value: unknown, deviceId: string): unknown {
  const withText = clearRowTextIdsOnValue(
    value,
    parseLineClearIds(fdtlLegendLineClearIds(deviceId)),
  );
  const overrides = readRowTextOverrides(withText);
  let next = normalizeFieldDeviceTestingLegendValue(withText);
  const fields: Array<keyof FdtlDeviceEntry> = [
    'type',
    'modelNumber',
    'sensitivityTestMethod',
    'manufacturerSensitivityRange',
  ];
  for (const field of fields) {
    next = setFdtlDeviceField(next, deviceId, field, '');
  }
  return withRowTextOverrides(next, overrides);
}
