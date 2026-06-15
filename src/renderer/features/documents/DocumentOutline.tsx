import { useMemo } from 'react';
import { List, X } from 'lucide-react';
import type { Block } from '../../../shared/document';
import { buildDocumentOutline, scrollToDocumentBlock, type OutlineNode } from '../../../shared/document/outline';
import { cn } from '../../lib/cn';

function kindLabel(kind: OutlineNode['kind']): string {
  switch (kind) {
    case 'section':
      return 'Section';
    case 'heading':
      return 'Heading';
    case 'paragraph':
      return 'Paragraph';
    case 'checklist':
      return 'Checklist';
    case 'table':
      return 'Table';
    case 'field':
      return 'Field';
    default:
      return 'Block';
  }
}

function OutlineTree({
  nodes,
  onNavigate,
}: {
  nodes: OutlineNode[];
  onNavigate?: (blockId: string) => void;
}) {
  if (nodes.length === 0) {
    return <p className="px-2 py-4 text-xs text-neutral-500">No sections or headings yet.</p>;
  }

  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => (
        <li key={node.id}>
          <button
            type="button"
            onClick={() => {
              scrollToDocumentBlock(node.id);
              onNavigate?.(node.id);
            }}
            className={cn(
              'w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/5',
              node.kind === 'section' ? 'font-medium text-neutral-100' : 'text-neutral-300',
            )}
            style={{ paddingLeft: 8 + node.depth * 12 }}
            title={node.label}
          >
            <span className="block truncate text-xs">{node.label}</span>
            {node.kind !== 'section' && (
              <span className="block truncate text-[10px] text-neutral-500">{kindLabel(node.kind)}</span>
            )}
          </button>
          {node.children && node.children.length > 0 && (
            <OutlineTree nodes={node.children} onNavigate={onNavigate} />
          )}
        </li>
      ))}
    </ul>
  );
}

export function DocumentOutlinePanel({
  blocks,
  onClose,
  onNavigate,
}: {
  blocks: Block[];
  onClose: () => void;
  onNavigate?: (blockId: string) => void;
}) {
  const outline = useMemo(() => buildDocumentOutline(blocks), [blocks]);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-l border-white/5 bg-neutral-950/40">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
          <List className="size-3.5 text-neutral-400" />
          Contents
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
          aria-label="Close contents panel"
        >
          <X className="size-4" />
        </button>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto p-2">
        <OutlineTree nodes={outline} onNavigate={onNavigate} />
      </nav>
    </aside>
  );
}

export function DocumentOutlineToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors',
        open
          ? 'border-flame-500/40 bg-flame-500/10 text-flame-200'
          : 'border-white/10 text-neutral-300 hover:bg-white/5',
      )}
      aria-expanded={open}
    >
      <List className="size-3.5" />
      Contents
    </button>
  );
}
