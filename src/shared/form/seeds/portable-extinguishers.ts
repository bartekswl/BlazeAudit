import { FORM_REPORT_DISCLAIMER } from '../disclaimer';
import type { FormDefinition } from '../types';

export const PORTABLE_EXTINGUISHERS_SEED_ID = 'portable-extinguishers';

export function portableExtinguishersDefinition(): FormDefinition {
  return {
    schemaVersion: 2,
    kind: 'form-definition',
    disclaimer: FORM_REPORT_DISCLAIMER,
    pages: [
      {
        id: 'page-1',
        label: 'Page 1',
        regions: [
          {
            id: 'header-title',
            heightPercent: 8,
            content: { kind: 'variable', binding: 'template.title', align: 'center' },
          },
        ],
        sections: [
          {
            id: 'section-cover',
            heightPercent: 87,
            elements: [
              {
                kind: 'portableExtinguisherCover',
                id: 'portable-extinguisher-cover',
              },
            ],
          },
        ],
      },
      {
        id: 'page-2',
        label: 'Page 2',
        header: 'codeNameMeta',
        regions: [],
        sections: [
          {
            id: 'section-test-record',
            heading: 'Fire Extinguisher Test Record',
            elements: [
              {
                kind: 'fireExtinguisherTestRecord',
                id: 'fire-extinguisher-test-record',
              },
            ],
          },
        ],
      },
    ],
  };
}
