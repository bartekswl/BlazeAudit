import {
  emptyAncillaryDeviceCircuitTestValue,
  normalizeAncillaryDeviceCircuitTestValue,
} from './ancillaryDeviceCircuitTest';
import {
  emptyAnnunciatorDeviceTestValue,
  normalizeAnnunciatorDeviceTestValue,
} from './annunciatorDeviceTest';
import { emptyDeficienciesValue, normalizeDeficienciesValue } from './deficiencies';
import {
  emptyEmergencyPowerSupplyTestValue,
  normalizeEmergencyPowerSupplyTestValue,
} from './emergencyPowerSupplyTest';
import {
  elementIdsOnPage,
  pageIndicesWhere,
  renumberFormPageLabels,
  resolveExtraPageControls,
  sequenceIndexInRun,
  type FormExtraPageControls,
} from './formExtraPages';
import {
  emptyPowerSupplyInspectionValue,
  normalizePowerSupplyInspectionValue,
} from './powerSupplyInspection';
import {
  emptySequentialDisplayTestValue,
  normalizeSequentialDisplayTestValue,
} from './sequentialDisplayTest';
import { setElementValue } from './values';
import type {
  FormDefinition,
  FormElement,
  FormInspectionDocument,
  FormPage,
  FormSection,
} from './types';

/** One of each kind — extras may be removed; the seed page must remain. */
export const REPEATABLE_FORM_MIN_PAGES = 1;

export type RepeatableFormPageKind =
  | 'powerSupplies'
  | 'annunciatorPair'
  | 'deficiencies'
  | 'ancillaryDeviceCircuitTest';

function pageHasKind(page: FormPage, kind: FormElement['kind']): boolean {
  return page.sections.some((section) =>
    section.elements.some((element) => element.kind === kind),
  );
}

export function pageIsPowerSuppliesPair(page: FormPage): boolean {
  return (
    pageHasKind(page, 'powerSupplyInspection') &&
    pageHasKind(page, 'emergencyPowerSupplyTest')
  );
}

export function pageIsAnnunciatorPair(page: FormPage): boolean {
  return (
    pageHasKind(page, 'annunciatorDeviceTest') &&
    pageHasKind(page, 'sequentialDisplayTest')
  );
}

export function pageIsDeficiencies(page: FormPage): boolean {
  return pageHasKind(page, 'deficiencies');
}

export function pageIsAncillaryDeviceCircuitTest(page: FormPage): boolean {
  return pageHasKind(page, 'ancillaryDeviceCircuitTest');
}

function predicateForKind(kind: RepeatableFormPageKind): (page: FormPage) => boolean {
  switch (kind) {
    case 'powerSupplies':
      return pageIsPowerSuppliesPair;
    case 'annunciatorPair':
      return pageIsAnnunciatorPair;
    case 'deficiencies':
      return pageIsDeficiencies;
    case 'ancillaryDeviceCircuitTest':
      return pageIsAncillaryDeviceCircuitTest;
  }
}

export function getRepeatablePageIndices(
  form: FormDefinition,
  kind: RepeatableFormPageKind,
): number[] {
  return pageIndicesWhere(form, predicateForKind(kind));
}

export function repeatablePageSequenceIndex(
  form: FormDefinition,
  kind: RepeatableFormPageKind,
  pageIndex: number,
): number | null {
  return sequenceIndexInRun(form, pageIndex, predicateForKind(kind));
}

export function repeatablePageControls(
  form: FormDefinition,
  kind: RepeatableFormPageKind,
  pageIndex: number,
): FormExtraPageControls {
  return resolveExtraPageControls(
    repeatablePageSequenceIndex(form, kind, pageIndex),
    REPEATABLE_FORM_MIN_PAGES,
  );
}

/** First matching repeatable kind for this page, or null. */
export function resolveRepeatableFormPageKind(
  form: FormDefinition,
  pageIndex: number,
): RepeatableFormPageKind | null {
  const page = form.pages[pageIndex];
  if (!page) return null;
  if (pageIsPowerSuppliesPair(page)) return 'powerSupplies';
  if (pageIsAnnunciatorPair(page)) return 'annunciatorPair';
  if (pageIsDeficiencies(page)) return 'deficiencies';
  if (pageIsAncillaryDeviceCircuitTest(page)) return 'ancillaryDeviceCircuitTest';
  return null;
}

export function repeatablePageControlsForIndex(
  form: FormDefinition,
  pageIndex: number,
): FormExtraPageControls {
  const kind = resolveRepeatableFormPageKind(form, pageIndex);
  if (!kind) return 'none';
  return repeatablePageControls(form, kind, pageIndex);
}

function collectUsedIds(form: FormDefinition): {
  pageIds: Set<string>;
  sectionIds: Set<string>;
  elementIds: Set<string>;
} {
  const pageIds = new Set(form.pages.map((page) => page.id));
  const sectionIds = new Set<string>();
  const elementIds = new Set<string>();
  for (const page of form.pages) {
    for (const section of page.sections) {
      sectionIds.add(section.id);
      for (const element of section.elements) {
        elementIds.add(element.id);
      }
    }
  }
  return { pageIds, sectionIds, elementIds };
}

function nextSuffix(
  form: FormDefinition,
  pagePrefix: string,
  elementIdCandidates: (n: number) => string[],
): number {
  const { pageIds, elementIds } = collectUsedIds(form);
  let n = 2;
  while (
    pageIds.has(`${pagePrefix}-${n}`) ||
    elementIdCandidates(n).some((id) => elementIds.has(id))
  ) {
    n += 1;
  }
  return n;
}

function section(
  id: string,
  heading: string,
  element: FormElement,
): FormSection {
  return { id, heading, elements: [element] };
}

function createPowerSuppliesPage(form: FormDefinition): FormPage {
  const n = nextSuffix(form, 'page-power-supplies', (suffix) => [
    `power-supply-inspection-${suffix}`,
    `emergency-power-supply-test-${suffix}`,
  ]);
  return {
    id: `page-power-supplies-${n}`,
    label: '',
    header: 'codeNameMeta',
    regions: [],
    sections: [
      section(`section-power-supply-inspection-${n}`, '22.4 Power Supply Inspection', {
        kind: 'powerSupplyInspection',
        id: `power-supply-inspection-${n}`,
      }),
      section(
        `section-emergency-power-supply-test-${n}`,
        '22.5 Emergency Power Supply Test and Inspection',
        {
          kind: 'emergencyPowerSupplyTest',
          id: `emergency-power-supply-test-${n}`,
        },
      ),
    ],
  };
}

function createAnnunciatorPairPage(form: FormDefinition): FormPage {
  const n = nextSuffix(form, 'page-annunciator-pair', (suffix) => [
    `annunciator-device-test-${suffix}`,
    `sequential-display-test-${suffix}`,
  ]);
  return {
    id: `page-annunciator-pair-${n}`,
    label: '',
    header: 'codeNameMeta',
    regions: [],
    sections: [
      section(
        `section-annunciator-device-test-${n}`,
        '22.6 Annunciator, Remote Trouble Signal Unit, Display & Control Centre Test and Inspection',
        {
          kind: 'annunciatorDeviceTest',
          id: `annunciator-device-test-${n}`,
        },
      ),
      section(`section-sequential-display-test-${n}`, '22.7 Annunciators or Sequential Displays', {
        kind: 'sequentialDisplayTest',
        id: `sequential-display-test-${n}`,
      }),
    ],
  };
}

function createDeficienciesPage(form: FormDefinition): FormPage {
  const n = nextSuffix(form, 'page-deficiencies', (suffix) => [`deficiencies-table-${suffix}`]);
  return {
    id: `page-deficiencies-${n}`,
    label: '',
    orientation: 'landscape',
    header: 'codeNameMeta',
    regions: [],
    sections: [
      section(`section-deficiencies-${n}`, '20.2 Deficiencies', {
        kind: 'deficiencies',
        id: `deficiencies-table-${n}`,
      }),
    ],
  };
}

function createAncillaryDeviceCircuitTestPage(form: FormDefinition): FormPage {
  const n = nextSuffix(form, 'page-adc', (suffix) => [`ancillary-device-circuit-test-${suffix}`]);
  return {
    id: `page-adc-${n}`,
    label: '',
    header: 'codeNameMeta',
    regions: [],
    sections: [
      section(`section-ancillary-device-circuit-test-${n}`, '22.10 Ancillary Device Circuit Test', {
        kind: 'ancillaryDeviceCircuitTest',
        id: `ancillary-device-circuit-test-${n}`,
      }),
    ],
  };
}

function createPageForKind(form: FormDefinition, kind: RepeatableFormPageKind): FormPage {
  switch (kind) {
    case 'powerSupplies':
      return createPowerSuppliesPage(form);
    case 'annunciatorPair':
      return createAnnunciatorPairPage(form);
    case 'deficiencies':
      return createDeficienciesPage(form);
    case 'ancillaryDeviceCircuitTest':
      return createAncillaryDeviceCircuitTestPage(form);
  }
}

function initValuesForPage(
  values: Record<string, unknown>,
  page: FormPage,
): Record<string, unknown> {
  let next = values;
  for (const section of page.sections) {
    for (const element of section.elements) {
      switch (element.kind) {
        case 'powerSupplyInspection':
          next = setElementValue(next, element.id, emptyPowerSupplyInspectionValue());
          break;
        case 'emergencyPowerSupplyTest':
          next = setElementValue(next, element.id, emptyEmergencyPowerSupplyTestValue());
          break;
        case 'annunciatorDeviceTest':
          next = setElementValue(next, element.id, emptyAnnunciatorDeviceTestValue());
          break;
        case 'sequentialDisplayTest':
          next = setElementValue(next, element.id, emptySequentialDisplayTestValue());
          break;
        case 'deficiencies':
          next = setElementValue(next, element.id, emptyDeficienciesValue());
          break;
        case 'ancillaryDeviceCircuitTest':
          next = setElementValue(next, element.id, emptyAncillaryDeviceCircuitTestValue());
          break;
        default:
          break;
      }
    }
  }
  return next;
}

function checklistHasChoice(checklist: Record<string, { choice: string | null }>): boolean {
  return Object.values(checklist).some((row) => row.choice != null);
}

function powerSupplyInspectionHasContent(raw: unknown): boolean {
  const data = normalizePowerSupplyInspectionValue(raw);
  return (
    data.fieldLocation.trim() !== '' ||
    data.identification.trim() !== '' ||
    data.disconnectLocation.trim() !== '' ||
    data.breakerIdentification.trim() !== '' ||
    checklistHasChoice(data.checklist)
  );
}

function emergencyPowerSupplyTestHasContent(raw: unknown): boolean {
  const data = normalizeEmergencyPowerSupplyTestValue(raw);
  if (
    data.fieldLocation.trim() !== '' ||
    data.identification.trim() !== '' ||
    data.batteryCapacity.trim() !== '' ||
    data.dateCode.trim() !== '' ||
    data.nbcAlarmTime != null ||
    checklistHasChoice(data.checklist)
  ) {
    return true;
  }
  if (Object.values(data.providedBy).some(Boolean)) return true;
  if (Object.values(data.batteryType).some(Boolean)) return true;
  if (Object.values(data.measures).some((m) => m.voltage.trim() || m.current.trim())) return true;
  if (Object.values(data.valueFills).some((v) => v.trim())) return true;
  if (data.testType.i != null || data.testType.ii != null || data.testType.iii != null) return true;
  if (data.testType.specify.trim()) return true;
  return false;
}

function annunciatorDeviceTestHasContent(raw: unknown): boolean {
  const data = normalizeAnnunciatorDeviceTestValue(raw);
  if (data.sectionNotApplicable) return true;
  if (data.fieldLocation.trim() || data.identification.trim()) return true;
  return Object.values(data.checklist).some((row) => row.choice != null);
}

function sequentialDisplayTestHasContent(raw: unknown): boolean {
  const data = normalizeSequentialDisplayTestValue(raw);
  if (data.sectionNotApplicable) return true;
  if (data.fieldLocation.trim() || data.identification.trim()) return true;
  return Object.values(data.checklist).some((row) => row.choice != null);
}

function deficienciesHasContent(raw: unknown): boolean {
  const data = normalizeDeficienciesValue(raw);
  if (
    data.compliancePrintedName.trim() ||
    data.complianceSignature.trim() ||
    data.complianceDateMm.trim() ||
    data.complianceDateDd.trim() ||
    data.complianceDateYy.trim()
  ) {
    return true;
  }
  for (const row of data.deviceRows) {
    if (
      row.itemNumber.trim() ||
      row.deviceType.trim() ||
      row.deviceLocation.trim() ||
      row.deficiency.trim() ||
      row.ulcClause.trim() ||
      row.repair.dateCorrected.trim() ||
      row.repair.workOrder.trim() ||
      row.repair.serviceProvider.trim() ||
      row.repair.technician.trim()
    ) {
      return true;
    }
  }
  for (const row of data.controlRows) {
    if (
      row.itemNumber.trim() ||
      row.controlFunction.trim() ||
      row.deficiency.trim() ||
      row.ulcClause.trim() ||
      row.repair.dateCorrected.trim() ||
      row.repair.workOrder.trim() ||
      row.repair.serviceProvider.trim() ||
      row.repair.technician.trim()
    ) {
      return true;
    }
  }
  return false;
}

function ancillaryDeviceCircuitTestHasContent(raw: unknown): boolean {
  const data = normalizeAncillaryDeviceCircuitTestValue(raw);
  return data.rows.some(
    (row) =>
      row.identify.trim() !== '' ||
      row.poweredByFacu ||
      row.poweredByOther.trim() !== '' ||
      row.operationConfirmed != null ||
      row.confirmationMethod.trim() !== '',
  );
}

export function repeatablePageHasContent(
  document: FormInspectionDocument,
  pageIndex: number,
): boolean {
  const page = document.form.pages[pageIndex];
  if (!page) return false;

  for (const section of page.sections) {
    for (const element of section.elements) {
      const value = document.values[element.id];
      switch (element.kind) {
        case 'powerSupplyInspection':
          if (powerSupplyInspectionHasContent(value)) return true;
          break;
        case 'emergencyPowerSupplyTest':
          if (emergencyPowerSupplyTestHasContent(value)) return true;
          break;
        case 'annunciatorDeviceTest':
          if (annunciatorDeviceTestHasContent(value)) return true;
          break;
        case 'sequentialDisplayTest':
          if (sequentialDisplayTestHasContent(value)) return true;
          break;
        case 'deficiencies':
          if (deficienciesHasContent(value)) return true;
          break;
        case 'ancillaryDeviceCircuitTest':
          if (ancillaryDeviceCircuitTestHasContent(value)) return true;
          break;
        default:
          break;
      }
    }
  }
  return false;
}

export const REPEATABLE_PAGE_LABELS: Record<
  RepeatableFormPageKind,
  { short: string; addTooltip: string; removeTooltip: string; removeTitle: string }
> = {
  powerSupplies: {
    short: '22.4 / 22.5',
    addTooltip:
      'Add another page with 22.4 Power Supply Inspection and 22.5 Emergency Power Supply Test after this one. The new page starts empty.',
    removeTooltip:
      'Remove this 22.4 / 22.5 page from the inspection. At least one such page must remain.',
    removeTitle: 'Remove 22.4 / 22.5 page?',
  },
  annunciatorPair: {
    short: '22.6 / 22.7',
    addTooltip:
      'Add another page with 22.6 Annunciator Device Test and 22.7 Sequential Displays after this one. The new page starts empty.',
    removeTooltip:
      'Remove this 22.6 / 22.7 page from the inspection. At least one such page must remain.',
    removeTitle: 'Remove 22.6 / 22.7 page?',
  },
  deficiencies: {
    short: '20.2',
    addTooltip:
      'Add another 20.2 Deficiencies page after this one. The new page starts empty.',
    removeTooltip:
      'Remove this 20.2 Deficiencies page from the inspection. At least one Deficiencies page must remain.',
    removeTitle: 'Remove 20.2 Deficiencies page?',
  },
  ancillaryDeviceCircuitTest: {
    short: '22.10',
    addTooltip:
      'Add another 22.10 Ancillary Device Circuit Test page after this one. The new page starts empty.',
    removeTooltip:
      'Remove this 22.10 page from the inspection. At least one such page must remain.',
    removeTitle: 'Remove 22.10 page?',
  },
};

/** Insert a new empty page of the same repeatable kind after `afterPageIndex`. */
export function addRepeatableFormPage(
  document: FormInspectionDocument,
  afterPageIndex: number,
): FormInspectionDocument {
  const kind = resolveRepeatableFormPageKind(document.form, afterPageIndex);
  if (!kind) return document;

  const newPage = createPageForKind(document.form, kind);
  const pages = [...document.form.pages];
  pages.splice(afterPageIndex + 1, 0, newPage);

  return {
    ...document,
    form: renumberFormPageLabels({ ...document.form, pages }),
    values: initValuesForPage(document.values, newPage),
  };
}

/** Remove a repeatable page when above the minimum and not the first sheet of that run. */
export function removeRepeatableFormPage(
  document: FormInspectionDocument,
  pageIndex: number,
): FormInspectionDocument {
  const kind = resolveRepeatableFormPageKind(document.form, pageIndex);
  if (!kind) return document;

  const indices = getRepeatablePageIndices(document.form, kind);
  if (indices.length <= REPEATABLE_FORM_MIN_PAGES) return document;

  const sequenceIndex = repeatablePageSequenceIndex(document.form, kind, pageIndex);
  if (sequenceIndex == null || sequenceIndex < REPEATABLE_FORM_MIN_PAGES) return document;

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
