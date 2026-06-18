import { randomUUID } from 'node:crypto';
import {
  countBlocks,
  validateDocument,
  type Document,
  type Template,
  type TemplateInput,
  type TemplateSummary,
} from '../../shared/document';
import { getDatabase } from './connection';

interface TemplateRow {
  id: string;
  seed_id: string | null;
  name: string;
  description: string;
  document: string;
  version: number;
  created_at: string;
  updated_at: string;
}

function parseDocument(json: string): Document {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Template document is not valid JSON.');
  }
  const result = validateDocument(parsed);
  if (!result.ok) throw new Error(result.errors.join(' '));
  return result.document;
}

function toTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    seedId: row.seed_id,
    name: row.name,
    description: row.description,
    document: parseDocument(row.document),
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSummary(row: TemplateRow): TemplateSummary {
  const document = parseDocument(row.document);
  return {
    id: row.id,
    seedId: row.seed_id,
    name: row.name,
    description: row.description,
    version: row.version,
    updatedAt: row.updated_at,
    blockCount: countBlocks(document.blocks),
  };
}

function normalize(input: TemplateInput) {
  const name = input.name?.trim();
  if (!name) throw new Error('Template name is required.');

  const result = validateDocument(input.document);
  if (!result.ok) throw new Error(result.errors.join(' '));

  const document = result.document;
  if (document.meta.clientId !== null) {
    document.meta.clientId = null;
  }
  if (document.meta.inspectionDate !== null) {
    document.meta.inspectionDate = null;
  }
  document.meta.title = name;

  return {
    name,
    description: input.description?.trim() ?? '',
    document,
  };
}

export function listTemplates(): TemplateSummary[] {
  const rows = getDatabase()
    .prepare('SELECT * FROM templates ORDER BY name COLLATE NOCASE ASC')
    .all() as TemplateRow[];
  return rows.map(toSummary);
}

export function getTemplate(id: string): Template | null {
  const row = getDatabase().prepare('SELECT * FROM templates WHERE id = ?').get(id) as
    | TemplateRow
    | undefined;
  return row ? toTemplate(row) : null;
}

export function getTemplateBySeedId(seedId: string): Template | null {
  const row = getDatabase()
    .prepare('SELECT * FROM templates WHERE seed_id = ?')
    .get(seedId) as TemplateRow | undefined;
  return row ? toTemplate(row) : null;
}

export function createTemplate(input: TemplateInput, options?: { seedId?: string }): Template {
  const fields = normalize(input);
  const now = new Date().toISOString();
  const id = randomUUID();

  getDatabase()
    .prepare(
      `INSERT INTO templates (
         id, seed_id, name, description, document, version, created_at, updated_at
       ) VALUES (
         @id, @seedId, @name, @description, @document, 1, @createdAt, @updatedAt
       )`,
    )
    .run({
      id,
      seedId: options?.seedId ?? null,
      name: fields.name,
      description: fields.description,
      document: JSON.stringify(fields.document),
      createdAt: now,
      updatedAt: now,
    });

  return getTemplate(id)!;
}

export function upsertTemplateBySeedId(
  seedId: string,
  input: TemplateInput,
): { template: Template; created: boolean } {
  const existing = getTemplateBySeedId(seedId);
  if (existing) {
    return { template: updateTemplate(existing.id, input), created: false };
  }
  return { template: createTemplate(input, { seedId }), created: true };
}

export function updateTemplate(id: string, input: TemplateInput): Template {
  const fields = normalize(input);
  const now = new Date().toISOString();
  const existing = getTemplate(id);
  if (!existing) throw new Error(`Template not found: ${id}`);

  const result = getDatabase()
    .prepare(
      `UPDATE templates
         SET name = @name, description = @description, document = @document,
             version = @version, updated_at = @updatedAt
       WHERE id = @id`,
    )
    .run({
      id,
      name: fields.name,
      description: fields.description,
      document: JSON.stringify(fields.document),
      version: existing.version + 1,
      updatedAt: now,
    });

  if (result.changes === 0) throw new Error(`Template not found: ${id}`);
  return getTemplate(id)!;
}

export function deleteTemplate(id: string): void {
  const result = getDatabase().prepare('DELETE FROM templates WHERE id = ?').run(id);
  if (result.changes === 0) throw new Error(`Template not found: ${id}`);
}

export function duplicateTemplate(id: string): Template {
  const source = getTemplate(id);
  if (!source) throw new Error(`Template not found: ${id}`);
  return createTemplate({
    name: `${source.name} (copy)`,
    description: source.description,
    document: structuredClone(source.document),
  });
}
