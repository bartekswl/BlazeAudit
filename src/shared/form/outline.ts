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
  if (only?.kind === 'recommendations') return { label: 'Recommendations', depth: 1 };
  if (only?.kind === 'testingNotes') return { label: 'Testing Notes', depth: 1 };
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
