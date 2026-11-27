import { createBlock, newBlockId } from '../../../shared/document';
import type { Block, BlockType, ChecklistItem, TableColumn } from '../../../shared/document';

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

export type TemplatePresetId =
  | 'checklist-pass-fail'
  | 'checklist-yes-no'
  | 'table-equipment'
  | 'table-deficiencies'
  | 'table-blank'
  | 'heading-banner'
  | 'field-single'
  | 'field-multiline'
  | 'notes-ruled'
  | 'note-clause'
  | 'signature-tech'
  | 'image-slot'
  | 'spacer-rule';

export type PresetCategory = 'grids' | 'fields' | 'signoff';

export interface TemplateElementPreset {
  id: TemplatePresetId;
  category: PresetCategory;
  type: Exclude<BlockType, 'section'>;
  label: string;
  shortHint: string;
  /** Default width in dot-grid columns (out of 48 on portrait). */
  defaultColSpan: number;
  /** Default height in dot-grid rows. */
  defaultRowSpan: number;
  minColSpan: number;
  minRowSpan: number;
  build: () => Block;
}

export interface MinBlockSpan {
  minColSpan: number;
  minRowSpan: number;
  defaultColSpan: number;
  defaultRowSpan: number;
}

export function blockSpanRules(type: BlockType, block?: Block): MinBlockSpan {
  switch (type) {
    case 'heading':
      return { minColSpan: 12, minRowSpan: 3, defaultColSpan: 48, defaultRowSpan: 3 };
    case 'paragraph':
      return { minColSpan: 12, minRowSpan: 3, defaultColSpan: 48, defaultRowSpan: 4 };
    case 'textField': {
      const multiline = Boolean(block?.config?.multiline);
      return multiline
        ? { minColSpan: 12, minRowSpan: 5, defaultColSpan: 24, defaultRowSpan: 7 }
        : { minColSpan: 10, minRowSpan: 4, defaultColSpan: 24, defaultRowSpan: 4 };
    }
    case 'lines':
      return { minColSpan: 16, minRowSpan: 6, defaultColSpan: 48, defaultRowSpan: 10 };
    case 'checklist':
      return { minColSpan: 20, minRowSpan: 7, defaultColSpan: 48, defaultRowSpan: 12 };
    case 'table':
      return { minColSpan: 20, minRowSpan: 7, defaultColSpan: 48, defaultRowSpan: 13 };
    case 'signature':
      return { minColSpan: 18, minRowSpan: 6, defaultColSpan: 24, defaultRowSpan: 7 };
    case 'image':
      return { minColSpan: 12, minRowSpan: 6, defaultColSpan: 24, defaultRowSpan: 10 };
    case 'spacer':
      return { minColSpan: 8, minRowSpan: 2, defaultColSpan: 48, defaultRowSpan: 2 };
    case 'section':
    default:
      return { minColSpan: 16, minRowSpan: 6, defaultColSpan: 48, defaultRowSpan: 12 };
  }
}

function emptyRowsForColumns(columns: TableColumn[], rowCount: number): {
  rows: Record<string, string>[];
  rowHeights: number[];
} {
  const rows = Array.from({ length: rowCount }, () => {
    const row: Record<string, string> = {};
    for (const col of columns) row[col.key] = '';
    return row;
  });
  const rowHeights = Array.from({ length: rowCount }, () => 28);
  return { rows, rowHeights };
}

export const TEMPLATE_ELEMENT_PRESETS: TemplateElementPreset[] = [
  {
    id: 'checklist-pass-fail',
    category: 'grids',
    type: 'checklist',
    label: 'Checklist (Pass / Fail)',
    shortHint: 'Pass · Fail · N/A inspection rows',
    defaultColSpan: 48,
    defaultRowSpan: 12,
    minColSpan: 20,
    minRowSpan: 7,
    build: () => {
      const items: ChecklistItem[] = [
        { id: newBlockId(), label: 'Control panel normal & free of trouble signals' },
        { id: newBlockId(), label: 'Initiating devices accessible & unobstructed' },
        { id: newBlockId(), label: 'Notification appliances verified operational' },
        { id: newBlockId(), label: 'Testing documentation & logbook on site' },
      ];
      return createBlock('checklist', {
        label: 'Inspection Checklist',
        config: { items, choiceStyle: 'passFail' },
      });
    },
  },
  {
    id: 'checklist-yes-no',
    category: 'grids',
    type: 'checklist',
    label: 'Checklist (Yes / No)',
    shortHint: 'Yes · No · N/A compliance check',
    defaultColSpan: 48,
    defaultRowSpan: 11,
    minColSpan: 20,
    minRowSpan: 7,
    build: () => {
      const items: ChecklistItem[] = [
        { id: newBlockId(), label: 'System inspected in accordance with applicable code' },
        { id: newBlockId(), label: 'Deficiencies identified during inspection' },
        { id: newBlockId(), label: 'Monitoring station notified prior to & after test' },
      ];
      return createBlock('checklist', {
        label: 'System Summary',
        config: { items, choiceStyle: 'yesNo' },
      });
    },
  },
  {
    id: 'table-equipment',
    category: 'grids',
    type: 'table',
    label: 'Device / Equipment Log',
    shortHint: 'Location · Device · Type · Result · Notes',
    defaultColSpan: 48,
    defaultRowSpan: 14,
    minColSpan: 20,
    minRowSpan: 7,
    build: () => {
      const columns: TableColumn[] = [
        { key: 'col1', title: 'Unit / ID', width: 84 },
        { key: 'col2', title: 'Location', width: 170 },
        { key: 'col3', title: 'Device Type', width: 130 },
        { key: 'col4', title: 'Status', width: 92 },
        { key: 'col5', title: 'Remarks', width: 196 },
      ];
      return createBlock('table', {
        label: 'Equipment Inspection Record',
        config: { columns, layoutLocked: false },
        value: emptyRowsForColumns(columns, 5),
      });
    },
  },
  {
    id: 'table-deficiencies',
    category: 'grids',
    type: 'table',
    label: 'Deficiencies Grid',
    shortHint: 'Item # · Location · Deficiency · Corrected',
    defaultColSpan: 48,
    defaultRowSpan: 13,
    minColSpan: 20,
    minRowSpan: 7,
    build: () => {
      const columns: TableColumn[] = [
        { key: 'col1', title: 'Item #', width: 68 },
        { key: 'col2', title: 'Location / Zone', width: 164 },
        { key: 'col3', title: 'Deficiency Description', width: 310 },
        { key: 'col4', title: 'Corrected', width: 130 },
      ];
      return createBlock('table', {
        label: 'Summary of Deficiencies',
        config: { columns, layoutLocked: false, accent: 'danger' },
        value: emptyRowsForColumns(columns, 4),
      });
    },
  },
  {
    id: 'table-blank',
    category: 'grids',
    type: 'table',
    label: 'Custom Data Table',
    shortHint: '3-column blank grid',
    defaultColSpan: 48,
    defaultRowSpan: 11,
    minColSpan: 20,
    minRowSpan: 7,
    build: () => {
      const columns: TableColumn[] = [
        { key: 'col1', title: 'Column 1', width: 224 },
        { key: 'col2', title: 'Column 2', width: 224 },
        { key: 'col3', title: 'Column 3', width: 224 },
      ];
      return createBlock('table', {
        label: 'Data Table',
        config: { columns, layoutLocked: false },
        value: emptyRowsForColumns(columns, 3),
      });
    },
  },
  {
    id: 'heading-banner',
    category: 'fields',
    type: 'heading',
    label: 'Section Banner',
    shortHint: 'Numbered or titled report bar',
    defaultColSpan: 48,
    defaultRowSpan: 3,
    minColSpan: 12,
    minRowSpan: 3,
    build: () =>
      createBlock('heading', {
        config: { level: 2, text: '1. GENERAL INSPECTION & TESTING' },
      }),
  },
  {
    id: 'field-single',
    category: 'fields',
    type: 'textField',
    label: 'Data Field',
    shortHint: 'Half-width labeled entry box',
    defaultColSpan: 24,
    defaultRowSpan: 4,
    minColSpan: 10,
    minRowSpan: 4,
    build: () =>
      createBlock('textField', {
        label: 'Control Panel Make / Model',
        config: { multiline: false, placeholder: 'Enter value…' },
      }),
  },
  {
    id: 'field-multiline',
    category: 'fields',
    type: 'textField',
    label: 'Remarks Box',
    shortHint: 'Multi-line text box',
    defaultColSpan: 24,
    defaultRowSpan: 8,
    minColSpan: 12,
    minRowSpan: 5,
    build: () =>
      createBlock('textField', {
        label: 'Inspector Comments',
        config: { multiline: true, placeholder: 'Record observations or field notes…' },
      }),
  },
  {
    id: 'notes-ruled',
    category: 'fields',
    type: 'lines',
    label: 'Ruled Write-On Notes',
    shortHint: 'Report header + horizontal ruled lines',
    defaultColSpan: 48,
    defaultRowSpan: 10,
    minColSpan: 16,
    minRowSpan: 6,
    build: () =>
      createBlock('lines', {
        label: 'Recommendations & Testing Notes',
        config: { count: 5 },
      }),
  },
  {
    id: 'note-clause',
    category: 'fields',
    type: 'paragraph',
    label: 'Code / Instruction Note',
    shortHint: 'Static clause or reference callout',
    defaultColSpan: 48,
    defaultRowSpan: 4,
    minColSpan: 12,
    minRowSpan: 3,
    build: () =>
      createBlock('paragraph', {
        config: {
          text: 'All tests performed in accordance with applicable fire code and manufacturer specifications. Refer any failed items to the Deficiencies section.',
        },
      }),
  },
  {
    id: 'signature-tech',
    category: 'signoff',
    type: 'signature',
    label: 'Technician Sign-Off',
    shortHint: 'Name · Date · Signature box',
    defaultColSpan: 24,
    defaultRowSpan: 7,
    minColSpan: 18,
    minRowSpan: 6,
    build: () =>
      createBlock('signature', {
        label: 'Primary Technician Affirmation',
      }),
  },
  {
    id: 'image-slot',
    category: 'signoff',
    type: 'image',
    label: 'Photo / Diagram Box',
    shortHint: 'Site photo or floor-plan frame',
    defaultColSpan: 24,
    defaultRowSpan: 8,
    minColSpan: 12,
    minRowSpan: 6,
    build: () =>
      createBlock('image', {
        label: 'Site / Panel Photo',
      }),
  },
  {
    id: 'spacer-rule',
    category: 'signoff',
    type: 'spacer',
    label: 'Divider / Spacer',
    shortHint: 'Horizontal rule or vertical gap',
    defaultColSpan: 48,
    defaultRowSpan: 2,
    minColSpan: 8,
    minRowSpan: 2,
    build: () =>
      createBlock('spacer', {
        config: { size: 'sm', showRule: true },
      }),
  },
];

export const TEMPLATE_PRESET_CATEGORIES: {
  id: PresetCategory;
  title: string;
}[] = [
  { id: 'grids', title: 'Checklists & Tables' },
  { id: 'fields', title: 'Headers, Fields & Notes' },
  { id: 'signoff', title: 'Sign-Off & Layout' },
];

export function findPresetById(id: string): TemplateElementPreset | undefined {
  return TEMPLATE_ELEMENT_PRESETS.find((preset) => preset.id === id);
}
