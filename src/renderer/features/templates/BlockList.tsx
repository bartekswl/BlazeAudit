import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { Block, BlockPath } from '../../../shared/document';
import { cn } from '../../lib/cn';
import { blockTypeLabel } from './blockCatalog';

const inputCls =
  'w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-flame-500';

function pathKey(path: BlockPath): string {
  return path.join('.');
}

function blockSummary(block: Block): string {
  switch (block.type) {
    case 'heading':
      return (block.config.text as string) || 'Heading';
    case 'paragraph':
      return ((block.config.text as string) || 'Paragraph').slice(0, 48);
    case 'table':
      return block.label || 'Table';
    case 'checklist':
      return block.label || 'Checklist';
    default:
      return block.label || blockTypeLabel(block.type);
  }
}

export function BlockList({
  blocks,
  pathPrefix,
  selectedPath,
  onSelect,
  onMove,
  onRemove,
  depth = 0,
}: {
  blocks: Block[];
  pathPrefix: BlockPath;
  selectedPath: BlockPath | null;
  onSelect: (path: BlockPath) => void;
  onMove: (path: BlockPath, direction: -1 | 1) => void;
  onRemove: (path: BlockPath) => void;
  depth?: number;
}) {
  if (blocks.length === 0 && depth === 0) {
    return (
      <p className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-center text-sm text-neutral-500">
        No blocks yet. Add a block to start building this template.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {blocks.map((block, index) => {
        const path = [...pathPrefix, index];
        const selected = pathKey(selectedPath ?? []) === pathKey(path);

        return (
          <li key={block.id}>
            <div
              className={cn(
                'flex items-center gap-1 rounded-lg border px-2 py-1.5',
                selected
                  ? 'border-flame-500/40 bg-flame-500/10'
                  : 'border-white/5 bg-neutral-950/40 hover:border-white/10',
              )}
              style={{ marginLeft: depth * 12 }}
            >
              <button
                type="button"
                onClick={() => onSelect(path)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-sm font-medium text-neutral-100">
                  {blockSummary(block)}
                </span>
                <span className="block text-xs text-neutral-500">{blockTypeLabel(block.type)}</span>
              </button>
              <button
                type="button"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => onMove(path, -1)}
                className="rounded p-1 text-neutral-500 hover:bg-white/5 hover:text-neutral-200 disabled:opacity-30"
              >
                <ChevronUp className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={index === blocks.length - 1}
                onClick={() => onMove(path, 1)}
                className="rounded p-1 text-neutral-500 hover:bg-white/5 hover:text-neutral-200 disabled:opacity-30"
              >
                <ChevronDown className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="Remove block"
                onClick={() => onRemove(path)}
                className="rounded p-1 text-neutral-500 hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>

            {block.type === 'section' && block.children && block.children.length > 0 && (
              <div className="mt-1">
                <BlockList
                  blocks={block.children}
                  pathPrefix={path}
                  selectedPath={selectedPath}
                  onSelect={onSelect}
                  onMove={onMove}
                  onRemove={onRemove}
                  depth={depth + 1}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export { inputCls };
