import type { FormPage } from './types';
import { readHiddenTemplateLineIds, ROW_TEXT_EDITABLE_KINDS } from './rowTextOverrides';

export function pageHasRowTextEditableElements(page: FormPage): boolean {
  for (const section of page.sections) {
    for (const element of section.elements) {
      if (ROW_TEXT_EDITABLE_KINDS.has(element.kind)) return true;
    }
  }
  return false;
}

export function pageHasHiddenTemplateLines(
  page: FormPage,
  values: Record<string, unknown> | undefined,
): boolean {
  if (!values) return false;
  for (const section of page.sections) {
    for (const element of section.elements) {
      if (!ROW_TEXT_EDITABLE_KINDS.has(element.kind)) continue;
      const raw = values[element.id];
      if (readHiddenTemplateLineIds(raw).size > 0) return true;
    }
  }
  return false;
}
