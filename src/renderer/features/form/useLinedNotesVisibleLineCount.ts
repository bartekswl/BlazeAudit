import { useCallback, useEffect, useState, type RefObject } from 'react';
import { visibleLineCountFromHeights } from '../../../shared/form/linedNotes';

export type LinedNotesStackMeasure = {
  lineCount: number;
  stackHeightPx: number;
};

export function useLinedNotesVisibleLineCount(
  stackRef: RefObject<HTMLElement | null>,
): LinedNotesStackMeasure {
  const [measure, setMeasure] = useState<LinedNotesStackMeasure>({
    lineCount: 1,
    stackHeightPx: 0,
  });

  const update = useCallback(() => {
    const stack = stackRef.current;
    if (!stack) return;

    const body = stack.querySelector('.ln-body');
    if (!body) return;

    const lineHeight = parseFloat(getComputedStyle(body).lineHeight);
    const stackHeightPx = stack.clientHeight;
    setMeasure({
      lineCount: visibleLineCountFromHeights(stackHeightPx, lineHeight),
      stackHeightPx,
    });
  }, [stackRef]);

  useEffect(() => {
    const stack = stackRef.current;
    if (!stack) return;

    const observer = new ResizeObserver(() => update());
    observer.observe(stack);
    update();
    return () => observer.disconnect();
  }, [stackRef, update]);

  return measure;
}
