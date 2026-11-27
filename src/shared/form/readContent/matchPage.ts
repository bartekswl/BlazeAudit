import { ANNUNCIATOR_DEVICE_TEST_TITLE } from '../annunciatorDeviceTest';
import { CONTROL_UNIT_TEST_INTRO } from '../controlUnitTest';
import { DATA_COMMUNICATION_LINK_FAULT_TOLERANCE_TITLE } from '../dataCommunicationLinkFaultTolerance';
import { DOCUMENTATION_INTRO } from '../documentation';
import { FIRE_SIGNAL_RECEIVING_CENTRE_INTERCONNECTION_TITLE } from '../fireSignalReceivingCentreInterconnection';
import { POWER_SUPPLY_INSPECTION_TITLE } from '../powerSupplyInspection';
import { PRINTER_TEST_TITLE } from '../printerTest';
import { REMOTE_TROUBLE_SIGNAL_UNIT_TEST_TITLE } from '../remoteTroubleSignalUnitTest';
import { SEQUENTIAL_DISPLAY_TEST_TITLE } from '../sequentialDisplayTest';
import { VOICE_COMMUNICATION_TEST_TITLE } from '../voiceCommunicationTest';
import type { FormDefinition, FormElement, FormPage } from '../types';
import { BLAZE_ONLY_MESSAGE, PAGE_UNCLEAR_MESSAGE, type OcrPage } from './ocrTypes';
import { pageText, phraseHits } from './text';

const KIND_PHRASES: Partial<Record<FormElement['kind'], readonly string[]>> = {
  documentation: [DOCUMENTATION_INTRO],
  controlUnitTest: [CONTROL_UNIT_TEST_INTRO],
  voiceCommunicationTest: [VOICE_COMMUNICATION_TEST_TITLE],
  powerSupplyInspection: [POWER_SUPPLY_INSPECTION_TITLE],
  annunciatorDeviceTest: [ANNUNCIATOR_DEVICE_TEST_TITLE],
  sequentialDisplayTest: [SEQUENTIAL_DISPLAY_TEST_TITLE],
  remoteTroubleSignalUnitTest: [REMOTE_TROUBLE_SIGNAL_UNIT_TEST_TITLE],
  printerTest: [PRINTER_TEST_TITLE],
  fireSignalReceivingCentreInterconnection: [FIRE_SIGNAL_RECEIVING_CENTRE_INTERCONNECTION_TITLE],
  dataCommunicationLinkFaultTolerance: [DATA_COMMUNICATION_LINK_FAULT_TOLERANCE_TITLE],
  emergencyLightingCover: [
    'This is to Certify that Emergency Lighting has been tested and inspected',
  ],
  individualDeviceRecord: ['23.2 Individual Device Record'],
  circuitFaultToleranceTestSheet: ['23.3 Circuit Fault Tolerance Test Sheet'],
  fireExtinguisherTestRecord: ['Fire Extinguisher Test Record'],
  emergencyLightingDeviceLegend: ['Device Legend'],
  emergencyLightingInspectionRecord: ['Inspection Record'],
};

export type PageMatch = {
  /** Pages in this document that share the matched printed headings. */
  pageIndexes: number[];
  /** Stable id so a later extra page of the same sheet still matches. */
  signature: string;
  label: string;
};

function templateMarkers(form: FormDefinition): string[] {
  const kinds = new Set<FormElement['kind']>();
  for (const page of form.pages) {
    for (const section of page.sections) {
      for (const element of section.elements) kinds.add(element.kind);
    }
  }
  if (kinds.has('ulcSection1') || kinds.has('individualDeviceRecord')) {
    return ['ANNUAL FIRE ALARM SYSTEM TEST AND INSPECTION', 'ULC 536'];
  }
  if (kinds.has('portableExtinguisherCover') || kinds.has('fireExtinguisherTestRecord')) {
    return ['Annual Portable Extinguishers Inspection Report'];
  }
  if (
    kinds.has('emergencyLightingCover') ||
    kinds.has('emergencyLightingInspectionRecord') ||
    kinds.has('emergencyLightingDeviceLegend')
  ) {
    return ['Emergency Lighting Inspection Report'];
  }
  if (kinds.has('sprinklerCover')) {
    return ['Annual Sprinkler Inspection Report'];
  }
  return [];
}

function phrasesForPage(page: FormPage, markers: readonly string[]): string[] {
  const phrases = [...markers];
  for (const section of page.sections) {
    if (section.heading) phrases.push(section.heading);
    if (section.title && section.title !== section.heading) phrases.push(section.title);
    for (const element of section.elements) {
      const extra = KIND_PHRASES[element.kind];
      if (extra) phrases.push(...extra);
    }
  }
  return [...new Set(phrases.map((phrase) => phrase.trim()).filter((phrase) => phrase.length >= 8))];
}

function signatureFor(phrases: readonly string[]): string {
  return [...phrases].sort().join('|');
}

/**
 * Which open-template page a scan is.
 * Repeatable copies share one signature. Anything that is not this template throws.
 */
export function matchTemplatePage(form: FormDefinition, page: OcrPage): PageMatch {
  const text = pageText(page.lines);
  const markers = templateMarkers(form);
  const groups = new Map<string, { indexes: number[]; phrases: string[]; hits: string[] }>();

  form.pages.forEach((formPage, index) => {
    const phrases = phrasesForPage(formPage, markers);
    if (phrases.length === 0) return;
    const signature = signatureFor(phrases);
    const existing = groups.get(signature);
    if (existing) {
      existing.indexes.push(index);
      return;
    }
    const hits = phrases.filter((phrase) => phraseHits(text, phrase));
    groups.set(signature, { indexes: [index], phrases, hits });
  });

  let best: { signature: string; indexes: number[]; hits: string[] } | null = null;
  let runnerUpHits = 0;
  for (const [signature, group] of groups) {
    if (group.hits.length === 0) continue;
    if (!best || group.hits.length > best.hits.length) {
      runnerUpHits = best?.hits.length ?? 0;
      best = { signature, indexes: group.indexes, hits: group.hits };
    } else if (group.hits.length === best.hits.length) {
      runnerUpHits = group.hits.length;
    } else if (group.hits.length > runnerUpHits) {
      runnerUpHits = group.hits.length;
    }
  }

  if (!best) {
    throw new Error(BLAZE_ONLY_MESSAGE);
  }
  if (runnerUpHits === best.hits.length) {
    throw new Error(PAGE_UNCLEAR_MESSAGE);
  }

  const label = best.hits.slice().sort((a, b) => b.length - a.length)[0] ?? 'page';
  return { pageIndexes: best.indexes, signature: best.signature, label };
}

export function pageIndexesForSignature(form: FormDefinition, signature: string): number[] {
  const indexes: number[] = [];
  const markers = templateMarkers(form);
  form.pages.forEach((formPage, index) => {
    if (signatureFor(phrasesForPage(formPage, markers)) === signature) indexes.push(index);
  });
  return indexes;
}
