import { useEffect, useRef } from 'react';

/** Autosave cadence for open inspection documents. */
export const DOCUMENT_AUTOSAVE_INTERVAL_MS = 5 * 60 * 1000;

/**
 * While a document is open, periodically save if there are unsaved changes.
 * Skips ticks that are already mid-save.
 */
export function useDocumentAutosave(
  save: () => void | Promise<void>,
  isDirty: boolean,
  isSaving: boolean,
  documentKey: string,
): void {
  const saveRef = useRef(save);
  saveRef.current = save;
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;
  const savingRef = useRef(isSaving);
  savingRef.current = isSaving;

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!dirtyRef.current || savingRef.current) return;
      void saveRef.current();
    }, DOCUMENT_AUTOSAVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [documentKey]);
}
