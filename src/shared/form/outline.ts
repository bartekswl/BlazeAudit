import type { FormDefinition, FormSection } from './types';
import { formSectionHeading } from './layout';

export interface FormOutlineSection {
  id: string;
  label: string;
  pageIndex: number;
  pageLabel: string;
  /** Secondary (unbold) styling — Summary, Affirmation, and similar child rows. */
  subdued: boolean;
  /** Extra left padding added to the Contents row (e.g. `2ch`, `12px`). */
  indentExtra: string;
}

/** Small indent for numbered subsections (22.1.) — bold, same weight as chapters. */
export const FORM_OUTLINE_SUBSECTION_INDENT = '0.75ch';

/** Indent for unnumbered child rows (Summary, Affirmation, Technician's Testing Notes). */
export const FORM_OUTLINE_CHILD_INDENT = '2ch';

export function formSectionAnchorId(sectionId: string): string {
  return `form-section-${sectionId}`;
}

function outlineEntryForSection(section: FormSection): { label: string; depth: number } {
  const heading = formSectionHeading(section);
  if (heading) return { label: heading, depth: 0 };

  const only = section.elements.length === 1 ? section.elements[0] : null;
  if (only?.kind === 'yesNoSummary') return { label: 'Summary', depth: 1 };
  if (only?.kind === 'affirmation') return { label: 'Affirmation', depth: 1 };
  if (only?.kind === 'recommendations') return { label: 'Recommendations', depth: 1 };
  if (only?.kind === 'testingNotes')
    return { label: "Technician's Testing Notes", depth: 1 };
  if (only?.kind === 'attendanceLog') return { label: 'Attendance Log', depth: 1 };
  if (only?.kind === 'documentation') return { label: 'Documentation', depth: 1 };
  if (only?.kind === 'controlUnitTest') return { label: 'Control Unit Test', depth: 1 };
  if (only?.kind === 'controlUnitRecord') return { label: 'Control Unit Record', depth: 1 };
  if (only?.kind === 'voiceCommunicationTest') return { label: 'Voice Communication Test', depth: 1 };
  if (only?.kind === 'powerSupplyInspection') return { label: 'Power Supply Inspection', depth: 1 };
  if (only?.kind === 'emergencyPowerSupplyTest') return { label: 'Emergency Power Supply Test', depth: 1 };
  if (only?.kind === 'annunciatorDeviceTest') return { label: 'Annunciator Device Test', depth: 1 };
  if (only?.kind === 'sequentialDisplayTest') return { label: 'Sequential Display Test', depth: 1 };
  if (only?.kind === 'remoteTroubleSignalUnitTest') return { label: 'Remote Trouble Signal Unit Test', depth: 1 };
  if (only?.kind === 'printerTest') return { label: 'Printer Test', depth: 1 };
  if (only?.kind === 'ancillaryDeviceCircuitTest') return { label: 'Ancillary Device Circuit Test', depth: 1 };
  if (only?.kind === 'fireSignalReceivingCentreInterconnection')
    return { label: 'Fire Signal Receiving Centre Interconnection', depth: 1 };
  if (only?.kind === 'dataCommunicationLinkFaultTolerance')
    return { label: 'Operation Test Circuit Fault Tolerance', depth: 1 };
  if (only?.kind === 'fieldDeviceTestingLegend')
    return { label: 'Field Device Testing - Legend and Notes', depth: 1 };
  if (only?.kind === 'fieldDeviceTestingNotes') return { label: 'Testing Notes', depth: 1 };
  if (only?.kind === 'individualDeviceRecord')
    return { label: 'Individual Device Record', depth: 1 };
  if (only?.kind === 'circuitFaultToleranceTestSheet')
    return { label: 'Circuit Fault Tolerance Test Sheet', depth: 1 };

  const title = section.title?.trim();
  if (title) return { label: title, depth: 0 };

  return { label: section.number != null ? `${section.number}` : section.id, depth: 0 };
}

/** Contents labels: leading section numbers get a trailing period (e.g. 22.1 → 22.1.). */
export function formatOutlineSectionLabel(label: string): string {
  const match = label.match(/^(\d+(?:\.\d+)*)(\s+)(.+)$/);
  if (!match) return label;
  const [, number, space, rest] = match;
  if (number.endsWith('.')) return label;
  return `${number}.${space}${rest}`;
}

/** True when the label is a numbered subsection (e.g. 21.1., 20.2.) — not a top-level chapter (21., 22.). */
export function isOutlineSubSectionLabel(label: string): boolean {
  return /^\d+\.\d+(?:\.\d+)*\.\s/.test(label);
}

function resolveOutlinePresentation(
  label: string,
  entryDepth: number,
): Pick<FormOutlineSection, 'subdued' | 'indentExtra'> {
  if (entryDepth > 0) {
    return { subdued: true, indentExtra: FORM_OUTLINE_CHILD_INDENT };
  }
  if (isOutlineSubSectionLabel(label)) {
    return { subdued: false, indentExtra: FORM_OUTLINE_SUBSECTION_INDENT };
  }
  return { subdued: false, indentExtra: '0' };
}

function formatOutlinePageLabel(startPageIndex: number, endPageIndex: number): string {
  const start = startPageIndex + 1;
  const end = endPageIndex + 1;
  return start === end ? `Page ${start}` : `Page ${start}-${end}`;
}

/** Collapse consecutive duplicate sections (same label + presentation) into one row with a page range. */
function mergeConsecutiveOutlineSections(sections: FormOutlineSection[]): FormOutlineSection[] {
  if (sections.length === 0) return sections;

  const merged: FormOutlineSection[] = [];
  let runStart = 0;

  const flushRun = (runEnd: number) => {
    const first = sections[runStart];
    const last = sections[runEnd];
    merged.push({
      ...first,
      pageLabel: formatOutlinePageLabel(first.pageIndex, last.pageIndex),
    });
  };

  for (let i = 1; i <= sections.length; i += 1) {
    const prev = sections[i - 1];
    const next = sections[i];
    const continuesRun =
      next != null &&
      next.label === prev.label &&
      next.subdued === prev.subdued &&
      next.indentExtra === prev.indentExtra &&
      next.pageIndex === prev.pageIndex + 1;

    if (!continuesRun) {
      flushRun(i - 1);
      runStart = i;
    }
  }

  return merged;
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
      const label = formatOutlineSectionLabel(entry.label);
      const presentation = resolveOutlinePresentation(label, entry.depth);
      sections.push({
        id: section.id,
        label,
        subdued: presentation.subdued,
        indentExtra: presentation.indentExtra,
        pageIndex,
        pageLabel,
      });
    }
  }
  return mergeConsecutiveOutlineSections(sections);
}
