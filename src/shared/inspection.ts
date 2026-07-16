// Inspection domain types (see DATA_MODEL.md §1 inspections).

import type { Cadence } from './cadence';
import type { TemplateKind } from './document';
import type { InspectionDocument } from './form';

export type InspectionStatus = 'draft' | 'complete';

export interface Inspection {
  id: string;
  clientId: string;
  clientName: string;
  templateKind: TemplateKind | null;
  templateId: string | null;
  templateName: string | null;
  title: string;
  status: InspectionStatus;
  inspector: string;
  document: InspectionDocument;
  inspectedAt: string | null;
  projectNumber: string;
  cadence: Cadence;
  nextDueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionSummary {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  status: InspectionStatus;
  inspector: string;
  inspectedAt: string | null;
  projectNumber: string;
  cadence: Cadence;
  nextDueAt: string | null;
  updatedAt: string;
}

export interface CreateInspectionInput {
  clientId: string;
  templateKind: TemplateKind;
  templateId: string;
  title?: string;
  inspector?: string;
  inspectedAt?: string;
  projectNumber?: string;
  cadence?: Cadence;
}

export interface InspectionInput {
  title: string;
  status: InspectionStatus;
  inspector: string;
  document: InspectionDocument;
  inspectedAt: string | null;
  projectNumber: string;
  cadence: Cadence;
}

/** Sort document lists by inspection date (blank dates sort last). */
export function sortInspectionsByDate<T extends { inspectedAt: string | null; updatedAt: string }>(
  items: T[],
  direction: 'newest' | 'oldest',
): T[] {
  const factor = direction === 'newest' ? -1 : 1;
  return [...items].sort((a, b) => {
    const aDate = a.inspectedAt?.trim() ?? '';
    const bDate = b.inspectedAt?.trim() ?? '';
    if (aDate && bDate && aDate !== bDate) {
      return aDate < bDate ? -factor : factor;
    }
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;
    return factor === -1
      ? b.updatedAt.localeCompare(a.updatedAt)
      : a.updatedAt.localeCompare(b.updatedAt);
  });
}

export interface DueInspectionReminder {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  inspectionType: string;
  nextDueAt: string;
  overdue: boolean;
}

export interface DashboardStats {
  clientCount: number;
  completedThisYear: number;
  dueThisWeek: number;
  dueThisMonth: number;
  overdueCount: number;
  dueReminders: DueInspectionReminder[];
  recentInspections: InspectionSummary[];
}
