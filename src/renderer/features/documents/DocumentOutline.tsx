import { useMemo } from 'react';
import { Menu, PanelRightClose } from 'lucide-react';
import type { Block } from '../../../shared/document';
import {
  buildDocumentOutline,
  scrollToDocumentBlock,
  type OutlineNode,
} from '../../../shared/document/outline';
import { cn } from '../../lib/cn';
import { useDocumentOutlineRail } from './DocumentOutlineContext';

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
    return <p className="px-2 py-4 text-xs text-[var(--ba-text-muted)]">No sections yet.</p>;
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
              'w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--ba-hover-bg)]',
              node.kind === 'section'
                ? 'font-medium text-[var(--ba-text-primary)]'
                : 'text-[var(--ba-text-secondary)]',
            )}
            style={{ paddingLeft: 8 + node.depth * 12 }}
            title={node.label}
          >
            <span className="block truncate text-xs">{node.label}</span>
            {node.kind !== 'section' && (
              <span className="block truncate text-[10px] text-[var(--ba-text-muted)]">
                {kindLabel(node.kind)}
              </span>
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

function DocumentOutlineContent({
  blocks,
  onNavigate,
  onCollapse,
}: {
  blocks: Block[];
  onNavigate?: (blockId: string) => void;
  onCollapse: () => void;
}) {
  const outline = useMemo(() => buildDocumentOutline(blocks), [blocks]);

  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--ba-chrome-border)] px-2 py-2">
        <span className="truncate px-1 text-xs font-semibold text-[var(--ba-text-primary)]">
          Contents
        </span>
        <button
          type="button"
          onClick={onCollapse}
          className="rounded-md p-1 text-[var(--ba-text-muted)] transition-colors hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)]"
          aria-label="Collapse contents panel"
          title="Collapse"
        >
          <PanelRightClose className="size-4" />
        </button>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto p-2">
        <OutlineTree nodes={outline} onNavigate={onNavigate} />
      </nav>
    </>
  );
}

/** Thin right-edge rail; visible only when a document/template editor registers blocks. */
export function DocumentOutlineRail() {
  const { registration, expanded, setExpanded } = useDocumentOutlineRail();

  if (!registration) return null;

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col overflow-hidden border-l border-[var(--ba-chrome-border)] bg-[var(--ba-chrome-bg)] transition-[width] duration-200 ease-out',
        expanded ? 'w-60' : 'w-8',
      )}
      aria-label="Document contents"
    >
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex h-full w-full items-center justify-center text-[var(--ba-text-muted)] transition-colors hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)]"
          aria-label="Open contents"
          title="Contents"
        >
          <Menu className="size-4 shrink-0" aria-hidden />
        </button>
      ) : (
        <DocumentOutlineContent
          blocks={registration.blocks}
          onNavigate={registration.onNavigate}
          onCollapse={() => setExpanded(false)}
        />
      )}
    </aside>
  );
}
