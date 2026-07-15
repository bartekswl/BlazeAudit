import type { FormDefinition, FormPage } from './types';

/** Shared add/remove control modes for repeatable form pages (23.2 and others). */
export type FormExtraPageControls = 'none' | 'add-only' | 'add-remove';

/**
 * Controls for a page in a repeatable run.
 * First `minPages` sheets (0..minPages-2) show nothing when minPages > 1;
 * the sheet at minPages-1 shows add-only; later sheets show add+remove.
 * With minPages=1: the first sheet is add-only; extras are add-remove.
 */
export function resolveExtraPageControls(
  sequenceIndex: number | null,
  minPages: number,
): FormExtraPageControls {
  if (sequenceIndex == null) return 'none';
  if (sequenceIndex < minPages - 1) return 'none';
  if (sequenceIndex === minPages - 1) return 'add-only';
  return 'add-remove';
}

export function renumberFormPageLabels(form: FormDefinition): FormDefinition {
  return {
    ...form,
    pages: form.pages.map((page, index) => ({
      ...page,
      label: `Page ${index + 1}`,
    })),
  };
}

export function elementIdsOnPage(page: FormPage): string[] {
  return page.sections.flatMap((section) => section.elements.map((element) => element.id));
}

export function pageIndicesWhere(
  form: FormDefinition,
  predicate: (page: FormPage) => boolean,
): number[] {
  return form.pages
    .map((page, index) => (predicate(page) ? index : -1))
    .filter((index) => index >= 0);
}

export function sequenceIndexInRun(
  form: FormDefinition,
  pageIndex: number,
  predicate: (page: FormPage) => boolean,
): number | null {
  const indices = pageIndicesWhere(form, predicate);
  const sequenceIndex = indices.indexOf(pageIndex);
  return sequenceIndex === -1 ? null : sequenceIndex;
}
