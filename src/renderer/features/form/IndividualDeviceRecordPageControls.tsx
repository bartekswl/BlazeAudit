import { type ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { FormExtraPageControls as ControlsMode } from '../../../shared/form/formExtraPages';
import { cn } from '../../lib/cn';

const controlBtnCls =
  'inline-flex size-9 items-center justify-center rounded-md border border-[var(--ba-panel-border)] bg-[var(--ba-panel-bg)] text-[var(--ba-text-secondary)] shadow-sm transition-colors hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500/60';

function ControlTooltip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="idr-page-control-wrap group/control relative inline-flex">
      {children}
      <span className="idr-page-control-tooltip" role="tooltip">
        {text}
      </span>
    </span>
  );
}

export function FormExtraPageControlsBar({
  mode,
  ariaLabel,
  addTooltip,
  removeTooltip,
  onAdd,
  onRemove,
}: {
  mode: ControlsMode;
  ariaLabel: string;
  addTooltip: string;
  removeTooltip: string;
  onAdd?: () => void;
  onRemove?: () => void;
}) {
  if (mode === 'none') return null;

  return (
    <div className="idr-page-controls" aria-label={ariaLabel}>
      {mode === 'add-remove' ? (
        <ControlTooltip text={removeTooltip}>
          <button
            type="button"
            className={cn(controlBtnCls, 'idr-page-controls-btn idr-page-controls-btn--remove')}
            onClick={onRemove}
            aria-label={removeTooltip}
          >
            <Minus className="size-4" strokeWidth={2.5} />
          </button>
        </ControlTooltip>
      ) : null}
      <ControlTooltip text={addTooltip}>
        <button
          type="button"
          className={cn(controlBtnCls, 'idr-page-controls-btn idr-page-controls-btn--add')}
          onClick={onAdd}
          aria-label={addTooltip}
        >
          <Plus className="size-4" strokeWidth={2.5} />
        </button>
      </ControlTooltip>
    </div>
  );
}

/** @deprecated Prefer FormExtraPageControlsBar — kept for existing imports. */
export function IndividualDeviceRecordPageControlsBar({
  mode,
  onAdd,
  onRemove,
}: {
  mode: ControlsMode;
  onAdd?: () => void;
  onRemove?: () => void;
}) {
  return (
    <FormExtraPageControlsBar
      mode={mode}
      ariaLabel="Individual Device Record page controls"
      addTooltip="Add another 23.2 Individual Device Record page after this one. The new page starts empty."
      removeTooltip="Remove this 23.2 page from the inspection. At least three Individual Device Record pages must remain."
      onAdd={onAdd}
      onRemove={onRemove}
    />
  );
}
