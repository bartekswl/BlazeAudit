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
      {
        id: 'page-7',
        label: 'Page 7',
        header: 'codeNameMeta',
        regions: [],
        sections: [
          {
            id: 'section-control-unit-record',
            heading: '22.2 Control Unit or Transponder Record',
            elements: [
              {
                kind: 'controlUnitRecord',
                id: 'control-unit-record',
              },
            ],
          },
        ],
      },
      {
        id: 'page-8',
        label: 'Page 8',
        header: 'codeNameMeta',
        regions: [],
        sections: [
          {
            id: 'section-voice-communication-test',
            heading: '22.3 Voice Communication Test',
            elements: [
              {
                kind: 'voiceCommunicationTest',
                id: 'voice-communication-test',
              },
            ],
          },
          {
            id: 'section-power-supply-inspection',
            heading: '22.4 Power Supply Inspection',
            elements: [
              {
                kind: 'powerSupplyInspection',
                id: 'power-supply-inspection',
              },
            ],
          },
        ],
      },
      {
        id: 'page-9',
        label: 'Page 9',
        header: 'codeNameMeta',
        regions: [],
        sections: [
          {
            id: 'section-emergency-power-supply-test',
            heading: '22.5 Emergency Power Supply Test and Inspection',
            heightPercent: 95,
            elements: [
              {
                kind: 'emergencyPowerSupplyTest',
                id: 'emergency-power-supply-test',
              },
            ],
          },
        ],
      },
      {
        id: 'page-10',
        label: 'Page 10',
        header: 'codeNameMeta',
        regions: [],
        sections: [
          {
            id: 'section-annunciator-device-test',
            heading:
              '22.6 Annunciator, Remote Trouble Signal Unit, Display & Control Centre Test and Inspection',
            elements: [
              {
                kind: 'annunciatorDeviceTest',
                id: 'annunciator-device-test',
              },
            ],
          },
          {
            id: 'section-sequential-display-test',
            heading: '22.7 Annunciators or Sequential Displays',
            elements: [
              {
                kind: 'sequentialDisplayTest',
                id: 'sequential-display-test',
              },
            ],
          },
        ],
      },
      {
        id: 'page-11',
        label: 'Page 11',
        header: 'codeNameMeta',
        regions: [],
        sections: [
          {
            id: 'section-remote-trouble-signal-unit-test',
            heading: '22.8 Remote Trouble Signal Unit Test and Inspection',
            elements: [
              {
                kind: 'remoteTroubleSignalUnitTest',
                id: 'remote-trouble-signal-unit-test',
              },
            ],
          },
          {
            id: 'section-printer-test',
            heading: '22.9 Printer Test',
            elements: [
              {
                kind: 'printerTest',
                id: 'printer-test',
              },
            ],
          },
        ],
      },
      {
        id: 'page-12',
        label: 'Page 12',
        header: 'codeNameMeta',
        regions: [],
        sections: [
          {
            id: 'section-ancillary-device-circuit-test',
            heading: '22.10 Ancillary Device Circuit Test',
            elements: [
              {
                kind: 'ancillaryDeviceCircuitTest',
                id: 'ancillary-device-circuit-test',
              },
            ],
          },
        ],
      },
      {
        id: 'page-13',
        label: 'Page 13',
        header: 'codeNameMeta',
        regions: [],
        sections: [
          {
            id: 'section-fire-signal-receiving-centre-interconnection',
            heading: '22.11 Interconnection to the Fire Signal Receiving Centre',
            elements: [
              {
                kind: 'fireSignalReceivingCentreInterconnection',
                id: 'fire-signal-receiving-centre-interconnection',
              },
            ],
          },
        ],
      },
      {
        id: 'page-14',
        label: 'Page 14',
        header: 'codeNameMeta',
        regions: [],
        sections: [
          {
            id: 'section-data-communication-link-fault-tolerance',
            heading: '22.12 Operation Test Circuit Fault Tolerance',
            elements: [
              {
                kind: 'dataCommunicationLinkFaultTolerance',
                id: 'data-communication-link-fault-tolerance',
              },
            ],
          },
        ],
      },
      {
        id: 'page-15',
        label: 'Page 15',
        header: 'codeNameMeta',
        regions: [],
        sections: [
          {
            id: 'section-field-device-records',
            heading: '23 Field Device Records',
            elements: [],
          },
          {
            id: 'section-field-device-testing-legend',
            heading: '23.1 Field Device Testing - Legend and Notes',
            elements: [
              {
                kind: 'fieldDeviceTestingLegend',
                id: 'field-device-testing-legend',
              },
            ],
          },
        ],
      },
      {
        id: 'page-16',
        label: 'Page 16',
        header: 'codeNameMeta',
        regions: [],
        sections: [
          {
            id: 'section-field-device-testing-notes',
            heading: '23.1.1 Testing Notes',
            elements: [
              {
                kind: 'fieldDeviceTestingNotes',
                id: 'field-device-testing-notes',
              },
            ],
          },
        ],
      },
      {
        id: 'page-17',
        label: 'Page 17',
        orientation: 'landscape',
        header: 'codeNameMeta',
        regions: [],
        sections: [
          {
            id: 'section-individual-device-record',
            heading: '23.2 Individual Device Record',
            elements: [
              {
                kind: 'individualDeviceRecord',
                id: 'individual-device-record',
              },
            ],
          },
        ],
      },
      ...[18, 19, 20, 21].map((pageNumber) => ({
        id: `page-${pageNumber}`,
        label: `Page ${pageNumber}`,
        orientation: 'landscape' as const,
        header: 'codeNameMeta' as const,
        regions: [],
        sections: [
          {
            id: `section-individual-device-record-${pageNumber}`,
            heading: '23.2 Individual Device Record',
            elements: [
              {
                kind: 'individualDeviceRecord' as const,
                id: `individual-device-record-${pageNumber}`,
              },
            ],
          },
        ],
      })),
    ],
  };
}
