import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { PencilLine } from 'lucide-react';
import type { RowTextOverrides } from '../../../shared/form/rowTextOverrides';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { cn } from '../../lib/cn';

export type RowTextEditing = {
  overrides: RowTextOverrides;
  editable: boolean;
  onSet: (rowId: string, text: string | null) => void;
};

export const RowTextEditingContext = createContext<RowTextEditing | null>(null);

function RowTextEditor({
  initial,
  className,
  onCommit,
  onCancel,
}: {
  initial: string;
  className?: string;
  onCommit: (text: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const doneRef = useRef(false);
  const [draft, setDraft] = useState(initial);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  const finish = (commit: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (commit) onCommit(draft);
    else onCancel();
  };

  return (
    <textarea
      ref={ref}
      rows={1}
      spellCheck={false}
      className={cn(className, 'form-row-text-input')}
      value={draft}
      aria-label="Row text"
      onChange={(event) => setDraft(event.target.value.replace(/\r?\n/g, ' '))}
      onBlur={() => finish(true)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          finish(true);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          finish(false);
        }
      }}
    />
  );
}

/**
 * Fixed checklist row wording. In an editable document, double-click asks for confirmation and
 * then edits the text in place; the replacement is stored on the element value (`rowText`).
 */
export function EditableRowText({
  rowId,
  text,
  className,
}: {
  rowId: string;
  text: string;
  className?: string;
}) {
  const editing = useContext(RowTextEditingContext);
  const [confirming, setConfirming] = useState(false);
  const [active, setActive] = useState(false);
  const shown = editing?.overrides[rowId] ?? text;

  if (!editing?.editable) {
    return <span className={className}>{shown}</span>;
  }

  if (active) {
    return (
      <RowTextEditor
        initial={shown}
        className={className}
        onCancel={() => setActive(false)}
        onCommit={(next) => {
          setActive(false);
          const trimmed = next.trim();
          editing.onSet(rowId, trimmed === '' || trimmed === text ? null : trimmed);
        }}
      />
    );
  }

  return (
    <>
      <span
        className={cn(className, 'form-row-text--editable')}
        title="Double-click to edit this row's text"
        onDoubleClick={(event) => {
          event.preventDefault();
          window.getSelection()?.removeAllRanges();
          setConfirming(true);
        }}
      >
        {shown}
      </span>
      {confirming &&
        createPortal(
          <ConfirmDialog
            title="Edit template text?"
            icon={PencilLine}
            confirmLabel="Continue"
            onCancel={() => setConfirming(false)}
            onConfirm={() => {
              setConfirming(false);
              setActive(true);
            }}
          >
            <p>
              You are about to change the standard wording of this row. The change applies to this
              document only.
            </p>
            <p>Press Enter to save, Esc to cancel. Clear the text to restore the original wording.</p>
          </ConfirmDialog>,
          document.body,
        )}
    </>
  );
}
