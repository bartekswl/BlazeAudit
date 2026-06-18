import { memo, useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { Block, BlockPath } from '../../../shared/document';
import { insertBlock, markChecklistsNaInTree, updateBlock } from '../../../shared/document';
import { docAnchorId } from '../../../shared/document/outline';
import { blockTypeLabel } from '../templates/blockCatalog';
import { inputCls } from '../templates/BlockList';
import { InsertSectionDivider, SectionAddBlockBar } from './DocumentStructureControls';
import { TableFillIn } from './TableFillIn';

type ChecklistValue = Record<string, 'pass' | 'fail' | 'na' | null>;

const COMMIT_MS = 200;

function normalizeLinesValue(value: unknown, count: number): string[] {
  if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
    const lines = value as string[];
    if (lines.length >= count) return lines.slice(0, count);
    return [...lines, ...Array.from({ length: count - lines.length }, () => '')];
  }
  return Array.from({ length: count }, () => '');
}

function LazyTextInput({
  value,
  onCommit,
  multiline = false,
  className,
  placeholder,
  type = 'text',
  readOnly = false,
}: {
  value: string;
  onCommit: (value: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) {
  const [local, setLocal] = useState(value);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (local === value) return;
    const id = window.setTimeout(() => onCommitRef.current(local), COMMIT_MS);
    return () => window.clearTimeout(id);
  }, [local, value]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLocal(event.target.value);
  };

  const handleBlur = () => {
    if (local !== value) onCommitRef.current(local);
  };

  if (readOnly) {
    if (multiline) {
      return (
        <div
          className={`${className ?? ''} min-h-[2.5rem] whitespace-pre-wrap text-sm text-neutral-500`}
        >
          {value || placeholder || '—'}
        </div>
      );
    }
    return (
      <div className={`${className ?? ''} text-sm text-neutral-500`}>
        {value || placeholder || '—'}
      </div>
    );
  }

  if (multiline) {
    return (
      <textarea
        className={className}
        placeholder={placeholder}
        value={local}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    );
  }

  return (
    <input
      className={className}
      type={type}
      placeholder={placeholder}
      value={local}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}

function LazyLinesInput({
  values,
  onCommit,
  readOnly = false,
}: {
  values: string[];
  onCommit: (values: string[]) => void;
  readOnly?: boolean;
}) {
  const [local, setLocal] = useState(values);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  useEffect(() => {
    setLocal(values);
  }, [values]);

  useEffect(() => {
    if (local.every((line, index) => line === values[index]) && local.length === values.length) {
      return;
    }
    const id = window.setTimeout(() => onCommitRef.current(local), COMMIT_MS);
    return () => window.clearTimeout(id);
  }, [local, values]);

  if (readOnly) {
    return (
      <div className="space-y-2">
        {values.map((line, index) => (
          <div
            key={index}
            className="border-b border-white/10 py-2 text-sm text-neutral-500"
          >
            {line || `Line ${index + 1}`}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {local.map((line, index) => (
        <input
          key={index}
          className="w-full border-0 border-b border-white/10 bg-transparent px-0 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-flame-500/50"
          value={line}
          placeholder={`Line ${index + 1}`}
          onChange={(event) => {
            const next = [...local];
            next[index] = event.target.value;
            setLocal(next);
          }}
          onBlur={() => {
            if (!local.every((entry, i) => entry === values[i]) || local.length !== values.length) {
              onCommitRef.current(local);
            }
          }}
        />
      ))}
    </div>
  );
}

export function BlockFillIn({
  blocks,
  pathPrefix = [],
  onValueChange,
  onPatchBlocks,
  canEditStructure = false,
  readOnly = false,
}: {
  blocks: Block[];
  pathPrefix?: BlockPath;
  onValueChange: (path: BlockPath, value: unknown) => void;
  onPatchBlocks: (mutator: (blocks: Block[]) => Block[]) => void;
  canEditStructure?: boolean;
  readOnly?: boolean;
}) {
  const isRoot = pathPrefix.length === 0;

  return (
    <div className="min-w-0 space-y-4">
      {blocks.map((block, index) => {
        const path = [...pathPrefix, index];

        if (block.type === 'section') {
          return (
            <BlockFillInSection
              key={block.id}
              block={block}
              path={path}
              isRoot={isRoot}
              index={index}
              onValueChange={onValueChange}
              onPatchBlocks={onPatchBlocks}
              canEditStructure={canEditStructure}
              readOnly={readOnly}
            />
          );
        }

        return (
          <BlockFillInRow
            key={block.id}
            block={block}
            path={path}
            isRoot={isRoot}
            index={index}
            onValueChange={onValueChange}
            onPatchBlocks={onPatchBlocks}
            canEditStructure={canEditStructure}
            readOnly={readOnly}
          />
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

const BlockFillInSection = memo(function BlockFillInSection({
  block,
  path,
  isRoot,
  index,
  onValueChange,
  onPatchBlocks,
  canEditStructure,
  readOnly,
}: {
  block: Block;
  path: BlockPath;
  isRoot: boolean;
  index: number;
  onValueChange: (path: BlockPath, value: unknown) => void;
  onPatchBlocks: (mutator: (blocks: Block[]) => Block[]) => void;
  canEditStructure: boolean;
  readOnly: boolean;
}) {
  const included = (block.value as { included?: boolean } | null)?.included ?? true;
  const isHiddenOptional = Boolean(block.config.optional) && !included && !readOnly;

  return (
    <div className="min-w-0 space-y-4">
      {canEditStructure && isRoot && (
        <InsertSectionDivider
          onInsert={() => onPatchBlocks((root) => insertBlock(root, [], 'section', index))}
        />
      )}

      {isHiddenOptional ? (
        canEditStructure && (
          <div
            id={docAnchorId(block.id)}
            className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] px-4 py-3 scroll-mt-4"
          >
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
        <section
          id={docAnchorId(block.id)}
          className="min-w-0 scroll-mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {canEditStructure ? (
                <input
                  className="min-w-0 flex-1 rounded border border-white/10 bg-neutral-950 px-2 py-1 text-sm font-semibold text-neutral-100 outline-none focus:border-flame-500"
                  value={block.label ?? ''}
                  placeholder="Section title"
                  onChange={(e) =>
                    onPatchBlocks((root) => updateBlock(root, path, { label: e.target.value }))
                  }
                />
              ) : (
                <h3 className="text-sm font-semibold text-neutral-100">{block.label || 'Section'}</h3>
              )}
              {block.config.pageOrientation === 'landscape' && (
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                  Landscape
                </span>
              )}
              {readOnly && Boolean(block.config.optional) && (
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                  Optional
                </span>
              )}
            </div>
            {!readOnly && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {sectionHasChecklist(block.children) && (
                  <button
                    type="button"
                    onClick={() =>
                      onPatchBlocks((root) =>
                        updateBlock(root, path, {
                          children: markChecklistsNaInTree(block.children ?? []),
                        }),
                      )
                    }
                    className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-neutral-500 transition-colors hover:border-flame-500/40 hover:text-flame-300"
                  >
                    Mark section N/A
                  </button>
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
            )}
          </div>
          {block.children && block.children.length > 0 && (
            <BlockFillIn
              blocks={block.children}
              pathPrefix={path}
              onValueChange={onValueChange}
              onPatchBlocks={onPatchBlocks}
              canEditStructure={canEditStructure}
              readOnly={readOnly}
            />
          )}
          {canEditStructure && (
            <SectionAddBlockBar sectionPath={path} onPatchBlocks={onPatchBlocks} />
          )}
        </section>
      )}
    </div>
  );
});

const BlockFillInRow = memo(function BlockFillInRow({
  block,
  path,
  isRoot,
  index,
  onValueChange,
  onPatchBlocks,
  canEditStructure,
  readOnly,
}: {
  block: Block;
  path: BlockPath;
  isRoot: boolean;
  index: number;
  onValueChange: (path: BlockPath, value: unknown) => void;
  onPatchBlocks: (mutator: (blocks: Block[]) => Block[]) => void;
  canEditStructure: boolean;
  readOnly: boolean;
}) {
  return (
    <div className="min-w-0 space-y-4">
      {canEditStructure && isRoot && (
        <InsertSectionDivider
          onInsert={() => onPatchBlocks((root) => insertBlock(root, [], 'section', index))}
        />
      )}
      <div
        id={docAnchorId(block.id)}
        className="min-w-0 scroll-mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4"
      >
        <BlockFillInItem
          block={block}
          path={path}
          onValueChange={onValueChange}
          onPatchBlocks={onPatchBlocks}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
});

const BlockFillInItem = memo(function BlockFillInItem({
  block,
  path,
  onValueChange,
  onPatchBlocks,
  readOnly,
}: {
  block: Block;
  path: BlockPath;
  onValueChange: (path: BlockPath, value: unknown) => void;
  onPatchBlocks: (mutator: (blocks: Block[]) => Block[]) => void;
  readOnly: boolean;
}) {
  switch (block.type) {
    case 'heading': {
      const level = (block.config.level as number) ?? 2;
      const text = (block.config.text as string) ?? '';
      const Tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
      return <Tag className="font-semibold text-neutral-100">{text}</Tag>;
    }
    case 'paragraph':
      return (
        <p className="text-sm leading-relaxed text-neutral-300">{(block.config.text as string) ?? ''}</p>
      );
    case 'textField':
      return (
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-neutral-400">
            {block.label || 'Field'}
          </span>
          <LazyTextInput
            className={`${inputCls} ${(block.config.multiline as boolean) ? 'min-h-24 resize-y' : ''}`}
            multiline={Boolean(block.config.multiline)}
            value={(block.value as string) ?? ''}
            placeholder={(block.config.placeholder as string) ?? ''}
            onCommit={(next) => onValueChange(path, next)}
            readOnly={readOnly}
          />
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
          <LazyLinesInput
            values={lineValues}
            onCommit={(next) => onValueChange(path, next)}
            readOnly={readOnly}
          />
        </div>
      );
    }
    case 'checklist': {
      const items = (block.config.items as { id: string; label: string }[]) ?? [];
      const values = (block.value as ChecklistValue) ?? {};
      const markAllNa = () => {
        const next = { ...values };
        for (const item of items) next[item.id] = 'na';
        onValueChange(path, next);
      };
      return (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-neutral-400">{block.label || 'Checklist'}</p>
            {!readOnly && items.length > 0 && (
              <button
                type="button"
                onClick={markAllNa}
                className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-neutral-500 transition-colors hover:border-flame-500/40 hover:text-flame-300"
              >
                Mark all N/A
              </button>
            )}
          </div>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 text-neutral-200">{item.label}</span>
                {readOnly ? (
                  <div className="flex gap-2">
                    {(['pass', 'fail', 'na'] as const).map((choice) => (
                      <span
                        key={choice}
                        className="rounded-md border border-white/10 px-2 py-1 text-xs uppercase text-neutral-600"
                      >
                        {choice}
                      </span>
                    ))}
                  </div>
                ) : (
                  (['pass', 'fail', 'na'] as const).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => onValueChange(path, { ...values, [item.id]: choice })}
                      className={`rounded-md border px-2 py-1 text-xs uppercase ${
                        values[item.id] === choice
                          ? 'border-flame-500/50 bg-flame-500/15 text-flame-300'
                          : 'border-white/10 text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {choice}
                    </button>
                  ))
                )}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case 'table':
      return (
        <TableFillIn
          block={block}
          path={path}
          onPatchBlocks={onPatchBlocks}
          readOnly={readOnly}
        />
      );
    case 'signature': {
      const value = (block.value as { name?: string; date?: string | null }) ?? {};
      return (
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-400">{block.label || 'Signature'}</p>
          <LazyTextInput
            className={inputCls}
            placeholder="Inspector name"
            value={value.name ?? ''}
            onCommit={(name) => onValueChange(path, { ...value, name })}
            readOnly={readOnly}
          />
          <LazyTextInput
            className={inputCls}
            type="date"
            value={value.date ?? ''}
            onCommit={(date) => onValueChange(path, { ...value, date: date || null })}
            readOnly={readOnly}
          />
          <p className="text-xs text-neutral-600">
            Handwritten signature capture is planned for a later update.
          </p>
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
});

function sectionHasChecklist(blocks: Block[] | undefined): boolean {
  if (!blocks?.length) return false;
  for (const block of blocks) {
    if (block.type === 'checklist') return true;
    if (block.children && sectionHasChecklist(block.children)) return true;
  }
  return false;
}
