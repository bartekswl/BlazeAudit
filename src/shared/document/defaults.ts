import { createBlock, emptyDocument } from './factory';
import type { Document } from './types';

export interface DefaultTemplateSeed {
  seedId: string;
  name: string;
  description: string;
  document: Document;
}

function sprinklerDocument(): Document {
  const doc = emptyDocument({
    title: 'Annual Sprinkler System Inspection',
    inspectionType: 'Annual sprinkler',
  });
  doc.blocks = [
    createBlock('heading', { config: { level: 1, text: 'System overview' } }),
    createBlock('paragraph', {
      config: {
        text: 'Record the general condition of the sprinkler system, water supply, and alarm monitoring.',
      },
    }),
    createBlock('checklist', {
      label: 'System checks',
      config: {
        items: [
          { id: crypto.randomUUID(), label: 'Control valves in correct position' },
          { id: crypto.randomUUID(), label: 'Gauges within normal range' },
          { id: crypto.randomUUID(), label: 'Alarm devices tested' },
          { id: crypto.randomUUID(), label: 'Pipe and fittings free of damage/leaks' },
        ],
      },
    }),
    createBlock('table', {
      label: 'Sprinkler heads inspected',
      config: {
        columns: [
          { key: 'location', title: 'Location' },
          { key: 'type', title: 'Type' },
          { key: 'tempRating', title: 'Temp rating' },
          { key: 'condition', title: 'Condition' },
        ],
      },
      value: { rows: [] },
    }),
    createBlock('lines', { label: 'Deficiencies and corrective actions', config: { count: 6 } }),
    createBlock('signature'),
  ];
  return doc;
}

function extinguisherDocument(): Document {
  const doc = emptyDocument({
    title: 'Fire Extinguisher Survey',
    inspectionType: 'Extinguisher survey',
  });
  doc.blocks = [
    createBlock('heading', { config: { level: 1, text: 'Extinguisher inventory' } }),
    createBlock('paragraph', {
      config: { text: 'List each extinguisher on site. Add or remove rows and columns as needed.' },
    }),
    createBlock('table', {
      label: 'Extinguishers',
      config: {
        columns: [
          { key: 'location', title: 'Location' },
          { key: 'type', title: 'Type' },
          { key: 'size', title: 'Size' },
          { key: 'lastService', title: 'Last service' },
          { key: 'status', title: 'Status' },
        ],
      },
      value: { rows: [{ location: '', type: '', size: '', lastService: '', status: '' }] },
    }),
    createBlock('checklist', {
      label: 'Mounting and access',
      config: {
        items: [
          { id: crypto.randomUUID(), label: 'Extinguishers visible and accessible' },
          { id: crypto.randomUUID(), label: 'Mounting brackets secure' },
          { id: crypto.randomUUID(), label: 'Signage present where required' },
        ],
      },
    }),
    createBlock('signature'),
  ];
  return doc;
}

function walkthroughDocument(): Document {
  const sectionId = crypto.randomUUID();
  const doc = emptyDocument({
    title: 'General Fire Safety Walkthrough',
    inspectionType: 'Fire safety walkthrough',
  });
  doc.blocks = [
    createBlock('paragraph', {
      config: {
        text: 'A general-purpose walkthrough template. Toggle optional sections and customize blocks.',
      },
    }),
    createBlock('section', {
      id: sectionId,
      label: 'Means of egress',
      config: { collapsible: true, optional: false },
      children: [
        createBlock('checklist', {
          config: {
            items: [
              { id: crypto.randomUUID(), label: 'Exit routes clear' },
              { id: crypto.randomUUID(), label: 'Exit signs illuminated' },
              { id: crypto.randomUUID(), label: 'Doors open freely' },
            ],
          },
        }),
        createBlock('lines', { config: { count: 3 } }),
      ],
    }),
    createBlock('section', {
      label: 'Housekeeping',
      config: { collapsible: true, optional: true },
      children: [
        createBlock('textField', { label: 'Storage observations', config: { multiline: true, placeholder: '' } }),
        createBlock('lines', { config: { count: 4 } }),
      ],
    }),
    createBlock('signature'),
  ];
  return doc;
}

export const DEFAULT_TEMPLATE_SEEDS: DefaultTemplateSeed[] = [
  {
    seedId: 'default-sprinkler-annual',
    name: 'Annual Sprinkler System Inspection',
    description: 'Sprinkler system overview, checklist, head table, and sign-off.',
    document: sprinklerDocument(),
  },
  {
    seedId: 'default-extinguisher-survey',
    name: 'Fire Extinguisher Survey',
    description: 'Extinguisher inventory table with mounting and access checks.',
    document: extinguisherDocument(),
  },
  {
    seedId: 'default-fire-walkthrough',
    name: 'General Fire Safety Walkthrough',
    description: 'Flexible walkthrough with optional sections for egress and housekeeping.',
    document: walkthroughDocument(),
  },
];
