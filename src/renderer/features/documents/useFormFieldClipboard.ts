import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';

const SELECTED_CLASS = 'ba-field-selected';
const ROW_SELECTED_CLASS = 'ba-row-selected';
/** Toolbar buttons that must not clear a pending multi-select on pointerdown. */
export const CLIPBOARD_TOOLBAR_ATTR = 'data-ba-clipboard-toolbar';

const ROW_CLIP_PREFIX = 'BA_ROW';
const ROWS_CLIP_PREFIX = 'BA_ROWS';
const FIELDS_CLIP_PREFIX = 'BA_FIELDS';

/** Inputs + cycle choice buttons (IDR / CFTS / report grids). */
const FIELD_SELECTOR =
  'input, textarea, select, button.idr-choice-cell, button.cfts-choice-cell, button.rrg-choice-btn, button[class*="choice-cell"]';

export type FormFieldSelectMode = 'off' | 'cell' | 'line' | 'insert';

export type InsertLineTarget = {
  elementId: string;
  elementKind: string;
  pageIndex: number;
  rowIndex: number;
  /** Viewport position for the popup. */
  anchor: { top: number; left: number; bottom: number };
};

function isTextEditable(
  el: Element,
): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  if (el instanceof HTMLInputElement) {
    const type = el.type.toLowerCase();
    if (type === 'button' || type === 'submit' || type === 'hidden' || type === 'file') return false;
    if (el.readOnly || el.disabled) return false;
    return true;
  }
  if (el instanceof HTMLTextAreaElement) return !el.readOnly && !el.disabled;
  if (el instanceof HTMLSelectElement) return !el.disabled;
  return false;
}

/** IDR / CFTS / report-grid cycle buttons and similar choice cells. */
function isChoiceButton(el: Element): el is HTMLButtonElement {
  if (!(el instanceof HTMLButtonElement) || el.disabled) return false;
  return (
    el.classList.contains('idr-choice-cell') ||
    el.classList.contains('cfts-choice-cell') ||
    el.classList.contains('rrg-choice-btn') ||
    /(?:^|\s)[\w-]*choice-cell(?:\s|$)/.test(el.className)
  );
}

function isEditableField(el: Element): el is HTMLElement {
  return isTextEditable(el) || isChoiceButton(el);
}

function resolveField(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const hit = target.closest(FIELD_SELECTOR);
  if (!hit || !isEditableField(hit)) return null;
  return hit;
}

function readChoiceButton(el: HTMLButtonElement): string {
  const cls = el.className;
  if (
    el.classList.contains('idr-choice-cell--yes') ||
    el.classList.contains('rrg-choice--yes') ||
    cls.includes('choice-cell--yes')
  ) {
    return 'yes';
  }
  if (
    el.classList.contains('idr-choice-cell--no') ||
    el.classList.contains('rrg-choice--no') ||
    cls.includes('choice-cell--no')
  ) {
    return 'no';
  }
  if (
    el.classList.contains('idr-choice-cell--na') ||
    el.classList.contains('cfts-choice-cell--na') ||
    cls.includes('choice-cell--na')
  ) {
    return 'na';
  }
  if (el.classList.contains('cfts-choice-cell--pass') || cls.includes('choice-cell--pass')) {
    return 'pass';
  }
  if (el.classList.contains('cfts-choice-cell--fail') || cls.includes('choice-cell--fail')) {
    return 'fail';
  }
  const t = el.textContent?.trim() ?? '';
  if (t === '✓' || t === 'Y' || t.toLowerCase() === 'yes') return 'yes';
  if (t === '✗' || t === 'N' || t.toLowerCase() === 'no') return 'no';
  if (t === '—' || t === 'N/A' || t.toLowerCase() === 'na') return 'na';
  if (t === 'P' || t.toLowerCase() === 'pass') return 'pass';
  if (t === 'F' || t.toLowerCase() === 'fail') return 'fail';
  return '';
}

function fieldText(el: HTMLElement): string {
  if (isChoiceButton(el)) return readChoiceButton(el);
  if (el instanceof HTMLInputElement) {
    if (el.type === 'checkbox' || el.type === 'radio') return el.checked ? 'true' : 'false';
    return el.value;
  }
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return el.value;
  return '';
}

function toSingleLine(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/[\n\r]+/g, ' ').replace(/ {2,}/g, ' ').trim();
}

/** Canonical choice token for clipboard, or '' for empty. null = unrecognised. */
function normalizeChoiceToken(text: string): string | null {
  const t = text.trim().toLowerCase();
  if (t === '') return '';
  if (t === 'yes' || t === 'y' || t === 'true' || t === '✓' || t === 'check') return 'yes';
  if (t === 'no' || t === 'n' || t === 'false' || t === '✗' || t === 'x') return 'no';
  if (t === 'na' || t === 'n/a' || t === '—' || t === '-') return 'na';
  if (t === 'pass' || t === 'p') return 'pass';
  if (t === 'fail' || t === 'f') return 'fail';
  return null;
}

function setChoiceButton(el: HTMLButtonElement, text: string): void {
  const wanted = normalizeChoiceToken(text);
  if (wanted === null) return;
  for (let i = 0; i < 6; i++) {
    if (readChoiceButton(el) === wanted) return;
    // Controlled React cells only advance after commit — flush between clicks.
    flushSync(() => {
      el.click();
    });
  }
}

function setToggleInput(el: HTMLInputElement, text: string): void {
  const wanted =
    text === 'true' || text === '1' || text.trim().toLowerCase() === 'yes' || text === 'pass';
  if (el.type === 'radio') {
    if (wanted) {
      if (!el.checked) {
        flushSync(() => {
          el.click();
        });
      }
      return;
    }
    // Uncheck: toggle-radios clear on click when already selected (no onChange).
    if (el.checked) {
      flushSync(() => {
        el.click();
      });
    }
    return;
  }
  // checkbox
  if (el.checked !== wanted) {
    flushSync(() => {
      el.click();
    });
  }
}

function setFieldText(el: HTMLElement, text: string): void {
  if (isChoiceButton(el)) {
    setChoiceButton(el, text);
    return;
  }
  if (el instanceof HTMLInputElement) {
    if (el.type === 'checkbox' || el.type === 'radio') {
      setToggleInput(el, text);
      return;
    }
    flushSync(() => {
      const proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      proto?.set?.call(el, text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    return;
  }
  if (el instanceof HTMLTextAreaElement) {
    flushSync(() => {
      const proto = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
      proto?.set?.call(el, text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    return;
  }
  if (el instanceof HTMLSelectElement) {
    flushSync(() => {
      el.value = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
}

/** Always select the entire cell contents (inputs/textareas). */
function selectAllCellContent(el: HTMLElement): void {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.focus();
    try {
      el.select();
    } catch {
      /* ignore */
    }
    return;
  }
  if (el instanceof HTMLSelectElement || isChoiceButton(el)) {
    el.focus();
  }
}

function clearHighlights(selected: Set<HTMLElement>): void {
  for (const el of selected) {
    el.classList.remove(SELECTED_CLASS);
    el.closest('tr')?.classList.remove(ROW_SELECTED_CLASS);
  }
  selected.clear();
}

function fieldsInRow(tr: HTMLTableRowElement): HTMLElement[] {
  return [...tr.querySelectorAll(FIELD_SELECTOR)].filter(isEditableField);
}

function rowOf(el: HTMLElement): HTMLTableRowElement | null {
  return el.closest('tr');
}

function dataRowsInSection(tr: HTMLTableRowElement): HTMLTableRowElement[] {
  const section = tr.parentElement;
  if (!section) return [tr];
  return [...section.children].filter(
    (node): node is HTMLTableRowElement =>
      node instanceof HTMLTableRowElement && fieldsInRow(node).length > 0,
  );
}

/** Shift row values down by `count` empty rows below `tr` (single table section). */
export function insertEmptyRowsViaDom(tr: HTMLTableRowElement, count: number): void {
  if (!Number.isInteger(count) || count < 1) return;
  const allRows = dataRowsInSection(tr);
  const index = allRows.indexOf(tr);
  if (index < 0) return;

  const values = allRows.map((row) => fieldsInRow(row).map((el) => fieldText(el)));
  const empty = () => (values[0] ?? []).map(() => '');
  const next = [
    ...values.slice(0, index + 1),
    ...Array.from({ length: count }, empty),
    ...values.slice(index + 1),
  ].slice(0, values.length);

  allRows.forEach((row, rowIndex) => {
    const targets = fieldsInRow(row);
    const rowValues = next[rowIndex] ?? [];
    targets.forEach((el, col) => {
      setFieldText(el, rowValues[col] ?? '');
    });
  });
}

function resolveInsertLineTargetFromEvent(target: EventTarget | null): InsertLineTarget | null {
  if (!(target instanceof Element)) return null;
  const tr = target.closest('tr');
  if (!(tr instanceof HTMLTableRowElement)) return null;
  if (fieldsInRow(tr).length === 0) return null;

  const frame = tr.closest('[data-form-element-id]');
  const sheet = tr.closest('[data-form-page-index]');
  if (!(frame instanceof HTMLElement) || !(sheet instanceof HTMLElement)) return null;

  const elementId = frame.dataset.formElementId?.trim();
  const elementKind = frame.dataset.formElementKind?.trim() ?? '';
  const pageIndex = Number(sheet.dataset.formPageIndex);
  if (!elementId || !Number.isInteger(pageIndex) || pageIndex < 0) return null;

  const rows = dataRowsInSection(tr);
  const rowIndex = rows.indexOf(tr);
  if (rowIndex < 0) return null;

  const rect = tr.getBoundingClientRect();
  return {
    elementId,
    elementKind,
    pageIndex,
    rowIndex,
    anchor: { top: rect.top, left: rect.left, bottom: rect.bottom },
  };
}

function orderedUniqueRows(fields: HTMLElement[]): HTMLTableRowElement[] {
  const seen = new Set<HTMLTableRowElement>();
  const rows: HTMLTableRowElement[] = [];
  for (const el of fields) {
    const tr = rowOf(el);
    if (!tr || seen.has(tr)) continue;
    seen.add(tr);
    rows.push(tr);
  }
  rows.sort((a, b) => {
    const pos = a.compareDocumentPosition(b);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
  return rows;
}

function isFullRowSelection(fields: HTMLElement[]): boolean {
  if (fields.length === 0) return false;
  const rows = orderedUniqueRows(fields);
  if (rows.length === 0) return false;
  return rows.every((tr) => {
    const rowFields = fieldsInRow(tr);
    return rowFields.length > 0 && rowFields.every((f) => fields.includes(f));
  });
}

function syncRowHighlights(fields: HTMLElement[]): void {
  const rows = orderedUniqueRows(fields);
  for (const tr of rows) {
    const rowFields = fieldsInRow(tr);
    if (rowFields.length > 0 && rowFields.every((f) => fields.includes(f))) {
      tr.classList.add(ROW_SELECTED_CLASS);
    } else {
      tr.classList.remove(ROW_SELECTED_CLASS);
    }
  }
}

function encodeRowClipboard(fields: HTMLElement[]): string {
  return [ROW_CLIP_PREFIX, ...fields.map((el) => fieldText(el).replace(/\t/g, ' '))].join('\t');
}

function encodeRowsClipboard(rows: HTMLTableRowElement[]): string {
  const lines = rows.map((tr) =>
    fieldsInRow(tr)
      .map((el) => fieldText(el).replace(/\t/g, ' '))
      .join('\t'),
  );
  return `${ROWS_CLIP_PREFIX}\n${lines.join('\n')}`;
}

function encodeFieldsClipboard(fields: HTMLElement[]): string {
  return [FIELDS_CLIP_PREFIX, ...fields.map((el) => fieldText(el).replace(/\t/g, ' '))].join('\t');
}

function parseClipboardPayload(
  raw: string,
): { kind: 'row' | 'rows' | 'fields' | 'plain'; values: string[]; rows?: string[][] } {
  const text = raw.replace(/\r\n/g, '\n').trimEnd();
  if (text.startsWith(`${ROWS_CLIP_PREFIX}\n`) || text === ROWS_CLIP_PREFIX) {
    const body = text.slice(ROWS_CLIP_PREFIX.length).replace(/^\n/, '');
    const rows = body === '' ? [] : body.split('\n').map((line) => line.split('\t'));
    return { kind: 'rows', values: rows[0] ?? [], rows };
  }
  if (text.startsWith(`${ROW_CLIP_PREFIX}\t`) || text === ROW_CLIP_PREFIX) {
    const values = text.split('\t').slice(1);
    return { kind: 'row', values };
  }
  if (text.startsWith(`${FIELDS_CLIP_PREFIX}\t`) || text === FIELDS_CLIP_PREFIX) {
    const values = text.split('\t').slice(1);
    return { kind: 'fields', values };
  }
  if (text.includes('\t') && !text.includes('\n')) {
    return { kind: 'row', values: text.split('\t') };
  }
  if (text.includes('\t') && text.includes('\n')) {
    const rows = text.split('\n').map((line) => line.split('\t'));
    return { kind: 'rows', values: rows[0] ?? [], rows };
  }
  return { kind: 'plain', values: [toSingleLine(text)] };
}

/** Clear selected rows in place — do not pull content from below. */
function clearRowsInPlace(rows: HTMLTableRowElement[]): void {
  for (const tr of rows) {
    for (const el of fieldsInRow(tr)) setFieldText(el, '');
  }
}

/**
 * Remove selected rows' content and shift remaining sibling rows up so gaps close.
 * Keeps the same number of data rows (empties trail at the bottom).
 */
function collapseRowsAfterCut(rows: HTMLTableRowElement[]): void {
  const bySection = new Map<Element, HTMLTableRowElement[]>();
  for (const tr of rows) {
    const section = tr.parentElement;
    if (!section) continue;
    const list = bySection.get(section) ?? [];
    list.push(tr);
    bySection.set(section, list);
  }

  for (const [, cutRows] of bySection) {
    const sample = cutRows[0];
    if (!sample) continue;
    const allRows = dataRowsInSection(sample);
    if (allRows.length === 0) continue;
    const cutSet = new Set(cutRows);
    const keptValues = allRows
      .filter((tr) => !cutSet.has(tr))
      .map((tr) => fieldsInRow(tr).map((el) => fieldText(el)));

    allRows.forEach((tr, index) => {
      const targets = fieldsInRow(tr);
      const values = keptValues[index] ?? [];
      targets.forEach((el, col) => {
        setFieldText(el, values[col] ?? '');
      });
    });
  }
}

export function useFormFieldClipboard(rootRef: RefObject<HTMLElement | null>) {
  const [selectMode, setSelectMode] = useState<FormFieldSelectMode>('off');
  const [insertTarget, setInsertTarget] = useState<InsertLineTarget | null>(null);
  const [actionFlash, setActionFlash] = useState<'copy' | 'paste' | 'cut' | null>(null);
  const selectedRef = useRef<Set<HTMLElement>>(new Set());
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const [, bump] = useState(0);
  const dragRef = useRef(false);
  const madeSelectionRef = useRef(false);
  const flashTimerRef = useRef<number | null>(null);
  const sync = useCallback(() => bump((n) => n + 1), []);

  const clearInsertTarget = useCallback(() => {
    clearHighlights(selectedRef.current);
    setInsertTarget(null);
    sync();
  }, [sync]);

  const endInsertMode = useCallback(() => {
    clearInsertTarget();
    setSelectMode('off');
    sync();
  }, [clearInsertTarget, sync]);

  const flash = useCallback((action: 'copy' | 'paste' | 'cut') => {
    setActionFlash(action);
    if (flashTimerRef.current != null) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => {
      setActionFlash(null);
      flashTimerRef.current = null;
    }, 220);
  }, []);

  const targetEditable = useCallback((): HTMLElement | null => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && isEditableField(active)) return active;
    const last = lastFocusedRef.current;
    if (last && last.isConnected && isEditableField(last)) return last;
    return null;
  }, []);

  const orderedSelected = useCallback((): HTMLElement[] => {
    const root = rootRef.current;
    if (!root) return [...selectedRef.current];
    const all = [
      ...root.querySelectorAll(FIELD_SELECTOR),
    ].filter(isEditableField);
    return all.filter((el) => selectedRef.current.has(el));
  }, [rootRef]);

  const markSelected = useCallback(
    (fields: HTMLElement[], additive: boolean) => {
      if (!additive) clearHighlights(selectedRef.current);
      for (const el of fields) {
        selectedRef.current.add(el);
        el.classList.add(SELECTED_CLASS);
        selectAllCellContent(el);
      }
      syncRowHighlights([...selectedRef.current]);
      madeSelectionRef.current = true;
      sync();
    },
    [sync],
  );

  const addToSelection = useCallback(
    (el: HTMLElement, additive: boolean) => {
      markSelected([el], additive);
    },
    [markSelected],
  );

  const selectEntireRow = useCallback(
    (el: HTMLElement, additive: boolean) => {
      const tr = rowOf(el);
      if (!tr) {
        addToSelection(el, additive);
        return;
      }
      markSelected(fieldsInRow(tr), additive);
    },
    [addToSelection, markSelected],
  );

  const endSelectMode = useCallback(() => {
    setSelectMode('off');
    dragRef.current = false;
    sync();
  }, [sync]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onFocusIn = (event: FocusEvent) => {
      const field = resolveField(event.target);
      if (field) lastFocusedRef.current = field;
    };
    root.addEventListener('focusin', onFocusIn);
    return () => root.removeEventListener('focusin', onFocusIn);
  }, [rootRef]);

  const copySelected = useCallback(async () => {
    flash('copy');
    const fields = orderedSelected();
    if (fields.length > 0) {
      const rows = orderedUniqueRows(fields);
      const payload =
        isFullRowSelection(fields) && rows.length > 1
          ? encodeRowsClipboard(rows)
          : isFullRowSelection(fields)
            ? encodeRowClipboard(fieldsInRow(rows[0]))
            : fields.length > 1
              ? encodeFieldsClipboard(fields)
              : fieldText(fields[0]);
      await navigator.clipboard.writeText(payload);
      for (const el of fields) selectAllCellContent(el);
      return;
    }
    const el = targetEditable();
    if (!el) return;
    selectAllCellContent(el);
    await navigator.clipboard.writeText(fieldText(el));
  }, [orderedSelected, flash, targetEditable]);

  const cutSelected = useCallback(async () => {
    flash('cut');
    const fields = orderedSelected();
    if (fields.length > 0) {
      const rows = orderedUniqueRows(fields);
      const fullRows = isFullRowSelection(fields);
      const payload =
        fullRows && rows.length > 1
          ? encodeRowsClipboard(rows)
          : fullRows
            ? encodeRowClipboard(fieldsInRow(rows[0]))
            : fields.length > 1
              ? encodeFieldsClipboard(fields)
              : fieldText(fields[0]);
      await navigator.clipboard.writeText(payload);
      if (fullRows) {
        // Cut whole line(s): pull content underneath up to close the gap.
        collapseRowsAfterCut(rows);
      } else {
        for (const el of fields) setFieldText(el, '');
      }
      clearHighlights(selectedRef.current);
      sync();
      return;
    }
    const el = targetEditable();
    if (!el) return;
    selectAllCellContent(el);
    const text = fieldText(el);
    await navigator.clipboard.writeText(text);
    setFieldText(el, '');
  }, [orderedSelected, flash, targetEditable, sync]);

  /** Backspace/Delete on marked line(s): clear only — leave rows below in place. */
  const clearSelectedInPlace = useCallback(() => {
    const fields = orderedSelected();
    if (fields.length === 0) return;
    if (isFullRowSelection(fields)) {
      clearRowsInPlace(orderedUniqueRows(fields));
    } else {
      for (const el of fields) setFieldText(el, '');
    }
    clearHighlights(selectedRef.current);
    sync();
  }, [orderedSelected, sync]);

  const pasteSelected = useCallback(async () => {
    flash('paste');
    let raw = '';
    try {
      raw = await navigator.clipboard.readText();
    } catch {
      return;
    }
    const parsed = parseClipboardPayload(raw);
    const fields = orderedSelected();

    if (parsed.kind === 'rows' && parsed.rows && parsed.rows.length > 0) {
      const anchor = fields[0] ?? targetEditable();
      if (!anchor) return;
      const startTr = rowOf(anchor);
      if (!startTr) return;
      const sectionRows = dataRowsInSection(startTr);
      const startIndex = sectionRows.indexOf(startTr);
      if (startIndex < 0) return;
      parsed.rows.forEach((values, offset) => {
        const tr = sectionRows[startIndex + offset];
        if (!tr) return;
        fieldsInRow(tr).forEach((el, i) => {
          setFieldText(el, values[i] ?? '');
        });
      });
      const pasted = sectionRows
        .slice(startIndex, startIndex + parsed.rows.length)
        .flatMap((tr) => fieldsInRow(tr));
      if (pasted.length > 0) markSelected(pasted, false);
      return;
    }

    if (parsed.kind === 'row') {
      const anchor = fields[0] ?? targetEditable();
      if (!anchor) return;
      const tr = rowOf(anchor);
      const targets = tr ? fieldsInRow(tr) : fields.length > 0 ? fields : [anchor];
      targets.forEach((el, i) => {
        setFieldText(el, parsed.values[i] ?? '');
      });
      markSelected(targets, false);
      return;
    }

    if (parsed.kind === 'fields') {
      const targets =
        fields.length > 0
          ? fields
          : (() => {
              const anchor = targetEditable();
              if (!anchor) return [] as HTMLElement[];
              const tr = rowOf(anchor);
              if (!tr) return [anchor];
              const rowFields = fieldsInRow(tr);
              const start = rowFields.indexOf(anchor);
              if (start < 0) return [anchor];
              return rowFields.slice(start, start + parsed.values.length);
            })();
      targets.forEach((el, i) => {
        setFieldText(el, parsed.values[i] ?? '');
      });
      if (targets.length > 0) markSelected(targets, false);
      return;
    }

    const value = parsed.values[0] ?? '';
    if (fields.length > 0) {
      for (const el of fields) setFieldText(el, value);
      return;
    }
    const el = targetEditable();
    if (el) setFieldText(el, value);
  }, [orderedSelected, flash, targetEditable, markSelected]);

  // Select-mode picking (cell or whole-line).
  useEffect(() => {
    if (selectMode !== 'cell' && selectMode !== 'line') return;

    const root = rootRef.current;
    if (!root) return;
    const lineMode = selectMode === 'line';

    madeSelectionRef.current = false;

    const onPointerDown = (event: PointerEvent) => {
      const field = resolveField(event.target);
      if (!field) return;
      event.preventDefault();
      dragRef.current = true;
      const additive = event.ctrlKey || event.metaKey;
      if (lineMode || event.altKey) {
        selectEntireRow(field, additive);
        return;
      }
      addToSelection(field, additive);
    };

    const onDblClick = (event: MouseEvent) => {
      const field = resolveField(event.target);
      if (!field) return;
      event.preventDefault();
      selectEntireRow(field, event.ctrlKey || event.metaKey);
    };

    const onPointerOver = (event: PointerEvent) => {
      if (!dragRef.current) return;
      if ((event.buttons & 1) === 0) {
        dragRef.current = false;
        return;
      }
      const field = resolveField(event.target);
      if (!field) return;
      if (lineMode) {
        const tr = rowOf(field);
        if (!tr) return;
        const rowFields = fieldsInRow(tr);
        if (rowFields.every((f) => selectedRef.current.has(f))) return;
        markSelected(rowFields, true);
        return;
      }
      if (selectedRef.current.has(field)) return;
      selectedRef.current.add(field);
      field.classList.add(SELECTED_CLASS);
      selectAllCellContent(field);
      madeSelectionRef.current = true;
      sync();
    };

    const onPointerUp = () => {
      dragRef.current = false;
      if (madeSelectionRef.current && selectedRef.current.size > 0) {
        endSelectMode();
      }
    };

    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('dblclick', onDblClick);
    root.addEventListener('pointerover', onPointerOver);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('dblclick', onDblClick);
      root.removeEventListener('pointerover', onPointerOver);
      window.removeEventListener('pointerup', onPointerUp);
      dragRef.current = false;
    };
  }, [selectMode, rootRef, addToSelection, selectEntireRow, markSelected, sync, endSelectMode]);

  // Insert Line: click a table row → highlight + popup; miss → exit.
  useEffect(() => {
    if (selectMode !== 'insert') return;

    const root = rootRef.current;
    if (!root) return;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (target instanceof Element && target.closest(`[${CLIPBOARD_TOOLBAR_ATTR}]`)) return;
      if (target instanceof Element && target.closest('[data-ba-insert-line-popup]')) return;

      // Popup open: click outside cancels.
      if (insertTarget) {
        endInsertMode();
        return;
      }

      const next = resolveInsertLineTargetFromEvent(event.target);
      if (!next) {
        endInsertMode();
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      clearHighlights(selectedRef.current);
      const frame = root.querySelector(
        `[data-form-element-id="${CSS.escape(next.elementId)}"]`,
      );
      const rows = frame
        ? [...frame.querySelectorAll('tr')].filter(
            (node): node is HTMLTableRowElement =>
              node instanceof HTMLTableRowElement && fieldsInRow(node).length > 0,
          )
        : [];
      const tr = rows[next.rowIndex];
      if (tr) markSelected(fieldsInRow(tr), false);
      setInsertTarget(next);
    };

    window.addEventListener('pointerdown', onPointerDown, true);
    return () => window.removeEventListener('pointerdown', onPointerDown, true);
  }, [selectMode, insertTarget, rootRef, endInsertMode, markSelected]);

  // Any click on the document (outside the clipboard toolbar) clears highlights.
  useEffect(() => {
    if (selectMode !== 'off') return;
    if (insertTarget) return;

    const onPointerDown = (event: PointerEvent) => {
      if (selectedRef.current.size === 0) return;
      if (event.button !== 0) return;
      const target = event.target;
      if (target instanceof Element && target.closest(`[${CLIPBOARD_TOOLBAR_ATTR}]`)) return;
      if (target instanceof Element && target.closest('[data-ba-insert-line-popup]')) return;
      clearHighlights(selectedRef.current);
      sync();
    };

    window.addEventListener('pointerdown', onPointerDown, true);
    return () => window.removeEventListener('pointerdown', onPointerDown, true);
  }, [selectMode, insertTarget, sync]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (insertTarget || selectMode === 'insert') {
          endInsertMode();
          return;
        }
        if (selectMode !== 'off' || selectedRef.current.size > 0) {
          clearHighlights(selectedRef.current);
          setSelectMode('off');
          sync();
        }
        return;
      }

      if (selectMode === 'insert' || insertTarget) return;

      if (
        (event.key === 'Backspace' || event.key === 'Delete') &&
        selectedRef.current.size > 0 &&
        !(event.ctrlKey || event.metaKey || event.altKey)
      ) {
        event.preventDefault();
        clearSelectedInPlace();
        return;
      }

      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'c' && selectedRef.current.size > 0) {
        event.preventDefault();
        void copySelected();
      } else if (key === 'x' && selectedRef.current.size > 0) {
        event.preventDefault();
        void cutSelected();
      } else if (key === 'v' && selectedRef.current.size > 0) {
        event.preventDefault();
        void pasteSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    selectMode,
    insertTarget,
    endInsertMode,
    sync,
    clearSelectedInPlace,
    copySelected,
    cutSelected,
    pasteSelected,
  ]);

  useEffect(
    () => () => {
      if (flashTimerRef.current != null) window.clearTimeout(flashTimerRef.current);
    },
    [],
  );

  const beginMode = useCallback(
    (mode: Exclude<FormFieldSelectMode, 'off'>) => {
      clearHighlights(selectedRef.current);
      setInsertTarget(null);
      madeSelectionRef.current = false;
      setSelectMode((prev) => (prev === mode ? 'off' : mode));
      sync();
    },
    [sync],
  );

  const toggleSelectMode = useCallback(() => beginMode('cell'), [beginMode]);
  const toggleLineSelectMode = useCallback(() => beginMode('line'), [beginMode]);
  const toggleInsertLineMode = useCallback(() => beginMode('insert'), [beginMode]);

  return {
    selectMode,
    cellSelectMode: selectMode === 'cell',
    lineSelectMode: selectMode === 'line',
    insertLineMode: selectMode === 'insert',
    insertTarget,
    selectedCount: selectedRef.current.size,
    actionFlash,
    toggleSelectMode,
    toggleLineSelectMode,
    toggleInsertLineMode,
    clearInsertTarget,
    endInsertMode,
    copySelected,
    cutSelected,
    pasteSelected,
  };
}
