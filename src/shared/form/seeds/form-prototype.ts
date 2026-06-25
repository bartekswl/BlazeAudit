import type { FormDefinition } from '../types';
import { FORM_PROTOTYPE_SUMMARY_ITEMS } from '../yesNoSummary';

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
            id: 'section-1',
            number: 20,
            heading: '20.1 Fire Alarm System Annual Test and Inspection Report',
            heightPercent: 30,
            elements: [
              {
                kind: 'ulcSection1',
                id: 'ulc-section-1',
              },
            ],
          },
          {
            id: 'section-summary',
            elements: [
              {
                kind: 'yesNoSummary',
                id: 'annual-summary',
                items: FORM_PROTOTYPE_SUMMARY_ITEMS,
              },
            ],
          },
          {
            id: 'section-affirmation',
            elements: [
              {
                kind: 'affirmation',
                id: 'affirmation-block',
              },
            ],
          },
        ],
      },
      {
        id: 'page-2',
        label: 'Page 2',
        orientation: 'landscape',
        header: 'codeNameMeta',
        regions: [],
        sections: [
          {
            id: 'section-deficiencies',
            heading: '20.2 DEFICIENCIES',
            elements: [
              {
                kind: 'deficiencies',
                id: 'deficiencies-table',
              },
            ],
          },
        ],
      },
      {
        id: 'page-3',
        label: 'Page 3',
        header: 'codeNameMeta',
        regions: [],
        sections: [
          {
            id: 'section-recommendations',
            heading: '20.3 Recommendations',
            elements: [
              {
                kind: 'recommendations',
                id: 'recommendations-table',
              },
            ],
          },
          {
            id: 'section-testing-notes',
            heading: "Technician's Testing Notes",
            elements: [
              {
                kind: 'testingNotes',
                id: 'testing-notes-table',
              },
            ],
          },
        ],
      },
      {
        id: 'page-4',
        label: 'Page 4',
        header: 'codeNameMeta',
        regions: [],
        sections: [
          {
            id: 'section-attendance-log',
            heading: '20.4 Technician Attendance Log',
            elements: [
              {
                kind: 'attendanceLog',
                id: 'attendance-log-table',
              },
            ],
          },
        ],
      },
      {
        id: 'page-5',
        label: 'Page 5',
        header: 'codeNameMeta',
        regions: [],
        sections: [
          {
            id: 'section-documentation',
            heading: '21 Documentation',
            elements: [
              {
                kind: 'documentation',
                id: 'documentation-checklist',
              },
            ],
          },
        ],
      },
      {
        id: 'page-6',
        label: 'Page 6',
        header: 'codeNameMeta',
        regions: [],
        sections: [
          {
            id: 'section-control-unit-test',
            heading: '22 Control Unit or Transponder Test Record',
            elements: [
              {
                kind: 'controlUnitTest',
                id: 'control-unit-test-record',
              },
            ],
          },
        ],
      },
    ],
  };
}
