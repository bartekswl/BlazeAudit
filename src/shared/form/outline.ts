import type { FormDefinition } from './types';

export interface FormOutlineSection {
  id: string;
  label: string;
  pageIndex: number;
  pageLabel: string;
}

export function formSectionAnchorId(sectionId: string): string {
  return `form-section-${sectionId}`;
}

export function scrollToFormSection(sectionId: string): void {
  document.getElementById(formSectionAnchorId(sectionId))?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

export function buildFormOutline(form: FormDefinition): FormOutlineSection[] {
  const sections: FormOutlineSection[] = [];
  for (let pageIndex = 0; pageIndex < form.pages.length; pageIndex += 1) {
    const page = form.pages[pageIndex];
    const pageLabel = page.label ?? `Page ${pageIndex + 1}`;
    for (const section of page.sections) {
      sections.push({
        id: section.id,
        label: section.title ? `${section.number}. ${section.title}` : `${section.number}`,
        pageIndex,
        pageLabel,
      });
    }
  }
  return sections;
}
