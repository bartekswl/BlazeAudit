import {
  countBlocks,
  validateDocument,
  type Document,
  type Template,
  type TemplateInput,
} from '../../shared/document';

export function parseStoredDocument(json: string): Document {
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

export function toTemplate(row: {
  id: string;
  name: string;
  description: string;
  document: string;
  version: number;
  created_at: string;
  updated_at: string;
}): Template {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    document: parseStoredDocument(row.document),
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function normalizeTemplateInput(input: TemplateInput) {
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
    blockCount: countBlocks(document.blocks),
  };
}
