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
  templateName: string | null;
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

/**
 * List/breadcrumb display name: strip the ULC code from the template portion,
 * keep " — Client" (e.g. "Annual Fire Alarm Test — Acme Building").
 * If the stored title has no client suffix, `clientName` is appended when provided.
 */
export function shortInspectionDisplayName(
  title: string,
  clientName?: string | null,
): string {
  const trimmed = title.trim();
  if (!trimmed) return trimmed;

  let head = trimmed;
  let clientSuffix = '';
  if (trimmed.includes(' — ')) {
    const idx = trimmed.lastIndexOf(' — ');
    head = trimmed.slice(0, idx).trim();
    clientSuffix = trimmed.slice(idx);
  }

  const testName =
    head
      .replace(/\s*-\s*ULC\s*536:2019\s*\(\s*2024\s*\)/gi, '')
      .replace(/\s*ULC\s*536:2019\s*\(\s*2024\s*\)/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim() || head;

  if (clientSuffix) return `${testName}${clientSuffix}`;
  const client = clientName?.trim();
  if (client) return `${testName} — ${client}`;
  return testName;
}

export type InspectionListSortKey = 'name' | 'inspectedAt' | 'modified';
export type InspectionListSortDirection = 'asc' | 'desc';

export type InspectionListSort = {
  key: InspectionListSortKey;
  direction: InspectionListSortDirection;
};

export const DEFAULT_INSPECTION_LIST_SORT: InspectionListSort = {
  key: 'modified',
  direction: 'desc',
};

function compareOptionalDateStrings(a: string | null | undefined, b: string | null | undefined): number {
  const as = a?.trim() ?? '';
  const bs = b?.trim() ?? '';
  if (!as && !bs) return 0;
  if (!as) return 1;
  if (!bs) return -1;
  return as.localeCompare(bs);
}

/** Click same column toggles direction; new column uses a sensible default. */
export function nextInspectionListSort(
  current: InspectionListSort,
  key: InspectionListSortKey,
): InspectionListSort {
  if (current.key === key) {
    return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
  }
  if (key === 'name') return { key, direction: 'asc' };
  return { key, direction: 'desc' };
}

export function sortInspectionSummaries<
  T extends {
    title: string;
    clientName?: string;
    inspectedAt: string | null;
    updatedAt: string;
  },
>(items: T[], sort: InspectionListSort): T[] {
  const factor = sort.direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    let cmp = 0;
    if (sort.key === 'name') {
      const aName = shortInspectionDisplayName(a.title, a.clientName ?? '').toLowerCase();
      const bName = shortInspectionDisplayName(b.title, b.clientName ?? '').toLowerCase();
      cmp = aName.localeCompare(bName);
    } else if (sort.key === 'inspectedAt') {
      cmp = compareOptionalDateStrings(a.inspectedAt, b.inspectedAt);
    } else {
      cmp = a.updatedAt.localeCompare(b.updatedAt);
    }
    if (cmp !== 0) return cmp * factor;
    return b.updatedAt.localeCompare(a.updatedAt);
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
