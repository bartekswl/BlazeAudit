import { createBlock, emptyDocument, newBlockId } from './factory';
import type { Block, Document } from './types';

function cid(): string {
  return newBlockId();
}

function checklistItems(labels: string[]) {
  return labels.map((label) => ({ id: cid(), label }));
}

function ynChecklist(label: string, items: string[]): Block {
  return createBlock('checklist', {
    label,
    config: { items: checklistItems(items) },
  });
}

function tf(label: string, multiline = false): Block {
  return createBlock('textField', {
    label,
    config: { multiline, placeholder: '' },
  });
}

function para(text: string): Block {
  return createBlock('paragraph', { config: { text } });
}

function h(text: string, level: 1 | 2 | 3 = 2): Block {
  return createBlock('heading', { config: { level, text } });
}

function sec(
  label: string,
  children: Block[],
  opts?: { optional?: boolean; landscape?: boolean },
): Block {
  return createBlock('section', {
    label,
    config: {
      collapsible: true,
      optional: opts?.optional ?? false,
      ...(opts?.landscape ? { pageOrientation: 'landscape' } : {}),
    },
    children,
  });
}

function tbl(
  label: string,
  columns: { key: string; title: string; width?: number }[],
  rows = 5,
): Block {
  const emptyRow = Object.fromEntries(columns.map((c) => [c.key, '']));
  return createBlock('table', {
    label,
    config: {
      columns: columns.map((c) => ({ ...c, width: c.width ?? 100 })),
    },
    value: {
      rows: Array.from({ length: rows }, () => ({ ...emptyRow })),
    },
  });
}

function section201Report(): Block {
  return sec('20.1 Fire Alarm System Annual Test and Inspection Report', [
    para(
      'CAN/ULC-S536:2019 (2024) — Annual fire alarm system test and inspection record. Pass = Yes, Fail = No, N/A = Not applicable.',
    ),
    h('Service information', 3),
    tf('Date of service'),
    tf('Last service date'),
    tf('Work order number'),
    tf('Alarm stage (Single stage / Two stage / Other)', true),
    tf('Service company (address, telephone, contact)'),
    h('System type', 3),
    tf('System configuration (Addressable / Conventional / Hybrid / Wireless)'),
    tf('Number of conventional initiating circuits'),
    h('Control equipment', 3),
    tf('Notification type'),
    tf('Voice paging'),
    tf('Manufacturer'),
    tf('Model number'),
    tf('ULC serial number'),
    h('Building and contacts', 3),
    tf('Building name'),
    tf('Building address'),
    tf('City'),
    tf('Postal code'),
    tf('Contact person'),
    tf('Phone'),
    tf('Fax'),
    tf('Owner / property manager / strata'),
    tf('Owner phone'),
    tf('Owner fax'),
    tf('Fire signal receiving centre (Section 22.11)'),
    tf('FSRC phone'),
    tf('FSRC fax'),
    ynChecklist('System summary', [
      'The fire alarm system is connected to a Fire Signal Receiving Centre (name and telephone number recorded above).',
      'The entire fire alarm system has been inspected and tested in accordance with CAN/ULC-S536:2019 (2024).',
      'The fire alarm system is fully functional.',
      'During the annual inspection and test, deficiencies have been identified (see Section 20.2 if yes).',
      'All identified deficiencies have been corrected as of this date.',
      'During the annual inspection and test, recommendations have been identified (see Section 20.3 if yes).',
    ]),
    tf('Deficiencies corrected as of (date)'),
    tf('Report copy given to (owner or representative)'),
    para(
      'Affirmation: The equipment listed herein was tested and inspected in conformance with CAN/ULC-S536:2019 (2024), applicable codes, bylaws, standards, and the manufacturer\'s requirements by a qualified technician. The equipment was left in an operational condition except as noted above.',
    ),
    tf('Company name'),
    createBlock('signature', { label: 'Supervising / primary technician' }),
    createBlock('signature', { label: 'Technician conducting test and inspection' }),
  ]);
}

function section202Deficiencies(): Block {
  return sec('20.2 Deficiencies', [
    para(
      'Record device and control function deficiencies. For NO answers in checklists, refer to this section.',
    ),
    tbl(
      'Device deficiencies',
      [
        { key: 'item', title: 'Item #', width: 60 },
        { key: 'deviceType', title: 'Device type', width: 90 },
        { key: 'location', title: 'Device location', width: 120 },
        { key: 'deficiency', title: 'Deficiency', width: 140 },
        { key: 'clause', title: 'ULC 536 clause', width: 90 },
        { key: 'dateCorrected', title: 'Date corrected', width: 90 },
        { key: 'workOrder', title: 'Work order / ref #', width: 90 },
        { key: 'provider', title: 'Service provider', width: 100 },
        { key: 'technician', title: 'Technician name & ID', width: 110 },
      ],
      8,
    ),
    tbl(
      'Control function or feature deficiencies',
      [
        { key: 'item', title: 'Item #', width: 60 },
        { key: 'function', title: 'Control function / feature', width: 160 },
        { key: 'deficiency', title: 'Deficiency', width: 160 },
        { key: 'clause', title: 'ULC 536 clause', width: 90 },
        { key: 'dateCorrected', title: 'Date corrected', width: 90 },
        { key: 'workOrder', title: 'Work order / ref #', width: 90 },
        { key: 'provider', title: 'Service provider', width: 100 },
        { key: 'technician', title: 'Technician name & ID', width: 110 },
      ],
      6,
    ),
    para('Building owner / representative compliance statement'),
    tf('Printed name'),
    createBlock('signature', { label: 'Owner / representative signature' }),
  ]);
}

function section203Recommendations(): Block {
  return sec('20.3 Recommendations & notes', [
    createBlock('lines', {
      label: 'Recommendations',
      config: { count: 8 },
    }),
    createBlock('lines', {
      label: "Technician's testing notes",
      config: { count: 8 },
    }),
  ]);
}

function section204Attendance(): Block {
  return sec('20.4 Technician attendance log', [
    tbl(
      'Daily attendance',
      [
        { key: 'date', title: 'Date (MM/DD/YY)', width: 100 },
        { key: 'persons', title: 'Person(s) attending', width: 140 },
        { key: 'timeIn', title: 'Time in', width: 80 },
        { key: 'timeOut', title: 'Time out', width: 80 },
        { key: 'notes', title: 'Notes (for the day)', width: 160 },
        { key: 'primaryName', title: 'Primary technician printed name', width: 140 },
        { key: 'primaryCert', title: 'Primary technician certification no.', width: 140 },
      ],
      6,
    ),
  ]);
}

function section21Documentation(): Block {
  return sec('21 Documentation', [
    para(
      'Yes = tested correctly · No = did not test correctly (refer to Section 20.2) · N/A = not applicable (feature not available or not programmed). Reference Section 7 Documentation.',
    ),
    ynChecklist('21.1 On-site documentation', [
      'A — Instructions for resetting the system and silencing alarm signals.',
      'B — Instructions for silencing the trouble signal and action to be taken when the trouble signal sounds.',
      'C — Description of the function of each operating control and indicator on the fire alarm control unit.',
      'D — Description of the area or fire zone protected by each alarm detection circuit (list or plan drawing).',
      'E — Description of alarm signal operation.',
      'F — Description of ancillary equipment controlled by the fire alarm system.',
      'G — Smoke control sequence of operation documentation on site (where applicable).',
      'H — Building diagrams indicating type and location of smoke control equipment (fans, dampers, etc.).',
      'i) Sequence of operation (Annex D).',
      'ii) Operating instructions (Annex D).',
      'iii) Description of each type of field device.',
      'iv) Details of input to programmed output functions for programmed systems.',
      'v) Connection to fire signal receiving centre (if required).',
      'vi) Previous verification report(s) and modification documentation approved by AHJ (if applicable).',
      'vii) Building plans showing fire alarm zoning, device address/location, control units, transponders, RPS, field devices, fault isolators, ancillary devices, annunciators.',
      'viii) Copy of site-specific software (if applicable).',
      'J — Indicate location(s) and media type(s) of documentation on site.',
    ]),
    tf('Documentation locations and media types'),
    tf('Smoke control measure reference (NRCC No. 13366, if applicable)'),
  ]);
}

function controlUnit221(): Block {
  return sec('22.1 Control unit or transponder inspection (Clause 8.2)', [
    tf('Control unit / transponder field location'),
    tf('Control unit / transponder identification'),
    ynChecklist('Inspection items', [
      'A — Input circuit designations correctly identified in relation to connected field devices.',
      'B — Output circuit designations correctly identified in relation to connected field devices.',
      'C — Correct designations for common control functions and indicators.',
      'D — Plug-in components and modules securely in place.',
      'E — Plug-in cables securely in place.',
      'G — Control unit/transponder is clean and free of dust and dirt.',
      'H — Fuses in accordance with the manufacturer\'s specification.',
      'I — Control unit/transponder lock is functional.',
      'J — Termination points for wiring to field devices secure.',
    ]),
    tf('Firmware — date, revision, version'),
    tf('Program software — date, revision, version'),
  ]);
}

function controlUnit222(): Block {
  return sec('22.2 Control unit or transponder test record (Clause 8.3)', [
    tf('Control unit / transponder field location'),
    tf('Control unit / transponder identification'),
    ynChecklist('Test record', [
      'A — Power "on" visual indicator operates.',
      'B — Time and date indication corresponds with local time and date.',
      'C — Common visual trouble signal operates.',
      'D — Common audible trouble signal operates.',
      'E — Trouble signal silence switch operates.',
      'F — Main power supply failure trouble signal operates.',
      'G — Ground fault on positive and negative initiates trouble signal.',
      'H — Alert signal operates.',
      'I — Alarm signal operates.',
      'J — Automatic transfer from alert signal to alarm signal operates.',
      'K — Manual transfer from alert signal to alarm signal.',
      'L — Automatic transfer from alert to alarm cancel (acknowledge) on two-stage system.',
      'M — Alarm signal silence inhibit function operates.',
      'N — Alarm signal manual silence operates.',
      'O — Alarm signal silence visual indication operates.',
      'P — Alarm signal when silenced reinitiates only upon subsequent alarm from another NBC zone.',
      'Q — Duration of alarm signal prior to automatic silence.',
      'R — Audible, visual, alert, and alarm signals operate per design/specification or Section 21 documentation.',
      'S — Input circuit alarm and supervisory operation including indicators operates.',
      'T — Input circuit supervision fault causes trouble indication.',
      'U — Output circuit alarm indicators operate.',
      'V — Output circuit supervision fault causes trouble indication.',
      'W — Visual indicator test (lamp test) operates.',
      'X — Coded signal sequence operates required number of times and correct alarm signal thereafter.',
      'Y — Coded signal sequences not interrupted by subsequent alarms.',
      'Z — Ancillary device control circuit rated for intended purpose.',
      'AA — Ancillary device bypass results in trouble signal.',
      'BB — Input to output circuit operation including ancillary devices per design/specification.',
      'CC — System reset operates.',
      'DD — Main power to emergency power supply transfer operates.',
      'EE — Smoke detector alarm verification (status change confirmation) verified.',
    ]),
    tf('Item J — automatic alert-to-alarm transfer time'),
    tf('Item Q — alarm signal duration prior to automatic silence'),
  ]);
}

function voiceComm223(): Block {
  return sec('22.3 Voice communication test (Clause 8.5)', [
    para('Exclude this section if there are no voice communication capabilities on this system.'),
    tf('Location'),
    tf('Identification'),
    ynChecklist('Voice communication tests', [
      'A — Power "on" visual indicator operates.',
      'B — Common visual trouble signal operates.',
      'C — Common audible trouble signal operates.',
      'D — Trouble signal silence switch operates.',
      'E — All-call voice paging, including visual indicator, operates.',
      'F — Selective voice paging output circuits, including visual indication, operate.',
      'G — Selective voice paging trouble operation, including visual indication, operates.',
      'H — Microphone, including press-to-talk switch, operates.',
      'I — Voice paging does not interfere with initial inhibit time of alert and alarm signals.',
      'J — All-call voice paging operates on emergency power supply.',
      'K — Automatic transfer to back-up amplifiers operates (where used).',
      'L — Emergency telephone call-in circuits, including audible and visual indication, operate.',
      'M — Emergency telephones for two-way voice communication operate.',
      'N — Emergency telephone trouble operation, including visual indication, operates.',
      'O — Emergency telephone verbal communication operates.',
      'P — Emergency telephone operable/in-use tone at handset operates.',
      'Q — Short or open on paging/alert/alarm/telephone bus results in bus-specific trouble.',
    ]),
  ], { optional: true });
}

function powerSupply224(): Block {
  return sec('22.4 Power supply inspection (Section 9)', [
    tf('Power supply field location'),
    tf('Power supply identification'),
    tf('Circuit disconnect means location'),
    tf('Circuit panel / breaker identification'),
    ynChecklist('Power supply inspection', [
      'A — Fused in accordance with manufacturer\'s marked rating.',
      'B — Primary supply equipped with identified disconnect means.',
      'C — Adequate to meet system requirements.',
      'D — Short on isolated side of power isolation module results in trouble condition.',
      'E — Operation of device on source side of shorted power isolation module confirmed.',
      'F — Ancillary device power from separate source from FACU/transponder supply.',
      'G — Ancillary power from control unit/transponder designed to provide such power.',
      'H — Ancillary devices powered from control unit/transponder recorded.',
    ]),
  ]);
}

function emergencyPower225(): Block {
  return sec('22.5 Emergency power supply test and inspection (Section 9.2–9.4)', [
    tf('Emergency power supply field location'),
    tf('Emergency power supply identification'),
    tf('Emergency power provided by (Batteries / Generator / UPS / Combination)'),
    tf('Battery type (Sealed lead acid / Ni-Cad / Lithium-ion / Wet lead)'),
    tf('Battery capacity (AH)'),
    tf('NBC required full load alarm operation time'),
    ynChecklist('Battery tests', [
      'A — Correct battery type as recommended by manufacturer.',
      'B — Correct battery rating per battery calculations at full system load.',
      'F — Battery free of physical damage.',
      'G — Battery terminals cleaned and lubricated.',
      'H — Battery terminals clamped tightly.',
      'I — Correct electrolyte level.',
      'J — Specific gravity within manufacturer specifications.',
      'K — Inspected for electrolyte leakage.',
      'L — Adequately ventilated.',
      'N — Disconnection causes trouble signal.',
      'O(i) — Required supervisory load 24 h + full load operation test performed.',
      'O(ii) — Silent accelerated test performed (Annex C1).',
      'O(iii) — Battery manufacturer\'s method performed.',
      'R — Battery voltage not less than 85% of rated capacity after tests.',
    ]),
    tf('Battery voltage (main power on) — VDC'),
    tf('Battery charging current (main power on) — mA'),
    tf('Battery voltage (main off, supervisory) — VDC'),
    tf('Battery current (main off, supervisory) — mA'),
    tf('Battery voltage (main off, full load alarm) — VDC'),
    tf('Battery current (main off, full load alarm) — A'),
    tf('Manufacturer date code or in-service date'),
    tf('Battery manufacturer method (if item O(iii))'),
    tf('Calculated battery capacity (Annex C2) — AH'),
    tf('Battery terminal voltage after tests — VDC'),
    tf('Battery charging current — A'),
    ynChecklist('Emergency generator tests (Section 9.3)', [
      'A — Generator provides power to AC circuit serving fire alarm system.',
      'B — Generator trouble conditions result in audible common trouble and visual at annunciator.',
      'C — Generator "Run" condition results in audible common trouble and visual at annunciator.',
    ]),
  ]);
}

function annunciator226(): Block {
  return sec('22.6 Annunciator / remote trouble / display & control centre (Section 10)', [
    para('Exclude if no annunciator or remote trouble unit is installed.'),
    tf('Annunciator location'),
    tf('Annunciator identification'),
    ynChecklist('Annunciator tests', [
      'A — Power "on" indicator operates.',
      'B — Individual alarm and supervisory input zones clearly indicated and designated.',
      'C — Zone designation labels properly identified.',
      'D — Active/supporting field device labels correspond with field location.',
      'E — Common trouble signal operates.',
      'F — Visual indicator test (lamp test) operates.',
      'G — Input wiring from control unit/transponder is supervised.',
      'H — Alarm signal silence visual indicator operates.',
      'I — Ancillary function switches operate per design/specification or Section 21.',
      'J — Ancillary functions visual indicators operate.',
      'K — Manual activation of alarm signal and indication operates.',
      'L — Displays visible in installed location.',
      'M — Operates on emergency power.',
    ]),
  ], { optional: true });
}

function annunciator227(): Block {
  return sec('22.7 Annunciators or sequential displays (Section 10.2)', [
    para('Exclude if no annunciator or sequential display is installed.'),
    tf('Annunciator / sequential display location'),
    tf('Annunciator / sequential display identification'),
    ynChecklist('Sequential display tests', [
      'A — Power "on" indicator operates.',
      'B — Individual alarm and supervisory zone labels properly identified.',
      'C — Individual device annunciation properly identified (where applicable).',
      'D — Active/supporting field device location and label confirmed.',
      'E — Common trouble signal operates.',
      'F — Visual indicator test (lamp test) operates.',
      'G — Input wiring from control unit/transponder is supervised.',
      'H — Alarm signal silence visual indicator operates.',
      'I — Ancillary function switches operate per Section 21.',
      'J — Ancillary functions visual indicators operate.',
      'K — Manual activation of alarm signal and indication operates.',
      'L — Displays visible in installed location.',
      'M — Multi-line sequential display operates per 10.2 (where utilized).',
    ]),
  ], { optional: true });
}

function remoteTrouble228(): Block {
  return sec('22.8 Remote trouble signal unit (Section 10)', [
    para('Exclude if no remote trouble signal unit is installed.'),
    tf('Remote trouble signal unit location'),
    tf('Remote trouble signal unit identification'),
    ynChecklist('Remote trouble signal unit', [
      'A — Input wiring from control unit/transponder is supervised.',
      'B — Visual trouble signal operates.',
      'C — Audible trouble signal operates.',
      'D — Audible trouble signal silence operates.',
    ]),
  ], { optional: true });
}

function printer229(): Block {
  return sec('22.9 Printer test', [
    para('Exclude if no printers on this system.'),
    tf('Printer location'),
    tf('Printer identification'),
    ynChecklist('Printer tests', [
      'A — Operates per design/specification or Annex D documentation.',
      'B — Zone of each alarm initiating device correctly printed.',
    ]),
  ], { optional: true });
}

function ancillary2210(): Block {
  return sec('22.10 Ancillary device circuit test', [
    para('Refer to Annex A, A22.10 for confirmation methods. Tests may not include actual operational test of ancillary devices except when noted.'),
    tbl(
      'Ancillary circuits',
      [
        { key: 'circuit', title: 'Ancillary circuit & device', width: 140 },
        { key: 'poweredBy', title: 'Powered by (FACU / Other)', width: 100 },
        { key: 'operation', title: 'Operation confirmed (Yes/No)', width: 90 },
        { key: 'method', title: 'Confirmation method', width: 140 },
      ],
      12,
    ),
  ], { landscape: true });
}

function fsrc2211(): Block {
  return sec('22.11 Interconnection to fire signal receiving centre (Clause 8.4)', [
    para('Exclude if no interconnection to a fire signal receiving centre.'),
    tf('Communicator location'),
    tf('Circuit disconnect means location'),
    tf('Circuit panel / breaker identification'),
    ynChecklist('FSRC interconnection', [
      'A — FSRC transmitter integral to fire alarm control unit.',
      'A — Supervised interconnection between FACU and separately installed FSRC transmitter.',
      'B — Alarm transmission to FSRC received.',
      'C — Supervisory transmission to FSRC received.',
      'D — Trouble transmission to FSRC received.',
      'E — Disabling/disconnecting FSRC transmitter results in specific trouble at control unit/transmitter.',
      'F — Disabling/disconnecting FSRC transmitter transmits trouble to FSRC.',
      'H — Operation of FSRC disconnect means transmits trouble to FSRC.',
    ]),
    tf('FSRC company name'),
    tf('FSRC telephone'),
    tf('FSRC address'),
  ], { optional: true });
}

function dcl2212(): Block {
  return sec('22.12 Operation test — circuit fault tolerance (Section 12)', [
    para('Exclude if no Data Communication Link (DCL) circuits. Record detailed results in Section 23.3.'),
    tf('Control unit / transponder location'),
    tf('Control unit / transponder identification'),
    tf('DCL circuit identification'),
    ynChecklist('DCL fault tolerance — primary circuit', [
      'A — Each abnormal condition in Table 3.1 tested for each DCL at control unit/transponder.',
      'B — Alarm and trouble under single ground fault on each conductor independently.',
      'C — Class A (DCLA) alarm signal capability on each side of single open circuit fault.',
      'D — Wire-to-wire short without fault isolation — trouble and alarm from adjacent links (see 23.3).',
      'E — Wire-to-wire short on isolated side with fault isolators — fault annunciated, source-side device operates (see 23.3).',
      'F — Fault isolation between control units/transponders — fault annunciated, operation outside short confirmed (see 23.3).',
    ]),
    tf('Additional DCL circuit identification (if applicable)'),
    ynChecklist('DCL fault tolerance — additional circuit', [
      'A — Each abnormal condition in Table 3.1 tested.',
      'B — Ground fault tests on each conductor independently.',
      'C — Class A open circuit fault capability.',
      'D — Wire-to-wire short without fault isolation (see 23.3).',
      'E — Fault isolators on isolated side (see 23.3).',
      'F — Fault isolation between control units/transponders (see 23.3).',
    ]),
  ], { optional: true });
}

function section22ControlUnit(): Block {
  return sec('22 Control unit or transponder test record', [
    para(
      'Yes = tested correctly · No = did not test correctly (Section 20.2) · N/A = not applicable. Complete each applicable subsection for each control unit, transponder, or device.',
    ),
    controlUnit221(),
    controlUnit222(),
    voiceComm223(),
    powerSupply224(),
    emergencyPower225(),
    annunciator226(),
    annunciator227(),
    remoteTrouble228(),
    printer229(),
    ancillary2210(),
    fsrc2211(),
    dcl2212(),
  ]);
}

function section23FieldDevices(): Block {
  const deviceColumns = [
    { key: 'location', title: 'Device location', width: 110 },
    { key: 'annunciation', title: 'Annunciation label / LCD text', width: 110 },
    { key: 'deviceType', title: 'Device type', width: 80 },
    { key: 'circuit', title: 'Circuit required', width: 80 },
    { key: 'manufacturer', title: 'Manufacturer', width: 90 },
    { key: 'model', title: 'Model number', width: 80 },
    { key: 'address', title: 'Field device address', width: 80 },
    { key: 'installed', title: 'Installed date', width: 80 },
    { key: 'installation', title: 'Correct installation', width: 80 },
    { key: 'activation', title: 'Confirm activation', width: 80 },
    { key: 'trouble', title: 'Trouble annunciation', width: 80 },
    { key: 'supervisory', title: 'Supervisory annunciation', width: 80 },
    { key: 'alarmAnn', title: 'Alarm annunciation', width: 80 },
    { key: 'alarmInit', title: 'Alarm initiation', width: 80 },
    { key: 'measurements', title: 'Measurements', width: 100 },
    { key: 'comments', title: 'Comments', width: 120 },
  ];

  const faultColumns = [
    { key: 'testLocation', title: 'Circuit fault test location', width: 120 },
    { key: 'faultIntroduced', title: 'Device location / zone where fault introduced', width: 140 },
    { key: 'faultType', title: 'Fault type (Short / Open / Ground)', width: 100 },
    { key: 'failedZone', title: 'Zone/area where devices failed', width: 120 },
    { key: 'testDevice', title: 'Device tested in non-faulted zone', width: 120 },
    { key: 'isolation', title: 'Isolation results / non-faulted location', width: 120 },
    { key: 'result', title: 'Pass or fail', width: 80 },
  ];

  return sec('23 Field device records', [
    h('23.1 Field device testing — legend', 3),
    para(
      '✓ = Yes (acceptable) · X = No (unacceptable, see Section 20.2) · — = Not applicable. Record sensitivity readings, cleaning dates, status change delays, duct pressure differentials, transport times, flow switch delays, supervisory pressure settings, low temperature settings, and device change dates in the Measurements column.',
    ),
    createBlock('lines', {
      label: '23.1.1 Additional testing notes',
      config: { count: 6 },
    }),
    sec('23.2 Individual device record', [
      para('Use Pass/Fail/N/A for checklist-style confirmations; enter device details in the table below. Add rows as needed.'),
      tbl('Individual device record (sheet 1)', deviceColumns, 10),
      tbl('Individual device record (sheet 2)', deviceColumns, 10),
      tbl('Individual device record (sheet 3)', deviceColumns, 10),
    ], { landscape: true }),
    sec('23.3 Circuit fault tolerance test sheet', [
      para('P = Pass · F = Fail (Section 20.2) · — = Not applicable. Record response time or N/A in results.'),
      tbl('Circuit fault tolerance tests', faultColumns, 8),
    ], { landscape: true }),
  ]);
}

export function ulc536Document(): Document {
  const doc = emptyDocument({
    title: 'CAN/ULC-S536 Fire Alarm Annual Test & Inspection',
    inspectionType: 'Fire alarm annual (CAN/ULC-S536)',
  });

  doc.blocks = [
    h('CAN/ULC-S536:2019 (2024) Annual Fire Alarm Test & Inspection', 1),
    section201Report(),
    section202Deficiencies(),
    section203Recommendations(),
    section204Attendance(),
    section21Documentation(),
    section22ControlUnit(),
    section23FieldDevices(),
  ];

  return doc;
}
