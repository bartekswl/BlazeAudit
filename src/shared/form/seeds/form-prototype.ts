import type { FormDefinition } from '../types';

export const FORM_PROTOTYPE_SEED_ID = 'form-prototype';

export function formPrototypeDefinition(): FormDefinition {
  return {
    schemaVersion: 2,
    kind: 'form-definition',
    disclaimer: 'Disclaimer text — replace when form content is finalized.',
    pages: [
      {
        id: 'page-1',
        label: 'Page 1',
        regions: [
          {
            id: 'header-code',
            heightPercent: 5,
            content: { kind: 'variable', binding: 'template.code', align: 'center' },
          },
          {
            id: 'header-title',
            heightPercent: 5,
            content: { kind: 'variable', binding: 'template.title', align: 'center' },
          },
        ],
        sections: [
          {
            id: 'section-demo',
            number: 1,
            title: 'Demo section',
            heightPercent: 35,
            elements: [
              {
                kind: 'checklist',
                id: 'demo-checklist',
                label: 'Sample checklist',
                columns: 'yesNo',
                items: [
                  { id: 'item-1', label: 'System is operational' },
                  { id: 'item-2', label: 'Documentation on site' },
                ],
              },
              {
                kind: 'table',
                id: 'demo-table',
                label: 'Sample table',
                columns: [
                  { key: 'location', title: 'Location', widthPercent: 40 },
                  { key: 'notes', title: 'Notes', widthPercent: 60 },
                ],
                minRows: 2,
              },
            ],
          },
        ],
      },
    ],
  };
}
