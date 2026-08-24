import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

const SELECTED_CLASS = 'ba-field-selected';
const ROW_SELECTED_CLASS = 'ba-row-selected';
/** Toolbar buttons that must not clear a pending multi-select on pointerdown. */
export const CLIPBOARD_TOOLBAR_ATTR = 'data-ba-clipboard-toolbar';

const ROW_CLIP_PREFIX = 'BA_ROW';
const ROWS_CLIP_PREFIX = 'BA_ROWS';
const FIELDS_CLIP_PREFIX = 'BA_FIELDS';

export type FormFieldSelectMode = 'off' | 'cell' | 'line';

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

/** IDR-style cycle buttons and similar choice cells. */
function isChoiceButton(el: Element): el is HTMLButtonElement {
  return (
    el instanceof HTMLButtonElement &&
    !el.disabled &&
    (el.classList.contains('idr-choice-cell') ||
      /(?:^|\s)[\w-]*choice-cell(?:\s|$)/.test(el.className))
  );
}

function isEditableField(el: Element): el is HTMLElement {
  return isTextEditable(el) || isChoiceButton(el);
}

function resolveField(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const hit = target.closest(
    'input, textarea, select, button.idr-choice-cell, button[class*="choice-cell"]',
  );
  if (!hit || !isEditableField(hit)) return null;
  return hit;
}

function readChoiceButton(el: HTMLButtonElement): string {
  if (
    el.classList.contains('idr-choice-cell--yes') ||
    el.className.includes('choice-cell--yes')
  ) {
    return 'yes';
  }
  if (
    el.classList.contains('idr-choice-cell--no') ||
    el.className.includes('choice-cell--no')
  ) {
    return 'no';
  }
  if (
    el.classList.contains('idr-choice-cell--na') ||
    el.className.includes('choice-cell--na')
  ) {
    return 'na';
  }
  const t = el.textContent?.trim() ?? '';
  if (t === '✓' || t === 'Y' || t.toLowerCase() === 'yes') return 'yes';
  if (t === '✗' || t === 'N' || t.toLowerCase() === 'no') return 'no';
  if (t === '—' || t === 'N/A' || t.toLowerCase() === 'na') return 'na';
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

function setFieldText(el: HTMLElement, text: string): void {
  if (isChoiceButton(el)) {
    const wanted = normalizeChoiceToken(text);
    if (wanted === null && text.trim() === '') {
      for (let i = 0; i < 4; i++) {
        if (readChoiceButton(el) === '') return;
        el.click();
      }
      return;
    }
    if (!wanted) return;
    for (let i = 0; i < 4; i++) {
      if (readChoiceButton(el) === wanted) return;
      el.click();
    }
    return;
  }
  if (el instanceof HTMLInputElement) {
    if (el.type === 'checkbox' || el.type === 'radio') {
      el.checked = text === 'true' || text === '1' || text.toLowerCase() === 'yes';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    const proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    proto?.set?.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }
  if (el instanceof HTMLTextAreaElement) {
    const proto = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    proto?.set?.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }
  if (el instanceof HTMLSelectElement) {
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function normalizeChoiceToken(text: string): 'yes' | 'no' | 'na' | null {
  const t = text.trim().toLowerCase();
  if (t === 'yes' || t === 'y' || t === 'true' || t === '✓' || t === 'check') return 'yes';
  if (t === 'no' || t === 'n' || t === 'false' || t === '✗' || t === 'x') return 'no';
  if (t === 'na' || t === 'n/a' || t === '—' || t === '-') return 'na';
  return null;
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
  return [...tr.querySelectorAll('input, textarea, select, button.idr-choice-cell, button[class*="choice-cell"]')].filter(
    isEditableField,
  );
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
  const [actionFlash, setActionFlash] = useState<'copy' | 'paste' | 'cut' | null>(null);
  const selectedRef = useRef<Set<HTMLElement>>(new Set());
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const [, bump] = useState(0);
  const dragRef = useRef(false);
  const madeSelectionRef = useRef(false);
  const flashTimerRef = useRef<number | null>(null);
  const sync = useCallback(() => bump((n) => n + 1), []);

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
      ...root.querySelectorAll(
        'input, textarea, select, button.idr-choice-cell, button[class*="choice-cell"]',
      ),
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
    if (selectMode === 'off') return;

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

  // Any click on the document (outside the clipboard toolbar) clears highlights.
  useEffect(() => {
    if (selectMode !== 'off') return;

    const onPointerDown = (event: PointerEvent) => {
      if (selectedRef.current.size === 0) return;
      if (event.button !== 0) return;
      const target = event.target;
      if (target instanceof Element && target.closest(`[${CLIPBOARD_TOOLBAR_ATTR}]`)) return;
      clearHighlights(selectedRef.current);
      sync();
    };

    window.addEventListener('pointerdown', onPointerDown, true);
    return () => window.removeEventListener('pointerdown', onPointerDown, true);
  }, [selectMode, sync]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (selectMode !== 'off' || selectedRef.current.size > 0)) {
        clearHighlights(selectedRef.current);
        setSelectMode('off');
        sync();
        return;
      }

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
  }, [selectMode, copySelected, cutSelected, pasteSelected, clearSelectedInPlace, sync]);

  useEffect(
    () => () => {
      if (flashTimerRef.current != null) window.clearTimeout(flashTimerRef.current);
    },
    [],
  );

  const toggleSelectMode = useCallback(() => {
    setSelectMode((prev) => {
      clearHighlights(selectedRef.current);
      madeSelectionRef.current = false;
      return prev === 'cell' ? 'off' : 'cell';
    });
    sync();
  }, [sync]);

  const toggleLineSelectMode = useCallback(() => {
    setSelectMode((prev) => {
      clearHighlights(selectedRef.current);
      madeSelectionRef.current = false;
      return prev === 'line' ? 'off' : 'line';
    });
    sync();
  }, [sync]);

  return {
    selectMode,
    cellSelectMode: selectMode === 'cell',
    lineSelectMode: selectMode === 'line',
    selectedCount: selectedRef.current.size,
    actionFlash,
    toggleSelectMode,
    toggleLineSelectMode,
    copySelected,
    cutSelected,
    pasteSelected,
  };
}
