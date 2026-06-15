import { createBlock, newBlockId } from './factory';
import {
  clampTableColWidth,
  clampTableRowHeight,
  DEFAULT_TABLE_COL_WIDTH,
  DEFAULT_TABLE_ROW_HEIGHT,
  readTableValue,
  rowHeightAt,
} from './tableLayout';
import type { Block, BlockType, ChecklistItem, TableColumn, TableValue } from './types';

function syncTableRowHeights(value: TableValue): TableValue {
  const rows = value.rows ?? [];
  const heights = value.rowHeights ?? [];
  value.rowHeights = rows.map((_, index) => rowHeightAt(heights, index));
  return value;
}

export type BlockPath = number[];

function cloneBlock(block: Block): Block {
  return {
    ...block,
    config: structuredClone(block.config),
    value: block.value === null || block.value === undefined ? null : structuredClone(block.value),
    children: block.children?.map(cloneBlock),
  };
}

function getParentArray(blocks: Block[], path: BlockPath): Block[] {
  if (path.length === 0) return blocks;
  let current = blocks;
  for (let i = 0; i < path.length - 1; i++) {
    const block = current[path[i]];
    if (!block?.children) throw new Error('Invalid block path.');
    current = block.children;
  }
  return current;
}

function getBlockAt(blocks: Block[], path: BlockPath): Block | null {
  if (path.length === 0) return null;
  let current = blocks;
  let block: Block | undefined;
  for (let i = 0; i < path.length; i++) {
    block = current[path[i]];
    if (!block) return null;
    if (i < path.length - 1) {
      if (!block.children) return null;
      current = block.children;
    }
  }
  return block ?? null;
}

/** Set every checklist item under this block tree to N/A (pass/fail/na). */
export function markChecklistsNaInTree(blocks: Block[]): Block[] {
  return blocks.map((block) => {
    if (block.type === 'checklist') {
      const items = (block.config.items as ChecklistItem[]) ?? [];
      const value = Object.fromEntries(items.map((item) => [item.id, 'na' as const]));
      return { ...block, value };
    }
    if (block.children?.length) {
      return { ...block, children: markChecklistsNaInTree(block.children) };
    }
    return block;
  });
}

export function countBlocks(blocks: Block[]): number {
  return blocks.reduce((sum, block) => {
    const childCount = block.children ? countBlocks(block.children) : 0;
    return sum + 1 + childCount;
  }, 0);
}

export function insertBlock(
  blocks: Block[],
  path: BlockPath,
  type: BlockType,
  index?: number,
): Block[] {
  const next = blocks.map(cloneBlock);
  const parentBlock = path.length === 0 ? null : getBlockAt(next, path);
  if (path.length > 0 && parentBlock?.type !== 'section') {
    throw new Error('Blocks can only be added inside a section container.');
  }
  const target = path.length === 0 ? next : (parentBlock!.children ??= []);
  const at = index ?? target.length;
  target.splice(at, 0, createBlock(type));
  return next;
}

export function removeBlock(blocks: Block[], path: BlockPath): Block[] {
  const next = blocks.map(cloneBlock);
  const parent = getParentArray(next, path);
  const index = path[path.length - 1];
  parent.splice(index, 1);
  return next;
}

export function moveBlock(blocks: Block[], path: BlockPath, direction: -1 | 1): Block[] {
  const next = blocks.map(cloneBlock);
  const parent = getParentArray(next, path);
  const index = path[path.length - 1];
  const target = index + direction;
  if (target < 0 || target >= parent.length) return blocks;
  const [item] = parent.splice(index, 1);
  parent.splice(target, 0, item);
  return next;
}

export function updateBlock(blocks: Block[], path: BlockPath, patch: Partial<Block>): Block[] {
  const next = blocks.map(cloneBlock);
  const block = getBlockAt(next, path);
  if (!block) return blocks;
  Object.assign(block, patch);
  if (patch.config) block.config = { ...block.config, ...patch.config };
  return next;
}

export function setBlockConfig(
  blocks: Block[],
  path: BlockPath,
  config: Record<string, unknown>,
): Block[] {
  return updateBlock(blocks, path, { config });
}

export function addChecklistItem(blocks: Block[], path: BlockPath): Block[] {
  const next = blocks.map(cloneBlock);
  const block = getBlockAt(next, path);
  if (!block || block.type !== 'checklist') return blocks;
  const items = (block.config.items as ChecklistItem[] | undefined) ?? [];
  items.push({ id: newBlockId(), label: `Item ${items.length + 1}` });
  block.config = { ...block.config, items };
  return next;
}

export function removeChecklistItem(blocks: Block[], path: BlockPath, itemId: string): Block[] {
  const next = blocks.map(cloneBlock);
  const block = getBlockAt(next, path);
  if (!block || block.type !== 'checklist') return blocks;
  const items = ((block.config.items as ChecklistItem[] | undefined) ?? []).filter(
    (item) => item.id !== itemId,
  );
  block.config = { ...block.config, items };
  return next;
}

export function updateChecklistItem(
  blocks: Block[],
  path: BlockPath,
  itemId: string,
  label: string,
): Block[] {
  const next = blocks.map(cloneBlock);
  const block = getBlockAt(next, path);
  if (!block || block.type !== 'checklist') return blocks;
  const items = ((block.config.items as ChecklistItem[] | undefined) ?? []).map((item) =>
    item.id === itemId ? { ...item, label } : item,
  );
  block.config = { ...block.config, items };
  return next;
}

export function addTableColumn(blocks: Block[], path: BlockPath): Block[] {
  const next = blocks.map(cloneBlock);
  const block = getBlockAt(next, path);
  if (!block || block.type !== 'table') return blocks;
  const columns = (block.config.columns as TableColumn[] | undefined) ?? [];
  const key = `col${columns.length + 1}`;
  columns.push({ key, title: `Column ${columns.length + 1}`, width: DEFAULT_TABLE_COL_WIDTH });
  block.config = { ...block.config, columns };
  return next;
}

export function removeTableColumn(blocks: Block[], path: BlockPath, columnKey: string): Block[] {
  const next = blocks.map(cloneBlock);
  const block = getBlockAt(next, path);
  if (!block || block.type !== 'table') return blocks;
  const columns = ((block.config.columns as TableColumn[] | undefined) ?? []).filter(
    (col) => col.key !== columnKey,
  );
  block.config = { ...block.config, columns };
  const value = syncTableRowHeights(readTableValue(block.value));
  value.rows = value.rows.map((row) => {
    const nextRow = { ...row };
    delete nextRow[columnKey];
    return nextRow;
  });
  block.value = value;
  return next;
}

export function updateTableColumn(
  blocks: Block[],
  path: BlockPath,
  columnKey: string,
  title: string,
): Block[] {
  const next = blocks.map(cloneBlock);
  const block = getBlockAt(next, path);
  if (!block || block.type !== 'table') return blocks;
  const columns = ((block.config.columns as TableColumn[] | undefined) ?? []).map((col) =>
    col.key === columnKey ? { ...col, title } : col,
  );
  block.config = { ...block.config, columns };
  return next;
}

export function updateTableColumnWidth(
  blocks: Block[],
  path: BlockPath,
  columnKey: string,
  width: number,
): Block[] {
  const next = blocks.map(cloneBlock);
  const block = getBlockAt(next, path);
  if (!block || block.type !== 'table') return blocks;
  const clamped = clampTableColWidth(width);
  const columns = ((block.config.columns as TableColumn[] | undefined) ?? []).map((col) =>
    col.key === columnKey ? { ...col, width: clamped } : col,
  );
  block.config = { ...block.config, columns };
  return next;
}

export function setTableLayoutLocked(
  blocks: Block[],
  path: BlockPath,
  locked: boolean,
): Block[] {
  const next = blocks.map(cloneBlock);
  const block = getBlockAt(next, path);
  if (!block || block.type !== 'table') return blocks;
  block.config = { ...block.config, layoutLocked: locked };
  return next;
}

export function addTableRow(blocks: Block[], path: BlockPath): Block[] {
  const next = blocks.map(cloneBlock);
  const block = getBlockAt(next, path);
  if (!block || block.type !== 'table') return blocks;
  const columns = (block.config.columns as TableColumn[] | undefined) ?? [];
  const value = syncTableRowHeights(readTableValue(block.value));
  const row: Record<string, string> = {};
  for (const col of columns) row[col.key] = '';
  value.rows = [...value.rows, row];
  value.rowHeights = [...(value.rowHeights ?? []), DEFAULT_TABLE_ROW_HEIGHT];
  block.value = value;
  return next;
}

export function removeTableRow(blocks: Block[], path: BlockPath, rowIndex: number): Block[] {
  const next = blocks.map(cloneBlock);
  const block = getBlockAt(next, path);
  if (!block || block.type !== 'table') return blocks;
  const value = syncTableRowHeights(readTableValue(block.value));
  value.rows = value.rows.filter((_, i) => i !== rowIndex);
  value.rowHeights = (value.rowHeights ?? []).filter((_, i) => i !== rowIndex);
  block.value = value;
  return next;
}

export function updateTableRowHeight(
  blocks: Block[],
  path: BlockPath,
  rowIndex: number,
  height: number,
): Block[] {
  const next = blocks.map(cloneBlock);
  const block = getBlockAt(next, path);
  if (!block || block.type !== 'table') return blocks;
  const value = syncTableRowHeights(readTableValue(block.value));
  if (rowIndex < 0 || rowIndex >= value.rows.length) return blocks;
  const rowHeights = [...(value.rowHeights ?? [])];
  rowHeights[rowIndex] = clampTableRowHeight(height);
  value.rowHeights = rowHeights;
  block.value = value;
  return next;
}

export function updateTableCell(
  blocks: Block[],
  path: BlockPath,
  rowIndex: number,
  columnKey: string,
  cellValue: string,
): Block[] {
  const next = blocks.map(cloneBlock);
  const block = getBlockAt(next, path);
  if (!block || block.type !== 'table') return blocks;
  const value = readTableValue(block.value);
  const rows = value.rows ?? [];
  if (rowIndex < 0 || rowIndex >= rows.length) return blocks;
  value.rows = rows.map((row, index) =>
    index === rowIndex ? { ...row, [columnKey]: cellValue } : row,
  );
  block.value = syncTableRowHeights(value);
  return next;
}

export function setBlockValue(blocks: Block[], path: BlockPath, value: unknown): Block[] {
  const next = blocks.map(cloneBlock);
  const block = getBlockAt(next, path);
  if (!block) return blocks;
  block.value = value === undefined ? null : structuredClone(value);
  return next;
}

export function adjustLinesCount(blocks: Block[], path: BlockPath, delta: number): Block[] {
  const next = blocks.map(cloneBlock);
  const block = getBlockAt(next, path);
  if (!block || block.type !== 'lines') return blocks;
  const count = Math.max(1, Math.min(50, ((block.config.count as number) ?? 1) + delta));
  block.config = { ...block.config, count };
  return next;
}
