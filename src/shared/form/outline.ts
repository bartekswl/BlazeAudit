import type { FormDefinition, FormSection } from './types';
import { formSectionHeading } from './layout';

export interface FormOutlineSection {
  id: string;
  label: string;
  pageIndex: number;
  pageLabel: string;
  /** 0 = top-level section; 1+ = indented child in Contents. */
  depth: number;
}

export function formSectionAnchorId(sectionId: string): string {
  return `form-section-${sectionId}`;
}

function outlineEntryForSection(section: FormSection): { label: string; depth: number } {
  const heading = formSectionHeading(section);
  if (heading) return { label: heading, depth: 0 };

  const only = section.elements.length === 1 ? section.elements[0] : null;
  if (only?.kind === 'yesNoSummary') return { label: 'Summary', depth: 1 };
  if (only?.kind === 'affirmation') return { label: 'Affirmation', depth: 1 };

  const title = section.title?.trim();
  if (title) return { label: title, depth: 0 };

  return { label: section.number != null ? `${section.number}` : section.id, depth: 0 };
}

export function scrollToFormSection(sectionId: string): void {
  const target = document.getElementById(formSectionAnchorId(sectionId));
  if (!target) return;

  const scrollRoot = target.closest('.form-page-viewport-scroll') as HTMLElement | null;
  if (scrollRoot) {
    const rootRect = scrollRoot.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const top = targetRect.top - rootRect.top + scrollRoot.scrollTop - 12;
    scrollRoot.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    return;
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function buildFormOutline(form: FormDefinition): FormOutlineSection[] {
  const sections: FormOutlineSection[] = [];
  for (let pageIndex = 0; pageIndex < form.pages.length; pageIndex += 1) {
    const page = form.pages[pageIndex];
    const pageLabel = page.label ?? `Page ${pageIndex + 1}`;
    for (const section of page.sections) {
      const entry = outlineEntryForSection(section);
      sections.push({
        id: section.id,
        label: entry.label,
        depth: entry.depth,
        pageIndex,
        pageLabel,
      });
    }
  }
  return sections;
}
