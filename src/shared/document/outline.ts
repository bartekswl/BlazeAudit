import type { Block } from './types';
import type { BlockPath } from './mutations';

export type OutlineKind = 'section' | 'heading' | 'paragraph' | 'checklist' | 'table' | 'field' | 'other';

export interface OutlineNode {
  id: string;
  label: string;
  kind: OutlineKind;
  depth: number;
  children?: OutlineNode[];
}

export function docAnchorId(blockId: string): string {
  return `doc-block-${blockId}`;
}

export function scrollToDocumentBlock(blockId: string): void {
  document.getElementById(docAnchorId(blockId))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function outlineKind(block: Block): OutlineKind {
  switch (block.type) {
    case 'section':
      return 'section';
    case 'heading':
      return 'heading';
    case 'paragraph':
      return 'paragraph';
    case 'checklist':
      return 'checklist';
    case 'table':
      return 'table';
    case 'textField':
      return 'field';
    default:
      return 'other';
  }
}

function outlineLabel(block: Block): string | null {
  switch (block.type) {
    case 'section':
      return block.label?.trim() || 'Section';
    case 'heading':
      return ((block.config.text as string) || 'Heading').trim();
    case 'paragraph': {
      const text = ((block.config.text as string) || '').trim();
      if (!text) return null;
      return text.length > 72 ? `${text.slice(0, 69)}…` : text;
    }
    case 'checklist':
    case 'table':
    case 'textField':
      return block.label?.trim() || null;
    case 'lines':
      return block.label?.trim() || 'Write-on lines';
    case 'signature':
      return block.label?.trim() || 'Signature';
    default:
      return block.label?.trim() || null;
  }
}

function sectionIncluded(block: Block): boolean {
  if (block.type !== 'section') return true;
  const included = (block.value as { included?: boolean } | null)?.included ?? true;
  return included || !block.config.optional;
}

export function findBlockPath(
  blocks: Block[],
  blockId: string,
  prefix: BlockPath = [],
): BlockPath | null {
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const path: BlockPath = [...prefix, index];
    if (block.id === blockId) return path;
    if (block.children?.length) {
      const nested = findBlockPath(block.children, blockId, path);
      if (nested) return nested;
    }
  }
  return null;
}

export function buildDocumentOutline(blocks: Block[], depth = 0): OutlineNode[] {
  const nodes: OutlineNode[] = [];

  for (const block of blocks) {
    if (block.type === 'section') {
      if (!sectionIncluded(block)) continue;
      const childOutline = block.children ? buildDocumentOutline(block.children, depth + 1) : [];
      nodes.push({
        id: block.id,
        label: outlineLabel(block) ?? 'Section',
        kind: 'section',
        depth,
        children: childOutline.length > 0 ? childOutline : undefined,
      });
      continue;
    }

    const label = outlineLabel(block);
    if (!label) continue;

    nodes.push({
      id: block.id,
      label,
      kind: outlineKind(block),
      depth,
    });
  }

  return nodes;
}
