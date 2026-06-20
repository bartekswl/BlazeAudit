import { randomUUID } from 'node:crypto';
import type { CustomTemplateSummary, Template, TemplateInput } from '../../shared/document';
import { getDatabase } from './connection';
import { countBlocks } from '../../shared/document';
import { normalizeTemplateInput, parseStoredDocument, toTemplate } from './templateShared';

interface CustomTemplateRow {
  id: string;
  name: string;
  description: string;
  document: string;
  version: number;
  created_at: string;
  updated_at: string;
}

function toSummary(row: CustomTemplateRow): CustomTemplateSummary {
  const document = parseStoredDocument(row.document);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    version: row.version,
    updatedAt: row.updated_at,
    blockCount: countBlocks(document.blocks),
  };
}

export function listCustomTemplates(): CustomTemplateSummary[] {
  const rows = getDatabase()
    .prepare('SELECT * FROM custom_templates ORDER BY name COLLATE NOCASE ASC')
    .all() as CustomTemplateRow[];
  return rows.map(toSummary);
}

export function getCustomTemplate(id: string): Template | null {
  const row = getDatabase().prepare('SELECT * FROM custom_templates WHERE id = ?').get(id) as
    | CustomTemplateRow
    | undefined;
  return row ? toTemplate(row) : null;
}

export function createCustomTemplate(input: TemplateInput): Template {
  const fields = normalizeTemplateInput(input);
  const now = new Date().toISOString();
  const id = randomUUID();

  getDatabase()
    .prepare(
      `INSERT INTO custom_templates (
         id, name, description, document, version, created_at, updated_at
       ) VALUES (
         @id, @name, @description, @document, 1, @createdAt, @updatedAt
       )`,
    )
    .run({
      id,
      name: fields.name,
      description: fields.description,
      document: JSON.stringify(fields.document),
      createdAt: now,
      updatedAt: now,
    });

  return getCustomTemplate(id)!;
}

export function updateCustomTemplate(id: string, input: TemplateInput): Template {
  const fields = normalizeTemplateInput(input);
  const now = new Date().toISOString();
  const existing = getCustomTemplate(id);
  if (!existing) throw new Error(`Template not found: ${id}`);

  const result = getDatabase()
    .prepare(
      `UPDATE custom_templates
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
  return getCustomTemplate(id)!;
}

export function deleteCustomTemplate(id: string): void {
  const db = getDatabase();
  db.prepare(
    `UPDATE inspections SET template_kind = NULL, template_id = NULL
     WHERE template_kind = 'custom' AND template_id = ?`,
  ).run(id);

  const result = db.prepare('DELETE FROM custom_templates WHERE id = ?').run(id);
  if (result.changes === 0) throw new Error(`Template not found: ${id}`);
}

export function duplicateCustomTemplate(id: string): Template {
  const source = getCustomTemplate(id);
  if (!source) throw new Error(`Template not found: ${id}`);
  return createCustomTemplate({
    name: `${source.name} (copy)`,
    description: source.description,
    document: structuredClone(source.document),
  });
}
