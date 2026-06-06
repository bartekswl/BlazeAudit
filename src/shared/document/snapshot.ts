import { rowHeightAt } from './tableLayout';
import type { Block, ChecklistItem, Document, TableValue } from './types';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function initializeBlockValues(blocks: Block[]): void {
  for (const block of blocks) {
    switch (block.type) {
      case 'textField':
        block.value = '';
        break;
      case 'lines': {
        const count = Math.max(1, (block.config.count as number) ?? 1);
        block.value = Array.from({ length: count }, () => '');
        break;
      }
      case 'checklist': {
        const items = (block.config.items as ChecklistItem[] | undefined) ?? [];
        block.value = Object.fromEntries(items.map((item) => [item.id, null]));
        break;
      }
      case 'table': {
        const value = (block.value as TableValue | null) ?? { rows: [] };
        if (!value.rows || value.rows.length === 0) {
          const columns = (block.config.columns as { key: string }[] | undefined) ?? [];
          const row: Record<string, string> = {};
          for (const col of columns) row[col.key] = '';
          value.rows = [row];
        }
        value.rowHeights = value.rows.map((_, index) => rowHeightAt(value.rowHeights, index));
        block.value = value;
        break;
      }
      case 'signature':
        block.value = { name: '', dataUrl: null, date: null };
        break;
      case 'image':
        block.value = { dataUrl: null };
        break;
      case 'section':
        block.value = { included: !block.config.optional };
        if (block.children) initializeBlockValues(block.children);
        break;
      default:
        break;
    }
    if (block.type !== 'section' && block.children) {
      initializeBlockValues(block.children);
    }
  }
}

/** Clone a template document into an inspection snapshot with empty fill-in values. */
export function inspectionSnapshotFromTemplate(
  templateDocument: Document,
  options: {
    clientId: string;
    title: string;
    inspectionDate?: string;
  },
): Document {
  const doc = structuredClone(templateDocument);
  doc.meta = {
    ...doc.meta,
    title: options.title,
    clientId: options.clientId,
    inspectionDate: options.inspectionDate ?? todayIsoDate(),
  };
  initializeBlockValues(doc.blocks);
  return doc;
}
