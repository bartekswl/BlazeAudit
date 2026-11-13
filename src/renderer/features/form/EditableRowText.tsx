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
import {
  rowLetterOverrideId,
  resolveRowText,
  type RowTextOverrides,
} from '../../../shared/form/rowTextOverrides';
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

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const target = event.target;
      if (target instanceof Node && el.contains(target)) return;
      el.blur();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
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
  fillCell = true,
}: {
  rowId: string;
  text: string;
  className?: string;
  /** When true, the whole table cell (and letter column where applicable) accepts double-click. */
  fillCell?: boolean;
}) {
  const editing = useContext(RowTextEditingContext);
  const [confirming, setConfirming] = useState(false);
  const [active, setActive] = useState(false);
  const shown = editing ? resolveRowText(editing.overrides, rowId, text) : text;

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
          if (trimmed === text) {
            editing.onSet(rowId, null);
          } else if (trimmed === '') {
            editing.onSet(rowId, '');
          } else {
            editing.onSet(rowId, trimmed);
          }
        }}
      />
    );
  }

  return (
    <>
      <span
        className={cn(
          className,
          'form-row-text--editable',
          fillCell && 'form-row-text--fill-cell',
        )}
        title="Double-click anywhere in this row to edit the wording"
        onDoubleClick={(event) => {
          event.preventDefault();
          window.getSelection()?.removeAllRanges();
          setConfirming(true);
        }}
      >
        {shown || (fillCell ? '\u00a0' : '')}
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
              You are about to change standard checklist wording. The change applies to this
              document only; the built-in template is unchanged.
            </p>
            <p>
              Press Enter to save, Esc to cancel. Clear the letter or text to remove the whole row
              line. Match the original wording exactly to drop your override.
            </p>
          </ConfirmDialog>,
          document.body,
        )}
    </>
  );
}

/** Row letter column (A., B., …) — same edit flow as description; uses <code>{`${rowId}.letter`}</code>. */
export function EditableRowLetter({
  rowId,
  letter,
  className,
}: {
  rowId: string;
  letter: string;
  className?: string;
}) {
  return (
    <EditableRowText
      rowId={rowLetterOverrideId(rowId)}
      text={letter}
      className={className}
      fillCell
    />
  );
}
