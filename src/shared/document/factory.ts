import type { Block, BlockType, ChecklistItem, Document, DocumentMeta, TableColumn } from './types';
import { DOCUMENT_SCHEMA_VERSION } from './types';

export function newBlockId(): string {
  return globalThis.crypto.randomUUID();
}

export function emptyDocumentMeta(overrides?: Partial<DocumentMeta>): DocumentMeta {
  return {
    title: 'Untitled template',
    clientId: null,
    inspectionType: '',
    inspectionDate: null,
    ...overrides,
  };
}

export function emptyDocument(overrides?: Partial<DocumentMeta>): Document {
  return {
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    meta: emptyDocumentMeta(overrides),
    blocks: [],
  };
}

export function createBlock(type: BlockType, overrides?: Partial<Block>): Block {
  const id = overrides?.id ?? newBlockId();

  switch (type) {
    case 'heading':
      return {
        id,
        type,
        config: { level: 2, text: 'Section heading' },
        value: null,
        ...overrides,
      };
    case 'paragraph':
      return {
        id,
        type,
        config: { text: '' },
        value: null,
        ...overrides,
      };
    case 'textField':
      return {
        id,
        type,
        label: 'Notes',
        config: { multiline: false, placeholder: '' },
        value: null,
        ...overrides,
      };
    case 'lines':
      return {
        id,
        type,
        label: 'Write-on lines',
        config: { count: 4 },
        value: null,
        ...overrides,
      };
    case 'checklist':
      return {
        id,
        type,
        label: 'Checklist',
        config: {
          items: [
            { id: newBlockId(), label: 'Item 1' },
            { id: newBlockId(), label: 'Item 2' },
          ] satisfies ChecklistItem[],
        },
        value: null,
        ...overrides,
      };
    case 'table':
      return {
        id,
        type,
        label: 'Table',
        config: {
          columns: [
            { key: 'col1', title: 'Column 1', width: 140 },
            { key: 'col2', title: 'Column 2', width: 140 },
          ] satisfies TableColumn[],
        },
        value: { rows: [] },
        ...overrides,
      };
    case 'signature':
      return {
        id,
        type,
        label: 'Signature',
        config: {},
        value: null,
        ...overrides,
      };
    case 'section':
      return {
        id,
        type,
        label: 'Section',
        config: { collapsible: true, optional: false },
        value: null,
        children: [],
        ...overrides,
      };
    case 'spacer':
      return {
        id,
        type,
        config: { size: 'md' },
        value: null,
        ...overrides,
      };
    case 'image':
      return {
        id,
        type,
        label: 'Image',
        config: {},
        value: null,
        ...overrides,
      };
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unknown block type: ${_exhaustive}`);
    }
  }
}
