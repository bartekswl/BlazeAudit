import { randomUUID } from 'node:crypto';
import {
  computeNextDueAt,
  isDueWithinDays,
  isOverdue,
  type Cadence,
} from '../../shared/cadence';
import { inspectionSnapshotFromTemplate, validateDocument, type Document } from '../../shared/document';
import type { PdfInspectionExport } from '../../shared/pdf';
import type {
  CreateInspectionInput,
  DashboardStats,
  DueInspectionReminder,
  Inspection,
  InspectionInput,
  InspectionSummary,
} from '../../shared/inspection';
import type { TemplateKind } from '../../shared/document';
import { getDatabase } from './connection';
import * as templateRegistry from './templateRegistry';

interface InspectionRow {
  id: string;
  client_id: string;
  template_kind: string | null;
  template_id: string | null;
  title: string;
  status: string;
  inspector: string;
  document: string;
  inspected_at: string | null;
  cadence: string;
  next_due_at: string | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
  template_name?: string;
}

function parseInspectionDocument(json: string, requireClient = true): Document {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Inspection document is not valid JSON.');
  }
  const result = validateDocument(parsed);
  if (!result.ok) throw new Error(result.errors.join(' '));
  if (requireClient && !result.document.meta.clientId) {
    throw new Error('Inspection document must reference a client.');
  }
  return result.document;
}

function toInspection(row: InspectionRow): Inspection {
  const templateKind =
    row.template_kind === 'builtin' || row.template_kind === 'custom'
      ? row.template_kind
      : null;
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name ?? '',
    templateKind,
    templateId: row.template_id,
    templateName: row.template_name ?? null,
    title: row.title,
    status: row.status as Inspection['status'],
    inspector: row.inspector,
    document: parseInspectionDocument(row.document),
    inspectedAt: row.inspected_at,
    cadence: row.cadence,
    nextDueAt: row.next_due_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSummary(row: InspectionRow): InspectionSummary {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name ?? '',
    title: row.title,
    status: row.status as InspectionSummary['status'],
    inspector: row.inspector,
    inspectedAt: row.inspected_at,
    cadence: row.cadence,
    nextDueAt: row.next_due_at,
    updatedAt: row.updated_at,
  };
}

const summarySelect = `
  SELECT i.*, c.name AS client_name
    FROM inspections i
    JOIN clients c ON c.id = i.client_id
`;

const detailSelect = `
  SELECT i.*, c.name AS client_name,
         COALESCE(bt.name, ct.name) AS template_name
    FROM inspections i
    JOIN clients c ON c.id = i.client_id
    LEFT JOIN builtin_templates bt ON i.template_kind = 'builtin' AND bt.id = i.template_id
    LEFT JOIN custom_templates ct ON i.template_kind = 'custom' AND ct.id = i.template_id
`;

function normalizeInput(input: InspectionInput) {
  const title = input.title?.trim();
  if (!title) throw new Error('Inspection title is required.');

  const result = validateDocument(input.document);
  if (!result.ok) throw new Error(result.errors.join(' '));
  if (!result.document.meta.clientId) throw new Error('Inspection must be linked to a client.');

  const inspectedAt = input.inspectedAt?.trim() || null;
  const cadence = (input.cadence?.trim() || 'annual') as Cadence;
  const nextDueAt =
    input.status === 'complete' ? computeNextDueAt(inspectedAt, cadence) : null;

  const document = {
    ...result.document,
    meta: {
      ...result.document.meta,
      title,
      inspectionDate: inspectedAt,
    },
  };

  return {
    title,
    status: input.status,
    inspector: input.inspector?.trim() ?? '',
    document,
    inspectedAt,
    cadence,
    nextDueAt,
  };
}

export function listInspections(options?: { clientId?: string }): InspectionSummary[] {
  const db = getDatabase();
  if (options?.clientId) {
    const rows = db
      .prepare(`${summarySelect} WHERE i.client_id = ? ORDER BY i.updated_at DESC`)
      .all(options.clientId) as InspectionRow[];
    return rows.map(toSummary);
  }
  const rows = db
    .prepare(`${summarySelect} ORDER BY i.updated_at DESC`)
    .all() as InspectionRow[];
  return rows.map(toSummary);
}

export function getInspection(id: string): Inspection | null {
  const row = getDatabase()
    .prepare(`${detailSelect} WHERE i.id = ?`)
    .get(id) as InspectionRow | undefined;
  return row ? toInspection(row) : null;
}

export function createInspectionFromTemplate(input: CreateInspectionInput): Inspection {
  const template = templateRegistry.getTemplate(input.templateId, input.templateKind);
  if (!template) throw new Error(`Template not found: ${input.templateKind}:${input.templateId}`);

  const client = getDatabase()
    .prepare('SELECT id, name FROM clients WHERE id = ?')
    .get(input.clientId) as { id: string; name: string } | undefined;
  if (!client) throw new Error(`Client not found: ${input.clientId}`);

  const inspectedAt = input.inspectedAt ?? new Date().toISOString().slice(0, 10);
  const title = input.title?.trim() || `${template.name} — ${client.name}`;
  const cadence = (input.cadence ?? 'annual') as Cadence;
  const document = inspectionSnapshotFromTemplate(template.document, {
    clientId: input.clientId,
    title,
    inspectionDate: inspectedAt,
  });

  const now = new Date().toISOString();
  const id = randomUUID();

  getDatabase()
    .prepare(
      `INSERT INTO inspections (
         id, client_id, template_kind, template_id, title, status, inspector, document,
         inspected_at, cadence, next_due_at, created_at, updated_at
       ) VALUES (
         @id, @clientId, @templateKind, @templateId, @title, 'draft', @inspector, @document,
         @inspectedAt, @cadence, NULL, @createdAt, @updatedAt
       )`,
    )
    .run({
      id,
      clientId: input.clientId,
      templateKind: input.templateKind,
      templateId: input.templateId,
      title,
      inspector: input.inspector?.trim() ?? '',
      document: JSON.stringify(document),
      inspectedAt,
      cadence,
      createdAt: now,
      updatedAt: now,
    });

  return getInspection(id)!;
}

export function createInspectionFromPdfExport(payload: PdfInspectionExport): Inspection {
  const src = payload.inspection;

  const client = getDatabase()
    .prepare('SELECT id FROM clients WHERE id = ?')
    .get(src.clientId) as { id: string } | undefined;
  if (!client) {
    throw new Error(
      `Client "${src.clientName}" is not in this database. Import on the account that owns this client.`,
    );
  }

  const docResult = validateDocument(src.document);
  if (!docResult.ok) throw new Error(docResult.errors.join(' '));

  const document = {
    ...docResult.document,
    meta: { ...docResult.document.meta, clientId: src.clientId },
  };
  const cadence = (src.cadence?.trim() || 'annual') as Cadence;
  const inspectedAt = src.inspectedAt?.trim() || null;
  const status = src.status === 'complete' ? 'complete' : 'draft';
  const nextDueAt = status === 'complete' ? computeNextDueAt(inspectedAt, cadence) : null;
  const title = src.title?.trim() || 'Imported inspection';
  const now = new Date().toISOString();
  const id = randomUUID();

  const templateKind: TemplateKind | null =
    src.templateKind === 'builtin' || src.templateKind === 'custom' ? src.templateKind : null;

  getDatabase()
    .prepare(
      `INSERT INTO inspections (
         id, client_id, template_kind, template_id, title, status, inspector, document,
         inspected_at, cadence, next_due_at, created_at, updated_at
       ) VALUES (
         @id, @clientId, @templateKind, @templateId, @title, @status, @inspector, @document,
         @inspectedAt, @cadence, @nextDueAt, @createdAt, @updatedAt
       )`,
    )
    .run({
      id,
      clientId: src.clientId,
      templateKind,
      templateId: src.templateId,
      title,
      status,
      inspector: src.inspector?.trim() ?? '',
      document: JSON.stringify(document),
      inspectedAt,
      cadence,
      nextDueAt,
      createdAt: now,
      updatedAt: now,
    });

  return getInspection(id)!;
}

export function updateInspection(id: string, input: InspectionInput): Inspection {
  const existing = getInspection(id);
  if (!existing) throw new Error(`Inspection not found: ${id}`);

  const fields = normalizeInput(input);
  // Client is chosen at creation and cannot be changed on an existing inspection.
  fields.document.meta.clientId = existing.clientId;
  const now = new Date().toISOString();

  const result = getDatabase()
    .prepare(
      `UPDATE inspections
         SET title = @title, status = @status, inspector = @inspector,
             document = @document, inspected_at = @inspectedAt,
             cadence = @cadence, next_due_at = @nextDueAt, updated_at = @updatedAt
       WHERE id = @id`,
    )
    .run({
      id,
      title: fields.title,
      status: fields.status,
      inspector: fields.inspector,
      document: JSON.stringify(fields.document),
      inspectedAt: fields.inspectedAt,
      cadence: fields.cadence,
      nextDueAt: fields.nextDueAt,
      updatedAt: now,
    });

  if (result.changes === 0) throw new Error(`Inspection not found: ${id}`);
  return getInspection(id)!;
}

export function deleteInspection(id: string): void {
  const result = getDatabase().prepare('DELETE FROM inspections WHERE id = ?').run(id);
  if (result.changes === 0) throw new Error(`Inspection not found: ${id}`);
}

export function getDashboardStats(): DashboardStats {
  const db = getDatabase();
  const today = new Date();
  const yearStart = `${today.getFullYear()}-01-01`;

  const clientCount = (
    db.prepare('SELECT COUNT(*) AS count FROM clients').get() as { count: number }
  ).count;

  const completedThisYear = (
    db
      .prepare(
        `SELECT COUNT(*) AS count FROM inspections
          WHERE status = 'complete' AND inspected_at >= ?`,
      )
      .get(yearStart) as { count: number }
  ).count;

  const completedWithDue = db
    .prepare(
      `${summarySelect}
        WHERE i.status = 'complete' AND i.next_due_at IS NOT NULL
        ORDER BY i.next_due_at ASC`,
    )
    .all() as InspectionRow[];

  let dueThisWeek = 0;
  let dueThisMonth = 0;
  let overdueCount = 0;
  const dueReminders: DueInspectionReminder[] = [];

  for (const row of completedWithDue) {
    const summary = toSummary(row);
    if (!summary.nextDueAt) continue;
    if (isOverdue(summary.nextDueAt, today)) {
      overdueCount += 1;
      dueReminders.push({
        id: summary.id,
        clientId: summary.clientId,
        clientName: summary.clientName,
        title: summary.title,
        inspectionType: '',
        nextDueAt: summary.nextDueAt,
        overdue: true,
      });
    } else if (isDueWithinDays(summary.nextDueAt, 7, today)) {
      dueThisWeek += 1;
      dueReminders.push({
        id: summary.id,
        clientId: summary.clientId,
        clientName: summary.clientName,
        title: summary.title,
        inspectionType: '',
        nextDueAt: summary.nextDueAt,
        overdue: false,
      });
    }
    if (isDueWithinDays(summary.nextDueAt, 30, today) && !isOverdue(summary.nextDueAt, today)) {
      dueThisMonth += 1;
    }
  }

  dueReminders.sort((a, b) => a.nextDueAt.localeCompare(b.nextDueAt));

  const recentRows = db
    .prepare(`${summarySelect} ORDER BY i.updated_at DESC LIMIT 8`)
    .all() as InspectionRow[];

  return {
    clientCount,
    completedThisYear,
    dueThisWeek,
    dueThisMonth,
    overdueCount,
    dueReminders: dueReminders.slice(0, 12),
    recentInspections: recentRows.map(toSummary),
  };
}

export function getClientInspectionStats(clientId: string): {
  documentCount: number;
  lastDocumentDate: string | null;
  nextInspectionDue: string | null;
} {
  const rows = listInspections({ clientId });
  const completed = rows.filter((row) => row.status === 'complete');
  const lastDocumentDate =
    completed
      .map((row) => row.inspectedAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;

  const nextInspectionDue =
    completed
      .map((row) => row.nextDueAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .find((due) => !isOverdue(due)) ??
    completed
      .map((row) => row.nextDueAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(0) ??
    null;

  return {
    documentCount: rows.length,
    lastDocumentDate,
    nextInspectionDue,
  };
}
