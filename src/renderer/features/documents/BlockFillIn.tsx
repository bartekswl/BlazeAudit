import type { Block, BlockPath } from '../../../shared/document';
import { insertBlock, updateBlock } from '../../../shared/document';
import { blockTypeLabel } from '../templates/blockCatalog';
import { inputCls } from '../templates/BlockList';
import { InsertSectionDivider, SectionAddBlockBar } from './DocumentStructureControls';
import { TableFillIn } from './TableFillIn';

type ChecklistValue = Record<string, 'pass' | 'fail' | 'na' | null>;

function normalizeLinesValue(value: unknown, count: number): string[] {
  if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
    const lines = value as string[];
    if (lines.length >= count) return lines.slice(0, count);
    return [...lines, ...Array.from({ length: count - lines.length }, () => '')];
  }
  return Array.from({ length: count }, () => '');
}

export function BlockFillIn({
  blocks,
  pathPrefix = [],
  onValueChange,
  onPatchBlocks,
  canEditStructure = false,
}: {
  blocks: Block[];
  pathPrefix?: BlockPath;
  onValueChange: (path: BlockPath, value: unknown) => void;
  onPatchBlocks: (mutator: (blocks: Block[]) => Block[]) => void;
  canEditStructure?: boolean;
}) {
  const isRoot = pathPrefix.length === 0;

  return (
    <div className="min-w-0 space-y-4">
      {blocks.map((block, index) => {
        const path = [...pathPrefix, index];

        if (block.type === 'section') {
          const included = (block.value as { included?: boolean } | null)?.included ?? true;
          const isHiddenOptional = Boolean(block.config.optional) && !included;

          return (
            <div key={block.id} className="min-w-0 space-y-4">
              {canEditStructure && isRoot && (
                <InsertSectionDivider
                  onInsert={() =>
                    onPatchBlocks((root) => insertBlock(root, [], 'section', index))
                  }
                />
              )}

              {isHiddenOptional ? (
                canEditStructure && (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] px-4 py-3">
                    <label className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                      <span>{block.label || 'Section'} (excluded)</span>
                      <span className="flex items-center gap-2">
                        Include section
                        <input
                          type="checkbox"
                          checked={included}
                          onChange={(e) => onValueChange(path, { included: e.target.checked })}
                        />
                      </span>
                    </label>
                  </div>
                )
              ) : (
                <section className="min-w-0 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    {canEditStructure ? (
                      <input
                        className="min-w-0 flex-1 rounded border border-white/10 bg-neutral-950 px-2 py-1 text-sm font-semibold text-neutral-100 outline-none focus:border-flame-500"
                        value={block.label ?? ''}
                        placeholder="Section title"
                        onChange={(e) =>
                          onPatchBlocks((root) =>
                            updateBlock(root, path, { label: e.target.value }),
                          )
                        }
                      />
                    ) : (
                      <h3 className="text-sm font-semibold text-neutral-100">
                        {block.label || 'Section'}
                      </h3>
                    )}
                    {Boolean(block.config.optional) && (
                      <label className="flex shrink-0 items-center gap-2 text-xs text-neutral-400">
                        <input
                          type="checkbox"
                          checked={included}
                          onChange={(e) => onValueChange(path, { included: e.target.checked })}
                        />
                        Include section
                      </label>
                    )}
                  </div>
                  {block.children && block.children.length > 0 && (
                    <BlockFillIn
                      blocks={block.children}
                      pathPrefix={path}
                      onValueChange={onValueChange}
                      onPatchBlocks={onPatchBlocks}
                      canEditStructure={canEditStructure}
                    />
                  )}
                  {canEditStructure && (
                    <SectionAddBlockBar sectionPath={path} onPatchBlocks={onPatchBlocks} />
                  )}
                </section>
              )}
            </div>
          );
        }

        return (
          <div key={block.id} className="min-w-0 space-y-4">
            {canEditStructure && isRoot && (
              <InsertSectionDivider
                onInsert={() =>
                  onPatchBlocks((root) => insertBlock(root, [], 'section', index))
                }
              />
            )}
            <div className="min-w-0 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <BlockFillInItem
                block={block}
                path={path}
                onValueChange={onValueChange}
                onPatchBlocks={onPatchBlocks}
              />
            </div>
          </div>
        );
      })}

      {canEditStructure && isRoot && (
        <InsertSectionDivider
          onInsert={() => onPatchBlocks((root) => insertBlock(root, [], 'section'))}
        />
      )}
    </div>
  );
}

function BlockFillInItem({
  block,
  path,
  onValueChange,
  onPatchBlocks,
}: {
  block: Block;
  path: BlockPath;
  onValueChange: (path: BlockPath, value: unknown) => void;
  onPatchBlocks: (mutator: (blocks: Block[]) => Block[]) => void;
}) {
  switch (block.type) {
    case 'heading': {
      const level = (block.config.level as number) ?? 2;
      const text = (block.config.text as string) ?? '';
      const Tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
      return <Tag className="font-semibold text-neutral-100">{text}</Tag>;
    }
    case 'paragraph':
      return <p className="text-sm leading-relaxed text-neutral-300">{(block.config.text as string) ?? ''}</p>;
    case 'textField':
      return (
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-neutral-400">
            {block.label || 'Field'}
          </span>
          {(block.config.multiline as boolean) ? (
            <textarea
              className={`${inputCls} min-h-24 resize-y`}
              value={(block.value as string) ?? ''}
              placeholder={(block.config.placeholder as string) ?? ''}
              onChange={(e) => onValueChange(path, e.target.value)}
            />
          ) : (
            <input
              className={inputCls}
              value={(block.value as string) ?? ''}
              placeholder={(block.config.placeholder as string) ?? ''}
              onChange={(e) => onValueChange(path, e.target.value)}
            />
          )}
        </label>
      );
    case 'lines': {
      const count = Math.max(1, (block.config.count as number) ?? 1);
      const lineValues = normalizeLinesValue(block.value, count);
      return (
        <div>
          <p className="mb-2 text-xs font-medium text-neutral-400">
            {block.label || 'Write-on lines'}
          </p>
          <div className="space-y-2">
            {lineValues.map((line, i) => (
              <input
                key={i}
                className="w-full border-0 border-b border-white/10 bg-transparent px-0 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-flame-500/50"
                value={line}
                placeholder={`Line ${i + 1}`}
                onChange={(e) => {
                  const next = [...lineValues];
                  next[i] = e.target.value;
                  onValueChange(path, next);
                }}
              />
            ))}
          </div>
        </div>
      );
    }
    case 'checklist': {
      const items = (block.config.items as { id: string; label: string }[]) ?? [];
      const values = (block.value as ChecklistValue) ?? {};
      return (
        <div>
          <p className="mb-2 text-xs font-medium text-neutral-400">
            {block.label || 'Checklist'}
          </p>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 text-neutral-200">{item.label}</span>
                {(['pass', 'fail', 'na'] as const).map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() =>
                      onValueChange(path, { ...values, [item.id]: choice })
                    }
                    className={`rounded-md border px-2 py-1 text-xs uppercase ${
                      values[item.id] === choice
                        ? 'border-flame-500/50 bg-flame-500/15 text-flame-300'
                        : 'border-white/10 text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {choice}
                  </button>
                ))}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case 'table':
      return <TableFillIn block={block} path={path} onPatchBlocks={onPatchBlocks} />;
    case 'signature': {
      const value = (block.value as { name?: string; date?: string | null }) ?? {};
      return (
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-400">{block.label || 'Signature'}</p>
          <input
            className={inputCls}
            placeholder="Inspector name"
            value={value.name ?? ''}
            onChange={(e) => onValueChange(path, { ...value, name: e.target.value })}
          />
          <input
            className={inputCls}
            type="date"
            value={value.date ?? ''}
            onChange={(e) => onValueChange(path, { ...value, date: e.target.value || null })}
          />
          <p className="text-xs text-neutral-600">Handwritten signature capture is planned for a later update.</p>
        </div>
      );
    }
    case 'spacer':
      return <div className="h-4" aria-hidden />;
    case 'image':
      return (
        <p className="text-xs text-neutral-500">
          {block.label || blockTypeLabel(block.type)} — image upload arrives in a later phase.
        </p>
      );
    default:
      return null;
  }
}
