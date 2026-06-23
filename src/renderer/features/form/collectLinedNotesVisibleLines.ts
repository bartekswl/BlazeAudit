import { visibleLineCountFromHeights } from '../../../shared/form/linedNotes';

/** Read visible ruled-line counts from the live document editor (for PDF export). */
export function collectLinedNotesVisibleLines(root: ParentNode = document): Record<string, number> {
  const result: Record<string, number> = {};

  root.querySelectorAll<HTMLElement>('[data-lined-notes-stack]').forEach((stack) => {
    const elementId = stack.dataset.linedNotesStack;
    const body = stack.querySelector('.ln-body');
    if (!elementId || !body) return;

    const lineHeight = parseFloat(getComputedStyle(body).lineHeight);
    result[elementId] = visibleLineCountFromHeights(stack.clientHeight, lineHeight);
  });

  return result;
}
