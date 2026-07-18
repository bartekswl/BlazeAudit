import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

const SELECTED_CLASS = 'ba-field-selected';

function isEditableField(el: Element): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  if (el instanceof HTMLInputElement) {
    const type = el.type.toLowerCase();
    if (type === 'checkbox' || type === 'radio' || type === 'button' || type === 'submit' || type === 'hidden') {
      return type === 'checkbox' || type === 'radio';
    }
    if (el.readOnly || el.disabled) return false;
    return true;
  }
  if (el instanceof HTMLTextAreaElement) return !el.readOnly && !el.disabled;
  if (el instanceof HTMLSelectElement) return !el.disabled;
  return false;
}

function resolveField(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const hit = target.closest('input, textarea, select');
  if (!hit || !isEditableField(hit)) return null;
  return hit;
}

function fieldText(el: HTMLElement): string {
  if (el instanceof HTMLInputElement) {
    if (el.type === 'checkbox' || el.type === 'radio') return el.checked ? 'true' : 'false';
    return el.value;
  }
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return el.value;
  return '';
}

/** Collapse any newlines/whitespace runs so clipboard payloads stay one line. */
function toSingleLine(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/[\n\r\t]+/g, ' ').replace(/ {2,}/g, ' ').trim();
}

function clipboardFromFields(fields: HTMLElement[]): string {
  return fields
    .map((el) => toSingleLine(fieldText(el)))
    .filter((part) => part.length > 0)
    .join(' ');
}

function setFieldText(el: HTMLElement, text: string): void {
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

function selectFieldContents(el: HTMLElement): void {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.focus();
    el.select();
    return;
  }
  if (el instanceof HTMLSelectElement) {
    el.focus();
  }
}

function clearHighlights(selected: Set<HTMLElement>): void {
  for (const el of selected) el.classList.remove(SELECTED_CLASS);
  selected.clear();
}

export function useFormFieldClipboard(rootRef: RefObject<HTMLElement | null>) {
  const [selectMode, setSelectMode] = useState(false);
  const selectedRef = useRef<Set<HTMLElement>>(new Set());
  const [, bump] = useState(0);
  const dragRef = useRef(false);
  const madeSelectionRef = useRef(false);
  const sync = useCallback(() => bump((n) => n + 1), []);

  const orderedSelected = useCallback((): HTMLElement[] => {
    const root = rootRef.current;
    if (!root) return [...selectedRef.current];
    const all = [...root.querySelectorAll('input, textarea, select')].filter(isEditableField);
    return all.filter((el) => selectedRef.current.has(el));
  }, [rootRef]);

  const addToSelection = useCallback(
    (el: HTMLElement, additive: boolean) => {
      if (!additive) clearHighlights(selectedRef.current);
      selectedRef.current.add(el);
      el.classList.add(SELECTED_CLASS);
      selectFieldContents(el);
      madeSelectionRef.current = true;
      sync();
    },
    [sync],
  );

  const endSelectModeKeepHighlights = useCallback(() => {
    setSelectMode(false);
    dragRef.current = false;
    sync();
  }, [sync]);

  const copySelected = useCallback(async () => {
    const fields = orderedSelected();
    if (fields.length === 0) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && isEditableField(active)) {
        await navigator.clipboard.writeText(toSingleLine(fieldText(active)));
      }
      return;
    }
    await navigator.clipboard.writeText(clipboardFromFields(fields));
  }, [orderedSelected]);

  const cutSelected = useCallback(async () => {
    const fields = orderedSelected();
    const targets =
      fields.length > 0
        ? fields
        : document.activeElement instanceof HTMLElement && isEditableField(document.activeElement)
          ? [document.activeElement]
          : [];
    if (targets.length === 0) return;
    await navigator.clipboard.writeText(clipboardFromFields(targets));
    for (const el of targets) setFieldText(el, '');
  }, [orderedSelected]);

  const pasteSelected = useCallback(async () => {
    let text = '';
    try {
      text = await navigator.clipboard.readText();
    } catch {
      return;
    }
    const singleLine = toSingleLine(text);
    const fields = orderedSelected();
    const targets =
      fields.length > 0
        ? fields
        : document.activeElement instanceof HTMLElement && isEditableField(document.activeElement)
          ? [document.activeElement]
          : [];
    if (targets.length === 0) return;
    // One-line clipboard → first selected field (or the only target).
    if (targets.length === 1 || !text.includes('\n')) {
      setFieldText(targets[0], singleLine);
      return;
    }
    const lines = text.replace(/\r\n/g, '\n').split('\n').map(toSingleLine);
    targets.forEach((el, i) => {
      setFieldText(el, lines[i] ?? lines[lines.length - 1] ?? '');
    });
  }, [orderedSelected]);

  useEffect(() => {
    if (!selectMode) return;

    const root = rootRef.current;
    if (!root) return;

    madeSelectionRef.current = false;

    const onPointerDown = (event: PointerEvent) => {
      const field = resolveField(event.target);
      if (!field) return;
      event.preventDefault();
      dragRef.current = true;
      addToSelection(field, event.ctrlKey || event.metaKey);
    };

    const onPointerOver = (event: PointerEvent) => {
      if (!dragRef.current) return;
      if ((event.buttons & 1) === 0) {
        dragRef.current = false;
        return;
      }
      const field = resolveField(event.target);
      if (!field || selectedRef.current.has(field)) return;
      selectedRef.current.add(field);
      field.classList.add(SELECTED_CLASS);
      madeSelectionRef.current = true;
      sync();
    };

    const onPointerUp = () => {
      dragRef.current = false;
      if (madeSelectionRef.current && selectedRef.current.size > 0) {
        // Selection done → normal cursor + Select button off; keep field highlights for Copy/Paste.
        endSelectModeKeepHighlights();
      }
    };

    const onClick = (event: MouseEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      const field = resolveField(event.target);
      if (!field) return;
      event.preventDefault();
      if (selectedRef.current.has(field)) {
        selectedRef.current.delete(field);
        field.classList.remove(SELECTED_CLASS);
        sync();
      } else {
        addToSelection(field, true);
      }
    };

    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointerover', onPointerOver);
    window.addEventListener('pointerup', onPointerUp);
    root.addEventListener('click', onClick, true);

    return () => {
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointerover', onPointerOver);
      window.removeEventListener('pointerup', onPointerUp);
      root.removeEventListener('click', onClick, true);
      dragRef.current = false;
    };
  }, [selectMode, rootRef, addToSelection, sync, endSelectModeKeepHighlights]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (selectMode || selectedRef.current.size > 0)) {
        clearHighlights(selectedRef.current);
        setSelectMode(false);
        sync();
        return;
      }
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'c') {
        if (selectedRef.current.size > 1) {
          event.preventDefault();
          void copySelected();
        }
      } else if (key === 'x' && (selectMode || selectedRef.current.size > 0)) {
        event.preventDefault();
        void cutSelected();
      } else if (key === 'v' && (selectMode || selectedRef.current.size > 0)) {
        if (selectedRef.current.size > 1) {
          event.preventDefault();
          void pasteSelected();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectMode, copySelected, cutSelected, pasteSelected, sync]);

  const toggleSelectMode = useCallback(() => {
    setSelectMode((prev) => {
      if (prev) {
        // Manual off → clear selection highlights.
        clearHighlights(selectedRef.current);
        return false;
      }
      // Fresh select pass.
      clearHighlights(selectedRef.current);
      madeSelectionRef.current = false;
      return true;
    });
    sync();
  }, [sync]);

  return {
    selectMode,
    selectedCount: selectedRef.current.size,
    toggleSelectMode,
    copySelected,
    cutSelected,
    pasteSelected,
  };
}
