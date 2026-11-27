import { AFFIRMATION_CONDUCTING_LABELS, AFFIRMATION_PRIMARY_LABELS, normalizeAffirmationValue, type AffirmationTechnicianValue } from '../affirmation';
import { ANNUNCIATOR_DEVICE_TEST_IDENTIFICATION_LABEL, ANNUNCIATOR_DEVICE_TEST_LOCATION_LABEL, ANNUNCIATOR_DEVICE_TEST_ROWS, normalizeAnnunciatorDeviceTestValue } from '../annunciatorDeviceTest';
import { ATTENDANCE_LOG_COLUMNS, normalizeAttendanceLogValue } from '../attendanceLog';
import { CONTROL_UNIT_RECORD_ROWS, normalizeControlUnitRecordValue } from '../controlUnitRecord';
import { CONTROL_UNIT_TEST_FIELD_LOCATION_LABEL, CONTROL_UNIT_TEST_IDENTIFICATION_LABEL, CONTROL_UNIT_TEST_ROWS, normalizeControlUnitTestValue } from '../controlUnitTest';
import { DCLFT_CONTROL_UNIT_IDENTIFICATION_LABEL, DCLFT_CONTROL_UNIT_LOCATION_LABEL, DCLFT_DCL_CIRCUIT_IDENTIFICATION_LABEL, DCLFT_ROWS, normalizeDataCommunicationLinkFaultToleranceValue } from '../dataCommunicationLinkFaultTolerance';
import { normalizeDeficienciesValue } from '../deficiencies';
import { DOCUMENTATION_I_SUBITEMS, DOCUMENTATION_MAIN_ROWS, normalizeDocumentationValue } from '../documentation';
import { EMERGENCY_LIGHTING_DEVICE_LEGEND_COLUMNS, normalizeEmergencyLightingDeviceLegendValue } from '../emergencyLightingDeviceLegend';
import { EMERGENCY_LIGHTING_INSPECTION_RECORD_COLUMNS, normalizeEmergencyLightingInspectionRecordValue } from '../emergencyLightingInspectionRecord';
import { EMERGENCY_POWER_SUPPLY_TEST_ROWS, normalizeEmergencyPowerSupplyTestValue } from '../emergencyPowerSupplyTest';
import { FIRE_EXTINGUISHER_TEST_RECORD_COLUMNS, normalizeFireExtinguisherTestRecordValue } from '../fireExtinguisherTestRecord';
import { FSRC_COMMUNICATOR_LOCATION_LABEL, FSRC_ROWS, normalizeFireSignalReceivingCentreInterconnectionValue } from '../fireSignalReceivingCentreInterconnection';
import { addIndividualDeviceRecordPage, pageHasIndividualDeviceRecord } from '../individualDeviceRecordPages';
import { INDIVIDUAL_DEVICE_RECORD_COLUMNS, normalizeIndividualDeviceRecordValue } from '../individualDeviceRecord';
import { clampLinedNotesToMaxLines, RECOMMENDATIONS_ROW_COUNT, TESTING_NOTES_ROW_COUNT } from '../linedNotes';
import { POWER_SUPPLY_INSPECTION_BREAKER_LABEL, POWER_SUPPLY_INSPECTION_DISCONNECT_LOCATION_LABEL, POWER_SUPPLY_INSPECTION_FIELD_LOCATION_LABEL, POWER_SUPPLY_INSPECTION_IDENTIFICATION_LABEL, POWER_SUPPLY_INSPECTION_ROWS, normalizePowerSupplyInspectionValue } from '../powerSupplyInspection';
import { normalizePortableExtinguisherCoverValue } from '../portableExtinguisherCover';
import { PRINTER_TEST_IDENTIFICATION_LABEL, PRINTER_TEST_LOCATION_LABEL, PRINTER_TEST_ROWS, normalizePrinterTestValue } from '../printerTest';
import { REMOTE_TROUBLE_SIGNAL_UNIT_TEST_IDENTIFICATION_LABEL, REMOTE_TROUBLE_SIGNAL_UNIT_TEST_LOCATION_LABEL, REMOTE_TROUBLE_SIGNAL_UNIT_TEST_ROWS, normalizeRemoteTroubleSignalUnitTestValue } from '../remoteTroubleSignalUnitTest';
import { addRepeatableFormPage, resolveRepeatableFormPageKind } from '../repeatableFormPages';
import { mergeElementValuePatch } from '../rowTextOverrides';
import { SEQUENTIAL_DISPLAY_TEST_IDENTIFICATION_LABEL, SEQUENTIAL_DISPLAY_TEST_LOCATION_LABEL, SEQUENTIAL_DISPLAY_TEST_ROWS, normalizeSequentialDisplayTestValue } from '../sequentialDisplayTest';
import { setElementValue } from '../values';
import { VOICE_COMMUNICATION_TEST_IDENTIFICATION_LABEL, VOICE_COMMUNICATION_TEST_LOCATION_LABEL, VOICE_COMMUNICATION_TEST_ROWS, normalizeVoiceCommunicationTestValue } from '../voiceCommunicationTest';
import type { FormElement, FormInspectionDocument, FormPage } from '../types';
import { parseMmDdYyDate } from '../../dates';
import { normalizeEmergencyLightingCoverValue } from '../emergencyLightingCover';
import { SPRINKLER_CHECKLIST_GROUPS, normalizeSprinklerChecklistValue, sprinklerFieldKey } from '../sprinklerChecklist';
import { normalizeSprinklerCoverValue } from '../sprinklerCover';
import { normalizeSprinklerTableValue, sprinklerTableDef } from '../sprinklerTables';
import { normalizeUlcSection1Value, type UlcSection1Value } from '../ulcSection1';
import { normalizeYesNoSummaryValue } from '../yesNoSummary';
import {
  cellText,
  emptyGridRow,
  extractGridRows,
  fillChecklistChoices,
  fillChoiceLabels,
  fillLabeledStrings,
  fillYesNoSummary,
  linedNotesFromLines,
  type ExtractedCells,
} from './fill';
import { matchTemplatePage, pageIndexesForSignature } from './matchPage';
import type { OcrLine, OcrPage } from './ocrTypes';
import { assignLinesToRows, choiceOnLine, normalizeOcr, textAfterLabel, type ReadChoice } from './text';

const SKIP_CONTENT_KEYS = new Set([
  'buildingName',
  'address',
  'city',
  'postalCode',
  'ownerPropertyManager',
  'ownerPhone',
  'ownerFax',
  'contactPerson',
  'contactPhone',
  'contactFax',
  'phonesEdited',
  'companyName',
  'companyAddress',
  'companyPhone',
  'rowText',
  'hiddenTemplateLines',
]);

function hasContent(value: unknown, key?: string): boolean {
  if (key && SKIP_CONTENT_KEYS.has(key)) return false;
  if (value == null || value === false) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.some((item) => hasContent(item));
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).some(([childKey, child]) =>
      hasContent(child, childKey),
    );
  }
  return false;
}

function pageHasContent(document: FormInspectionDocument, pageIndex: number): boolean {
  const page = document.form.pages[pageIndex];
  if (!page) return false;
  for (const section of page.sections) {
    for (const element of section.elements) {
      if (hasContent(document.values[element.id])) return true;
    }
  }
  return false;
}

function canAddPage(document: FormInspectionDocument, pageIndex: number): 'idr' | 'repeatable' | null {
  const page = document.form.pages[pageIndex];
  if (!page) return null;
  if (pageHasIndividualDeviceRecord(page)) return 'idr';
  if (resolveRepeatableFormPageKind(document.form, pageIndex)) return 'repeatable';
  return null;
}

function addPage(
  document: FormInspectionDocument,
  afterIndex: number,
  mode: 'idr' | 'repeatable',
): FormInspectionDocument {
  return mode === 'idr'
    ? addIndividualDeviceRecordPage(document, afterIndex)
    : addRepeatableFormPage(document, afterIndex);
}

/** Use an empty sheet of this page. If every copy already has writing, add one when the form allows it. */
function targetPage(
  document: FormInspectionDocument,
  signature: string,
): { document: FormInspectionDocument; pageIndex: number } | null {
  const indexes = pageIndexesForSignature(document.form, signature);
  if (indexes.length === 0) return null;
  for (const index of indexes) {
    if (!pageHasContent(document, index)) return { document, pageIndex: index };
  }
  const mode = canAddPage(document, indexes[0]);
  if (!mode) return { document, pageIndex: indexes[0] };
  const after = indexes[indexes.length - 1];
  const next = addPage(document, after, mode);
  if (next === document) return { document, pageIndex: indexes[0] };
  return { document: next, pageIndex: after + 1 };
}

function writeElement(
  document: FormInspectionDocument,
  elementId: string,
  value: unknown,
): FormInspectionDocument {
  return {
    ...document,
    values: setElementValue(
      document.values,
      elementId,
      mergeElementValuePatch(document.values[elementId], value),
    ),
  };
}

function applyChecklist(
  value: unknown,
  rows: readonly { id: string; text?: string }[],
  lines: OcrPage['lines'],
  labels: readonly { key: string; label: string }[],
  allowed?: readonly ReadChoice[],
): { value: unknown; filled: number } {
  const labeled = fillLabeledStrings(value, lines, labels);
  const choices = fillChecklistChoices(labeled.value, rows, lines, allowed);
  return { value: choices.value, filled: labeled.filled + choices.filled };
}

function writeGridRows(
  rows: Record<string, unknown>[],
  columns: readonly { key: string; kind: 'text' | 'choice' }[],
  extracted: ExtractedCells[],
  allowNa = false,
): { rows: Record<string, unknown>[]; written: number } {
  const next = rows.map((row) => ({ ...row }));
  let cursor = 0;
  let written = 0;
  for (let index = 0; index < next.length && cursor < extracted.length; index++) {
    if (!emptyGridRow(next[index], columns)) continue;
    const source = extracted[cursor];
    cursor += 1;
    const row = { ...next[index] };
    let used = false;
    for (const column of columns) {
      const read = cellText(source[column.key] ?? '', column.kind);
      if (column.kind === 'choice') {
        if (read === 'yes' || read === 'no' || read === 'na') {
          if (row[column.key] == null && (read !== 'na' || allowNa)) {
            row[column.key] = read === 'na' ? 'na' : read;
            used = true;
          }
        }
      } else if (typeof read === 'string' && read && !String(row[column.key] ?? '').trim()) {
        row[column.key] = read;
        used = true;
      }
    }
    if (used) {
      next[index] = row;
      written += 1;
    }
  }
  return { rows: next, written };
}

function elementLines(page: FormPage, lines: OcrPage['lines']): OcrPage['lines'] {
  const headings = page.sections.map((section) => section.heading ?? '').filter(Boolean);
  return lines.filter((line) => {
    const text = line.text.trim();
    if (!text) return false;
    return !headings.some((heading) => text.toLowerCase().includes(heading.toLowerCase().slice(0, 24)));
  });
}

function fillTechnician(
  tech: AffirmationTechnicianValue,
  lines: OcrLine[],
  nameLabel: string,
): { tech: AffirmationTechnicianValue; filled: number } {
  const next = { ...tech };
  let filled = 0;
  const pairs = [
    ['name', nameLabel],
    ['identification', 'Identification Number'],
  ] as const;
  for (const [key, label] of pairs) {
    const current = next[key];
    if (typeof current === 'string' && current.trim()) continue;
    const read = textAfterLabel(lines, label);
    const readWords = normalizeOcr(read).split(' ').filter((word) => word.length >= 3);
    if (readWords.length === 0) continue;
    next[key] = read;
    filled += 1;
  }
  return { tech: next, filled };
}

function plainText(text: string): string {
  const cleaned = text.trim().replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
  if (/[:_]/.test(cleaned)) return '';
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (cleaned.length < 3 || cleaned.length > 60 || words.length > 6) return '';
  return cleaned;
}

function digitRun(text: string, min: number, max: number): string {
  const digits = text.replace(/\D/g, '');
  return digits.length >= min && digits.length <= max ? digits : '';
}

function personName(text: string): string {
  const name = text
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z'-]/g, ''))
    .filter((word) => word.length >= 2)
    .join(' ');
  const words = name.split(' ').filter(Boolean);
  if (words.length >= 2 || (words[0]?.length ?? 0) >= 4) return name;
  return '';
}

function summaryFromPen(
  value: unknown,
  items: readonly { id: string }[],
  pen: Record<string, string>,
): { value: unknown; filled: number } | null {
  if (!value || typeof value !== 'object') return null;
  const marked = items.flatMap((item) => {
    const choice = pen[`summary:${item.id}`];
    return choice === 'yes' || choice === 'no' ? [{ id: item.id, choice }] : [];
  });
  const hasFill = items.some((item) => (pen[`summaryFill:${item.id}`]?.trim() ?? '') !== '');
  if (marked.length === 0 && !hasFill) return null;
  const next = { ...(value as Record<string, unknown>) };
  let filled = 0;
  for (const mark of marked) {
    const current = next[mark.id];
    if (!current || typeof current !== 'object' || (current as { choice?: unknown }).choice != null) continue;
    next[mark.id] = { ...(current as Record<string, unknown>), choice: mark.choice };
    filled += 1;
  }
  for (const item of items) {
    const fillIn = pen[`summaryFill:${item.id}`]?.trim() ?? '';
    if (!fillIn) continue;
    const current = next[item.id];
    if (!current || typeof current !== 'object') continue;
    const row = current as { fillIn?: unknown };
    if (typeof row.fillIn === 'string' && row.fillIn.trim()) continue;
    next[item.id] = { ...(current as Record<string, unknown>), fillIn };
    filled += 1;
  }
  return { value: next, filled };
}

function fillAffirmationFromPen(
  raw: unknown,
  lines: OcrLine[],
  pen: Record<string, string>,
  hasPenJob: boolean,
): { value: unknown; filled: number } {
  const current = normalizeAffirmationValue(raw);
  const primary = { ...current.primary };
  const conducting = { ...current.conducting };
  let filled = 0;
  const write = (
    tech: AffirmationTechnicianValue,
    key: string,
    field: 'name' | 'identification' | 'date' | 'signature',
    clean: (text: string) => string,
  ) => {
    const incoming = pen[key]?.trim() ?? '';
    if (!incoming || String(tech[field] ?? '').trim()) return;
    const value = clean(incoming);
    if (!value) return;
    tech[field] = value;
    filled += 1;
  };
  // Names stay empty. The technician is chosen from the inspector list.
  write(primary, 'primaryIdentification', 'identification', plainText);
  write(primary, 'primaryDate', 'date', handwrittenDate);
  write(primary, 'primarySignature', 'signature', plainText);
  write(conducting, 'conductingIdentification', 'identification', plainText);
  write(conducting, 'conductingDate', 'date', handwrittenDate);
  write(conducting, 'conductingSignature', 'signature', plainText);
  if (filled === 0 && !hasPenJob) return fillAffirmation(raw, lines);
  return { value: { primary, conducting }, filled };
}

function fillAffirmation(raw: unknown, lines: OcrLine[]): { value: unknown; filled: number } {
  const current = normalizeAffirmationValue(raw);
  const split = lines.findIndex((line) => normalizeOcr(line.text).includes('technician conducting'));
  const primaryLines = split > 0 ? lines.slice(0, split) : lines;
  const conductingLines = split > 0 ? lines.slice(split) : [];
  const primary = fillTechnician(current.primary, primaryLines, AFFIRMATION_PRIMARY_LABELS[0]);
  const conducting = fillTechnician(current.conducting, conductingLines, AFFIRMATION_CONDUCTING_LABELS[0]);
  return {
    value: { primary: primary.tech, conducting: conducting.tech },
    filled: primary.filled + conducting.filled,
  };
}

function fillSprinklerChecklist(
  group: keyof typeof SPRINKLER_CHECKLIST_GROUPS,
  raw: unknown,
  lines: OcrLine[],
): { value: unknown; filled: number } {
  const current = normalizeSprinklerChecklistValue(raw);
  const items = SPRINKLER_CHECKLIST_GROUPS[group].filter((row) => row.type === 'item');
  const assigned = assignLinesToRows(
    items.filter((row) => row.choice !== false).map((row) => ({ id: row.id, text: row.text })),
    lines,
  );
  const answers = { ...current.answers };
  const fields = { ...current.fields };
  let filled = 0;
  for (const [id, line] of assigned) {
    if (answers[id] != null) continue;
    const choice = choiceOnLine(line, ['yes', 'no', 'na']);
    if (!choice) continue;
    answers[id] = choice;
    filled += 1;
  }
  for (const row of items) {
    for (const field of row.fields ?? []) {
      const key = sprinklerFieldKey(row.id, field.key);
      if ((fields[key] ?? '').trim()) continue;
      const read = textAfterLabel(lines, field.label);
      if (!read) continue;
      fields[key] = read;
      filled += 1;
    }
  }
  return { value: { ...current, answers, fields }, filled };
}

function isCalendarDate(iso: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1990 || year > 2999) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** Pull a date out of a handwriting read. A real calendar date wins; a messy digit string is kept. */
function handwrittenDate(text: string): string {
  const cleaned = text.replace(/[^\d/-]/g, '');
  for (let start = 0; start + 10 <= cleaned.length; start += 1) {
    const slice = cleaned.slice(start, start + 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(slice) && isCalendarDate(slice)) return slice;
  }
  const dash = cleaned.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (dash) {
    const padded = `${dash[1]}-${dash[2]!.padStart(2, '0')}-${dash[3]!.padStart(2, '0')}`;
    if (isCalendarDate(padded)) return padded;
    return padded;
  }
  const slash = cleaned.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
  if (slash) {
    const parsed = parseMmDdYyDate(slash[0]);
    if (parsed) return parsed;
  }
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length >= 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  if (digits.length === 6) {
    const parsed = parseMmDdYyDate(
      `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 6)}`,
    );
    if (parsed) return parsed;
  }
  return digits.length >= 4 ? cleaned : '';
}

function fillElement(
  element: FormElement,
  raw: unknown,
  lines: OcrPage['lines'],
  pen: Record<string, string>,
  hasPenJob: boolean,
): { value: unknown; filled: number } {
  switch (element.kind) {
    case 'yesNoSummary': {
      const current = normalizeYesNoSummaryValue(raw, element.items);
      const fromPen = summaryFromPen(current, element.items, pen);
      if (fromPen) return fromPen;
      if (hasPenJob) return { value: current, filled: 0 };
      return fillYesNoSummary(current, element.items, lines);
    }
    case 'ulcSection1': {
      const current = normalizeUlcSection1Value(raw);
      const next = { ...current };
      let filled = 0;
      const writeText = (key: keyof UlcSection1Value, value: string) => {
        if (!value || (typeof current[key] === 'string' && current[key].trim())) return;
        next[key] = value as never;
        filled += 1;
      };
      for (const key of ['dateOfService', 'lastServiceDate'] as const) {
        writeText(key, handwrittenDate(pen[key] ?? ''));
      }
      writeText('projectNumber', digitRun(pen.projectNumber ?? '', 2, 12));
      for (const key of ['circuitsInitiating', 'circuitsNotification', 'circuitsVoicePaging'] as const) {
        writeText(key, digitRun(pen[key] ?? '', 1, 6));
      }
      for (const key of ['contactPhone', 'ownerPhone', 'fireSignalPhone'] as const) {
        writeText(key, digitRun(pen[key] ?? '', 6, 15));
      }
      writeText('postalCode', plainText(pen.postalCode ?? ''));
      for (const key of [
        'stageOtherText',
        'manufacturer',
        'modelNumber',
        'ulcSerialNumber',
        'buildingName',
        'address',
        'city',
        'fireSignalCentre',
      ] as const) {
        writeText(key, plainText(pen[key] ?? ''));
      }
      writeText('contactPerson', personName(pen.contactPerson ?? ''));
      writeText('ownerPropertyManager', personName(pen.ownerPropertyManager ?? ''));
      for (const key of [
        'stageSingle',
        'stageTwo',
        'stageOther',
        'systemAddressable',
        'systemConventional',
        'systemWireless',
        'systemHybrid',
      ] as const) {
        if (pen[key] === 'yes' && next[key] !== true) {
          next[key] = true;
          filled += 1;
        }
      }
      return { value: next, filled };
    }
    case 'documentation':
      return applyChecklist(
        normalizeDocumentationValue(raw),
        [
          ...DOCUMENTATION_MAIN_ROWS.filter((row) => row.kind === 'checklist'),
          ...DOCUMENTATION_I_SUBITEMS,
        ],
        lines,
        [],
      );
    case 'controlUnitTest':
      return applyChecklist(normalizeControlUnitTestValue(raw), CONTROL_UNIT_TEST_ROWS, lines, [
        { key: 'fieldLocation', label: CONTROL_UNIT_TEST_FIELD_LOCATION_LABEL },
        { key: 'identification', label: CONTROL_UNIT_TEST_IDENTIFICATION_LABEL },
      ]);
    case 'controlUnitRecord':
      return applyChecklist(normalizeControlUnitRecordValue(raw), CONTROL_UNIT_RECORD_ROWS, lines, [
        { key: 'fieldLocation', label: 'Control Unit/Transponder Field Location' },
        { key: 'identification', label: 'Control Unit/Transponder Identification' },
      ]);
    case 'voiceCommunicationTest':
      return applyChecklist(normalizeVoiceCommunicationTestValue(raw), VOICE_COMMUNICATION_TEST_ROWS, lines, [
        { key: 'fieldLocation', label: VOICE_COMMUNICATION_TEST_LOCATION_LABEL },
        { key: 'identification', label: VOICE_COMMUNICATION_TEST_IDENTIFICATION_LABEL },
      ]);
    case 'powerSupplyInspection':
      return applyChecklist(normalizePowerSupplyInspectionValue(raw), POWER_SUPPLY_INSPECTION_ROWS, lines, [
        { key: 'fieldLocation', label: POWER_SUPPLY_INSPECTION_FIELD_LOCATION_LABEL },
        { key: 'identification', label: POWER_SUPPLY_INSPECTION_IDENTIFICATION_LABEL },
        { key: 'disconnectLocation', label: POWER_SUPPLY_INSPECTION_DISCONNECT_LOCATION_LABEL },
        { key: 'breakerIdentification', label: POWER_SUPPLY_INSPECTION_BREAKER_LABEL },
      ]);
    case 'emergencyPowerSupplyTest':
      return applyChecklist(
        normalizeEmergencyPowerSupplyTestValue(raw),
        EMERGENCY_POWER_SUPPLY_TEST_ROWS.filter((row) => row.text.trim()),
        lines,
        [],
      );
    case 'annunciatorDeviceTest':
      return applyChecklist(normalizeAnnunciatorDeviceTestValue(raw), ANNUNCIATOR_DEVICE_TEST_ROWS, lines, [
        { key: 'fieldLocation', label: ANNUNCIATOR_DEVICE_TEST_LOCATION_LABEL },
        { key: 'identification', label: ANNUNCIATOR_DEVICE_TEST_IDENTIFICATION_LABEL },
      ]);
    case 'sequentialDisplayTest':
      return applyChecklist(normalizeSequentialDisplayTestValue(raw), SEQUENTIAL_DISPLAY_TEST_ROWS, lines, [
        { key: 'fieldLocation', label: SEQUENTIAL_DISPLAY_TEST_LOCATION_LABEL },
        { key: 'identification', label: SEQUENTIAL_DISPLAY_TEST_IDENTIFICATION_LABEL },
      ]);
    case 'remoteTroubleSignalUnitTest':
      return applyChecklist(normalizeRemoteTroubleSignalUnitTestValue(raw), REMOTE_TROUBLE_SIGNAL_UNIT_TEST_ROWS, lines, [
        { key: 'fieldLocation', label: REMOTE_TROUBLE_SIGNAL_UNIT_TEST_LOCATION_LABEL },
        { key: 'identification', label: REMOTE_TROUBLE_SIGNAL_UNIT_TEST_IDENTIFICATION_LABEL },
      ]);
    case 'printerTest':
      return applyChecklist(normalizePrinterTestValue(raw), PRINTER_TEST_ROWS, lines, [
        { key: 'fieldLocation', label: PRINTER_TEST_LOCATION_LABEL },
        { key: 'identification', label: PRINTER_TEST_IDENTIFICATION_LABEL },
      ]);
    case 'fireSignalReceivingCentreInterconnection':
      return applyChecklist(
        normalizeFireSignalReceivingCentreInterconnectionValue(raw),
        FSRC_ROWS.flatMap((row) => {
          if (row.choiceMode === 'record-fields') return [];
          if (row.subItems?.length) return row.subItems.map((item) => ({ id: item.id, text: item.text }));
          return row.text ? [{ id: row.id, text: row.text }] : [];
        }),
        lines,
        [{ key: 'communicatorLocation', label: FSRC_COMMUNICATOR_LOCATION_LABEL }],
      );
    case 'dataCommunicationLinkFaultTolerance': {
      const record = normalizeDataCommunicationLinkFaultToleranceValue(raw);
      const primary = applyChecklist(record.primary, DCLFT_ROWS, lines, [
        { key: 'controlUnitLocation', label: DCLFT_CONTROL_UNIT_LOCATION_LABEL },
        { key: 'controlUnitIdentification', label: DCLFT_CONTROL_UNIT_IDENTIFICATION_LABEL },
        { key: 'dclCircuitIdentification', label: DCLFT_DCL_CIRCUIT_IDENTIFICATION_LABEL },
      ]);
      return { value: { ...record, primary: primary.value }, filled: primary.filled };
    }
    case 'recommendations':
    case 'testingNotes': {
      const current = typeof raw === 'string' ? raw : '';
      if (current.trim()) return { value: raw, filled: 0 };
      const max = element.kind === 'recommendations' ? RECOMMENDATIONS_ROW_COUNT : TESTING_NOTES_ROW_COUNT;
      const text = clampLinedNotesToMaxLines(linedNotesFromLines(lines, []), max);
      return text ? { value: text, filled: 1 } : { value: raw, filled: 0 };
    }
    case 'individualDeviceRecord': {
      const current = normalizeIndividualDeviceRecordValue(raw);
      const extracted = extractGridRows(lines, INDIVIDUAL_DEVICE_RECORD_COLUMNS);
      const written = writeGridRows(current.rows, INDIVIDUAL_DEVICE_RECORD_COLUMNS, extracted, true);
      return { value: { rows: written.rows }, filled: written.written };
    }
    case 'fireExtinguisherTestRecord': {
      const current = normalizeFireExtinguisherTestRecordValue(raw);
      const extracted = extractGridRows(lines, FIRE_EXTINGUISHER_TEST_RECORD_COLUMNS);
      const written = writeGridRows(current.rows, FIRE_EXTINGUISHER_TEST_RECORD_COLUMNS, extracted);
      return { value: { rows: written.rows }, filled: written.written };
    }
    case 'emergencyLightingDeviceLegend': {
      const current = normalizeEmergencyLightingDeviceLegendValue(raw);
      const extracted = extractGridRows(lines, EMERGENCY_LIGHTING_DEVICE_LEGEND_COLUMNS);
      const written = writeGridRows(current.rows, EMERGENCY_LIGHTING_DEVICE_LEGEND_COLUMNS, extracted);
      return { value: { rows: written.rows }, filled: written.written };
    }
    case 'emergencyLightingInspectionRecord': {
      const current = normalizeEmergencyLightingInspectionRecordValue(raw);
      const extracted = extractGridRows(lines, EMERGENCY_LIGHTING_INSPECTION_RECORD_COLUMNS);
      const written = writeGridRows(current.rows, EMERGENCY_LIGHTING_INSPECTION_RECORD_COLUMNS, extracted);
      return { value: { rows: written.rows }, filled: written.written };
    }
    case 'deficiencies':
      return fillDeficiencies(raw, lines);
    case 'affirmation':
      return fillAffirmationFromPen(raw, lines, pen, hasPenJob);
    case 'attendanceLog': {
      const current = normalizeAttendanceLogValue(raw);
      const columns = ATTENDANCE_LOG_COLUMNS.map((column) => ({ ...column, kind: 'text' as const }));
      const written = writeGridRows(current.rows, columns, extractGridRows(lines, columns));
      return { value: { rows: written.rows }, filled: written.written };
    }
    case 'sprinklerChecklist':
      return fillSprinklerChecklist(element.group, raw, lines);
    case 'sprinklerTable': {
      const def = sprinklerTableDef(element.table);
      const current = normalizeSprinklerTableValue(element.table, raw);
      const written = writeGridRows(current.rows, def.columns, extractGridRows(lines, def.columns));
      return { value: { rows: written.rows }, filled: written.written };
    }
    case 'portableExtinguisherCover':
      return fillLabeledStrings(normalizePortableExtinguisherCoverValue(raw), lines, [
        { key: 'jobContactNo', label: 'Project Number' },
        { key: 'inspectorName', label: 'Inspector Conducting Test' },
        { key: 'signatureName', label: 'Signature' },
      ]);
    case 'sprinklerCover':
      return fillLabeledStrings(normalizeSprinklerCoverValue(raw), lines, [
        { key: 'jobContactNo', label: 'Project Number' },
        { key: 'inspectorName', label: 'Inspector Conducting Test' },
        { key: 'signatureName', label: 'Signature' },
      ]);
    case 'emergencyLightingCover': {
      const text = fillLabeledStrings(normalizeEmergencyLightingCoverValue(raw), lines, [
        { key: 'jobContactNo', label: 'Project Number' },
        { key: 'technicianName', label: 'Technician Conducting Test' },
        { key: 'signatureName', label: 'Signature' },
      ]);
      const marks = fillChoiceLabels(text.value, lines, [
        { key: 'certifyTested', label: 'tested and inspected in accordance' },
        { key: 'certifyFunctional', label: 'fully functional' },
      ]);
      return { value: marks.value, filled: text.filled + marks.filled };
    }
    default:
      return { value: raw, filled: 0 };
  }
}

const DEVICE_COLUMNS = [
  { key: 'itemNumber', title: 'Item', widthPercent: 8, kind: 'text' as const },
  { key: 'deviceType', title: 'Device Type', widthPercent: 14, kind: 'text' as const },
  { key: 'deviceLocation', title: 'Location', widthPercent: 16, kind: 'text' as const },
  { key: 'deficiency', title: 'Deficiency', widthPercent: 24, kind: 'text' as const },
  { key: 'ulcClause', title: 'Clause', widthPercent: 10, kind: 'text' as const },
  { key: 'dateCorrected', title: 'Date Corrected', widthPercent: 8, kind: 'text' as const },
  { key: 'workOrder', title: 'Work Order', widthPercent: 8, kind: 'text' as const },
  { key: 'serviceProvider', title: 'Service Provider', widthPercent: 6, kind: 'text' as const },
  { key: 'technician', title: 'Technician', widthPercent: 6, kind: 'text' as const },
];

const CONTROL_COLUMNS = [
  { key: 'itemNumber', title: 'Item', widthPercent: 8, kind: 'text' as const },
  { key: 'controlFunction', title: 'Control Function', widthPercent: 22, kind: 'text' as const },
  { key: 'deficiency', title: 'Deficiency', widthPercent: 28, kind: 'text' as const },
  { key: 'ulcClause', title: 'Clause', widthPercent: 10, kind: 'text' as const },
  { key: 'dateCorrected', title: 'Date Corrected', widthPercent: 8, kind: 'text' as const },
  { key: 'workOrder', title: 'Work Order', widthPercent: 8, kind: 'text' as const },
  { key: 'serviceProvider', title: 'Service Provider', widthPercent: 8, kind: 'text' as const },
  { key: 'technician', title: 'Technician', widthPercent: 8, kind: 'text' as const },
];

function splitDeficiencyLines(lines: OcrPage['lines']): { device: OcrPage['lines']; control: OcrPage['lines'] } {
  const splitAt = lines.findIndex((line) => /control function/i.test(line.text));
  if (splitAt < 0) return { device: lines, control: [] };
  return { device: lines.slice(0, splitAt), control: lines.slice(splitAt + 1) };
}

function applyRepairCells(
  row: { repair: { dateCorrected: string; workOrder: string; serviceProvider: string; technician: string } },
  cells: ExtractedCells,
): boolean {
  let used = false;
  for (const key of ['dateCorrected', 'workOrder', 'serviceProvider', 'technician'] as const) {
    const read = (cells[key] ?? '').trim();
    if (read && !row.repair[key].trim()) {
      row.repair = { ...row.repair, [key]: read };
      used = true;
    }
  }
  return used;
}

function fillDeficiencies(raw: unknown, lines: OcrPage['lines']): { value: unknown; filled: number } {
  const current = normalizeDeficienciesValue(raw);
  const split = splitDeficiencyLines(lines);
  let filled = 0;
  const deviceRows = current.deviceRows.map((row) => ({ ...row, repair: { ...row.repair } }));
  const deviceExtracted = extractGridRows(split.device, DEVICE_COLUMNS);
  let cursor = 0;
  for (let index = 0; index < deviceRows.length && cursor < deviceExtracted.length; index++) {
    const row = deviceRows[index];
    const blank = !row.itemNumber && !row.deviceType && !row.deviceLocation && !row.deficiency;
    if (!blank) continue;
    const cells = deviceExtracted[cursor];
    cursor += 1;
    let used = false;
    for (const key of ['itemNumber', 'deviceType', 'deviceLocation', 'deficiency', 'ulcClause'] as const) {
      const read = (cells[key] ?? '').trim();
      if (read) {
        row[key] = read;
        used = true;
      }
    }
    if (applyRepairCells(row, cells)) used = true;
    if (used) filled += 1;
  }
  const controlRows = current.controlRows.map((row) => ({ ...row, repair: { ...row.repair } }));
  const controlExtracted = extractGridRows(split.control, CONTROL_COLUMNS);
  cursor = 0;
  for (let index = 0; index < controlRows.length && cursor < controlExtracted.length; index++) {
    const row = controlRows[index];
    const blank = !row.itemNumber && !row.controlFunction && !row.deficiency;
    if (!blank) continue;
    const cells = controlExtracted[cursor];
    cursor += 1;
    let used = false;
    for (const key of ['itemNumber', 'controlFunction', 'deficiency', 'ulcClause'] as const) {
      const read = (cells[key] ?? '').trim();
      if (read) {
        row[key] = read;
        used = true;
      }
    }
    if (applyRepairCells(row, cells)) used = true;
    if (used) filled += 1;
  }
  return { value: { ...current, deviceRows, controlRows }, filled };
}

/** Drop the top-left company block. That name is already chosen when the document is created. */
function withoutCompanyBlock(lines: OcrPage['lines']): OcrPage['lines'] {
  const words = lines.flatMap((line) => line.words);
  const service = words.find((word, index) => {
    const next = words[index + 1];
    const third = words[index + 2];
    if (!next || !third) return false;
    return (
      normalizeOcr(word.text) === 'date' &&
      normalizeOcr(next.text) === 'of' &&
      normalizeOcr(third.text) === 'service'
    );
  });
  if (!service) return lines;
  const building = words.find((word, index) => {
    const next = words[index + 1];
    return next && normalizeOcr(word.text) === 'building' && normalizeOcr(next.text) === 'name';
  });
  const cutX = service.x - 0.02;
  const cutY = building ? building.y : service.y + 0.28;
  return lines.flatMap((line) => {
    const kept = line.words.filter((word) => {
      const cx = word.x + word.w / 2;
      const cy = word.y + word.h / 2;
      return !(cx < cutX && cy < cutY);
    });
    if (kept.length === 0) return [];
    if (kept.length === line.words.length) return [line];
    const minX = Math.min(...kept.map((word) => word.x));
    const minY = Math.min(...kept.map((word) => word.y));
    const maxX = Math.max(...kept.map((word) => word.x + word.w));
    const maxY = Math.max(...kept.map((word) => word.y + word.h));
    return [{
      text: kept.map((word) => word.text).join(' '),
      x: minX,
      y: minY,
      w: Math.max(0, maxX - minX),
      h: Math.max(0, maxY - minY),
      words: kept,
    }];
  });
}

function fillPage(
  document: FormInspectionDocument,
  pageIndex: number,
  lines: OcrPage['lines'],
  pen: Record<string, string>,
  hasPenJob: boolean,
): { document: FormInspectionDocument; filled: number; label: string; sectionId: string | null } {
  const page = document.form.pages[pageIndex];
  const label = page?.sections.find((section) => section.heading)?.heading ?? `Page ${pageIndex + 1}`;
  const sectionId = page?.sections.find((section) => section.elements.length > 0)?.id ?? null;
  if (!page) return { document, filled: 0, label, sectionId };
  const body = withoutCompanyBlock(elementLines(page, lines));
  let next = document;
  let filled = 0;
  for (const section of page.sections) {
    for (const element of section.elements) {
      const result = fillElement(element, next.values[element.id], body, pen, hasPenJob);
      if (result.filled > 0) {
        next = writeElement(next, element.id, result.value);
        filled += result.filled;
      }
    }
  }
  return { document: next, filled, label, sectionId };
}

export type ReadContentResult = {
  document: FormInspectionDocument;
  summary: string;
  /** Section to bring into view — the page the scan was written onto. */
  focusSectionId: string | null;
};

/**
 * Place one scan, or a whole report, into the open form.
 * Client and company fields chosen when the document was created are left as they are.
 * One call is one undo step for the editor.
 */
export type HandwritingBox = {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  allowed?: string;
};

export type SummaryMark = { key: string; yes: HandwritingBox; no: HandwritingBox };

export type HandwritingJob = {
  scanIndex: number;
  /** Boxes are fractions of the form border, so the photo is squared first. */
  flatten: boolean;
  anchors?: Record<string, readonly [number, number]>;
  boxes: HandwritingBox[];
  marks: SummaryMark[];
  checks: HandwritingBox[];
};

const DATE_CHARS = '0123456789-/';
const DIGIT_CHARS = '0123456789';
const PHONE_CHARS = '0123456789-() +';
const NAME_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ .'-";

/** Unique printed word landmarks on CAN/ULC-S536 Page 1 (20.1) in canonical [0..1] panel coordinates. */
const ANNUAL_ANCHORS: Record<string, readonly [number, number]> = {
  accordance: [0.56083, 0.39775],
  addressable: [0.48386, 0.0605],
  adopted: [0.29857, 0.642],
  affirmation: [0.48355, 0.675],
  affirms: [0.39913, 0.7055],
  building: [0.84885, 0.6115],
  bylaws: [0.62197, 0.723],
  canada: [0.22471, 0.64125],
  circuits: [0.87803, 0.05075],
  codes: [0.57604, 0.7225],
  comprises: [0.27933, 0.707],
  condition: [0.61732, 0.73825],
  conformance: [0.85009, 0.707],
  connected: [0.33302, 0.3635],
  contact: [0.44134, 0.152],
  corrected: [0.40192, 0.53225],
  division: [0.70174, 0.641],
  entire: [0.20081, 0.3975],
  equipment: [0.39044, 0.7385],
  equiprnent: [0.50962, 0.70675],
  examination: [0.40192, 0.6255],
  except: [0.67163, 0.74025],
  fully: [0.31285, 0.449],
  functional: [0.36065, 0.44775],
  given: [0.33954, 0.61125],
  herein: [0.60615, 0.706],
  hybrid: [0.61359, 0.09425],
  identification: [0.39727, 0.82725],
  information: [0.08163, 0.7065],
  initiating: [0.70577, 0.0695],
  inspector: [0.60956, 0.62675],
  installation: [0.63687, 0.6415],
  jurisdiction: [0.39944, 0.642],
  listed: [0.56363, 0.7055],
  maintained: [0.2036, 0.62525],
  manager: [0.55866, 0.20775],
  manufacturer: [0.46151, 0.11975],
  manufacturers: [0.81595, 0.723],
  marshal: [0.536, 0.6255],
  model: [0.60956, 0.1185],
  national: [0.8653, 0.62625],
  noted: [0.73153, 0.739],
  notification: [0.71508, 0.085],
  nurtoer: [0.45996, 0.82725],
  operational: [0.54842, 0.73875],
  other: [0.63004, 0.035],
  owned: [0.65239, 0.61],
  pages: [0.35413, 0.70825],
  paging: [0.7365, 0.10275],
  person: [0.49131, 0.152],
  postal: [0.29174, 0.26275],
  premises: [0.31254, 0.62625],
  primary: [0.15953, 0.828],
  property: [0.49814, 0.208],
  pursuant: [0.7666, 0.6275],
  qualified: [0.22905, 0.7395],
  receivi: [0.50745, 0.26275],
  receiving: [0.48759, 0.365],
  recommendations: [0.44631, 0.57625],
  recorded: [0.77033, 0.3625],
  representative: [0.72688, 0.611],
  request: [0.71198, 0.627],
  requirements: [0.9072, 0.72425],
  section: [0.62166, 0.2625],
  sentence: [0.77436, 0.64125],
  serial: [0.80819, 0.11675],
  service: [0.48976, 0.004],
  servtce: [0.6378, 0.005],
  shall: [0.92303, 0.61025],
  signal: [0.43793, 0.36475],
  single: [0.45003, 0.03625],
  standards: [0.68063, 0.723],
  summary: [0.54624, 0.333],
  supervising: [0.09373, 0.8275],
  telephone: [0.65953, 0.364],
  their: [0.67101, 0.62525],
  voice: [0.69305, 0.10175],
  which: [0.22626, 0.70625],
  wireless: [0.48417, 0.09425],
};

/** Every value cell on the annual page in canonical panel coordinates. Company block is excluded. */
const ANNUAL_BOXES: HandwritingBox[] = [
  { key: 'dateOfService', x: 0.416, y: 0.01, w: 0.148, h: 0.018, allowed: DATE_CHARS },
  { key: 'lastServiceDate', x: 0.583, y: 0.009, w: 0.155, h: 0.02, allowed: DATE_CHARS },
  { key: 'projectNumber', x: 0.74, y: 0.006, w: 0.24, h: 0.026, allowed: DIGIT_CHARS },
  { key: 'stageOtherText', x: 0.652, y: 0.03, w: 0.08, h: 0.014 },
  { key: 'circuitsInitiating', x: 0.83, y: 0.058, w: 0.15, h: 0.018, allowed: DIGIT_CHARS },
  { key: 'circuitsNotification', x: 0.83, y: 0.074, w: 0.15, h: 0.018, allowed: DIGIT_CHARS },
  { key: 'circuitsVoicePaging', x: 0.83, y: 0.09, w: 0.15, h: 0.018, allowed: DIGIT_CHARS },
  { key: 'manufacturer', x: 0.416, y: 0.126, w: 0.16, h: 0.016 },
  { key: 'modelNumber', x: 0.59, y: 0.126, w: 0.16, h: 0.016 },
  { key: 'ulcSerialNumber', x: 0.764, y: 0.125, w: 0.185, h: 0.016 },
  { key: 'buildingName', x: 0.034, y: 0.162, w: 0.36, h: 0.032 },
  { key: 'contactPerson', x: 0.416, y: 0.161, w: 0.33, h: 0.035, allowed: NAME_CHARS },
  { key: 'contactPhone', x: 0.76, y: 0.172, w: 0.22, h: 0.022, allowed: PHONE_CHARS },
  { key: 'address', x: 0.034, y: 0.217, w: 0.36, h: 0.034 },
  { key: 'ownerPropertyManager', x: 0.416, y: 0.217, w: 0.33, h: 0.034, allowed: NAME_CHARS },
  { key: 'ownerPhone', x: 0.76, y: 0.228, w: 0.22, h: 0.022, allowed: PHONE_CHARS },
  { key: 'city', x: 0.034, y: 0.273, w: 0.22, h: 0.032 },
  { key: 'postalCode', x: 0.272, y: 0.273, w: 0.12, h: 0.032 },
  { key: 'fireSignalCentre', x: 0.416, y: 0.273, w: 0.33, h: 0.032 },
  { key: 'fireSignalPhone', x: 0.76, y: 0.284, w: 0.22, h: 0.022, allowed: PHONE_CHARS },
  { key: 'summaryFill:deficiencies-corrected', x: 0.53, y: 0.522, w: 0.28, h: 0.024 },
  { key: 'summaryFill:report-copy', x: 0.382, y: 0.602, w: 0.16, h: 0.019 },
  { key: 'primaryIdentification', x: 0.358, y: 0.768, w: 0.16, h: 0.03 },
  { key: 'primaryDate', x: 0.55, y: 0.768, w: 0.16, h: 0.03, allowed: DATE_CHARS },
  { key: 'primarySignature', x: 0.74, y: 0.768, w: 0.2, h: 0.03 },
  { key: 'conductingIdentification', x: 0.358, y: 0.85, w: 0.16, h: 0.028 },
  { key: 'conductingDate', x: 0.55, y: 0.85, w: 0.16, h: 0.028, allowed: DATE_CHARS },
  { key: 'conductingSignature', x: 0.74, y: 0.85, w: 0.2, h: 0.028 },
];

const ANNUAL_CHECKS: HandwritingBox[] = [
  { key: 'stageSingle', x: 0.402, y: 0.033, w: 0.016, h: 0.014 },
  { key: 'stageTwo', x: 0.5, y: 0.033, w: 0.016, h: 0.014 },
  { key: 'stageOther', x: 0.605, y: 0.033, w: 0.016, h: 0.014 },
  { key: 'systemAddressable', x: 0.41, y: 0.058, w: 0.016, h: 0.014 },
  { key: 'systemConventional', x: 0.538, y: 0.058, w: 0.016, h: 0.014 },
  { key: 'systemWireless', x: 0.408, y: 0.09, w: 0.016, h: 0.014 },
  { key: 'systemHybrid', x: 0.538, y: 0.092, w: 0.016, h: 0.014 },
];

const ANNUAL_ROWS = [0.355, 0.396, 0.438, 0.48, 0.523, 0.566, 0.612];
const ANNUAL_MARKS: SummaryMark[] = [
  'connected-fsrc',
  'inspected-ulc536',
  'fully-functional',
  'deficiencies-identified',
  'deficiencies-corrected',
  'recommendations-identified',
  'report-copy',
].map((id, index) => ({
  key: `summary:${id}`,
  yes: { key: 'yes', x: 0.026, y: ANNUAL_ROWS[index]! + 0.004, w: 0.04, h: 0.024 },
  no: { key: 'no', x: 0.092, y: ANNUAL_ROWS[index]! + 0.004, w: 0.04, h: 0.024 },
}));

/** Empty boxes to read with the handwriting model. Printed labels and the company block are not included. */
export function planHandwriting(document: FormInspectionDocument, pages: OcrPage[]): HandwritingJob[] {
  const jobs: HandwritingJob[] = [];
  pages.forEach((page, scanIndex) => {
    const match = matchTemplatePage(document.form, page);
    const formPage = document.form.pages[match.pageIndexes[0] ?? -1];
    const hasAnnualPage = formPage?.sections.some((section) =>
      section.elements.some((element) => element.kind === 'ulcSection1'),
    );
    if (!hasAnnualPage) return;
    jobs.push({
      scanIndex,
      flatten: true,
      anchors: ANNUAL_ANCHORS,
      boxes: ANNUAL_BOXES,
      marks: ANNUAL_MARKS,
      checks: ANNUAL_CHECKS,
    });
  });
  return jobs;
}

export type PenRead = { scanIndex: number; key: string; text: string };

export function applyScannedPages(
  document: FormInspectionDocument,
  pages: OcrPage[],
  reads: PenRead[] = [],
): ReadContentResult {
  if (pages.length === 0) {
    throw new Error('Choose a photo or scan to read.');
  }
  const matches = pages.map((page) => matchTemplatePage(document.form, page));
  const indicesWithPenJob = new Set(reads.map((read) => read.scanIndex));
  let next = document;
  let filled = 0;
  let focusSectionId: string | null = null;
  const labels: string[] = [];
  pages.forEach((page, index) => {
    const placed = targetPage(next, matches[index].signature);
    if (!placed) throw new Error(matches[index].label);
    const pen: Record<string, string> = {};
    for (const read of reads) {
      if (read.scanIndex === index && read.text.trim()) pen[read.key] = read.text.trim();
    }
    const result = fillPage(
      placed.document,
      placed.pageIndex,
      page.lines,
      pen,
      indicesWithPenJob.has(index),
    );
    next = result.document;
    filled += result.filled;
    if (!focusSectionId && result.sectionId) focusSectionId = result.sectionId;
    labels.push(result.label);
  });
  const pageWord = pages.length === 1 ? 'page' : 'pages';
  const summary =
    filled > 0
      ? `Read ${pages.length} ${pageWord} into ${labels.join(', ')}. ${filled} field${filled === 1 ? '' : 's'} filled. Undo puts the report back.`
      : `Read ${pages.length} ${pageWord} (${labels.join(', ')}). Nothing new was empty to fill. Undo puts the report back.`;
  return { document: next, summary, focusSectionId };
}
