import { walkFormElements } from './layout';
import {
  emptyIndividualDeviceRecordValue,
  individualDeviceRecordHasContent,
} from './individualDeviceRecord';
import { setElementValue } from './values';
import type { FormDefinition, FormInspectionDocument, FormPage } from './types';

/** Minimum 23.2 Individual Device Record pages in a document inspection. */
export const INDIVIDUAL_DEVICE_RECORD_MIN_PAGES = 3;

export type IndividualDeviceRecordPageControls = 'none' | 'add-only' | 'add-remove';

export function pageHasIndividualDeviceRecord(page: FormPage): boolean {
  return page.sections.some((section) =>
    section.elements.some((element) => element.kind === 'individualDeviceRecord'),
  );
}

export function getIndividualDeviceRecordPageIndices(form: FormDefinition): number[] {
  return form.pages
    .map((page, index) => (pageHasIndividualDeviceRecord(page) ? index : -1))
    .filter((index) => index >= 0);
}

/** 0-based index within the consecutive 23.2 page run, or null if not an IDR page. */
export function individualDeviceRecordSequenceIndex(
  form: FormDefinition,
  pageIndex: number,
): number | null {
  const indices = getIndividualDeviceRecordPageIndices(form);
  const sequenceIndex = indices.indexOf(pageIndex);
  return sequenceIndex === -1 ? null : sequenceIndex;
}

export function individualDeviceRecordPageControls(
  form: FormDefinition,
  pageIndex: number,
): IndividualDeviceRecordPageControls {
  const sequenceIndex = individualDeviceRecordSequenceIndex(form, pageIndex);
  if (sequenceIndex == null || sequenceIndex < 2) return 'none';
  if (sequenceIndex === 2) return 'add-only';
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

function collectIndividualDeviceRecordElementIds(form: FormDefinition): Set<string> {
  const ids = new Set<string>();
  walkFormElements(form, (element) => {
    if (element.kind === 'individualDeviceRecord') ids.add(element.id);
  });
  return ids;
}

function nextIndividualDeviceRecordIds(form: FormDefinition): {
  pageId: string;
  sectionId: string;
  elementId: string;
} {
  const usedPageIds = new Set(form.pages.map((page) => page.id));
  const usedElementIds = collectIndividualDeviceRecordElementIds(form);

  let n = 22;
  while (
    usedPageIds.has(`page-idr-${n}`) ||
    usedElementIds.has(`individual-device-record-${n}`)
  ) {
    n += 1;
  }

  const suffix = String(n);
  return {
    pageId: `page-idr-${suffix}`,
    sectionId: `section-individual-device-record-${suffix}`,
    elementId: `individual-device-record-${suffix}`,
  };
}

export function createIndividualDeviceRecordPage(form: FormDefinition): FormPage {
  const { pageId, sectionId, elementId } = nextIndividualDeviceRecordIds(form);

  return {
    id: pageId,
    label: '',
    orientation: 'landscape',
    header: 'codeNameMeta',
    regions: [],
    sections: [
      {
        id: sectionId,
        heading: '23.2 Individual Device Record',
        elements: [
          {
            kind: 'individualDeviceRecord',
            id: elementId,
          },
        ],
      },
    ],
  };
}

function elementIdsOnPage(page: FormPage): string[] {
  return page.sections.flatMap((section) => section.elements.map((element) => element.id));
}

export function getIndividualDeviceRecordElementId(page: FormPage): string | null {
  for (const section of page.sections) {
    for (const element of section.elements) {
      if (element.kind === 'individualDeviceRecord') return element.id;
    }
  }
  return null;
}

export function individualDeviceRecordPageHasContent(
  document: FormInspectionDocument,
  pageIndex: number,
): boolean {
  const page = document.form.pages[pageIndex];
  if (!page) return false;
  const elementId = getIndividualDeviceRecordElementId(page);
  if (!elementId) return false;
  return individualDeviceRecordHasContent(document.values[elementId]);
}

/** Insert a new 23.2 page immediately after `afterPageIndex`. */
export function addIndividualDeviceRecordPage(
  document: FormInspectionDocument,
  afterPageIndex: number,
): FormInspectionDocument {
  const idrIndices = getIndividualDeviceRecordPageIndices(document.form);
  if (!idrIndices.includes(afterPageIndex)) return document;

  const newPage = createIndividualDeviceRecordPage(document.form);
  const pages = [...document.form.pages];
  pages.splice(afterPageIndex + 1, 0, newPage);

  const elementId = newPage.sections[0]?.elements[0]?.id;
  if (!elementId || newPage.sections[0]?.elements[0]?.kind !== 'individualDeviceRecord') {
    return document;
  }

  return {
    ...document,
    form: renumberFormPageLabels({ ...document.form, pages }),
    values: setElementValue(document.values, elementId, emptyIndividualDeviceRecordValue()),
  };
}

/** Remove the 23.2 page at `pageIndex` when above the minimum and not one of the first three sheets. */
export function removeIndividualDeviceRecordPage(
  document: FormInspectionDocument,
  pageIndex: number,
): FormInspectionDocument {
  const idrIndices = getIndividualDeviceRecordPageIndices(document.form);
  if (idrIndices.length <= INDIVIDUAL_DEVICE_RECORD_MIN_PAGES) return document;

  const sequenceIndex = individualDeviceRecordSequenceIndex(document.form, pageIndex);
  if (sequenceIndex == null || sequenceIndex < 3) return document;

  const page = document.form.pages[pageIndex];
  if (!page) return document;

  const removedElementIds = new Set(elementIdsOnPage(page));
  const pages = document.form.pages.filter((_, index) => index !== pageIndex);
  const values = { ...document.values };
  for (const elementId of removedElementIds) {
    delete values[elementId];
  }

  return {
    ...document,
    form: renumberFormPageLabels({ ...document.form, pages }),
    values,
  };
}
