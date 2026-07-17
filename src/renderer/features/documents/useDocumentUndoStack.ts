import { useCallback, useEffect, useRef, useState } from 'react';

/** Max in-session undo steps for an open document. */
export const DOCUMENT_UNDO_MAX_STEPS = 40;

/** Coalesce rapid edits to the same key (e.g. typing in one field). */
const COALESCE_MS = 800;

/**
 * In-memory undo stack for document editors.
 * Snapshots are structured clones; nothing is written to disk.
 */
export function useDocumentUndoStack<T>() {
  const stackRef = useRef<T[]>([]);
  const coalesceRef = useRef<{ key: string; at: number } | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  const clear = useCallback(() => {
    stackRef.current = [];
    coalesceRef.current = null;
    setCanUndo(false);
  }, []);

  const push = useCallback((snapshot: T, coalesceKey?: string) => {
    const now = Date.now();
    if (
      coalesceKey &&
      coalesceRef.current?.key === coalesceKey &&
      now - coalesceRef.current.at < COALESCE_MS
    ) {
      coalesceRef.current.at = now;
      return;
    }

    stackRef.current.push(structuredClone(snapshot));
    if (stackRef.current.length > DOCUMENT_UNDO_MAX_STEPS) {
      stackRef.current.shift();
    }
    coalesceRef.current = coalesceKey ? { key: coalesceKey, at: now } : null;
    setCanUndo(true);
  }, []);

  const undo = useCallback((): T | null => {
    const prev = stackRef.current.pop() ?? null;
    coalesceRef.current = null;
    setCanUndo(stackRef.current.length > 0);
    return prev;
  }, []);

  return { canUndo, push, undo, clear };
}

/** Ctrl/Cmd+Z while not typing in a way that browsers already handle poorly. */
export function useDocumentUndoHotkey(canUndo: boolean, onUndo: () => void): void {
  const onUndoRef = useRef(onUndo);
  onUndoRef.current = onUndo;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod || event.altKey || event.shiftKey) return;
      if (event.key !== 'z' && event.key !== 'Z') return;
      if (!canUndo) return;
      event.preventDefault();
      onUndoRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canUndo]);
}
