import { useMemo } from 'react';
import { Menu, PanelRightClose } from 'lucide-react';
import type { Block } from '../../../shared/document';
import type { FormOutlineSection } from '../../../shared/form/outline';
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

function FormOutlineList({
  sections,
  onNavigate,
}: {
  sections: FormOutlineSection[];
  onNavigate?: (sectionId: string, pageIndex: number) => void;
}) {
  if (sections.length === 0) {
    return <p className="px-2 py-4 text-xs text-[var(--ba-text-muted)]">No sections yet.</p>;
  }

  return (
    <ul className="space-y-0.5">
      {sections.map((section) => (
        <li key={section.id}>
          <button
            type="button"
            onClick={() => onNavigate?.(section.id, section.pageIndex)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md py-1.5 text-left transition-colors hover:bg-[var(--ba-hover-bg)]',
              section.subdued
                ? 'font-normal text-[var(--ba-text-secondary)]'
                : 'font-medium text-[var(--ba-text-primary)]',
            )}
            style={{
              paddingLeft:
                section.indentExtra === '0'
                  ? 8
                  : `calc(0.5rem + ${section.indentExtra})`,
              paddingRight: 8,
            }}
            title={section.label}
          >
            <span className="min-w-0 flex-1 truncate text-xs">{section.label}</span>
            <span className="shrink-0 text-[10px] text-[var(--ba-text-muted)]">
              {section.pageLabel}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function DocumentOutlineContent({
  title,
  blocks,
  formSections,
  onNavigate,
  onFormNavigate,
  onCollapse,
}: {
  title?: string;
  blocks?: Block[];
  formSections?: FormOutlineSection[];
  onNavigate?: (blockId: string) => void;
  onFormNavigate?: (sectionId: string, pageIndex: number) => void;
  onCollapse: () => void;
}) {
  const outline = useMemo(() => buildDocumentOutline(blocks ?? []), [blocks]);
  const isForm = (formSections?.length ?? 0) > 0;

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
        {title ? (
          <p
            className="mb-2 truncate px-2 text-xs font-semibold text-[var(--ba-text-primary)]"
            title={title}
          >
            {title}
          </p>
        ) : null}
        {isForm ? (
          <FormOutlineList sections={formSections ?? []} onNavigate={onFormNavigate} />
        ) : (
          <OutlineTree nodes={outline} onNavigate={onNavigate} />
        )}
      </nav>
    </>
  );
}

/** Thin right-edge rail; visible only when a document/template editor registers blocks. */
export function DocumentOutlineRail() {
  const { registration, expanded, setExpanded } = useDocumentOutlineRail();

  if (!registration) return null;

  const hasForm = (registration.formSections?.length ?? 0) > 0;
  const hasBlocks = (registration.blocks?.length ?? 0) > 0;
  if (!hasForm && !hasBlocks) return null;

  return (
    <aside
      className={cn(
        'relative h-full shrink-0 overflow-hidden border-l border-[var(--ba-chrome-border)] bg-[var(--ba-chrome-bg)]',
        'transition-[width] duration-[400ms] ease-in-out',
        expanded ? 'w-60' : 'w-10',
      )}
      aria-label="Document contents"
      aria-expanded={expanded}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 flex w-60 flex-col bg-[var(--ba-chrome-bg)]',
          'transition-transform duration-[400ms] ease-in-out',
          expanded ? 'translate-x-0' : 'translate-x-[calc(100%-2.5rem)]',
        )}
      >
        <DocumentOutlineContent
          title={registration.title}
          blocks={registration.blocks}
          formSections={registration.formSections}
          onNavigate={registration.onNavigate}
          onFormNavigate={registration.onFormNavigate}
          onCollapse={() => setExpanded(false)}
        />
      </div>

      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="group absolute inset-y-0 left-0 z-10 flex w-10 flex-col items-center justify-center gap-3 bg-[var(--ba-chrome-bg)] py-6 text-[var(--ba-text-muted)] hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)]"
          aria-label="Open contents"
          title="Contents"
        >
          <Menu className="size-4 shrink-0" aria-hidden />
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--ba-text-muted)] group-hover:text-[var(--ba-text-primary)]"
            style={{ writingMode: 'vertical-rl' }}
          >
            Contents
          </span>
        </button>
      )}
    </aside>
  );
}
