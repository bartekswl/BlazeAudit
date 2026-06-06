import type { BlockType } from '../../../shared/document';

export const BLOCK_CATALOG: { type: BlockType; label: string; description: string }[] = [
  { type: 'heading', label: 'Heading', description: 'Section title text' },
  { type: 'paragraph', label: 'Paragraph', description: 'Static descriptive text' },
  { type: 'textField', label: 'Text field', description: 'Single or multi-line fill-in' },
  { type: 'lines', label: 'Write-on lines', description: 'Ruled lines for handwriting' },
  { type: 'checklist', label: 'Checklist', description: 'Pass / fail line items' },
  { type: 'table', label: 'Table', description: 'Rows and columns grid' },
  { type: 'signature', label: 'Signature', description: 'Sign-off block' },
  { type: 'section', label: 'Section', description: 'Group blocks; optional toggle' },
  { type: 'spacer', label: 'Spacer', description: 'Vertical spacing' },
  { type: 'image', label: 'Image', description: 'Embedded photo placeholder' },
];

export function blockTypeLabel(type: BlockType): string {
  return BLOCK_CATALOG.find((item) => item.type === type)?.label ?? type;
}
