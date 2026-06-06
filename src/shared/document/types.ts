// Document / block model shared across main and renderer (see DATA_MODEL.md §2).

export const DOCUMENT_SCHEMA_VERSION = 1;

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'textField'
  | 'lines'
  | 'checklist'
  | 'table'
  | 'signature'
  | 'section'
  | 'spacer'
  | 'image';

export interface TableColumn {
  key: string;
  title: string;
  /** Column width in pixels (optional; defaults in the UI). */
  width?: number;
}

/** Table fill-in payload (`block.value` for type `table`). */
export interface TableValue {
  rows: Record<string, string>[];
  /** Per-row height in pixels, aligned with `rows` indices. */
  rowHeights?: number[];
}

export interface ChecklistItem {
  id: string;
  label: string;
}

export interface DocumentMeta {
  title: string;
  clientId: string | null;
  inspectionType: string;
  inspectionDate: string | null;
  branding?: { company?: string };
}

export interface Block {
  id: string;
  type: BlockType;
  label?: string;
  config: Record<string, unknown>;
  value: unknown;
  children?: Block[];
}

export interface Document {
  schemaVersion: number;
  meta: DocumentMeta;
  blocks: Block[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  document: Document;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  version: number;
  updatedAt: string;
  blockCount: number;
}

/** Fields supplied when creating or updating a template. */
export interface TemplateInput {
  name: string;
  description?: string;
  document: Document;
}

/** Portable JSON envelope for export/import. */
export interface TemplateExportPayload {
  kind: 'blazeaudit-template';
  exportedAt: string;
  appVersion: string;
  template: {
    name: string;
    description: string;
    document: Document;
  };
}
