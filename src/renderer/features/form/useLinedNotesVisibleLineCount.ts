import { useCallback, useEffect, useState, type RefObject } from 'react';
import { visibleLineCountFromHeights } from '../../../shared/form/linedNotes';

export function useLinedNotesVisibleLineCount(
  stackRef: RefObject<HTMLElement | null>,
): number {
  const [lineCount, setLineCount] = useState(1);

  const update = useCallback(() => {
    const stack = stackRef.current;
    if (!stack) return;

    const body = stack.querySelector('.ln-body');
    if (!body) return;

    const lineHeight = parseFloat(getComputedStyle(body).lineHeight);
    setLineCount(visibleLineCountFromHeights(stack.clientHeight, lineHeight));
  }, [stackRef]);

  useEffect(() => {
    const stack = stackRef.current;
    if (!stack) return;

    const observer = new ResizeObserver(() => update());
    observer.observe(stack);
    update();
    return () => observer.disconnect();
  }, [stackRef, update]);

  return lineCount;
}
