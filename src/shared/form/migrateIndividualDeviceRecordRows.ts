import {
  emptyIndividualDeviceRecordRow,
  emptyIndividualDeviceRecordValue,
  INDIVIDUAL_DEVICE_RECORD_COLUMNS,
  INDIVIDUAL_DEVICE_RECORD_ROW_COUNT,
  normalizeIndividualDeviceRecordValue,
  type IndividualDeviceRecordRow,
  type IndividualDeviceRecordValue,
} from './individualDeviceRecord';
import {
  getIndividualDeviceRecordElementId,
  getIndividualDeviceRecordPageIndices,
  INDIVIDUAL_DEVICE_RECORD_MIN_PAGES,
} from './individualDeviceRecordPages';
import { elementIdsOnPage, renumberFormPageLabels } from './formExtraPages';
import type { FormInspectionDocument } from './types';

export function individualDeviceRecordRowHasContent(row: IndividualDeviceRecordRow): boolean {
  return INDIVIDUAL_DEVICE_RECORD_COLUMNS.some((col) => {
    if (col.kind === 'choice') {
      return row[col.key] !== null;
    }
    const text = row[col.key];
    return typeof text === 'string' && text.trim().length > 0;
  });
}

function rowsEqual(a: IndividualDeviceRecordRow[], b: IndividualDeviceRecordRow[]): boolean {
  if (a.length !== b.length) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

function padToPage(rows: IndividualDeviceRecordRow[]): IndividualDeviceRecordRow[] {
  const next = rows.slice(0, INDIVIDUAL_DEVICE_RECORD_ROW_COUNT);
  while (next.length < INDIVIDUAL_DEVICE_RECORD_ROW_COUNT) {
    next.push(emptyIndividualDeviceRecordRow());
  }
  return next;
}

/**
 * Pack rows toward the top and collapse empty gaps to at most one blank row
 * between filled records. Does not pad to page length (caller chunks/pads).
 */
export function compactIndividualDeviceRecordRowStream(
  rows: IndividualDeviceRecordRow[],
): IndividualDeviceRecordRow[] {
  const packed: IndividualDeviceRecordRow[] = [];
  let seenContent = false;
  let pendingEmpty = 0;

  for (const row of rows) {
    if (individualDeviceRecordRowHasContent(row)) {
      if (seenContent && pendingEmpty > 0) {
        packed.push(emptyIndividualDeviceRecordRow());
      }
      packed.push(row);
      seenContent = true;
      pendingEmpty = 0;
    } else if (seenContent) {
      pendingEmpty += 1;
    }
  }

  return packed;
}

/** Single-page compact + pad (used by tests / helpers). */
export function compactIndividualDeviceRecordRows(
  rows: IndividualDeviceRecordRow[],
): IndividualDeviceRecordRow[] {
  return padToPage(compactIndividualDeviceRecordRowStream(rows));
}

export function compactIndividualDeviceRecordValue(
  raw: unknown,
): IndividualDeviceRecordValue {
  const data = normalizeIndividualDeviceRecordValue(raw);
  return { rows: compactIndividualDeviceRecordRows(data.rows) };
}

function chunkRowsIntoPages(rows: IndividualDeviceRecordRow[]): IndividualDeviceRecordRow[][] {
  if (rows.length === 0) {
    return [padToPage([])];
  }

  const chunks: IndividualDeviceRecordRow[][] = [];
  for (let i = 0; i < rows.length; i += INDIVIDUAL_DEVICE_RECORD_ROW_COUNT) {
    chunks.push(padToPage(rows.slice(i, i + INDIVIDUAL_DEVICE_RECORD_ROW_COUNT)));
  }
  return chunks;
}

/**
 * Compact 23.2 rows across consecutive IDR pages: pull content up from later
 * pages when earlier pages have spare bottom rows, keep at most one blank gap
 * between records, and remove trailing empty IDR pages above the minimum.
 * Idempotent — returns the same document reference when unchanged.
 */
export function migrateFormInspectionIdrRowGaps(
  document: FormInspectionDocument,
): FormInspectionDocument {
  const idrIndices = getIndividualDeviceRecordPageIndices(document.form);
  if (idrIndices.length === 0) return document;

  const pageSnapshots = idrIndices.map((pageIndex) => {
    const page = document.form.pages[pageIndex]!;
    const elementId = getIndividualDeviceRecordElementId(page);
    const rows = elementId
      ? normalizeIndividualDeviceRecordValue(document.values[elementId]).rows
      : emptyIndividualDeviceRecordValue().rows;
    return { pageIndex, page, elementId, rows };
  });

  const flattened = pageSnapshots.flatMap((snap) => snap.rows);
  const compacted = compactIndividualDeviceRecordRowStream(flattened);
  const chunks = chunkRowsIntoPages(compacted);

  while (chunks.length < INDIVIDUAL_DEVICE_RECORD_MIN_PAGES) {
    chunks.push(padToPage([]));
  }

  // Drop trailing empty IDR sheets when content fits in fewer pages (never below min).
  const targetPageCount =
    chunks.length < idrIndices.length
      ? Math.max(chunks.length, INDIVIDUAL_DEVICE_RECORD_MIN_PAGES)
      : idrIndices.length;

  let valuesChanged = false;
  let pagesChanged = false;
  const values = { ...document.values };

  for (let i = 0; i < targetPageCount; i += 1) {
    const snap = pageSnapshots[i];
    if (!snap?.elementId) continue;
    const nextRows = chunks[i] ?? padToPage([]);
    if (!rowsEqual(snap.rows, nextRows)) {
      values[snap.elementId] = { rows: nextRows };
      valuesChanged = true;
    }
  }

  let pages = document.form.pages;
  if (targetPageCount < idrIndices.length) {
    const dropIndices = new Set(idrIndices.slice(targetPageCount));
    for (const pageIndex of [...dropIndices].sort((a, b) => b - a)) {
      const page = document.form.pages[pageIndex];
      if (!page) continue;
      for (const elementId of elementIdsOnPage(page)) {
        delete values[elementId];
      }
    }
    pages = document.form.pages.filter((_, index) => !dropIndices.has(index));
    pagesChanged = true;
  }

  if (!valuesChanged && !pagesChanged) return document;

  return {
    ...document,
    form: pagesChanged
      ? renumberFormPageLabels({ ...document.form, pages })
      : document.form,
    values,
  };
}
