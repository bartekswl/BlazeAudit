import type {
  FormDefinition,
  FormInspectionDocument,
  FormPage,
  FormSection,
} from './types';

function sectionHasKind(section: FormSection, kind: string): boolean {
  return section.elements.some((element) => element.kind === kind);
}

function pageHasKind(page: FormPage, kind: string): boolean {
  return page.sections.some((section) => sectionHasKind(section, kind));
}

function stripHeightPercent(section: FormSection): FormSection {
  if (section.heightPercent == null) return section;
  const { heightPercent: _removed, ...rest } = section;
  return rest;
}

/**
 * Move 22.4 (powerSupplyInspection) off the 22.3 page onto the 22.5 page so both
 * power-supply sections share one sheet. Idempotent for already-migrated forms.
 */
export function migratePowerSupplyPageLayout(form: FormDefinition): FormDefinition {
  const alreadyCombined = form.pages.some(
    (page) =>
      pageHasKind(page, 'powerSupplyInspection') &&
      pageHasKind(page, 'emergencyPowerSupplyTest'),
  );
  if (alreadyCombined) {
    // Still drop legacy full-page heightPercent on EPST when sharing a page.
    let touched = false;
    const pages = form.pages.map((page) => {
      if (
        !(
          pageHasKind(page, 'powerSupplyInspection') &&
          pageHasKind(page, 'emergencyPowerSupplyTest')
        )
      ) {
        return page;
      }
      const sections = page.sections.map((section) => {
        if (!sectionHasKind(section, 'emergencyPowerSupplyTest')) return section;
        const next = stripHeightPercent(section);
        if (next !== section) touched = true;
        return next;
      });
      return touched ? { ...page, sections } : page;
    });
    return touched ? { ...form, pages } : form;
  }

  let psiSection: FormSection | null = null;
  const pagesWithoutPsi: FormPage[] = [];

  for (const page of form.pages) {
    const psiIndex = page.sections.findIndex((section) =>
      sectionHasKind(section, 'powerSupplyInspection'),
    );
    const sharesWithVoice =
      psiIndex >= 0 && pageHasKind(page, 'voiceCommunicationTest');

    if (!sharesWithVoice) {
      pagesWithoutPsi.push(page);
      continue;
    }

    psiSection = page.sections[psiIndex] ?? null;
    pagesWithoutPsi.push({
      ...page,
      sections: page.sections.filter((_, index) => index !== psiIndex),
    });
  }

  if (!psiSection) return form;

  let inserted = false;
  const pages = pagesWithoutPsi.map((page) => {
    if (inserted || !pageHasKind(page, 'emergencyPowerSupplyTest')) return page;
    if (pageHasKind(page, 'powerSupplyInspection')) return page;

    inserted = true;
    const sections = [
      psiSection!,
      ...page.sections.map((section) =>
        sectionHasKind(section, 'emergencyPowerSupplyTest')
          ? stripHeightPercent(section)
          : section,
      ),
    ];
    return { ...page, sections };
  });

  if (!inserted) {
    // EPST page missing — put PSI back where it was by returning original.
    return form;
  }

  return { ...form, pages };
}

export function migrateFormInspectionPowerSupplyLayout(
  document: FormInspectionDocument,
): FormInspectionDocument {
  const form = migratePowerSupplyPageLayout(document.form);
  if (form === document.form) return document;
  return { ...document, form };
}
