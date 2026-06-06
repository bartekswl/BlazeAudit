import { Minus, Plus, Trash2 } from 'lucide-react';
import type { Block, BlockPath, Document } from '../../../shared/document';
import {
  addChecklistItem,
  addTableColumn,
  addTableRow,
  adjustLinesCount,
  removeChecklistItem,
  removeTableColumn,
  removeTableRow,
  setBlockConfig,
  updateBlock,
  updateChecklistItem,
  updateTableColumn,
} from '../../../shared/document';
import { blockTypeLabel } from './blockCatalog';
import { inputCls } from './BlockList';

export function BlockEditor({
  document,
  path,
  onChange,
}: {
  document: Document;
  path: BlockPath;
  onChange: (document: Document) => void;
}) {
  const block = getBlock(document.blocks, path);
  if (!block) {
    return (
      <p className="text-sm text-neutral-500">Select a block from the list to edit its settings.</p>
    );
  }

  const patchBlock = (nextBlocks: Block[]) => {
    onChange({ ...document, blocks: nextBlocks });
  };

  const update = (patch: Partial<Block>) => {
    patchBlock(updateBlock(document.blocks, path, patch));
  };

  const setConfig = (config: Record<string, unknown>) => {
    patchBlock(setBlockConfig(document.blocks, path, config));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-neutral-100">{blockTypeLabel(block.type)}</h3>
        <p className="text-xs text-neutral-500">Configure the selected block.</p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-neutral-400">Label (optional)</span>
        <input
          className={inputCls}
          value={block.label ?? ''}
          onChange={(e) => update({ label: e.target.value })}
        />
      </label>

      {block.type === 'heading' && (
        <>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-neutral-400">Text</span>
            <input
              className={inputCls}
              value={(block.config.text as string) ?? ''}
              onChange={(e) => setConfig({ ...block.config, text: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-neutral-400">Level</span>
            <select
              className={inputCls}
              value={String(block.config.level ?? 2)}
              onChange={(e) => setConfig({ ...block.config, level: Number(e.target.value) })}
            >
              <option value="1">1 — largest</option>
              <option value="2">2</option>
              <option value="3">3 — smallest</option>
            </select>
          </label>
        </>
      )}

      {block.type === 'paragraph' && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-neutral-400">Text</span>
          <textarea
            className={`${inputCls} min-h-24 resize-y`}
            value={(block.config.text as string) ?? ''}
            onChange={(e) => setConfig({ ...block.config, text: e.target.value })}
          />
        </label>
      )}

      {block.type === 'textField' && (
        <>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={Boolean(block.config.multiline)}
              onChange={(e) => setConfig({ ...block.config, multiline: e.target.checked })}
            />
            Multi-line field
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-neutral-400">Placeholder</span>
            <input
              className={inputCls}
              value={(block.config.placeholder as string) ?? ''}
              onChange={(e) => setConfig({ ...block.config, placeholder: e.target.value })}
            />
          </label>
        </>
      )}

      {block.type === 'lines' && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-300">Line count</span>
          <button
            type="button"
            onClick={() => patchBlock(adjustLinesCount(document.blocks, path, -1))}
            className="rounded-lg border border-white/10 p-2 text-neutral-300 hover:bg-white/5"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center text-sm font-medium text-neutral-100">
            {(block.config.count as number) ?? 1}
          </span>
          <button
            type="button"
            onClick={() => patchBlock(adjustLinesCount(document.blocks, path, 1))}
            className="rounded-lg border border-white/10 p-2 text-neutral-300 hover:bg-white/5"
          >
            <Plus className="size-4" />
          </button>
        </div>
      )}

      {block.type === 'checklist' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-400">Checklist items</p>
          {((block.config.items as { id: string; label: string }[]) ?? []).map((item) => (
            <div key={item.id} className="flex gap-2">
              <input
                className={inputCls}
                value={item.label}
                onChange={(e) =>
                  patchBlock(updateChecklistItem(document.blocks, path, item.id, e.target.value))
                }
              />
              <button
                type="button"
                aria-label="Remove item"
                onClick={() => patchBlock(removeChecklistItem(document.blocks, path, item.id))}
                className="rounded-lg border border-white/10 px-2 text-neutral-500 hover:text-red-300"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => patchBlock(addChecklistItem(document.blocks, path))}
            className="text-sm text-flame-400 hover:text-flame-300"
          >
            + Add line
          </button>
        </div>
      )}

      {block.type === 'table' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-400">Columns</p>
            {((block.config.columns as { key: string; title: string }[]) ?? []).map((col) => (
              <div key={col.key} className="flex gap-2">
                <input
                  className={inputCls}
                  value={col.title}
                  onChange={(e) =>
                    patchBlock(updateTableColumn(document.blocks, path, col.key, e.target.value))
                  }
                />
                <button
                  type="button"
                  aria-label="Remove column"
                  onClick={() => patchBlock(removeTableColumn(document.blocks, path, col.key))}
                  className="rounded-lg border border-white/10 px-2 text-neutral-500 hover:text-red-300"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => patchBlock(addTableColumn(document.blocks, path))}
              className="text-sm text-flame-400 hover:text-flame-300"
            >
              + Add column
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-400">Starter rows (template)</p>
            <p className="text-xs text-neutral-600">
              {(block.value as { rows?: unknown[] } | null)?.rows?.length ?? 0} row(s) defined
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => patchBlock(addTableRow(document.blocks, path))}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/5"
              >
                + Add row
              </button>
              <button
                type="button"
                onClick={() => {
                  const rows = (block.value as { rows?: Record<string, string>[] })?.rows ?? [];
                  if (rows.length === 0) return;
                  patchBlock(removeTableRow(document.blocks, path, rows.length - 1));
                }}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/5"
              >
                − Remove last row
              </button>
            </div>
          </div>
        </div>
      )}

      {block.type === 'section' && (
        <>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={Boolean(block.config.collapsible)}
              onChange={(e) => setConfig({ ...block.config, collapsible: e.target.checked })}
            />
            Collapsible in editor
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={Boolean(block.config.optional)}
              onChange={(e) => setConfig({ ...block.config, optional: e.target.checked })}
            />
            Optional section (can be toggled off)
          </label>
          <p className="text-xs text-neutral-500">
            Add blocks while this section is selected to nest children inside it.
          </p>
        </>
      )}

      {block.type === 'spacer' && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-neutral-400">Size</span>
          <select
            className={inputCls}
            value={(block.config.size as string) ?? 'md'}
            onChange={(e) => setConfig({ ...block.config, size: e.target.value })}
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </label>
      )}

      {(block.type === 'signature' || block.type === 'image') && (
        <p className="text-xs text-neutral-500">
          This block is filled in during inspections. No extra template settings.
        </p>
      )}
    </div>
  );
}

function getBlock(blocks: Block[], path: BlockPath): Block | null {
  let current = blocks;
  let node: Block | undefined;
  for (let i = 0; i < path.length; i++) {
    node = current[path[i]];
    if (!node) return null;
    if (i < path.length - 1) {
      if (!node.children) return null;
      current = node.children;
    }
  }
  return node ?? null;
}
