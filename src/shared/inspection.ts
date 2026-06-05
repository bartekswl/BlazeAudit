// Inspection domain types (see DATA_MODEL.md §1 inspections).

import type { Cadence } from './cadence';
import type { Document } from './document';

export type InspectionStatus = 'draft' | 'complete';

export interface Inspection {
  id: string;
  clientId: string;
  clientName: string;
  templateId: string | null;
  templateName: string | null;
  title: string;
  status: InspectionStatus;
  inspector: string;
  document: Document;
  inspectedAt: string | null;
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
  cadence: Cadence;
  nextDueAt: string | null;
  updatedAt: string;
}

export interface CreateInspectionInput {
  clientId: string;
  templateId: string;
  title?: string;
  inspector?: string;
  inspectedAt?: string;
  cadence?: Cadence;
}

export interface InspectionInput {
  title: string;
  status: InspectionStatus;
  inspector: string;
  document: Document;
  inspectedAt: string | null;
  cadence: Cadence;
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
