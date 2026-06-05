import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Block, BlockPath, BlockType } from '../../../shared/document';
import { insertBlock } from '../../../shared/document';
import { BLOCK_CATALOG } from '../templates/blockCatalog';
import { inputCls } from '../templates/BlockList';

export function InsertSectionDivider({ onInsert }: { onInsert: () => void }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <div className="h-px flex-1 border-t border-dashed border-white/10" />
      <button
        type="button"
        onClick={onInsert}
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-dashed border-white/15 px-2 py-1 text-[11px] text-neutral-500 transition-colors hover:border-flame-500/30 hover:bg-flame-500/5 hover:text-flame-300"
      >
        <Plus className="size-3" />
        Section
      </button>
      <div className="h-px flex-1 border-t border-dashed border-white/10" />
    </div>
  );
}

export function SectionAddBlockBar({
  sectionPath,
  onPatchBlocks,
}: {
  sectionPath: BlockPath;
  onPatchBlocks: (mutator: (blocks: Block[]) => Block[]) => void;
}) {
  const [addType, setAddType] = useState<BlockType>('textField');

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-white/10 pt-3">
      <select
        className={`${inputCls} w-auto min-w-32 text-xs`}
        value={addType}
        onChange={(e) => setAddType(e.target.value as BlockType)}
      >
        {BLOCK_CATALOG.map((item) => (
          <option key={item.type} value={item.type}>
            {item.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onPatchBlocks((blocks) => insertBlock(blocks, sectionPath, addType))}
        className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1.5 text-[11px] text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
      >
        <Plus className="size-3.5" />
        Add block
      </button>
    </div>
  );
}
