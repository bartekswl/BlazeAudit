import type { FormDefinition, FormElement, FormPage, FormSection } from './types';

export const FORM_FOOTER_HEIGHT_PERCENT = 5;

export function countFormElements(form: FormDefinition): number {
  let count = 0;
  for (const page of form.pages) {
    for (const section of page.sections) {
      count += section.elements.length;
    }
  }
  return count;
}

export function countFormPages(form: FormDefinition): number {
  return form.pages.length;
}

export function pageBodyPercent(_page?: FormPage): number {
  return 100 - FORM_FOOTER_HEIGHT_PERCENT;
}

export function pageRegionPercentTotal(page: FormPage): number {
  return page.regions.reduce((sum, region) => sum + region.heightPercent, 0);
}

export function pageSectionPercentTotal(page: FormPage): number {
  return page.sections.reduce((sum, section) => sum + (section.heightPercent ?? 0), 0);
}

export function validatePagePercentBudget(page: FormPage): string | null {
  const body = pageBodyPercent(page);
  const regions = pageRegionPercentTotal(page);
  const sections = pageSectionPercentTotal(page);
  const total = regions + sections;
  if (total > body + 0.01) {
    return `Page "${page.label ?? page.id}" regions (${regions}%) + sections (${sections}%) exceed body budget (${body}%).`;
  }
  return null;
}

export function walkFormElements(
  form: FormDefinition,
  visit: (element: FormElement, section: FormSection, page: FormPage) => void,
): void {
  for (const page of form.pages) {
    for (const section of page.sections) {
      for (const element of section.elements) {
        visit(element, section, page);
      }
    }
  }
}

export function formSectionHeading(section: FormSection): string | null {
  const heading = section.heading?.trim();
  if (heading) return heading;
  const title = section.title?.trim();
  if (title) return `${section.number ?? ''}. ${title}`.replace(/^\.\s*/, '');
  return null;
}
