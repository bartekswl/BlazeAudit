/**
 * Process Desktop/PPS scanned reports → BlazeAudit importable PDFs.
 *
 * Outputs to: C:\Users\<user>\Desktop\PPS\Processed\
 * Names use Blaze report titles + full client names.
 *
 * Usage (app NOT running):
 *   npx electron scripts/process-pps-desktop.mjs
 */

import { app, safeStorage } from 'electron';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  statSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

app.setPath('userData', resolve(process.cwd(), '.electron-dev'));

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3-multiple-ciphers');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const OUT_DIR = join(process.env.USERPROFILE || '', 'Desktop', 'PPS', 'Processed');
const PDF_EMBED_MARKER = '\n%BLAZEAUDIT_JSON_V1%\n';
const IDR_ROW_COUNT = 22;
const GRID_ROW_COUNT = 28;

const TECH = { name: 'Jack Razniak', identification: '19-997707' };

const CHASE = {
  name: 'The Chase Square',
  street: '1675 The Chase',
  city: 'Mississauga',
  postCode: '',
  province: 'ON',
  country: 'Canada',
  ownerManagerName: 'Andrejs Management Inc.',
  signalReceivingCenterName: '',
  signalReceivingCenterPhone: '',
  projectNumber: '8999',
  inspectedAt: '2025-06-09',
};

const CREDIT = {
  name: 'Credit Valley Medical Arts Centre',
  street: '2000 Credit Valley Road',
  city: 'Mississauga',
  postCode: 'L5M 4N4',
  province: 'ON',
  country: 'Canada',
  ownerManagerName: 'Wright Property Mgmt.',
  signalReceivingCenterName: 'Security Response Cen',
  signalReceivingCenterPhone: '1-866-914-1337',
  projectNumber: '9048',
  inspectedAtFa: '2025-08-30',
  inspectedAtEml: '2024-08-22',
  inspectedAtFe: '2025-08-30',
};

function readKeyX(accountDirPath) {
  const dpapi = join(accountDirPath, 'auth', 'keyx.dpapi');
  if (existsSync(dpapi) && safeStorage.isEncryptionAvailable()) {
    try {
      const raw = safeStorage.decryptString(readFileSync(dpapi));
      if (/^[0-9a-f]{64}$/i.test(raw)) return raw;
      const { keyX } = JSON.parse(raw);
      if (/^[0-9a-f]{64}$/i.test(keyX)) return keyX;
    } catch {
      /* fall through */
    }
  }
  return null;
}

function pickAccount(dataDir) {
  const accountsDir = join(dataDir, 'accounts');
  const ids = readdirSync(accountsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  let best = null;
  let bestSize = 0;
  for (const id of ids) {
    const dir = join(accountsDir, id);
    const dbPath = join(dir, 'blazeaudit.db');
    if (!existsSync(dbPath)) continue;
    const keyX = readKeyX(dir);
    if (!keyX) continue;
    const size = readFileSync(dbPath).length;
    if (size > bestSize) {
      bestSize = size;
      best = { id, dir, dbPath, keyX };
    }
  }
  return best;
}

function formatAddress(c) {
  return [c.street, c.city, c.province, c.postCode, c.country].filter(Boolean).join(', ');
}

function yesNo(id, choice, fillIn) {
  const entry = { choice };
  if (fillIn !== undefined) entry.fillIn = fillIn;
  return { [id]: entry };
}

function emptyIdrRow() {
  return {
    deviceLocation: '',
    annunciationLabel: '',
    deviceType: '',
    requiresService: null,
    circuitNumber: '',
    fireZone: '',
    correctlyInstalled: null,
    measurements: '',
    alarmConfirmed: null,
    annunciatorIndication: null,
    supervisedCircuitTrouble: null,
    comments: '',
  };
}

function idrRow({ location, type = '', circuit = '', measurements = '', comments = '', service = null }) {
  return {
    ...emptyIdrRow(),
    deviceLocation: location,
    deviceType: type,
    circuitNumber: circuit,
    measurements,
    comments,
    requiresService: service,
  };
}

function buildIdrValue(dataRows) {
  const rows = Array.from({ length: IDR_ROW_COUNT }, (_, i) => dataRows[i] ?? emptyIdrRow());
  return { rows };
}

function getIdrElementIds(pages) {
  const ids = [];
  for (const page of pages) {
    for (const section of page.sections ?? []) {
      for (const el of section.elements ?? []) {
        if (el.kind === 'individualDeviceRecord') ids.push(el.id);
      }
    }
  }
  return ids;
}

function emptyFeRow() {
  return {
    location: '',
    type: '',
    make: '',
    size: '',
    requires6YearMaintenance: null,
    requiresHydrostaticTesting: null,
    requiresRecharging: null,
    deficiency: '',
  };
}

function emptyElRow() {
  return {
    unitNumber: '',
    floorNumber: '',
    location: '',
    deviceType: '',
    deviceOperation: '',
    batterySizeAmpHr: '',
    voltage: '',
    chargingVoltageAfterTest: '',
    serviceRequired: null,
    remarks: '',
  };
}

function emptyLegendRow() {
  return { device: '', description: '', manufacturer: '', model: '' };
}

function padGrid(rows, emptyFn, count = GRID_ROW_COUNT) {
  const out = rows.slice(0, count).map((r) => ({ ...emptyFn(), ...r }));
  while (out.length < count) out.push(emptyFn());
  return { rows: out };
}

function ensureIdrPages(form, needed) {
  const ids = getIdrElementIds(form.pages);
  let n = 22;
  while (ids.length < needed) {
    while (
      form.pages.some((p) => p.id === `page-idr-${n}`) ||
      ids.includes(`individual-device-record-${n}`)
    ) {
      n += 1;
    }
    const elementId = `individual-device-record-${n}`;
    form.pages.push({
      id: `page-idr-${n}`,
      label: `IDR ${ids.length + 1}`,
      orientation: 'landscape',
      header: 'codeNameMeta',
      regions: [],
      sections: [
        {
          id: `section-individual-device-record-${n}`,
          heading: '23.2 Individual Device Record',
          elements: [{ kind: 'individualDeviceRecord', id: elementId }],
        },
      ],
    });
    ids.push(elementId);
    n += 1;
  }
  return ids;
}

function ensureGridPages(form, values, {
  kind,
  baseElementId,
  heading,
  neededPages,
  pagePrefix,
  elementPrefix,
  sectionPrefix,
}) {
  const ids = [];
  for (const page of form.pages) {
    for (const section of page.sections ?? []) {
      for (const el of section.elements ?? []) {
        if (el.kind === kind) ids.push(el.id);
      }
    }
  }
  if (!ids.includes(baseElementId) && ids.length === 0) {
    // form always has base from seed
  }
  let n = 2;
  while (ids.length < neededPages) {
    while (
      form.pages.some((p) => p.id === `${pagePrefix}-${n}`) ||
      ids.includes(`${elementPrefix}-${n}`)
    ) {
      n += 1;
    }
    const elementId = `${elementPrefix}-${n}`;
    form.pages.push({
      id: `${pagePrefix}-${n}`,
      label: `${heading} ${ids.length + 1}`,
      header: 'codeNameMeta',
      regions: [],
      sections: [
        {
          id: `${sectionPrefix}-${n}`,
          heading,
          elements: [{ kind, id: elementId }],
        },
      ],
    });
    ids.push(elementId);
    if (!values[elementId]) {
      values[elementId] =
        kind === 'fireExtinguisherTestRecord'
          ? padGrid([], emptyFeRow)
          : padGrid([], emptyElRow);
    }
    n += 1;
  }
  // Prefer base id first
  const ordered = ids.includes(baseElementId)
    ? [baseElementId, ...ids.filter((id) => id !== baseElementId)]
    : ids;
  return ordered.slice(0, Math.max(neededPages, 1));
}

function fillIdrPages(form, values, devices) {
  const pagesNeeded = Math.max(1, Math.ceil(devices.length / IDR_ROW_COUNT));
  const idrIds = ensureIdrPages(form, pagesNeeded);
  for (let p = 0; p < idrIds.length; p++) {
    const slice = devices.slice(p * IDR_ROW_COUNT, (p + 1) * IDR_ROW_COUNT);
    values[idrIds[p]] = buildIdrValue(slice);
  }
  return values;
}

function fillGridPages(form, values, kind, baseElementId, heading, pagePrefix, elementPrefix, sectionPrefix, rows, emptyFn) {
  const pagesNeeded = Math.max(1, Math.ceil(Math.max(rows.length, 1) / GRID_ROW_COUNT));
  const ids = ensureGridPages(form, values, {
    kind,
    baseElementId,
    heading,
    neededPages: pagesNeeded,
    pagePrefix,
    elementPrefix,
    sectionPrefix,
  });
  for (let p = 0; p < ids.length; p++) {
    const slice = rows.slice(p * GRID_ROW_COUNT, (p + 1) * GRID_ROW_COUNT);
    values[ids[p]] = padGrid(slice, emptyFn);
  }
  return values;
}

function applyFaCommon(values, client, {
  inspectedAt,
  manufacturer,
  modelNumber,
  controlLocation,
  controlId,
  annunciatorLocation,
  annunciatorId,
  batteryLocation,
  measures,
  dateCode,
  batteryCapacity,
  chargingCurrent,
  afterTestVoltage,
  fsrcName,
  fsrcPhone,
  connectedFsrc,
  deficiencies,
  notes,
  owner,
}) {
  values['ulc-section-1'] = {
    ...(typeof values['ulc-section-1'] === 'object' && values['ulc-section-1']
      ? values['ulc-section-1']
      : {}),
    dateOfService: inspectedAt,
    lastServiceDate: '',
    projectNumber: client.projectNumber,
    stageSingle: true,
    stageTwo: false,
    stageOther: false,
    stageOtherText: '',
    systemAddressable: true,
    systemConventional: false,
    systemWireless: false,
    systemHybrid: false,
    manufacturer,
    modelNumber,
    buildingName: client.name,
    address: client.street,
    city: client.city,
    postalCode: client.postCode || '',
    ownerPropertyManager: owner,
    contactPerson: owner,
    phonesEdited: true,
  };

  values['annual-summary'] = {
    ...yesNo('connected-fsrc', connectedFsrc),
    ...yesNo('inspected-ulc536', 'yes'),
    ...yesNo('fully-functional', deficiencies === 'yes' ? 'no' : 'yes'),
    ...yesNo('deficiencies-identified', deficiencies),
    ...yesNo('deficiencies-corrected', deficiencies === 'yes' ? 'no' : 'na'),
    ...yesNo('recommendations-identified', deficiencies === 'yes' ? 'yes' : 'no'),
    ...yesNo('report-copy', 'yes', owner),
  };

  values['affirmation-block'] = {
    primary: {
      inspectorId: null,
      name: TECH.name,
      identification: TECH.identification,
      date: inspectedAt,
      signature: TECH.name,
    },
    conducting: {
      inspectorId: null,
      name: TECH.name,
      identification: TECH.identification,
      date: inspectedAt,
      signature: TECH.name,
    },
  };

  values['testing-notes-table'] = notes;
  values['recommendations-table'] =
    deficiencies === 'yes'
      ? 'See testing notes / source remarks. Review device remarks (e.g. blocked exits) before finalizing.'
      : '';

  values['control-unit-test-record'] = {
    ...(typeof values['control-unit-test-record'] === 'object' ? values['control-unit-test-record'] : {}),
    fieldLocation: controlLocation,
    identification: controlId,
    checklist: {},
    firmware: { date: '', revision: '', version: '' },
    software: { date: '', revision: '', version: '' },
  };

  values['control-unit-record'] = {
    ...(typeof values['control-unit-record'] === 'object' ? values['control-unit-record'] : {}),
    fieldLocation: controlLocation,
    identification: controlId,
    checklist: {},
  };

  values['power-supply-inspection'] = {
    ...(typeof values['power-supply-inspection'] === 'object' ? values['power-supply-inspection'] : {}),
    fieldLocation: controlLocation,
    identification: controlId,
    disconnectLocation: '',
    breakerIdentification: '',
    checklist: {},
  };

  values['emergency-power-supply-test'] = {
    ...(typeof values['emergency-power-supply-test'] === 'object'
      ? values['emergency-power-supply-test']
      : {}),
    fieldLocation: batteryLocation,
    identification: controlId,
    providedBy: { batteries: true, generator: false, ups: false, combination: false },
    batteryType: {
      sealedLeadAcid: true,
      niCad: false,
      lithiumIon: false,
      wetLead: false,
    },
    batteryCapacity,
    nbcAlarmTime: null,
    checklist: {},
    measures,
    dateCode,
    valueFills: {
      p: batteryCapacity,
      q: afterTestVoltage,
      s: chargingCurrent,
    },
    testType: { i: null, ii: null, iii: null, specify: '' },
  };

  if (annunciatorLocation) {
    values['annunciator-device-test'] = {
      ...(typeof values['annunciator-device-test'] === 'object' ? values['annunciator-device-test'] : {}),
      sectionNotApplicable: false,
      fieldLocation: annunciatorLocation,
      identification: annunciatorId || '',
      checklist: {},
    };
  }

  if (fsrcName || fsrcPhone) {
    values['fire-signal-receiving-centre-interconnection'] = {
      ...(typeof values['fire-signal-receiving-centre-interconnection'] === 'object'
        ? values['fire-signal-receiving-centre-interconnection']
        : {}),
      name: fsrcName || '',
      telephone: fsrcPhone || '',
      checklist: {},
    };
  }

  {
    const base =
      values['attendance-log-table'] && typeof values['attendance-log-table'] === 'object'
        ? values['attendance-log-table']
        : { rows: [] };
    const rows = Array.isArray(base.rows) ? [...base.rows] : [];
    while (rows.length < 1) {
      rows.push({
        date: '',
        personsAttending: '',
        timeIn: '',
        timeOut: '',
        notes: '',
        technicianName: '',
        technicianCert: '',
      });
    }
    const [y, m, d] = inspectedAt.split('-');
    rows[0] = {
      date: `${m}/${d}/${y.slice(2)}`,
      personsAttending: TECH.name,
      timeIn: '',
      timeOut: '',
      notes: `Annual fire alarm inspection — job ${client.projectNumber}`,
      technicianName: TECH.name,
      technicianCert: TECH.identification,
    };
    values['attendance-log-table'] = { ...base, rows };
  }

  return values;
}

/** Chase IDR — curated from OCR (location + device letter). */
function chaseFaDevices() {
  const y = null; // do not invent ticks
  const rows = [
    ['UNIT #1/#2 PHARMACY', 'H'],
    ['BACK EXIT', 'M'],
    ['#3-4 CHASE DENTAL FRONT', 'H'],
    ['#3-4 CHASE DENTAL BACK EXIT', 'M', '', '', 'BLOCKED'],
    ['#5 LUNCH ROOM', ''],
    ['#6 HAIR LOSS CLINIC BACK DOOR', 'M'],
    ['#7 PRINT EXPRESS CENTRE', 'H'],
    ['#8-9-10 DIAMOND BEAUTY CENTRE', 'H'],
    ['#8-9-10 DIAMOND BEAUTY WEST', 'H'],
    ['#8-9-10 DIAMOND BEAUTY EAST', 'H'],
    ['#11 HAIR MEWS CENTRE', 'H'],
    ['#12 ALLURE NAILS STORAGE', 'H'],
    ['#13 GINSENG FARM CENTRE', 'H'],
    ['#16 MONA FRONT EXIT', 'M'],
    ['#16 MONA STORE', 'H'],
    ['STORE', 'H'],
    ['STORE', 'H'],
    ['STORE', 'H'],
    ['STORE', 'H'],
    ['LOADING AREA', 'H'],
    ['LOADING AREA', 'M'],
    ['BACK EXIT', 'M'],
    ['BACK STAIRS TO BSMT', 'S', '', '1.61', '1400A-#3'],
    ['#17 KHAN FRONT', 'M'],
    ['#17 KHAN CENTRE', 'H'],
    ['#19 PHYSIO/ACCUPUNCTURE CENTRE', 'H'],
    ['#20 WELLNESS CLINIC CENTRE', 'H'],
    ['#21 HEALTH PLUS CENTRE', 'H'],
    ['#22 RE/MAX CENTRE', 'H'],
    ['#23 PIANO MELODIES BACK', 'H'],
    ['#24 KOON OPTICAL FRONT', 'H'],
    ['#25 L&T TUTORING CENTRE', 'H'],
    ['#26 DIAMOND BEAUTY SPA ROOM', 'H'],
    ['#27 JANA ACADEMY CENTRE', 'H'],
    ['#28-30 DR. OFFICE / DR. JIMMY POON CENTRE', 'H'],
    ['#31-32 BAYVIEW GARDEN RESTAURANT FRONT', 'M'],
    ['#31-32 HALL', 'H'],
    ['#31-32 HALL', 'H'],
    ['#31-32 HALL', 'H'],
    ['#31-32 BACK EXIT', 'M'],
    ['#31-32 BACK EXIT', 'H'],
    ['#33-34 BUBBLE TEA CONVENIENCE FRONT EAST', 'M'],
    ['#33-34 FRONT WEST', 'M'],
    ['#33-34 WEST', 'H'],
    ['#33-34 EAST', 'H'],
    ['#33-34 EAST EOL', 'EOL'],
    ['#33-34 WEST EOL', 'EOL'],
    ['#35 MICROCOMP SYSTEMS FRONT', 'M'],
    ['#35 BACK', 'H'],
    ['#36 AM SPORT FRONT', 'M'],
    ['#36 CENTRE', 'H'],
    ['#37 CLEANERS FRONT', 'M'],
    ['#37 CENTRE', 'H'],
    ['#38 HSBC CASH MACHINE FRONT', 'M'],
    ['#38 CENTRE', 'H'],
    ['BANK HSBC FRONT ENTRANCE', 'M'],
    ['FRONT EXIT WEST', 'M'],
    ['FRONT', 'H'],
    ['FRONT', 'H'],
    ['FRONT', 'H'],
    ['FRONT', 'H'],
    ['B.S.M.', 'M'],
    ['B.S.M.', 'H'],
    ['COMPUTER ROOM', 'H'],
    ['COMPUTER ROOM', 'H'],
    ['COMMON AREA EAST EXIT', 'M'],
    ['COMMON AREA WEST EXIT', 'M'],
    ['COMMON AREA SOUTH EXIT', 'M'],
    ['COMMON AREA NORTH EXIT', 'M'],
    ['COMMON AREA SOUTH EXIT', 'H'],
    ['COMMON AREA NORTH EXIT', 'H'],
    ['COMMON AREA CENTER SOUTH', 'H'],
    ['HALLWAY TO WSHR.', 'H'],
    ['B.S.M. SOUTH EXIT', 'M'],
    ['B.S.M. EAST EXIT', 'M'],
    ['N/W EXIT', 'S', '', '1.88', 'C2W-BA(#1)'],
    ['N/E EXIT', 'S', '', '1.95', 'C2W-BA(#2)'],
    ['MONA STAIRS', 'S', '', '1.43', '1400A(#3)'],
    ['ELECTRICAL ROOM', 'M'],
    ['ELECTRICAL ROOM', 'H'],
    ['SPRINKLER ROOM', 'M'],
    ['SPRINKLER ROOM', 'H'],
    ['GARBAGE ROOM', 'M'],
    ['GARBAGE ROOM', 'H'],
  ];
  return rows.map(([location, type, circuit = '', measurements = '', comments = '']) =>
    idrRow({
      location,
      type,
      circuit,
      measurements,
      comments,
      service: comments.toLowerCase().includes('block') ? 'yes' : y,
    }),
  );
}

/**
 * Walk OCR blob left-to-right: each device type token closes the prior device.
 * Types listed longest-first so "RHT" wins over "H".
 */
/**
 * Walk OCR blob left-to-right: each device type token closes the prior device.
 * Types listed longest-first so "RHT" wins over "H".
 */
/**
 * Walk OCR blob left-to-right: each device type token closes the prior device.
 * Types listed longest-first so "RHT" wins over "H".
 */
function tokenizeDevices(blob, typeList) {
  const types = [...typeList].sort((a, b) => b.length - a.length);
  const typeRe = new RegExp(`\\b(${types.join('|')})\\b`, 'gi');
  const hits = [];
  let m;
  while ((m = typeRe.exec(blob)) !== null) {
    hits.push({ type: m[1].toUpperCase(), index: m.index, end: m.index + m[0].length });
  }
  const out = [];
  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i];
    const prevEnd = i === 0 ? 0 : hits[i - 1].end;
    let left = blob.slice(prevEnd, hit.index).trim();
    // Drop leftover sensitivity/circuit from previous device
    left = left.replace(/^(?:\d+\.\d+\s+)?(?:\d{1,3}\s+)?/, '').trim();
    // Prefer the last floor+location pair in the left slice
    const floorMatch = left.match(/.*?(\d+)\s+(.+)$/);
    if (!floorMatch) continue;
    const floor = floorMatch[1];
    let location = floorMatch[2].replace(/\s+/g, ' ').trim();
    // Drop section headers that leaked in
    location = location
      .replace(
        /^(?:PENTHOUSE|5TH FLOOR|4TH FLOOR|3RD FLOOR|2ND FLOOR|1ST FLOOR|PHARMACY|BASEMENT(?:\s*&\s*GARAGE)?|ABOVE CEILING)\s+/i,
        '',
      )
      .trim();
    if (!location || location.length < 2) continue;
    // Reject if location still contains another device type token
    if (new RegExp(`\\b(${types.join('|')})\\b`, 'i').test(location)) continue;

    const after = blob.slice(hit.end, hits[i + 1]?.index ?? blob.length).trim();
    let measurements = '';
    let circuit = '';
    let comments = '';
    const sens = after.match(/^(\d+\.\d+)\b/);
    let rest = after;
    if (sens) {
      measurements = sens[1];
      rest = after.slice(sens[0].length).trim();
    }
    const circ = rest.match(/^(\d{1,3})\b/);
    if (circ) {
      // "116 NEXT" where 11=circuit and 6=next floor already handled by glue split;
      // if 3-digit and next hit's floor matches last digit, trim.
      if (circ[1].length >= 2) {
        const nextLeft = blob.slice(hit.end, hits[i + 1]?.index ?? hit.end).trim();
        // keep full circ as circuit when it's 1-2 digits; for 3 digits split
        if (circ[1].length === 3 && /[0-6]$/.test(circ[1])) circuit = circ[1].slice(0, -1);
        else circuit = circ[1];
      } else {
        circuit = circ[1];
      }
      rest = rest.slice(circ[0].length).trim();
    }
    // Model crumbs like 2181A / CR135-2CO
    if (/^[A-Z0-9#()\-./]+$/i.test(rest.split(/\s+/)[0] || '') && rest.length < 20) {
      comments = rest.split(/\s+/).slice(0, 2).join(' ');
    }
    out.push({ floor, location, type: hit.type, measurements, circuit, comments });
  }
  return out;
}

function parseCreditFaDevices(extractText) {
  const bodies = [];
  for (const chunk of extractText.split(/===== DOC PAGE/i)) {
    if (!/Individual Device Record/i.test(chunk)) continue;
    const after = chunk.split(/REMARKS/i).slice(1).join(' ');
    if (after) bodies.push(after);
  }
  let blob = bodies
    .join(' ')
    .replace(
      /\b(PENTHOUSE|5TH FLOOR|4TH FLOOR|3RD FLOOR|2ND FLOOR|1ST FLOOR|PHARMACY|BASEMENT(?:\s*&\s*GARAGE)?|ABOVE CEILING)\b/gi,
      ' ',
    )
    // "EOL6 ADJ" / "B6 FAN" / "M1 MAIN"
    .replace(/\b(DS|RHT|EOL|ANN|FACP|FS|SS|OS|HT|CO|S|M|B|H)([0-6])(?=\s*[A-Z.#])/gi, '$1 $2 ')
    .replace(/\s+/g, ' ')
    .trim();
  return tokenizeDevices(blob, [
    'FACP',
    'RHT',
    'EOL',
    'ANN',
    'DS',
    'FS',
    'SS',
    'OS',
    'HT',
    'CO',
    'S',
    'M',
    'B',
    'H',
  ]).map((d) =>
    idrRow({
      location: `${d.floor} ${d.location}`,
      type: d.type,
      measurements: d.measurements,
      circuit: d.circuit,
      comments: d.comments,
    }),
  );
}

function chaseFeRows() {
  return [
    { location: 'WEST', type: 'ABC', make: 'KIDDE', size: '5LB', deficiency: 'H.T. DONE' },
    { location: 'EAST', type: 'ABC', make: 'STR.FIR.', size: '5LB', deficiency: 'DUE IN 2027' },
    { location: 'SOUTH', type: 'ABC', make: 'STR.FIR.', size: '5LB', deficiency: 'H.T. DONE' },
    { location: 'NORTH', type: 'ABC', make: 'FLAG', size: '5LB', deficiency: 'DUE IN 2026' },
    { location: 'MIDDLE OF THE HALL', type: 'ABC', make: 'FLAG', size: '5LB', deficiency: 'H.T. DONE' },
    { location: 'NORTH BY WASHROOM', type: 'ABC', make: 'BUCKEYE', size: '5LB', deficiency: 'H.T. DONE' },
    { location: 'B.S.M. SOUTH HALLWAY', type: 'ABC', make: 'STR.FIR.', size: '5LB', deficiency: 'H.T. DONE' },
    { location: 'B.S.M. NORTH HALLWAY', type: 'ABC', make: 'STR.FIR.', size: '5LB', deficiency: 'H.T. DONE' },
    { location: 'ELECTRICAL ROOM', type: 'ABC', make: 'DIAMON', size: '10LB', deficiency: 'DUE IN 2028' },
    { location: 'SPRINKLER ROOM', type: 'ABC', make: 'PYRENE', size: '5LB', deficiency: 'DUE IN 2028' },
    { location: 'GARBAGE ROOM', type: 'ABC', make: 'FLAG', size: '10LB', deficiency: 'DUE IN 2030' },
  ];
}

function creditFeRows() {
  const rows = [
    { location: 'MANAGEMENT OFFICE', type: 'ABC', make: 'YF-96657', size: '5', deficiency: 'H-TEST DUE 2030' },
    { location: 'GARBAGE RM.', type: 'ABC', make: 'STR.FST', size: '10', deficiency: 'H-TEST DUE 2031' },
    { location: 'ELEC. RM', type: 'ABC', make: 'STR.FST', size: '10', deficiency: 'H-TEST DUE 2031' },
    { location: 'GARAGE SPOT #3', type: 'ABC', make: 'STR.FST', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'GARAGE SPOT #16', type: 'ABC', make: 'STR.FST', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'GARAGE SPOT #78', type: 'ABC', make: 'BUCKEY', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'GARAGE SPOT #147', type: 'ABC', make: 'BUCKEY', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'GARAGE SPOT #157', type: 'ABC', make: 'BUCKEY', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'GARAGE SPOT #91', type: 'ABC', make: 'STR.FST', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'LOBBY FHC ADJ #101', type: 'ABC', make: 'STR.1ST', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'HALLWAY FHC ADJ #102', type: 'ABC', make: 'STR.1ST', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'LOBBY ELEC. CLOSET', type: 'ABC', make: '', size: '5', deficiency: 'H-TEST DUE 2030' },
    { location: 'SUITE #125', type: 'ABC', make: 'STR.FST', size: '5', deficiency: '' },
    { location: 'SUITE #123', type: 'ABC', make: 'AMEREX', size: '5', deficiency: '' },
    { location: 'SUITE #122', type: 'ABC', make: 'STR.FST', size: '5', deficiency: '' },
    { location: 'SUITE #101', type: 'ABC', make: 'AMEREX', size: '10', deficiency: '' },
    { location: 'SUITE #103', type: 'ABC', make: '', size: '20', deficiency: 'H-TEST DUE 2028' },
    { location: 'SUITE #104/105', type: 'ABC', make: 'STR 1ST', size: '5LB', deficiency: '' },
    { location: 'SUITE #106', type: 'ABC', make: 'STR.FST', size: '10', deficiency: '' },
    { location: 'ADJ. SUITE #214', type: 'ABC', make: 'BUCKEY', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'ELECTRICAL ROOM 2ND FL.', type: 'ABC', make: 'AMEREX', size: '10', deficiency: 'H-TEST DUE 2027' },
    { location: 'ADJ. SUITE #206', type: 'ABC', make: 'AMEREX', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'ADJ. SUITE #314', type: 'ABC', make: 'BUCKEY', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'ELECTRICAL ROOM 3RD FL.', type: 'ABC', make: 'STR.1ST', size: '10', deficiency: 'H-TEST DUE 2027' },
    { location: 'ADJ. SUITE #306', type: 'ABC', make: 'BUCKEY', size: '10', deficiency: 'H-TEST DUE 2025' },
    { location: 'ADJ. SUITE #414', type: 'ABC', make: 'STR FST', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'ELECTRICAL ROOM 4TH FL.', type: 'ABC', make: 'STR.1ST', size: '10', deficiency: 'H-TEST DUE 2027' },
    { location: 'ADJ. SUITE #406', type: 'ABC', make: 'BUCKEY', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'ADJ. SUITE #514', type: 'ABC', make: 'STR.FST', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'ELECTRICAL ROOM 5TH FL.', type: 'ABC', make: 'BUCKEY', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'ADJ. SUITE #506', type: 'ABC', make: 'AMEREX', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'PENTHOUSE CENTER', type: 'ABC', make: 'FLAG', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'PENTHOUSE', type: 'ABC', make: 'STR.FST', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'PENTHOUSE FHC', type: 'ABC', make: 'PYRO', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'ELEV. MACHINE ROOM', type: 'ABC', make: 'KIDDE', size: '10', deficiency: 'H-TEST DUE 2030' },
    { location: 'ELECTRICAL ROOM PENTHOUSE', type: 'ABC', make: 'PYRENE', size: '5', deficiency: 'H-TEST DUE 2027' },
  ];
  return rows;
}

function chaseElRows() {
  return [
    { location: 'EAST EXIT', deviceType: 'COM', remarks: '' },
    { location: 'WEST EXIT', deviceType: 'COM', remarks: '' },
    { location: 'SOUTH EXIT', deviceType: 'COM', remarks: '' },
    { location: 'CENTER EL', deviceType: 'EL', remarks: 'RECOMMEND REPLACEMENT WITH COM', serviceRequired: 'yes' },
    { location: 'NORTH EXIT', deviceType: 'COM', remarks: '' },
    { location: 'NORTH EXIT E. SIDE', deviceType: 'COM', remarks: '' },
    { location: 'CENTER EL', deviceType: 'EL', remarks: 'RECOMMEND REPLACEMENT WITH COM', serviceRequired: 'yes' },
    { location: 'BY UNIT 28', deviceType: 'EML', remarks: 'REPLACED BATT.', batterySizeAmpHr: '12', serviceRequired: 'yes' },
    { location: 'BY UNIT 27', deviceType: 'EML', remarks: '', batterySizeAmpHr: '12' },
    { location: 'BY UNIT 9', deviceType: 'EML', remarks: 'REPLACED BATT.', batterySizeAmpHr: '12', serviceRequired: 'yes' },
    { location: 'BY UNIT 13', deviceType: 'EML', remarks: 'REPLACED BATT.', batterySizeAmpHr: '12', serviceRequired: 'yes' },
    { location: 'BY UNIT 7', deviceType: 'EML', remarks: '2 x 6V12Ah', batterySizeAmpHr: '12' },
    { location: 'HALL BY THE BANK', deviceType: 'EML', remarks: 'REPLACED BATT.', batterySizeAmpHr: '12', serviceRequired: 'yes' },
    { location: 'ELECTRICAL ROOM', deviceType: 'COM', remarks: '' },
    { location: 'B.S.M. SOUTH EXIT', deviceType: 'COM', remarks: '' },
    { location: 'CENTRE HALL', deviceType: 'EML', remarks: '', batterySizeAmpHr: '12' },
    { location: 'NORTH EXIT', deviceType: 'EL', remarks: '' },
    { location: 'STRW. NORTH', deviceType: 'COM', remarks: '' },
  ].map((r) => ({ ...emptyElRow(), ...r, floorNumber: 'COMMON AREA' }));
}

function parseCreditElRows(extractText) {
  const bodies = [];
  for (const chunk of extractText.split(/===== DOC PAGE/i)) {
    if (!/Inspection Record/i.test(chunk)) continue;
    const after = chunk.split(/REMARKS/i).slice(1).join(' ');
    if (after) bodies.push(after);
  }
  let blob = bodies
    .join(' ')
    // CENTEREML / RM.CENTEREML
    .replace(/([A-Za-z0-9.'#)])(EML|COM|EL|SRH|DRH)/gi, '$1 $2')
    .replace(/(EML|COM|EL|SRH|DRH)(\d)/gi, '$1 $2')
    .replace(/(REPLACED|BATT|AH)(\d)/gi, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  const rows = [];
  const re =
    /(\d+)\s+((?:(?!\b(?:EML|COM|EL|SRH|DRH)\b)[A-Z0-9#./'+\- @])+?)\s+(EML|COM|EL|SRH|DRH)\b([^0-9]*?)(?=\s*\d+\s+[A-Z0-9.#]|$)/gi;
  let m;
  while ((m = re.exec(blob)) !== null) {
    let floor = m[1];
    const location = m[2].replace(/\s+/g, ' ').trim();
    const deviceType = m[3].toUpperCase();
    let rest = (m[4] || '').trim();
    if (!location || location.length < 2) continue;
    if (/^(TH FLOOR|ND FLOOR|RD FLOOR|ST FLOOR)/i.test(location)) continue;
    // OCR glues prior operation digits onto next floor: "7"+"6"→76, "33"+"5"→335
    if (floor.length > 1 && /^[0-6]$/.test(floor.slice(-1))) {
      const glued = floor.slice(0, -1);
      floor = floor.slice(-1);
      if (glued && !rest) rest = glued;
    }
    let service = null;
    if (/NEW BATT|REPLACED|UNIT REPLACED/i.test(rest + ' ' + location)) service = 'yes';
    rows.push({
      ...emptyElRow(),
      floorNumber: floor,
      location: location.replace(/^UNIT REPLACED\s+\d+\s+/i, '').trim(),
      deviceType,
      batterySizeAmpHr: /BATT|AH|\d+V/i.test(rest) ? rest : '',
      remarks: rest,
      serviceRequired: service,
    });
  }
  return rows;
}

function chaseElLegend() {
  return padGrid(
    [
      { device: 'COM', description: 'EXIT / EMERG. LIGHT COMBO', manufacturer: 'EMERGI LITE', model: '6PXI 36 P 2' },
      { device: 'COM', description: 'EXIT / EMERG. LIGHT COMBO', manufacturer: 'BAGHELLI', model: 'SL-RM636LU-OLR-M-2' },
      { device: 'EL', description: 'EXIT LIGHT', manufacturer: 'BAGHELLI', model: 'SL-RMSPLU-OLR-M' },
      { device: 'EL', description: 'EXIT LIGHT', manufacturer: 'NEW LUMACELL', model: 'LMCEUN' },
      { device: 'EML', description: 'EMERG. LIGHT UNIT', manufacturer: 'BAGHELLI', model: 'NV12120-2BTMR50WQ' },
      { device: 'EML', description: 'EMERG. LIGHT UNIT', manufacturer: 'LUMACELL', model: 'RG 12S 144 2 MT 9W' },
      { device: 'DRH', description: 'DOUBLE REMOTE HEAD', manufacturer: 'LUMACELL', model: 'MT 212 V9W' },
      { device: 'SRH', description: 'SINGLE REMOTE HEAD', manufacturer: 'LUMACELL', model: 'MT 112 V 9W' },
    ],
    emptyLegendRow,
    10,
  );
}

function creditElLegend() {
  return padGrid(
    [
      { device: 'EML', description: 'EMERGENCY LIGHT UNIT', manufacturer: 'LUMACELL', model: 'RG12S200' },
      { device: 'EML', description: 'EMERGENCY LIGHT UNIT', manufacturer: 'LUMACELL', model: 'RG12S360' },
      { device: 'EML', description: 'EMERGENCY LIGHT UNIT', manufacturer: 'LUMACELL', model: 'RG24S488' },
      { device: 'COM', description: 'EMER./EXIT LIGHT COMBO', manufacturer: 'LUMACELL', model: '' },
      { device: 'EL', description: 'EXIT LIGHT', manufacturer: '', model: '' },
      { device: 'SRH', description: 'SINGLE REMOTE HEAD', manufacturer: '', model: '' },
      { device: 'DRH', description: 'DOUBLE REMOTE HEAD', manufacturer: '', model: '' },
    ],
    emptyLegendRow,
    10,
  );
}

function emptyValuesFromForm(form) {
  const values = {};
  for (const page of form.pages || []) {
    for (const section of page.sections || []) {
      for (const el of section.elements || []) {
        if (!el?.id) continue;
        if (el.kind === 'ulcSection1') values[el.id] = {};
        else if (el.kind === 'yesNoSummary') values[el.id] = {};
        else if (el.kind === 'affirmation') values[el.id] = { primary: {}, conducting: {} };
        else if (el.kind === 'recommendations' || el.kind === 'testingNotes') values[el.id] = '';
        else if (el.kind === 'portableExtinguisherCover') {
          values[el.id] = {
            date: '',
            jobContactNo: '',
            inspectorName: '',
            signatureName: '',
            recommendationsNotes: '',
          };
        } else if (el.kind === 'emergencyLightingCover') {
          values[el.id] = {
            date: '',
            jobContactNo: '',
            certifyTested: null,
            certifyFunctional: null,
            technicianName: '',
            signatureName: '',
          };
        } else if (el.kind === 'fireExtinguisherTestRecord') values[el.id] = padGrid([], emptyFeRow);
        else if (el.kind === 'emergencyLightingInspectionRecord') values[el.id] = padGrid([], emptyElRow);
        else if (el.kind === 'emergencyLightingDeviceLegend') values[el.id] = padGrid([], emptyLegendRow, 10);
        else if (el.kind === 'individualDeviceRecord') values[el.id] = buildIdrValue([]);
        else values[el.id] = values[el.id] ?? null;
      }
    }
  }
  return values;
}

function loadBuiltinForm(db, seedId) {
  const builtin = db
    .prepare(`SELECT id, name, document FROM builtin_templates WHERE seed_id = ?`)
    .get(seedId);
  if (!builtin) return null;
  let form = JSON.parse(builtin.document);
  if (form.form?.pages) form = form.form;
  return { id: builtin.id, name: builtin.name, form: structuredClone(form) };
}

function upsertClient(db, client, sourceTag) {
  const now = new Date().toISOString();
  let row = db.prepare(`SELECT * FROM clients WHERE name = ? COLLATE NOCASE LIMIT 1`).get(client.name);
  const notes = [
    `PPS Desktop batch: ${sourceTag}`,
    `Mapped from scanned PPS reports into BlazeAudit forms (best-effort OCR).`,
    `Job/Contact #: ${client.projectNumber}.`,
  ].join('\n');
  const address = formatAddress(client);
  if (!row) {
    const id = randomUUID();
    db.prepare(
      `INSERT INTO clients (
         id, name, address, street, unit, city, post_code, country, province,
         contact_name, phone, email,
         owner_manager_name, owner_manager_phone,
         signal_receiving_center_name, signal_receiving_center_phone,
         notes, created_at, updated_at
       ) VALUES (
         @id, @name, @address, @street, '', @city, @postCode, @country, @province,
         @contactName, '', '',
         @ownerManagerName, '',
         @srcName, @srcPhone,
         @notes, @createdAt, @updatedAt
       )`,
    ).run({
      id,
      name: client.name,
      address,
      street: client.street,
      city: client.city,
      postCode: client.postCode || '',
      country: client.country,
      province: client.province,
      contactName: client.ownerManagerName,
      ownerManagerName: client.ownerManagerName,
      srcName: client.signalReceivingCenterName || '',
      srcPhone: client.signalReceivingCenterPhone || '',
      notes,
      createdAt: now,
      updatedAt: now,
    });
    row = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    console.log('Created client', client.name);
  } else {
    db.prepare(
      `UPDATE clients SET
         address=@address, street=@street, city=@city, post_code=@postCode,
         country=@country, province=@province,
         contact_name=@contactName, owner_manager_name=@ownerManagerName,
         signal_receiving_center_name=@srcName, signal_receiving_center_phone=@srcPhone,
         notes=@notes, updated_at=@updatedAt
       WHERE id=@id`,
    ).run({
      id: row.id,
      address,
      street: client.street,
      city: client.city,
      postCode: client.postCode || '',
      country: client.country,
      province: client.province,
      contactName: client.ownerManagerName,
      ownerManagerName: client.ownerManagerName,
      srcName: client.signalReceivingCenterName || '',
      srcPhone: client.signalReceivingCenterPhone || '',
      notes,
      updatedAt: now,
    });
    row = db.prepare('SELECT * FROM clients WHERE id = ?').get(row.id);
    console.log('Updated client', client.name);
  }
  return row;
}

function upsertInspection(db, {
  clientId,
  templateId,
  title,
  inspectedAt,
  projectNumber,
  document,
}) {
  const now = new Date().toISOString();
  let inspection = db
    .prepare(
      `SELECT * FROM inspections WHERE client_id = ? AND title = ? COLLATE NOCASE LIMIT 1`,
    )
    .get(clientId, title);
  if (!inspection) {
    const id = randomUUID();
    db.prepare(
      `INSERT INTO inspections (
         id, client_id, template_kind, template_id, title, status, inspector, document,
         inspected_at, project_number, cadence, next_due_at, created_at, updated_at
       ) VALUES (
         @id, @clientId, 'builtin', @templateId, @title, 'draft', @inspector, @document,
         @inspectedAt, @projectNumber, 'annual', NULL, @createdAt, @updatedAt
       )`,
    ).run({
      id,
      clientId,
      templateId,
      title,
      inspector: TECH.name,
      document: JSON.stringify(document),
      inspectedAt,
      projectNumber,
      createdAt: now,
      updatedAt: now,
    });
    inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(id);
    console.log('  Created inspection', title);
  } else {
    db.prepare(
      `UPDATE inspections SET
         template_id=@templateId, inspector=@inspector, document=@document,
         inspected_at=@inspectedAt, project_number=@projectNumber, updated_at=@updatedAt
       WHERE id=@id`,
    ).run({
      id: inspection.id,
      templateId,
      inspector: TECH.name,
      document: JSON.stringify(document),
      inspectedAt,
      projectNumber,
      updatedAt: now,
    });
    inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(inspection.id);
    console.log('  Updated inspection', title);
  }
  return inspection;
}

function clientPayload(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    street: row.street,
    unit: row.unit,
    city: row.city,
    postCode: row.post_code,
    country: row.country,
    province: row.province,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    ownerManagerName: row.owner_manager_name,
    ownerManagerPhone: row.owner_manager_phone,
    signalReceivingCenterName: row.signal_receiving_center_name,
    signalReceivingCenterPhone: row.signal_receiving_center_phone,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function inspectionPayload(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    templateKind: row.template_kind,
    templateId: row.template_id,
    title: row.title,
    status: row.status,
    inspector: row.inspector,
    document: JSON.parse(row.document),
    inspectedAt: row.inspected_at,
    projectNumber: row.project_number,
    cadence: row.cadence,
    nextDueAt: row.next_due_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function buildImportablePdf(payload, title) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  page.drawText('BlazeAudit inspection export', {
    x: 48,
    y: 740,
    size: 16,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  const safeTitle = title.replace(/[^\x20-\x7E]/g, '-').slice(0, 95);
  page.drawText(safeTitle, {
    x: 48,
    y: 712,
    size: 11,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText('Embedded BlazeAudit JSON - Import via Documents > Import Document.', {
    x: 48,
    y: 688,
    size: 10,
    font,
  });
  const clientLine = `Client: ${payload.client?.name || ''}`.replace(/[^\x20-\x7E]/g, '-');
  page.drawText(clientLine.slice(0, 90), { x: 48, y: 668, size: 10, font });
  page.drawText(`Job #: ${payload.inspection?.projectNumber || ''}`, { x: 48, y: 652, size: 10, font });
  page.drawText(`Inspected: ${payload.inspection?.inspectedAt || ''}`, { x: 48, y: 636, size: 10, font });
  const bytes = Buffer.from(await doc.save());
  const json = Buffer.from(JSON.stringify(payload), 'utf8');
  return Buffer.concat([bytes, Buffer.from(PDF_EMBED_MARKER, 'utf8'), Buffer.from(json.toString('base64'), 'utf8')]);
}

function safeFileName(reportTitle, clientName) {
  return `${reportTitle} — ${clientName}.pdf`.replace(/[<>:"/\\|?*]/g, '-');
}

app.whenReady().then(async () => {
  try {
    const dataDir = join(process.cwd(), 'data');
    const account = pickAccount(dataDir);
    if (!account) {
      console.error('No usable account with keyx.dpapi under data/accounts/. Log in once in dev.');
      app.exit(1);
      return;
    }
    console.log('Using account', account.id);

    const db = new Database(account.dbPath);
    db.pragma("cipher='sqlcipher'");
    db.pragma(`key="x'${account.keyX}'"`);
    db.exec('SELECT count(*) FROM sqlite_master');

    const faTpl = loadBuiltinForm(db, 'form-prototype');
    const feTpl = loadBuiltinForm(db, 'portable-extinguishers');
    const elTpl = loadBuiltinForm(db, 'emergency-lighting');
    if (!faTpl || !feTpl || !elTpl) {
      console.error('Missing builtin templates. Unlock the app once to seed them.');
      db.close();
      app.exit(1);
      return;
    }

    const extractsDir = join(dataDir, 'pps-2026-extracts');
    const creditFaExtract = readFileSync(join(extractsDir, 'credit-v-fa.txt'), 'utf8');
    const creditElExtract = readFileSync(join(extractsDir, 'credit-v-eml.txt'), 'utf8');

    mkdirSync(OUT_DIR, { recursive: true });

    const chaseClient = upsertClient(db, CHASE, 'chase FA/FE/EML');
    const creditClient = upsertClient(db, CREDIT, 'Credit V FA/FE/EML');

    const jobs = [];

    // --- Chase FA ---
    {
      const form = structuredClone(faTpl.form);
      let values = emptyValuesFromForm(form);
      values = applyFaCommon(values, CHASE, {
        inspectedAt: CHASE.inspectedAt,
        manufacturer: 'MIRCOM',
        modelNumber: 'FA-1000',
        controlLocation: 'ELECTRICAL ROOM',
        controlId: '',
        annunciatorLocation: 'EXIT WEST',
        annunciatorId: 'MIRCOM',
        batteryLocation: 'BATTERIES INSIDE F/P',
        measures: {
          c: { voltage: '26.7', current: '' },
          d: { voltage: '26.6', current: '0.45' },
          e: { voltage: '25.7', current: '0.96' },
        },
        dateCode: '2020',
        batteryCapacity: '2x18',
        chargingCurrent: '1.7',
        afterTestVoltage: '25.2',
        fsrcName: '',
        fsrcPhone: '',
        connectedFsrc: 'na',
        deficiencies: 'yes',
        owner: CHASE.ownerManagerName,
        notes: [
          'Source: chase FA.pdf — Fire Alarm System Test and Inspection Report (CAN/ULC-S536-2004).',
          `Job ${CHASE.projectNumber}. Date June 9/25. System: Mircom FA-1000 (addressable, single-stage).`,
          `Technician: ${TECH.name} (${TECH.identification}). Report copy to: ${CHASE.ownerManagerName}.`,
          'Ancillary on source: AIR HANDLING UNITS, MONITORING.',
          'REMARKS (source): BASEMENT CORRIDOR IS FULL OF JUNK, THIS IS THE ONLY MEANS OF EGRESS FROM BASEMENT AND NEEDS TO BE CLEANED IMMEDIATELY !!!',
          'IDR: device location/type mapped from OCR; checklist ticks left blank (not inventing Y/N). Smoke sensitivities recorded where OCR showed values.',
          'Device legend (source): M=Edwards 79KNR; HT; S=System Sensor 1400; FS=Potter VSR-F; SS=Victalic 708; H=EST 882-2C; EOL=Edwards.',
        ].join('\n'),
      });
      values = fillIdrPages(form, values, chaseFaDevices());
      const title = `Annual Fire Alarm Test — ${CHASE.name}`;
      const document = {
        schemaVersion: 2,
        kind: 'form-inspection',
        clientId: chaseClient.id,
        form,
        values,
      };
      const insp = upsertInspection(db, {
        clientId: chaseClient.id,
        templateId: faTpl.id,
        title,
        inspectedAt: CHASE.inspectedAt,
        projectNumber: CHASE.projectNumber,
        document,
      });
      jobs.push({ title, file: safeFileName('Annual Fire Alarm Test', CHASE.name), insp, client: chaseClient });
    }

    // --- Chase FE ---
    {
      const form = structuredClone(feTpl.form);
      let values = emptyValuesFromForm(form);
      values['portable-extinguisher-cover'] = {
        date: CHASE.inspectedAt,
        jobContactNo: CHASE.projectNumber,
        inspectorName: TECH.name,
        signatureName: TECH.name,
        recommendationsNotes: 'Source: chase fe.pdf. Common-area extinguishers listed; hydrostatic due dates in deficiency column where shown.',
      };
      values = fillGridPages(
        form,
        values,
        'fireExtinguisherTestRecord',
        'fire-extinguisher-test-record',
        'Fire Extinguisher Test Record',
        'page-fe',
        'fire-extinguisher-test-record',
        'section-fire-extinguisher-test-record',
        chaseFeRows(),
        emptyFeRow,
      );
      const title = `Annual Portable Extinguishers Inspection Report — ${CHASE.name}`;
      const document = {
        schemaVersion: 2,
        kind: 'form-inspection',
        clientId: chaseClient.id,
        form,
        values,
      };
      const insp = upsertInspection(db, {
        clientId: chaseClient.id,
        templateId: feTpl.id,
        title,
        inspectedAt: CHASE.inspectedAt,
        projectNumber: CHASE.projectNumber,
        document,
      });
      jobs.push({
        title,
        file: safeFileName('Annual Portable Extinguishers Inspection Report', CHASE.name),
        insp,
        client: chaseClient,
      });
    }

    // --- Chase EML ---
    {
      const form = structuredClone(elTpl.form);
      let values = emptyValuesFromForm(form);
      values['emergency-lighting-cover'] = {
        date: CHASE.inspectedAt,
        jobContactNo: CHASE.projectNumber,
        certifyTested: 'yes',
        certifyFunctional: 'yes',
        technicianName: TECH.name,
        signatureName: TECH.name,
      };
      values['emergency-lighting-comments'] =
        'GARBAGE ROOM HAS NO EMERGENCY LIGHTING.\nBREAKERS LOCATED IN MAIN ELECTRICAL ROOM (PANEL EMI) BRKR #2 & #4.';
      values['emergency-lighting-recommendations'] =
        'RECOMMENDED REPLACING THE NORTH AND SOUTH EXIT FROM MALL EL WITH COMBO UNITS.';
      values['emergency-lighting-device-legend'] = chaseElLegend();
      values = fillGridPages(
        form,
        values,
        'emergencyLightingInspectionRecord',
        'emergency-lighting-inspection-record',
        'Inspection Record',
        'page-elr',
        'emergency-lighting-inspection-record',
        'section-emergency-lighting-inspection-record',
        chaseElRows(),
        emptyElRow,
      );
      const title = `Emergency Lighting Inspection Report — ${CHASE.name}`;
      const document = {
        schemaVersion: 2,
        kind: 'form-inspection',
        clientId: chaseClient.id,
        form,
        values,
      };
      const insp = upsertInspection(db, {
        clientId: chaseClient.id,
        templateId: elTpl.id,
        title,
        inspectedAt: CHASE.inspectedAt,
        projectNumber: CHASE.projectNumber,
        document,
      });
      jobs.push({
        title,
        file: safeFileName('Emergency Lighting Inspection Report', CHASE.name),
        insp,
        client: chaseClient,
      });
    }

    // --- Credit V FA ---
    {
      const form = structuredClone(faTpl.form);
      let values = emptyValuesFromForm(form);
      const devices = parseCreditFaDevices(creditFaExtract);
      console.log('  Credit V FA devices parsed:', devices.length);
      values = applyFaCommon(values, CREDIT, {
        inspectedAt: CREDIT.inspectedAtFa,
        manufacturer: 'MIRCOM',
        modelNumber: 'FA 1000',
        controlLocation: 'PARKING ELEC. RM',
        controlId: 'MIRCOM FA 1000',
        annunciatorLocation: 'FRONT ENTRANCE',
        annunciatorId: 'RA-1000',
        batteryLocation: 'PARKING ELEC. ROOM',
        measures: {
          c: { voltage: '26.8', current: '' },
          d: { voltage: '26.4', current: '0.74' },
          e: { voltage: '25.65', current: '2.48' },
        },
        dateCode: '2022',
        batteryCapacity: '33',
        chargingCurrent: '2.12',
        afterTestVoltage: '25.6',
        fsrcName: CREDIT.signalReceivingCenterName,
        fsrcPhone: CREDIT.signalReceivingCenterPhone,
        connectedFsrc: 'yes',
        deficiencies: 'no',
        owner: CREDIT.ownerManagerName,
        notes: [
          'Source: Credit V FA.pdf — Fire Alarm System Test and Inspection Report (CAN/ULC-S536-2004).',
          `Job ${CREDIT.projectNumber}. Date Aug 30, 2025. System: Mircom FA 1000.`,
          `Technician: ${TECH.name} (${TECH.identification}). Report copy to: ${CREDIT.ownerManagerName}.`,
          `FSRC: ${CREDIT.signalReceivingCenterName} ${CREDIT.signalReceivingCenterPhone}.`,
          'Ancillary on source: FAN SHUTDOWN, MAGLOCK, DOOR HOLDER.',
          `IDR: ${devices.length} devices parsed from OCR (location/type/sensitivity/circuit where present). Checklist ticks left blank.`,
          'Device legend (source): M=Mirtone 207-41; RHT=Mircom MIRCR-135 / FDD CR135-2CO; S=System Sensor 2181A; DS=System Sensor D2A; FS=Potter WS-5; SS=Potter OSYSU-A1; OS=Potter PS40; B=Notifier KSM-6-24; ANN=Mircom RA-1000; FACP=Mircom FA 1000. Sensitivity method MOD 400, range 1.8%FT–5.8%FT.',
        ].join('\n'),
      });
      values = fillIdrPages(form, values, devices);
      const title = `Annual Fire Alarm Test — ${CREDIT.name}`;
      const document = {
        schemaVersion: 2,
        kind: 'form-inspection',
        clientId: creditClient.id,
        form,
        values,
      };
      const insp = upsertInspection(db, {
        clientId: creditClient.id,
        templateId: faTpl.id,
        title,
        inspectedAt: CREDIT.inspectedAtFa,
        projectNumber: CREDIT.projectNumber,
        document,
      });
      jobs.push({
        title,
        file: safeFileName('Annual Fire Alarm Test', CREDIT.name),
        insp,
        client: creditClient,
      });
    }

    // --- Credit V FE ---
    {
      const form = structuredClone(feTpl.form);
      let values = emptyValuesFromForm(form);
      values['portable-extinguisher-cover'] = {
        date: CREDIT.inspectedAtFe,
        jobContactNo: CREDIT.projectNumber,
        inspectorName: TECH.name,
        signatureName: TECH.name,
        recommendationsNotes: [
          'Source: Credit V FE.pdf — Annual Fire Extinguishers and Fire Hose Inspection Report.',
          'Blaze portable form maps extinguishers only. Source also listed 75′ fire hose cabinets at many FHC/garage/suite locations — hose items not entered as extinguisher rows; confirm on site if hose record is required separately.',
        ].join('\n'),
      };
      values = fillGridPages(
        form,
        values,
        'fireExtinguisherTestRecord',
        'fire-extinguisher-test-record',
        'Fire Extinguisher Test Record',
        'page-fe',
        'fire-extinguisher-test-record',
        'section-fire-extinguisher-test-record',
        creditFeRows(),
        emptyFeRow,
      );
      const title = `Annual Portable Extinguishers Inspection Report — ${CREDIT.name}`;
      const document = {
        schemaVersion: 2,
        kind: 'form-inspection',
        clientId: creditClient.id,
        form,
        values,
      };
      const insp = upsertInspection(db, {
        clientId: creditClient.id,
        templateId: feTpl.id,
        title,
        inspectedAt: CREDIT.inspectedAtFe,
        projectNumber: CREDIT.projectNumber,
        document,
      });
      jobs.push({
        title,
        file: safeFileName('Annual Portable Extinguishers Inspection Report', CREDIT.name),
        insp,
        client: creditClient,
      });
    }

    // --- Credit V EML ---
    {
      const form = structuredClone(elTpl.form);
      let values = emptyValuesFromForm(form);
      const elRows = parseCreditElRows(creditElExtract);
      console.log('  Credit V EL units parsed:', elRows.length);
      values['emergency-lighting-cover'] = {
        date: CREDIT.inspectedAtEml,
        jobContactNo: CREDIT.projectNumber,
        certifyTested: 'yes',
        certifyFunctional: 'yes',
        technicianName: TECH.name,
        signatureName: TECH.name,
      };
      values['emergency-lighting-comments'] = [
        '1) MAIN FLOOR ELECTR. RM.-PANEL LP-ZZ (347V)',
        '2) 5th FL. EL. RM. PANEL 5AA',
        '3) 5th FL. EL. RM. PANEL 5B-#3',
        '4) 4th FL. EL. RM. PANEL 4AA+4B ,#3, #15(4AA)',
        '5) 3rd FL. EL. RM. PANEL 3-AA+3B, #3',
        '6) 2nd FL. EL. RM. PANEL 2AA',
      ].join('\n');
      values['emergency-lighting-recommendations'] = '';
      values['emergency-lighting-device-legend'] = creditElLegend();
      values = fillGridPages(
        form,
        values,
        'emergencyLightingInspectionRecord',
        'emergency-lighting-inspection-record',
        'Inspection Record',
        'page-elr',
        'emergency-lighting-inspection-record',
        'section-emergency-lighting-inspection-record',
        elRows,
        emptyElRow,
      );
      const title = `Emergency Lighting Inspection Report — ${CREDIT.name}`;
      const document = {
        schemaVersion: 2,
        kind: 'form-inspection',
        clientId: creditClient.id,
        form,
        values,
      };
      const insp = upsertInspection(db, {
        clientId: creditClient.id,
        templateId: elTpl.id,
        title,
        inspectedAt: CREDIT.inspectedAtEml,
        projectNumber: CREDIT.projectNumber,
        document,
      });
      jobs.push({
        title,
        file: safeFileName('Emergency Lighting Inspection Report', CREDIT.name),
        insp,
        client: creditClient,
      });
    }

    // Export PDFs
    for (const job of jobs) {
      const payload = {
        kind: 'blazeaudit-inspection',
        schemaVersion: 2,
        inspectionId: job.insp.id,
        exportedAt: new Date().toISOString(),
        appVersion: app.getVersion?.() || '0.1.14',
        inspection: inspectionPayload(job.insp),
        client: clientPayload(job.client),
      };
      const outPath = join(OUT_DIR, job.file);
      const pdf = await buildImportablePdf(payload, job.title);
      writeFileSync(outPath, pdf);
      console.log('Wrote', outPath, `(${pdf.length} bytes)`);
    }

    db.close();
    console.log('\nDone. Processed folder:', OUT_DIR);
    console.log('Import: Documents → Import Document on each PDF.');
    app.exit(0);
  } catch (err) {
    console.error(err);
    app.exit(1);
  }
});
