import { FORM_REPORT_DISCLAIMER } from '../disclaimer';
import type { FormDefinition } from '../types';

export const EMERGENCY_LIGHTING_SEED_ID = 'emergency-lighting';

export function emergencyLightingDefinition(): FormDefinition {
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
                kind: 'emergencyLightingCover',
                id: 'emergency-lighting-cover',
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
            id: 'section-comments',
            heading: 'Inspection Comments',
            heightPercent: 26,
            elements: [
              {
                kind: 'recommendations',
                id: 'emergency-lighting-comments',
              },
            ],
          },
          {
            id: 'section-recommendations',
            heading: 'Inspection Recommendations',
            heightPercent: 26,
            elements: [
              {
                kind: 'testingNotes',
                id: 'emergency-lighting-recommendations',
              },
            ],
          },
          {
            id: 'section-device-legend',
            heading: 'Device Legend',
            heightPercent: 32,
            elements: [
              {
                kind: 'emergencyLightingDeviceLegend',
                id: 'emergency-lighting-device-legend',
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
            id: 'section-inspection-record',
            heading: 'Inspection Record',
            elements: [
              {
                kind: 'emergencyLightingInspectionRecord',
                id: 'emergency-lighting-inspection-record',
              },
            ],
          },
        ],
      },
    ],
  };
}
