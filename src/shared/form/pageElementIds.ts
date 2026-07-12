import type { FormPage } from './types';

export function pageElementIds(page: FormPage): string[] {
  const ids: string[] = [];
  for (const section of page.sections) {
    for (const element of section.elements) {
      ids.push(element.id);
    }
  }
  return ids;
}

export function pageValuesChanged(
  prev: Record<string, unknown> | undefined,
  next: Record<string, unknown> | undefined,
  elementIds: string[],
): boolean {
  const a = prev ?? {};
  const b = next ?? {};
  for (const id of elementIds) {
    if (a[id] !== b[id]) return true;
  }
  return false;
}
