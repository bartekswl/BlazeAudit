import { randomUUID } from 'node:crypto';
import type { BuiltinTemplateMeta, BuiltinTemplateSummary } from '../../shared/document';
import {
  countFormElements,
  countFormPages,
  parseStoredFormDefinition,
  type BuiltinTemplate,
  type FormDefinition,
} from '../../shared/form';
import { getDatabase } from './connection';

interface BuiltinTemplateRow {
  id: string;
  seed_id: string;
  name: string;
  description: string;
  code: string;
  title: string;
  document: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface BuiltinTemplateInput {
  name: string;
  description?: string;
  form: FormDefinition;
}

function toBuiltinTemplate(row: BuiltinTemplateRow): BuiltinTemplate {
  const form = parseStoredFormDefinition(row.document);
  return {
    id: row.id,
    seedId: row.seed_id,
    name: row.name,
    description: row.description,
    code: row.code,
    title: row.title,
    form,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSummary(row: BuiltinTemplateRow): BuiltinTemplateSummary {
  const form = parseStoredFormDefinition(row.document);
  return {
    id: row.id,
    seedId: row.seed_id,
    name: row.name,
    description: row.description,
    code: row.code,
    title: row.title,
    version: row.version,
    updatedAt: row.updated_at,
    blockCount: countFormElements(form),
    pageCount: countFormPages(form),
  };
}

function normalizeBuiltinInput(input: BuiltinTemplateInput) {
  const name = input.name?.trim();
  if (!name) throw new Error('Template name is required.');
  const form = structuredClone(input.form);
  return {
    name,
    description: input.description?.trim() ?? '',
    form,
  };
}

export function listBuiltinTemplates(): BuiltinTemplateSummary[] {
  const rows = getDatabase()
    .prepare('SELECT * FROM builtin_templates ORDER BY name COLLATE NOCASE ASC')
    .all() as BuiltinTemplateRow[];
  return rows.map(toSummary);
}

export function getBuiltinTemplate(id: string): BuiltinTemplate | null {
  const row = getDatabase().prepare('SELECT * FROM builtin_templates WHERE id = ?').get(id) as
    | BuiltinTemplateRow
    | undefined;
  return row ? toBuiltinTemplate(row) : null;
}

export function getBuiltinTemplateBySeedId(seedId: string): BuiltinTemplate | null {
  const row = getDatabase()
    .prepare('SELECT * FROM builtin_templates WHERE seed_id = ?')
    .get(seedId) as BuiltinTemplateRow | undefined;
  return row ? toBuiltinTemplate(row) : null;
}

export function getBuiltinSeedId(templateId: string): string | null {
  const row = getDatabase()
    .prepare('SELECT seed_id FROM builtin_templates WHERE id = ?')
    .get(templateId) as { seed_id: string } | undefined;
  return row?.seed_id ?? null;
}

export function getBuiltinTemplateMeta(
  templateId: string,
): (BuiltinTemplateMeta & { seedId: string; name: string; description: string }) | null {
  const row = getDatabase()
    .prepare('SELECT seed_id, name, description, code, title FROM builtin_templates WHERE id = ?')
    .get(templateId) as
    | Pick<BuiltinTemplateRow, 'seed_id' | 'name' | 'description' | 'code' | 'title'>
    | undefined;
  if (!row) return null;
  return {
    seedId: row.seed_id,
    name: row.name,
    description: row.description,
    code: row.code,
    title: row.title,
  };
}

export function createBuiltinTemplate(
  input: BuiltinTemplateInput,
  seedId: string,
  meta: BuiltinTemplateMeta,
): BuiltinTemplate {
  const fields = normalizeBuiltinInput(input);
  const now = new Date().toISOString();
  const id = randomUUID();

  getDatabase()
    .prepare(
      `INSERT INTO builtin_templates (
         id, seed_id, name, description, code, title, document, version, created_at, updated_at
       ) VALUES (
         @id, @seedId, @name, @description, @code, @title, @document, 1, @createdAt, @updatedAt
       )`,
    )
    .run({
      id,
      seedId,
      name: fields.name,
      description: fields.description,
      code: meta.code,
      title: meta.title,
      document: JSON.stringify(fields.form),
      createdAt: now,
      updatedAt: now,
    });

  return getBuiltinTemplate(id)!;
}

export function syncBuiltinTemplateFromSeed(
  seedId: string,
  input: BuiltinTemplateInput,
  meta: BuiltinTemplateMeta,
): BuiltinTemplate {
  const existing = getBuiltinTemplateBySeedId(seedId);
  if (!existing) throw new Error(`Built-in template not found for seed: ${seedId}`);

  const fields = normalizeBuiltinInput(input);
  const now = new Date().toISOString();

  getDatabase()
    .prepare(
      `UPDATE builtin_templates
         SET name = @name, description = @description, code = @code, title = @title,
             document = @document, version = @version, updated_at = @updatedAt
       WHERE seed_id = @seedId`,
    )
    .run({
      seedId,
      name: fields.name,
      description: fields.description,
      code: meta.code,
      title: meta.title,
      document: JSON.stringify(fields.form),
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
