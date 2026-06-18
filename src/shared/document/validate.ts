import { DOCUMENT_SCHEMA_VERSION } from './types';
import type { BlockType, Document, TemplateExportPayload } from './types';

const BLOCK_TYPES: BlockType[] = [
  'heading',
  'paragraph',
  'textField',
  'lines',
  'checklist',
  'table',
  'signature',
  'section',
  'spacer',
  'image',
];

export type ValidationResult =
  | { ok: true; document: Document }
  | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateBlock(block: unknown, path: string, errors: string[]): void {
  if (!isRecord(block)) {
    errors.push(`${path}: expected an object.`);
    return;
  }

  if (typeof block.id !== 'string' || !block.id.trim()) {
    errors.push(`${path}.id: required string.`);
  }
  if (typeof block.type !== 'string' || !BLOCK_TYPES.includes(block.type as BlockType)) {
    errors.push(`${path}.type: unknown or missing block type.`);
    return;
  }
  if (!isRecord(block.config)) {
    errors.push(`${path}.config: expected an object.`);
  }

  const type = block.type as BlockType;

  const config = block.config as Record<string, unknown>;

  switch (type) {
    case 'heading':
      if (typeof config.level !== 'number') errors.push(`${path}.config.level: required number.`);
      if (typeof config.text !== 'string') errors.push(`${path}.config.text: required string.`);
      break;
    case 'paragraph':
      if (typeof config.text !== 'string') errors.push(`${path}.config.text: required string.`);
      break;
    case 'textField':
      if (typeof config.multiline !== 'boolean') {
        errors.push(`${path}.config.multiline: required boolean.`);
      }
      break;
    case 'lines':
      if (typeof config.count !== 'number' || config.count < 1) {
        errors.push(`${path}.config.count: required positive number.`);
      }
      break;
    case 'checklist': {
      const items = config.items;
      if (!Array.isArray(items) || items.length === 0) {
        errors.push(`${path}.config.items: required non-empty array.`);
      } else {
        items.forEach((item, i) => {
          if (!isRecord(item) || typeof item.id !== 'string' || typeof item.label !== 'string') {
            errors.push(`${path}.config.items[${i}]: invalid checklist item.`);
          }
        });
      }
      break;
    }
    case 'table': {
      const columns = config.columns;
      if (!Array.isArray(columns) || columns.length === 0) {
        errors.push(`${path}.config.columns: required non-empty array.`);
      } else {
        columns.forEach((col, i) => {
          if (!isRecord(col) || typeof col.key !== 'string' || typeof col.title !== 'string') {
            errors.push(`${path}.config.columns[${i}]: invalid column.`);
          }
        });
      }
      if (block.value !== null && block.value !== undefined && !isRecord(block.value)) {
        errors.push(`${path}.value: expected object or null for table.`);
      }
      break;
    }
    case 'section':
      if (!Array.isArray(block.children)) {
        errors.push(`${path}.children: required array for section.`);
      } else {
        block.children.forEach((child, i) => validateBlock(child, `${path}.children[${i}]`, errors));
      }
      break;
    case 'signature':
    case 'spacer':
    case 'image':
      break;
    default:
      break;
  }
}

export function validateDocument(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { ok: false, errors: ['Document must be a JSON object.'] };
  }

  const schemaVersion = input.schemaVersion;
  if (schemaVersion !== DOCUMENT_SCHEMA_VERSION) {
    errors.push(
      `Unsupported schemaVersion ${String(schemaVersion)} (expected ${DOCUMENT_SCHEMA_VERSION}).`,
    );
  }

  if (!isRecord(input.meta)) {
    errors.push('meta: required object.');
  } else {
    if (typeof input.meta.title !== 'string' || !input.meta.title.trim()) {
      errors.push('meta.title: required non-empty string.');
    }
    if (
      input.meta.clientId !== null &&
      (typeof input.meta.clientId !== 'string' || !input.meta.clientId.trim())
    ) {
      errors.push('meta.clientId: must be null or a non-empty string.');
    }
    if (typeof input.meta.inspectionType !== 'string') {
      errors.push('meta.inspectionType: required string.');
    }
    if (
      input.meta.inspectionDate !== null &&
      typeof input.meta.inspectionDate !== 'string'
    ) {
      errors.push('meta.inspectionDate: must be null or an ISO date string.');
    }
  }

  if (!Array.isArray(input.blocks)) {
    errors.push('blocks: required array.');
  } else {
    input.blocks.forEach((block, i) => validateBlock(block, `blocks[${i}]`, errors));
  }

  if (errors.length > 0) return { ok: false, errors };

  return { ok: true, document: input as unknown as Document };
}

export type TemplateImportResult =
  | { ok: false; errors: string[] }
  | { ok: true; document: Document; name: string; description: string };

export function parseTemplateExportPayload(input: unknown): TemplateImportResult {
  if (!isRecord(input)) {
    return { ok: false, errors: ['Import file must be a JSON object.'] };
  }

  if (input.kind === 'blazeaudit-template' && isRecord(input.template)) {
    const docResult = validateDocument(input.template.document);
    if (!docResult.ok) return docResult;
    const name =
      typeof input.template.name === 'string' && input.template.name.trim()
        ? input.template.name.trim()
        : docResult.document.meta.title;
    const description =
      typeof input.template.description === 'string' ? input.template.description : '';
    return { ok: true, document: docResult.document, name, description };
  }

  // Bare document export (e.g. from external AI).
  const bare = validateDocument(input);
  if (!bare.ok) return bare;
  return {
    ok: true,
    document: bare.document,
    name: bare.document.meta.title,
    description: '',
  };
}

export function buildTemplateExportPayload(
  name: string,
  description: string,
  document: Document,
  appVersion: string,
): TemplateExportPayload {
  return {
    kind: 'blazeaudit-template',
    exportedAt: new Date().toISOString(),
    appVersion,
    template: { name, description, document },
  };
}
