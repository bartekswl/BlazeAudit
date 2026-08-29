import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { InsertLineTarget } from './useFormFieldClipboard';

const COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function InsertLinePopup({
  target,
  onConfirm,
  onClose,
}: {
  target: InsertLineTarget;
  onConfirm: (count: number) => void;
  onClose: () => void;
}) {
  const [count, setCount] = useState(1);
  const selectId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.querySelector('select')?.focus();
  }, [target]);

  const top = Math.min(
    Math.max(12, target.anchor.bottom + 8),
    typeof window !== 'undefined' ? window.innerHeight - 160 : target.anchor.bottom + 8,
  );
  const left = Math.min(
    Math.max(12, target.anchor.left),
    typeof window !== 'undefined' ? window.innerWidth - 260 : target.anchor.left,
  );

  return (
    <div
      ref={panelRef}
      data-ba-insert-line-popup=""
      role="dialog"
      aria-label="Insert rows below"
      className="fixed z-[80] w-[15.5rem] rounded-lg border border-[var(--ba-border)] bg-[var(--ba-surface-elevated)] p-3 shadow-xl"
      style={{ top, left }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-[12px] font-medium leading-4 text-[var(--ba-text-primary)]">
          How many rows to add below?
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-5 shrink-0 items-center justify-center rounded text-[var(--ba-text-muted)] hover:bg-white/10 hover:text-[var(--ba-text-primary)]"
          aria-label="Close"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <label htmlFor={selectId} className="sr-only">
        Number of rows
      </label>
      <select
        id={selectId}
        value={count}
        onChange={(e) => setCount(Number(e.target.value))}
        className="ba-input ba-input--compact mb-2 w-full !text-[12px]"
      >
        {COUNT_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="inline-flex h-7 w-full items-center justify-center rounded-md border border-flame-500/40 bg-flame-500/20 text-[12px] font-medium text-flame-200 hover:bg-flame-500/30"
        onClick={() => onConfirm(count)}
      >
        Insert {count} {count === 1 ? 'row' : 'rows'}
      </button>
    </div>
  );
}
