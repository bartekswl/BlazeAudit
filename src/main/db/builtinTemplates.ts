import { randomUUID } from 'node:crypto';
import type { BuiltinTemplateSummary, Template, TemplateInput } from '../../shared/document';
import { countBlocks } from '../../shared/document';
import { getDatabase } from './connection';
import { normalizeTemplateInput, parseStoredDocument, toTemplate } from './templateShared';

interface BuiltinTemplateRow {
  id: string;
  seed_id: string;
  name: string;
  description: string;
  document: string;
  version: number;
  created_at: string;
  updated_at: string;
}

function toSummary(row: BuiltinTemplateRow): BuiltinTemplateSummary {
  const document = parseStoredDocument(row.document);
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

export function listBuiltinTemplates(): BuiltinTemplateSummary[] {
  const rows = getDatabase()
    .prepare('SELECT * FROM builtin_templates ORDER BY name COLLATE NOCASE ASC')
    .all() as BuiltinTemplateRow[];
  return rows.map(toSummary);
}

export function getBuiltinTemplate(id: string): Template | null {
  const row = getDatabase().prepare('SELECT * FROM builtin_templates WHERE id = ?').get(id) as
    | BuiltinTemplateRow
    | undefined;
  return row ? toTemplate(row) : null;
}

export function getBuiltinTemplateBySeedId(seedId: string): Template | null {
  const row = getDatabase()
    .prepare('SELECT * FROM builtin_templates WHERE seed_id = ?')
    .get(seedId) as BuiltinTemplateRow | undefined;
  return row ? toTemplate(row) : null;
}

export function createBuiltinTemplate(input: TemplateInput, seedId: string): Template {
  const fields = normalizeTemplateInput(input);
  const now = new Date().toISOString();
  const id = randomUUID();

  getDatabase()
    .prepare(
      `INSERT INTO builtin_templates (
         id, seed_id, name, description, document, version, created_at, updated_at
       ) VALUES (
         @id, @seedId, @name, @description, @document, 1, @createdAt, @updatedAt
       )`,
    )
    .run({
      id,
      seedId,
      name: fields.name,
      description: fields.description,
      document: JSON.stringify(fields.document),
      createdAt: now,
      updatedAt: now,
    });

  return getBuiltinTemplate(id)!;
}

export function syncBuiltinTemplateFromSeed(seedId: string, input: TemplateInput): Template {
  const existing = getBuiltinTemplateBySeedId(seedId);
  if (!existing) throw new Error(`Built-in template not found for seed: ${seedId}`);

  const fields = normalizeTemplateInput(input);
  const now = new Date().toISOString();

  getDatabase()
    .prepare(
      `UPDATE builtin_templates
         SET name = @name, description = @description, document = @document,
             version = @version, updated_at = @updatedAt
       WHERE seed_id = @seedId`,
    )
    .run({
      seedId,
      name: fields.name,
      description: fields.description,
      document: JSON.stringify(fields.document),
      version: existing.version + 1,
      updatedAt: now,
    });

  return getBuiltinTemplateBySeedId(seedId)!;
}

export function deleteBuiltinTemplatesExcept(keepSeedIds: string[]): void {
  const db = getDatabase();

  const rows =
    keepSeedIds.length === 0
      ? (db.prepare('SELECT id FROM builtin_templates').all() as { id: string }[])
      : (db
          .prepare(
            `SELECT id FROM builtin_templates WHERE seed_id NOT IN (${keepSeedIds.map(() => '?').join(', ')})`,
          )
          .all(...keepSeedIds) as { id: string }[]);

  if (rows.length === 0) return;

  const ids = rows.map((row) => row.id);
  const placeholders = ids.map(() => '?').join(', ');

  db.prepare(
    `UPDATE inspections SET template_kind = NULL, template_id = NULL
     WHERE template_kind = 'builtin' AND template_id IN (${placeholders})`,
  ).run(...ids);
  db.prepare(`DELETE FROM builtin_templates WHERE id IN (${placeholders})`).run(...ids);
}
