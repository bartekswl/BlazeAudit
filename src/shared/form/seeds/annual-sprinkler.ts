import { FORM_REPORT_DISCLAIMER } from '../disclaimer';
import { SPRINKLER_RECOMMENDATIONS_INTRO } from '../sprinklerChecklist';
import type { FormDefinition } from '../types';

export const ANNUAL_SPRINKLER_SEED_ID = 'annual-sprinkler';

export function annualSprinklerDefinition(): FormDefinition {
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
            elements: [{ kind: 'sprinklerCover', id: 'sprinkler-cover' }],
          },
          {
            id: 'section-general',
            heading: '1. General',
            elements: [{ kind: 'sprinklerChecklist', id: 'sprinkler-general', group: 'general' }],
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
            id: 'section-control-valves',
            heading: '2. Control Valves',
            elements: [
              {
                kind: 'sprinklerChecklist',
                id: 'sprinkler-control-valves',
                group: 'controlValves',
              },
              {
                kind: 'sprinklerTable',
                id: 'sprinkler-control-valves-table',
                table: 'controlValves',
              },
            ],
          },
          {
            id: 'section-water-supplies',
            heading: '3. Water Supplies',
            elements: [
              {
                kind: 'sprinklerChecklist',
                id: 'sprinkler-water-supplies',
                group: 'waterSupplies',
              },
              {
                kind: 'sprinklerTable',
                id: 'sprinkler-main-drain-table',
                table: 'mainDrain',
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
            id: 'section-tanks',
            heading: '4. Tanks and F.D. Connections',
            elements: [{ kind: 'sprinklerChecklist', id: 'sprinkler-tanks', group: 'tanks' }],
          },
          {
            id: 'section-wet-systems',
            heading: '5. Wet Systems',
            elements: [
              { kind: 'sprinklerChecklist', id: 'sprinkler-wet-systems', group: 'wetSystems' },
            ],
          },
          {
            id: 'section-wet-alarm-valves',
            heading: 'Wet Systems Alarm Valve Table',
            elements: [
              {
                kind: 'sprinklerTable',
                id: 'sprinkler-wet-alarm-valves-table',
                table: 'wetAlarmValves',
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
            id: 'section-paddle-flow-switches',
            heading: 'Wet Systems Paddle Flow Switch Table',
            elements: [
              {
                kind: 'sprinklerTable',
                id: 'sprinkler-paddle-flow-switches-table',
                table: 'paddleFlowSwitches',
              },
            ],
          },
          {
            id: 'section-dry-systems',
            heading: '6. Dry Systems',
            elements: [
              { kind: 'sprinklerChecklist', id: 'sprinkler-dry-systems', group: 'drySystems' },
              {
                kind: 'sprinklerTable',
                id: 'sprinkler-dry-systems-table',
                table: 'drySystems',
              },
            ],
          },
          {
            id: 'section-alarms',
            heading: '7. Alarms',
            elements: [{ kind: 'sprinklerChecklist', id: 'sprinkler-alarms', group: 'alarms' }],
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
            id: 'section-piping',
            heading: '8. Sprinkler Piping',
            elements: [{ kind: 'sprinklerChecklist', id: 'sprinkler-piping', group: 'piping' }],
          },
          {
            id: 'section-no-explanations',
            heading: '9. Explanation of NO Answers for Sections 1 through 8',
            elements: [{ kind: 'recommendations', id: 'sprinkler-no-explanations' }],
          },
          {
            id: 'section-inspector-recommendations',
            heading: '10. Inspector Recommendations',
            elements: [
              {
                kind: 'testingNotes',
                id: 'sprinkler-inspector-recommendations',
                intro: SPRINKLER_RECOMMENDATIONS_INTRO,
              },
            ],
          },
        ],
      },
    ],
  };
}
