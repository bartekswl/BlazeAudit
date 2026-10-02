import { renumberFormPageLabels } from './formExtraPages';
import type { FormDefinition, FormInspectionDocument, FormPage, FormSection } from './types';

function sectionHasKind(section: FormSection, kind: string): boolean {
  return section.elements.some((element) => element.kind === kind);
}

function isLegendSection(section: FormSection): boolean {
  return sectionHasKind(section, 'emergencyLightingDeviceLegend');
}

function isLinedNotesSection(section: FormSection): boolean {
  return sectionHasKind(section, 'recommendations') || sectionHasKind(section, 'testingNotes');
}

function stripHeightPercent(section: FormSection): FormSection {
  if (section.heightPercent == null) return section;
  const { heightPercent: _removed, ...rest } = section;
  return rest;
}

function uniquePageId(form: FormDefinition, base: string): string {
  const ids = new Set(form.pages.map((page) => page.id));
  if (!ids.has(base)) return base;
  let n = 2;
  while (ids.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/**
 * Emergency lighting: move Device Legend off the Comments / Recommendations page onto
 * its own page right after it, and let the two lined-notes panels split that page evenly.
 * Idempotent — a legend already alone on its page is left as-is.
 */
export function migrateEmergencyLightingLegendPage(form: FormDefinition): FormDefinition {
  const pageIndex = form.pages.findIndex(
    (page) =>
      page.sections.some(isLegendSection) &&
      page.sections.some((section) => !isLegendSection(section)),
  );
  if (pageIndex < 0) return form;

  const page = form.pages[pageIndex]!;
  const legendSections = page.sections.filter(isLegendSection).map(stripHeightPercent);
  const remaining = page.sections
    .filter((section) => !isLegendSection(section))
    .map((section) => (isLinedNotesSection(section) ? stripHeightPercent(section) : section));

  const legendPage: FormPage = {
    id: uniquePageId(form, 'page-device-legend'),
    label: '',
    header: 'codeNameMeta',
    regions: [],
    sections: legendSections,
  };

  const pages = [...form.pages];
  pages.splice(pageIndex, 1, { ...page, sections: remaining }, legendPage);
  return renumberFormPageLabels({ ...form, pages });
}

export function migrateFormInspectionEmergencyLightingLegendPage(
  document: FormInspectionDocument,
): FormInspectionDocument {
  const form = migrateEmergencyLightingLegendPage(document.form);
  if (form === document.form) return document;
  return { ...document, form };
}
