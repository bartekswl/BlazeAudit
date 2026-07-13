import { type ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { IndividualDeviceRecordPageControls as ControlsMode } from '../../../shared/form/individualDeviceRecordPages';
import { cn } from '../../lib/cn';

const controlBtnCls =
  'inline-flex size-9 items-center justify-center rounded-md border border-[var(--ba-panel-border)] bg-[var(--ba-panel-bg)] text-[var(--ba-text-secondary)] shadow-sm transition-colors hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500/60';

const IDR_ADD_PAGE_TOOLTIP =
  'Add another 23.2 Individual Device Record page after this one. The new page starts empty.';

const IDR_REMOVE_PAGE_TOOLTIP =
  'Remove this 23.2 page from the inspection. At least three Individual Device Record pages must remain.';

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

export function IndividualDeviceRecordPageControlsBar({
  mode,
  onAdd,
  onRemove,
}: {
  mode: ControlsMode;
  onAdd?: () => void;
  onRemove?: () => void;
}) {
  if (mode === 'none') return null;

  return (
    <div className="idr-page-controls" aria-label="Individual Device Record page controls">
      {mode === 'add-remove' ? (
        <ControlTooltip text={IDR_REMOVE_PAGE_TOOLTIP}>
          <button
            type="button"
            className={cn(controlBtnCls, 'idr-page-controls-btn idr-page-controls-btn--remove')}
            onClick={onRemove}
            aria-label={IDR_REMOVE_PAGE_TOOLTIP}
          >
            <Minus className="size-4" strokeWidth={2.5} />
          </button>
        </ControlTooltip>
      ) : null}
      <ControlTooltip text={IDR_ADD_PAGE_TOOLTIP}>
        <button
          type="button"
          className={cn(controlBtnCls, 'idr-page-controls-btn idr-page-controls-btn--add')}
          onClick={onAdd}
          aria-label={IDR_ADD_PAGE_TOOLTIP}
        >
          <Plus className="size-4" strokeWidth={2.5} />
        </button>
      </ControlTooltip>
    </div>
  );
}
