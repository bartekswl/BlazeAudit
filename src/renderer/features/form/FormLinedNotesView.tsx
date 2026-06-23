import { useRef, type CSSProperties } from 'react';
import { normalizeLinedNotesValue, type LinedNotesValue } from '../../../shared/form/linedNotes';
import { FormLinedNotesInput } from './FormLinedNotesInput';
import { LinedNoteRuleRows } from './LinedNoteRuleRows';
import { useLinedNotesVisibleLineCount } from './useLinedNotesVisibleLineCount';
import { cn } from '../../lib/cn';

export function FormLinedNotesView({
  elementId,
  variant,
  value: rawValue,
  readOnly,
  visibleLineCount,
  pdfRowHeightPx,
  onChange,
}: {
  elementId: string;
  variant: 'green' | 'blue';
  value: unknown;
  readOnly?: boolean;
  /** PDF export — line counts measured from the document editor. */
  visibleLineCount?: number;
  /** PDF export — pixel height per row (measured from fixed A4 layout). */
  pdfRowHeightPx?: number;
  onChange?: (value: LinedNotesValue) => void;
}) {
  const text = normalizeLinedNotesValue(rawValue);
  const stackRef = useRef<HTMLDivElement>(null);
  const measuredLineCount = useLinedNotesVisibleLineCount(stackRef);
  const lineCount = visibleLineCount ?? measuredLineCount;
  const isPdfLayout = visibleLineCount != null;
  const isMeasuredPdf = pdfRowHeightPx != null && pdfRowHeightPx > 0;

  const stackStyle: CSSProperties = {
    ...(isPdfLayout ? { '--ln-visible-lines': String(visibleLineCount) } : {}),
    ...(isMeasuredPdf ? { '--ln-row-height': `${pdfRowHeightPx}px` } : {}),
  } as CSSProperties;

  return (
    <div
      className={cn(
        'ln-panel',
        variant === 'green' ? 'ln-panel--green' : 'ln-panel--blue',
      )}
    >
      <div className="ln-head-bar shrink-0" aria-hidden="true" />
      <div
        ref={stackRef}
        className={cn(
          'ln-body-stack',
          isPdfLayout && 'ln-body-stack--fill',
          isMeasuredPdf && 'ln-body-stack--measured',
        )}
        data-lined-notes-stack={elementId}
        style={stackStyle}
      >
        <LinedNoteRuleRows count={lineCount} />
        {readOnly ? (
          <div className="ln-body ln-body--readonly">{text || '\u00a0'}</div>
        ) : (
          <FormLinedNotesInput value={text} lineCount={lineCount} onChange={onChange} />
        )}
      </div>
    </div>
  );
}
