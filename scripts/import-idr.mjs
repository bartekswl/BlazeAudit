/**
 * scripts/import-idr.mjs
 *
 * Bulk-imports Individual Device Record data parsed from paper inspection sheets
 * into a BlazeAudit inspection document.
 *
 * Usage (from project root, while app is NOT running):
 *   npx electron scripts/import-idr.mjs [inspectionId]
 *
 * If inspectionId is omitted, available inspections are listed and you can
 * re-run with the desired ID.
 */

import { app, safeStorage } from 'electron';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

// BlazeAudit dev mode stores Electron userData in .electron-dev/ (project root).
// safeStorage uses a two-layer scheme: the DB key is encrypted with an AES key
// stored (DPAPI-wrapped) in {userData}/Local State. We must point to the same
// userData so that safeStorage can read and unwrap that AES key.
app.setPath('userData', resolve(process.cwd(), '.electron-dev'));

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3-multiple-ciphers');

// ---------------------------------------------------------------------------
// Constants (must mirror src/shared/form/individualDeviceRecord.ts)
// ---------------------------------------------------------------------------
const ROW_COUNT = 22;

// ---------------------------------------------------------------------------
// Row data helper
// r(location, deviceType, correctlyInstalled, measurements,
//   alarmConfirmed, annunciatorIndication, circuitNumber,
//   supervisedCircuitTrouble, comments)
//
// choice: 'yes' | 'no' | 'na' | null
// ---------------------------------------------------------------------------
function r(loc, dev, inst, meas, alarm, annun, circuit, sup, comments) {
  return {
    deviceLocation: loc,
    annunciationLabel: '',
    deviceType: dev,
    requiresService: null,
    circuitNumber: circuit,
    fireZone: '',
    correctlyInstalled: inst,
    measurements: meas,
    alarmConfirmed: alarm,
    annunciatorIndication: annun,
    supervisedCircuitTrouble: sup,
    comments,
  };
}

function emptyRow() {
  return r('', '', null, '', null, null, '', null, '');
}

// ---------------------------------------------------------------------------
// ALL ROWS — parsed from paper inspection pages 21–27 of 33
// Sequence: pg21 → pg22 → pg23 → pg24 → pg25 → pg26 → pg27
// ---------------------------------------------------------------------------
const ALL_ROWS = [
  // ── PAGE 21 ─────────────────────────────────────────────────────────────
  // Loop 1 – Manual Stations
  r('Ground Floor North Exit by Elevator MS',    'MS',  'yes', '',          'yes', 'yes', '1:2-1-1',    'yes', 'FAZ-06'),
  r('Ground Floor North Exit by Elevator MS',    'EM',  'yes', '',          'yes', 'yes', '1:2-1-1',    'yes', ''),
  r('Ground Floor C102 Northwest Lobby MS',      'MS',  'yes', '',          'yes', 'yes', '1:2-1-2',    'yes', 'FAZ-06'),
  r('Ground Floor C102 Northwest Lobby MS',      'EM',  'yes', '',          'yes', 'yes', '1:2-1-2',    'yes', ''),
  r('Ground Floor Electrical Rm S102 MS',        'MS',  'yes', '',          'yes', 'yes', '1:2-1-3',    'yes', 'FAZ-06'),
  r('Ground Fl Dining Area C105 West Exit MS',   'MS',  'yes', '',          'yes', 'yes', '1:2-1-4',    'yes', 'FAZ-06'),
  r('Ground Fl Dining Area C105 West Exit MS',   'EM',  'yes', '',          'yes', 'yes', '1:2-1-4',    'yes', ''),
  r('Ground Fl Kitchen S103 MS',                 'MS',  'yes', '',          'yes', 'yes', '1:2-1-5',    'yes', ''),
  r('Ground Fl Exit to South Stair MS',          'MS',  'yes', '',          'yes', 'yes', '1:2-1-6',    'yes', 'FAZ-06'),
  r('Ground Fl Exit to South Stair MS',          'EM',  'yes', '',          'yes', 'yes', '1:2-1-6',    'yes', 'FAZ-06'),
  r('Grnd Fl South Exit by Mech Rm S106 MS',    'MS',  'yes', '',          'yes', 'yes', '1:2-1-7',    'yes', 'FAZ-06'),
  r('Ground Floor South Stair Exit MS',          'MS',  'yes', '',          'yes', 'yes', '1:2-1-8',    'yes', 'FAZ-02'),
  r('Ground Floor South Stair Exit MS',          'EM',  'yes', '',          'yes', 'yes', '1:2-1-8',    'yes', ''),
  // Loop 1 – Smoke Detectors
  r('Ground Floor Elevator Lobby Smoke',         'S',   'yes', '',          'yes', 'yes', '1:2-1-10',   'yes', ''),
  r('Ground Floor Elevator Lobby Smoke',         'EM',  'yes', '',          'yes', 'yes', '1:2-1-10',   'yes', 'FAZ-06'),
  r('Ground Flr Corr. By Reception Desk Smk',   'S',   'yes', '5.44%/ft',  'yes', 'yes', '1:2-1-11',   'yes', 'FAZ-06'),
  r('Ground Floor Corr. By Washrm C106 Smk',    'S',   'yes', '4.56%/ft',  'yes', 'yes', '1:2-1-12',   'yes', 'FAZ-06'),
  r('Ground Floor Corridor by South Stair Smk', 'S',   'yes', '5.44%/ft',  'yes', 'yes', '1:2-1-13',   'yes', ''),
  r('Ground Floor Corridor by South Stair Smk', 'EM',  'yes', '',          'yes', 'yes', '1:2-1-13',   'yes', ''),
  r('Ground Floor Kitchen S103 Smoke',           'S',   'yes', '5.44%/ft',  'yes', 'yes', '1:2-1-14',   'yes', 'FAZ-06'),
  r('Ground Floor Mechanical Rm S106 Smoke',     'S',   'yes', '',          'yes', 'yes', '1:2-1-17',   'yes', ''),
  r('Ground Floor Mechanical Rm S106 Smoke',     'EM',  'yes', '',          'yes', 'yes', '1:2-1-17',   'yes', ''),
  r('Elevator Pit Heat',                         'RHT', 'yes', '',          'yes', 'yes', '1:2-1-18',   'yes', ''),
  r('Elevator Pit Heat',                         'EM',  'yes', '',          'yes', 'yes', '1:2-1-18',   'yes', 'FAZ-02'),
  r('Ground Floor in South Stair Smoke',         'S',   'yes', '',          'yes', 'yes', '1:2-1-22',   'yes', ''),
  r('Ground Floor in South Stair Smoke',         'EM',  'yes', '',          'yes', 'yes', '1:2-1-22',   'yes', ''),
  r('Ground Floor in North Stair Smoke',         'S',   'yes', '0.19%/ft',  'yes', 'yes', '1:2-1-23',   'yes', 'FAZ-01'),
  r('Ground floor in North Stair Smoke',         'EM',  'yes', '',          'yes', 'yes', '1:2-1-23',   'yes', ''),
  // Loop 1 – Sprinkler Supervisory (FAZ-20/FSZ-32)
  r('Sprinkler Riser FAZ-20/FSZ-32',            'SFD', 'yes', '',          'yes', 'yes', '1:2-1-60',   'yes', ''),
  r('FAZ-20 Dry Sprinkler Flow FS-7',            'FS',  'yes', '',          'yes', 'yes', '1:2-1-60^1', 'yes', ''),
  r('FAZ-20 Dry Sprinkler Flow FS-7',            'EOL', 'yes', '',          null,  null,  '1:2-1-60^1', 'yes', ''),
  r('FSZ-32 Dry Sprinkler Ctl Valve SV-10',      'SV',  'yes', '',          null,  'yes', '1:2-1-60^2', 'yes', ''),
  r('FSZ-32 Dry Sprinkler Ctl Valve SV-10',      'EOL', 'yes', '',          null,  null,  '1:2-1-60^2', null,  ''),
  // Sprinkler Riser FAZ-22/FSZ-29 / Class 1 Standpipe
  r('Sprinkler Riser FAZ-22/FSZ-29',            'SFD', 'yes', '',          'yes', 'yes', '1:2-1-61',   'yes', ''),
  r('FAZ-23 Flow for Class 1 Standpipe FS-7',   'FS',  'yes', '35"',       'yes', 'yes', '1:2-1-61^1', 'yes', ''),

  // ── PAGE 22 ─────────────────────────────────────────────────────────────
  r('FAZ-23 Flow for Class 1 Standpipe FS-7',   'EOL', 'yes', '',          null,  null,  '1:2-1-61^1', null,  ''),
  r('FSZ-30 Ctl Vlv for Class 1 Stdplp SV-4',   'SV',  'yes', '',          null,  'yes', '1:2-1-61^2', null,  ''),
  r('FSZ-30 Ctl Vlv for Class 1 Stdplp SV-4',   'EOL', 'yes', '',          null,  null,  '1:2-1-61^2', null,  ''),
  // Sprinkler Riser FAZ-22/FSZ-31
  r('Sprinkler Riser FAZ-22/FSZ-31',            'SFD', 'yes', '',          'yes', 'yes', '1:2-1-62',   'yes', ''),
  r('FAZ-22 Ground Fl Sprinkler Flow FS-2',      'FS',  'yes', '35"',       'yes', 'yes', '1:2-1-62^1', 'yes', ''),
  r('FAZ-22 Ground Fl Sprinkler Flow FS-2',      'EOL', 'yes', '',          null,  null,  '1:2-1-62^1', null,  ''),
  r('FSZ-31 Ground Fl Ctl Valve SV-5',           'SV',  'yes', '',          null,  'yes', '1:2-1-62^2', 'yes', ''),
  r('FSZ-31 Ground Fl Ctl Valve SV-5',           'EOL', 'yes', '',          null,  null,  '1:2-1-62^2', null,  ''),
  // Sprinkler Riser FAZ-21/FSZ-29
  r('Sprinkler Riser FAZ-21/FSZ-29',            'SFD', 'yes', '',          'yes', 'yes', '1:2-1-63',   'yes', ''),
  r('FAZ-21 Dedicated Spr/Stdpipe Flow FS-1',   'FS',  'yes', '35"',       'yes', 'yes', '1:2-1-63^1', 'yes', ''),
  r('FAZ-21 Dedicated Spr/Stdpipe Flow FS-1',   'EOL', 'yes', '',          null,  null,  '1:2-1-63^1', null,  ''),
  r('FSZ-29 Dedicated Spr/Stdplp Ctl Vlv SV-3', 'SV',  'yes', '',          null,  'yes', '1:2-1-63^2', 'yes', ''),
  r('FSZ-29 Dedicated Spr/Stdplp Ctl Vlv SV-3', 'EOL', 'yes', '',          null,  null,  '1:2-1-63^2', null,  ''),
  // Incoming Water / Dry System
  r('Incoming Water SV/Dry Sys Low Air',         'SFD', 'yes', '',          'yes', 'yes', '1:2-1-64',   'yes', ''),
  r('Main Incoming Water SV',                    'SV',  'yes', '',          null,  'yes', '1:2-1-64^1', 'yes', ''),
  r('Main Incoming Water SV',                    'EOL', 'yes', '',          null,  null,  '1:2-1-64^1', null,  ''),
  r('Dry Sys Low Air',                           'FS',  'yes', '25 psi',    'yes', 'yes', '1:2-1-64^2', 'yes', ''),
  r('Dry Sys Low Air',                           'EOL', 'yes', '',          null,  null,  '1:2-1-64^2', null,  ''),
  // Kitchen Hood Suppression
  r('Kitchen Hood Suppression Monitor/Relay',    'SFD', 'yes', '',          'yes', 'yes', '1:2-1-90',   'yes', ''),
  r('Kitchen Hood Suppression Monitor',          'MON', 'yes', '',          null,  null,  '1:2-1-90^1', null,  ''),
  r('Kitchen Hood Suppression Monitor',          'EOL', 'yes', '',          null,  null,  '1:2-1-90^1', null,  ''),
  r('Kitchen Hood Suppression Relay',            'AD',  null,  '',          null,  null,  '1:2-1-90^2', null,  ''),
  r('Ground Floor Fan Shutdown Relay',           'SFD', 'yes', '',          null,  null,  '1:2-1-91',   null,  ''),
  r('Ground Floor Fan Shutdown Relay',           'AD',  null,  '',          null,  null,  '1:2-1-91',   null,  ''),
  // PAD-5
  r('PAD-5 MB, 2x class A',                     'PAD-5','yes','',          'yes', 'yes', '1:2-1-100',  null,  ''),
  r('PAD-5 CLSA, 2x class A',                   'PAD-5','yes','',          null,  null,  '1:2-1-101',  null,  ''),
  // Loop 2 – Heat / Manual Stations
  r('Elevator Top of Shaft Heat',                'RHT', 'yes', '',          'yes', 'yes', '1:2-2-19',   'yes', 'FAZ-03'),
  r('Elevator Top of Shaft Heat',                'EM',  'yes', '',          'yes', 'yes', '1:2-2-19',   'yes', ''),
  r('2nd Floor North By Stair A MS',             'MS',  'yes', '',          'yes', 'yes', '1:2-2-20',   'yes', ''),
  r('2nd Floor North By Stair A MS',             'EM',  'yes', '',          'yes', 'yes', '1:2-2-20',   'yes', ''),
  r('2nd Floor South By Stair B MS',             'MS',  'yes', '',          'yes', 'yes', '1:2-2-21',   'yes', ''),
  r('2nd Floor South By Stair B MS',             'EM',  'yes', '',          'yes', 'yes', '1:2-2-21',   'yes', ''),
  // Loop 2 – Smoke Detectors (2nd floor)
  r('2nd Floor North Elec. Closet S201 Smoke',  'S',   'yes', '5.44%/ft',  'yes', 'yes', '1:2-2-25',   'yes', ''),
  r('2nd Floor Elevator Lobby Smoke',            'S',   'yes', '5.44%/ft',  'yes', 'yes', '1:2-2-26',   'yes', ''),
  r('2nd Floor Corridor C201 North Smoke',       'S',   'yes', '5.06%/ft',  'yes', 'yes', '1:2-2-27',   'yes', ''),
  r('2nd Floor Corridor C201 Center Smoke',      'S',   'yes', '5.44%/ft',  'yes', 'yes', '1:2-2-28',   'yes', ''),
  r('2nd Floor Corridor by South Stair B Smk',  'S',   'yes', '5.44%/ft',  'yes', 'yes', '1:2-2-29',   'yes', ''),
  // Loop 2 – Manual Stations (3rd floor)
  r('3rd Floor North By Stair A MS',             'MS',  'yes', '',          'yes', 'yes', '1:2-2-30',   'yes', 'FAZ-08'),
  r('3rd Floor North By Stair A MS',             'EM',  'yes', '',          'yes', 'yes', '1:2-2-30',   'yes', ''),
  r('3rd Floor South By Stair B MS',             'MS',  'yes', '',          'yes', 'yes', '1:2-2-31',   'yes', ''),
  r('3rd Floor South By Stair B MS',             'EM',  'yes', '',          'yes', 'yes', '1:2-2-31',   'yes', ''),

  // ── PAGE 23 ─────────────────────────────────────────────────────────────
  // Loop 2 – Smoke (3rd floor)
  r('3rd Floor North Elec. Closet S301 Smoke',  'S',   'yes', '1.56%/ft',  'yes', 'yes', '1:2-2-35',   'yes', ''),
  r('3rd Floor North Elec. Closet S301 Smoke',  'EM',  'yes', '',          'yes', 'yes', '1:2-2-35',   'yes', ''),
  r('3rd Floor Elevator Lobby Smoke',            'S',   'yes', '0.69%/ft',  'yes', 'yes', '1:2-2-36',   'yes', ''),
  r('3rd Floor Corridor C301 North Smoke',       'S',   'yes', '2.13%/ft',  'yes', 'yes', '1:2-2-37',   'yes', ''),
  r('3rd Floor Corridor C301 Center Smoke',      'S',   'yes', '0.56%/ft',  'yes', 'yes', '1:2-2-38',   'yes', ''),
  r('3rd Floor Corridor C301 South Smoke',       'S',   'yes', '0.81%/ft',  'yes', 'yes', '1:2-2-39',   'yes', ''),
  // Loop 2 – Manual Stations / Smoke (4th floor)
  r('4th Floor North By North Stair A MS',       'MS',  'yes', '',          'yes', 'yes', '1:2-2-40',   'yes', ''),
  r('4th Floor North By North Stair A MS',       'EM',  'yes', '',          'yes', 'yes', '1:2-2-40',   'yes', ''),
  r('4th Floor South By Stair B MS',             'MS',  'yes', '',          'yes', 'yes', '1:2-2-41',   'yes', 'FAZ-09'),
  r('4th Floor South By Stair B MS',             'EM',  'yes', '',          'yes', 'yes', '1:2-2-41',   'yes', ''),
  r('4th Floor Elev. Lobby Smoke',               'S',   'yes', '5.44%/ft',  'yes', 'yes', '1:2-2-44',   'yes', ''),
  r('4th Floor Elev. Lobby Smoke',               'EM',  'yes', '',          'yes', 'yes', '1:2-2-44',   'yes', ''),
  r('4th Floor North Elevator Closet Smoke',     'S',   'yes', '5.44%/ft',  'yes', 'yes', '1:2-2-45',   'yes', 'FAZ-09'),
  r('4th Floor North Elevator Closet Smoke',     'EM',  'yes', '',          'yes', 'yes', '1:2-2-46',   'yes', 'FAZ-09'),
  r('4th Floor Corridor C401 North Smoke',       'S',   'yes', '1.88%/ft',  'yes', 'yes', '1:2-2-47',   'yes', 'FAZ-09'),
  r('4th Floor Corridor C401 Center Smoke',      'S',   'yes', '3.63%/ft',  'yes', 'yes', '1:2-2-48',   'yes', ''),
  r('4th Floor Corridor C401 South Smoke',       'S',   'yes', '5.38%/ft',  'yes', 'yes', '1:2-2-49',   'yes', ''),
  r('4th Floor North Stair A Smoke',             'S',   'yes', '5.44%/ft',  'yes', 'yes', '1:2-2-51',   'yes', ''),
  r('4th Floor North Stair A Smoke',             'EM',  'yes', '',          'yes', 'yes', '1:2-2-51',   'yes', ''),
  r('4th Floor South Stair B Smoke',             'S',   'yes', '4.5%/ft',   'yes', 'yes', '1:2-2-52',   'yes', 'FAZ-02'),
  r('4th Floor South Stair B Smoke',             'EM',  'yes', '',          'yes', 'yes', '1:2-2-52',   'yes', ''),
  // Rooftop Duct Smoke
  r('Rooftop DSD-MUA-01 Duct Smoke',             'DS',  'yes', '',          'yes', 'yes', '1:2-2-55',   'yes', ''),
  r('Rooftop DSD-MUA-01 Duct Smoke',             'EM',  'yes', '',          'yes', 'yes', '1:2-2-55',   'yes', ''),
  // Loop 2 – Sprinkler (FAZ-24/FSZ-33, 2nd floor)
  r('Sprinkler Riser FAZ-24/FSZ-33',            'SFD', 'yes', '',          'yes', 'yes', '1:2-2-65',   'yes', ''),
  r('FAZ-24 2nd Floor Spr Flow FS-3',            'FS',  'yes', "35'",       'yes', 'yes', '1:2-2-65^1', 'yes', ''),
  r('FAZ-24 2nd Floor Spr Flow FS-3',            'EOL', 'yes', '',          null,  null,  '1:2-2-65^1', 'yes', ''),
  r('FSZ-33 2nd Fl Sprinkler Ctl Vlv SV-6',     'SV',  'yes', '',          null,  'yes', '1:2-2-65^2', 'yes', ''),
  r('FSZ-33 2nd Fl Sprinkler Ctl Vlv SV-6',     'EOL', 'yes', '',          null,  null,  '1:2-2-65^2', 'yes', ''),
  // Loop 2 – Sprinkler (FAZ-25/FSZ-34, 3rd floor)
  r('Sprinkler Riser FAZ-25/FSZ-34',            'SFD', 'yes', '',          'yes', 'yes', '1:2-2-66',   'yes', ''),
  r('FAZ-25 3rd Fl Sprinkler Flow FS-4',         'FS',  'yes', "37'",       'yes', 'yes', '1:2-2-66^1', 'yes', ''),
  r('FAZ-25 3rd Fl Sprinkler Flow FS-4',         'EOL', 'yes', '',          null,  null,  '1:2-2-66^1', 'yes', ''),
  r('FSZ-34 3rd Fl Sprinkler Ctl Vlv SV-7',     'SV',  'yes', '',          null,  'yes', '1:2-2-66^2', 'yes', ''),
  r('FSZ-34 3rd Fl Sprinkler Ctl Vlv SV-7',     'EOL', 'yes', '',          null,  null,  '1:2-2-66^2', 'yes', ''),
  // Loop 2 – Sprinkler (FAZ-26/FSZ-35, 4th floor)
  r('Sprinkler Riser FAZ-26/FSZ-35',            'SFD', 'yes', '',          'yes', 'yes', '1:2-2-67',   'yes', ''),
  r('FAZ-26 4th Fl Sprinkler Flow FS-5',         'FS',  'yes', "27'",       'yes', 'yes', '1:2-2-67^1', 'yes', ''),
  r('FAZ-26 4th Fl Sprinkler Flow FS-5',         'EOL', 'yes', '',          null,  null,  '1:2-2-67^1', 'yes', ''),
  r('FSZ-35 4th Flr Sprinkler Ctl Vlv SV-8',    'SV',  'yes', '',          null,  'yes', '1:2-2-67^2', 'yes', ''),
  r('FSZ-35 4th Flr Sprinkler Ctl Vlv SV-8',    'EOL', 'yes', '',          null,  null,  '1:2-2-67^2', 'yes', ''),
  // Loop 2 – Stair Smokes
  r('2nd Floor in South Stair Smoke',            'S',   'yes', '5.44%/ft',  'yes', 'yes', '1:2-2-80',   'yes', 'FAZ-02'),
  r('2nd Floor in South Stair Smoke',            'EM',  'yes', '',          null,  'yes', '1:2-2-80',   'yes', ''),
  r('2nd Floor in North Stair Smoke',            'S',   'yes', '0.19%/ft',  'yes', 'yes', '1:2-2-81',   'yes', 'FAZ-01'),
  r('2nd Floor in North Stair Smoke',            'EM',  'yes', '',          'yes', 'yes', '1:2-2-81',   'yes', ''),
  r('3rd Floor in North Stair Smoke',            'S',   'yes', '5.44%/ft',  'yes', 'yes', '1:2-2-82',   'yes', 'FAZ-01'),

  // ── PAGE 24 ─────────────────────────────────────────────────────────────
  r('3rd Floor in South Stair Smoke',            'EM',  'yes', '',          'yes', 'yes', '1:2-2-83',   'yes', ''),
  // Elevator Recall
  r('Elevator Main Recall',                      'SFD', 'yes', '',          'yes', 'yes', '1:2-2-102',  'yes', ''),
  r('Elevator Main Recall',                      'AD',  'yes', '',          null,  null,  '1:2-2-102',  null,  ''),
  r('Elev. Alternative Recall Relay',            'SFD', 'yes', '',          'yes', null,  '1:2-2-103',  'yes', ''),
  r('Elev. Alternative Recall Relay',            'AD',  'yes', '',          null,  null,  '1:2-2-103',  null,  ''),
  r("Elev. Fireman's Hat Flashing",              'SFD', 'yes', '',          'yes', null,  '1:2-2-104',  'yes', ''),
  r("Elev. Fireman's Hat Flashing",              'AD',  'yes', '',          null,  null,  '1:2-2-104',  null,  ''),
  // Fan Shutdown Relays
  r('2nd Floor Fan Shutdown Relay',              'SFD', 'yes', '',          'yes', null,  '1:2-2-120',  'yes', ''),
  r('2nd Floor Fan Shutdown Relay',              'AD',  'yes', '',          null,  null,  '1:2-2-120',  null,  ''),
  r('3rd Floor Fan Shutdown Relay',              'SFD', 'yes', '',          'yes', null,  '1:2-2-130',  'yes', ''),
  r('3rd Floor Fan Shutdown Relay',              'AD',  'yes', '',          null,  null,  '1:2-2-130',  null,  ''),
  r('4th Floor Fan Shutdown Relay',              'SFD', 'yes', '',          'yes', null,  '1:2-2-140',  'yes', ''),
  r('4th Floor Fan Shutdown Relay',              'AD',  'yes', '',          null,  null,  '1:2-2-140',  null,  ''),
  r('Rooftop Fan Shutdown Relay',                'SFD', 'yes', '',          'yes', null,  '1:2-2-150',  'yes', ''),
  r('Rooftop Fan Shutdown Relay',                'AD',  'yes', '',          null,  null,  '1:2-2-150',  null,  ''),
  r('Rooftop Fan Shutdown Relay',                'EM',  'yes', '',          null,  null,  '1:2-2-150',  null,  ''),

  // ── PAGE 25 ─────────────────────────────────────────────────────────────
  // Ground Floor Horn/Strobes (NAC 1:1-5^1)
  r('North Corridor by Elevator H/V',            'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^1',    'yes', 'SL2HSW'),
  r('North Corridor By CACF Rm H/V',             'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^1',    'yes', 'SL2HSW'),
  r('Electrical Rm S102 H/V',                    'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^1',    'yes', 'SL2HSW'),
  r('Dining Area C105 North H/V',                'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^1',    'yes', 'SL2HSW'),
  r('Dining Area C105 Southeast H/V',            'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^1',    'yes', 'SL2HSW'),
  r('Kitchen S103 North H/V',                    'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^1',    'yes', 'SL2HSW'),
  r('Kitchen S103 South H/V',                    'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^1',    'yes', 'SL25W'),
  r('Universal Washroom C106',                   'V',   'yes', '15CD',     'yes', 'yes', '1:1-5^1',    'yes', 'SL2HSW'),
  r('Corridor C103 by Washroom',                 'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^1',    'yes', 'SL2HSW'),
  r('Corridor C103 South By Suite 101',          'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^1',    'yes', 'SL2HSW'),
  r('Open Office A102',                          'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^1',    'yes', 'SL2HSW'),
  r('Washroom A104 In Open office A102',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^1',    'yes', 'SL2HSW'),
  r('Office A105',                               'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^1',    'yes', 'SL2HSW'),
  r('Office A103',                               'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^1',    'yes', 'SL2HSW'),
  r('Laundry Room C107',                         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^1',    'yes', 'SL2HSW'),
  r('South Mechanical Rm S106',                  'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^1',    'yes', 'SL2HSW'),
  r('North Stair A',                             'H',   'yes', 'T3L',      'yes', 'yes', '1:1-5^1',    'yes', 'SL2HW'),
  r('South Stair B',                             'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-100^1','yes', 'SL2HSW'),
  r('Suite 101 Living room',                     'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-100^1','yes', 'SL2HSW'),
  r('Suite 101 Bedroom',                         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-100^1','yes', 'SL2HSW'),
  r('Suite 101 Washroom',                        'V',   'yes', '15CD',     'yes', 'yes', '1:1-5^1',    'yes', 'SL25W'),
  r('South exit',                                'EOL', 'yes', '',          null,  null,  '1:1-5^1',    null,  ''),
  // 2nd Floor Corridor (NAC 1:1-5^2)
  r('North Corridor by Elevator',                'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^2',    'yes', 'SL2HSW'),
  r('North Corridor by 2nd Floor',               'V',   'yes', '15CD',     'yes', 'yes', '1:1-5^2',    'yes', 'SL2SW'),
  r('Center Corridor by Suite 206',              'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^2',    'yes', 'SL2HSW'),
  r('South Corridor by Suite 208',               'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^2',    'yes', 'SL2HSW'),
  r('South end of corridor',                     'EOL', 'yes', '',          null,  null,  '1:1-5^2',    null,  ''),
  // 2nd Floor Suites (NAC 1:2-1-100^3)
  r('Suite 201 bedroom Horn/Strobe',             'H/V', 'yes', 'T3L/15CD', 'yes', null,  '1:2-1-100^3','yes', 'SL2HSW'),
  r('Suite 201 Washroom Strobe',                 'V',   'yes', '15CD',     'yes', null,  '1:2-1-100^3','yes', 'SL25W'),
  r('Suite 202 kitchen room Horn/Strobe',        'H/V', 'yes', 'T3L/15CD', 'yes', null,  '1:2-1-100^3','yes', 'SL2HSW'),
  r('Suite 202 Bed room Horn',                   'H',   'yes', 'T3L',      'yes', null,  '1:2-1-100^3','yes', 'SL2HW'),
  r('Suite 203 Dining area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', null,  '1:2-1-100^3','yes', 'SL2HSW'),
  r('Suite 204 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', null,  '1:2-1-100^3','yes', 'SL2HSW'),
  r('Suite 204 Bed room Horn',                   'H',   'yes', 'T3L',      'yes', null,  '1:2-1-100^3','yes', 'SL2HW'),

  // ── PAGE 26 ─────────────────────────────────────────────────────────────
  // 2nd Floor Suites continued
  r('Suite 205 Horn/Strobe',                     'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-100^3','yes', 'SL2HSW'),
  r('Suite 206 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-100^3','yes', 'SL2HSW'),
  r('Suite 206 Bed room Horn',                   'H',   'yes', 'T3L',      'yes', 'yes', '1:2-1-100^3','yes', 'SL2HW'),
  r('Suite 207 Horn/Strobe',                     'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-100^3','yes', 'SL2HSW'),
  r('Suite 208 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-100^3','yes', 'SL2HSW'),
  r('Suite 208 Bedroom Horn',                    'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-100^3','yes', 'SL2SW'),
  r('Suite 208 Washroom',                        'V',   'yes', '15CD',     'yes', 'yes', '1:2-1-100^3','yes', 'SL2HSW'),
  r('Suite 209 Dining area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-100^3','yes', 'SL2HSW'),
  r('Suite 211 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^2',    'yes', 'SL2HSW'),
  // 2nd Floor common areas
  r('North Stair A',                             'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^2',    'yes', 'SL2HSW'),
  r('South Stair B',                             'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^2',    'yes', 'SL2HSW'),
  r('Hallway south',                             'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^2',    'yes', 'SL2HSW'),
  r('Center Hallway',                            'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^2',    'yes', 'SL25W'),
  r('Hallway north',                             'V',   'yes', '15CD',     'yes', 'yes', '1:1-5^2',    'yes', 'SL2HSW'),
  r('Elevator lobby',                            'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-5^2',    'yes', 'SL2HSW'),
  r('South end of corridor',                     'EOL', 'yes', '',          null,  null,  '1:1-5^2',    null,  ''),
  // 3rd Floor Corridor (NAC 1:1-6^1)
  r('North Corridor by Elevator',                'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-6^1',    'yes', 'SL2HSW'),
  r('North Corridor by Suite 302',               'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-6^1',    'yes', 'SL2HSW'),
  r('Center Corridor by Suite 306',              'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-6^1',    'yes', 'SL2HSW'),
  r('South Corridor by Suite 308',               'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-6^1',    'yes', 'SL2HSW'),
  r('North Stair A',                             'EOL', 'yes', '',          null,  null,  '1:1-6^1',    null,  ''),
  // 3rd Floor Suites (NAC 1:2-1-101^1)
  r('Suite 301 Dining Area Horn/Strobe',         'H/V', 'yes', '15CD',     'yes', 'yes', '1:2-1-101^1','yes', 'SL25W'),
  r('Suite 301 Washroom Strobe',                 'V',   'yes', '15CD',     'yes', null,  '1:2-1-101^1','yes', 'SL2HSW'),
  r('Suite 302 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-101^1','yes', 'SL2HSW'),
  r('Suite 302 Bedroom Horn',                    'H',   'yes', 'T3L',      'yes', 'yes', '1:2-1-101^1','yes', 'SL2HW'),
  r('Suite 303 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-101^1','yes', 'SL2HSW'),
  r('Suite 304 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-101^1','yes', 'SL2HSW'),
  r('Suite 304 Bedroom Horn',                    'H',   'yes', 'T3L',      'yes', 'yes', '1:2-1-101^1','yes', 'SL2HW'),
  r('Suite 305 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-101^1','yes', 'SL2HSW'),
  r('Suite 306 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-101^1','yes', 'SL2HSW'),
  r('Suite 306 Bedroom Horn',                    'H',   'yes', 'T3L',      'yes', 'yes', '1:2-1-101^1','yes', 'SL2HW'),
  r('Suite 307 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-101^1','yes', 'SL2HSW'),
  r('Suite 308 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-101^1','yes', 'SL2HSW'),
  r('Suite 308 Bedroom Horn',                    'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-101^1','yes', 'SL2HSW'),
  r('Suite 308 Washroom',                        'V',   'yes', '15CD',     'yes', null,  '1:2-1-101^1','yes', 'SL25W'),
  r('Suite 309 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-101^1','yes', 'SL2HSW'),
  r('Suite 311 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-6^1',    'yes', 'SL2HSW'),
  r('North Stair A',                             'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-6^1',    'yes', 'SL2HSW'),
  r('South Stair B',                             'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-6^1',    'yes', 'SL2HSW'),
  // 4th Floor Corridor (NAC 1:1-6^2)
  r('North Corridor by Elevator',                'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-6^2',    'yes', 'SL2HSW'),
  r('North Corridor by Suite 402',               'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-6^2',    'yes', 'SL2HSW'),
  r('Center Corridor by Suite 406',              'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-6^2',    'yes', 'SL2HSW'),
  r('South Corridor by Suite 408',               'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-6^2',    'yes', 'SL2HSW'),

  // ── PAGE 27 ─────────────────────────────────────────────────────────────
  r('North Stair A',                             'EOL', 'yes', '',          null,  null,  '1:1-6^2',    'yes', ''),
  // 4th Floor Suites (NAC 1:2-1-101^3)
  r('Suite 401 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-101^3','yes', 'SL2HSW'),
  r('Suite 401 Washroom Strobe',                 'V',   'yes', '15CD',     'yes', null,  '1:2-1-101^3','yes', 'SL25W'),
  r('Suite 401 Bedroom Strobe',                  'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-101^3','yes', 'SL2HSW'),
  r('Suite 402 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-101^3','yes', 'SL2HSW'),
  r('Suite 402 Bedroom Horn',                    'H',   'yes', 'T3L',      'yes', 'yes', '1:2-1-101^3','yes', 'SL2HW'),
  r('Suite 403 Horn/Strobe',                     'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-101^3','yes', 'SL2HSW'),
  r('Suite 404 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', null,  '1:2-1-101^3','yes', 'SL2HSW'),
  r('Suite 404 Bed room Horn',                   'H',   'yes', 'T3L',      'yes', null,  '1:2-1-101^3','yes', 'SL2HW'),
  r('Suite 405 Horn/Strobe',                     'H/V', 'yes', 'T3L/15CD', 'yes', null,  '1:2-1-101^3','yes', 'SL2HSW'),
  r('Suite 406 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-101^3','yes', 'SL2HSW'),
  r('Suite 406 Bed room Horn',                   'H',   'yes', 'T3L',      'yes', 'yes', '1:2-1-101^3','yes', 'SL2HW'),
  r('Suite 407 Horn/Strobe',                     'H/V', 'yes', 'T3L',      'yes', 'yes', '1:2-1-101^3','yes', 'SL2HSW'),
  r('Suite 409 Horn/Strobe',                     'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:2-1-101^3','yes', 'SL2HSW'),
  r('Suite 411 Dining Area Horn/Strobe',         'H/V', 'yes', 'T3L/15CD', 'yes', 'yes', '1:1-6^2',    'yes', 'SL2HW'),
  r('North Stair A',                             'H',   'yes', 'T3L',      'yes', 'yes', '1:1-6^2',    'yes', 'SL2HW'),
  r('South Stair B',                             'H',   'yes', 'T3L',      'yes', 'yes', '1:1-6^2',    'yes', 'SL2HW'),
];

// ---------------------------------------------------------------------------
// DB / document helpers
// ---------------------------------------------------------------------------

/** Find all account directories under data/accounts/ */
function findAccountDirs(dataDir) {
  const accountsDir = join(dataDir, 'accounts');
  if (!existsSync(accountsDir)) return [];
  return readdirSync(accountsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

/** Read and decrypt the DPAPI key cache for a given account directory. */
function readKeyX(accountDir) {
  const dpapi = join(accountDir, 'auth', 'keyx.dpapi');
  if (!existsSync(dpapi)) return null;
  if (!safeStorage.isEncryptionAvailable()) return null;
  try {
    const raw = safeStorage.decryptString(readFileSync(dpapi));
    // legacy format: bare 64-char hex
    if (/^[0-9a-f]{64}$/i.test(raw)) return raw;
    const { keyX } = JSON.parse(raw);
    return /^[0-9a-f]{64}$/i.test(keyX) ? keyX : null;
  } catch {
    return null;
  }
}

/** Get the IDR element IDs in order from the form pages. */
function getIdrElementIds(formPages) {
  const ids = [];
  for (const page of formPages) {
    for (const section of page.sections ?? []) {
      for (const element of section.elements ?? []) {
        if (element.kind === 'individualDeviceRecord') {
          ids.push({ pageId: page.id, elementId: element.id });
        }
      }
    }
  }
  return ids;
}

/** Build the next unique IDs for a new IDR page. */
function nextIdrIds(formPages) {
  const usedPageIds = new Set(formPages.map((p) => p.id));
  const usedElemIds = new Set();
  for (const page of formPages) {
    for (const section of page.sections ?? []) {
      for (const el of section.elements ?? []) {
        if (el.kind === 'individualDeviceRecord') usedElemIds.add(el.id);
      }
    }
  }
  let n = 22;
  while (usedPageIds.has(`page-idr-${n}`) || usedElemIds.has(`individual-device-record-${n}`)) n++;
  return {
    pageId: `page-idr-${n}`,
    sectionId: `section-individual-device-record-${n}`,
    elementId: `individual-device-record-${n}`,
  };
}

/** Renumber all page labels Page 1, Page 2, … */
function renumberLabels(pages) {
  return pages.map((p, i) => ({ ...p, label: `Page ${i + 1}` }));
}

/** Add one new IDR page after the given page index; return updated pages + new elementId. */
function addIdrPage(pages, afterIndex) {
  const ids = nextIdrIds(pages);
  const newPage = {
    id: ids.pageId,
    label: '',
    orientation: 'landscape',
    header: 'codeNameMeta',
    regions: [],
    sections: [
      {
        id: ids.sectionId,
        heading: '23.2 Individual Device Record',
        elements: [{ kind: 'individualDeviceRecord', id: ids.elementId }],
      },
    ],
  };
  const updated = [...pages];
  updated.splice(afterIndex + 1, 0, newPage);
  return { pages: renumberLabels(updated), elementId: ids.elementId };
}

/** Build a full IDR value object from a slice of data rows (ROW_COUNT rows). */
function buildIdrValue(dataRows) {
  const rows = Array.from({ length: ROW_COUNT }, (_, i) => dataRows[i] ?? emptyRow());
  return { rows };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
app.whenReady().then(() => {
  try {
    const targetInspectionId = process.argv[2] ?? null;
    const dataDir = join(process.cwd(), 'data');

    // 1. Find account dir — prefer the one that has both keyx.dpapi and blazeaudit.db
    const accountIds = findAccountDirs(dataDir);
    if (accountIds.length === 0) {
      console.error('No BlazeAudit accounts found under data/accounts/');
      app.exit(1);
      return;
    }
    // Pick the account that has an active DPAPI cache and a DB file
    const accountId = accountIds.find((id) => {
      const dir = join(dataDir, 'accounts', id);
      return (
        existsSync(join(dir, 'auth', 'keyx.dpapi')) &&
        existsSync(join(dir, 'blazeaudit.db'))
      );
    }) ?? accountIds[0];
    console.log(`Using account: ${accountId}`);
    const accountDir = join(dataDir, 'accounts', accountId);
    const dbPath = join(accountDir, 'blazeaudit.db');

    // 2. Read keyX from DPAPI cache
    const keyX = readKeyX(accountDir);
    if (!keyX) {
      console.error(
        'Could not read DB key from DPAPI cache.\n' +
        'Make sure you have logged in to BlazeAudit at least once (the app caches the key on login).',
      );
      app.exit(1);
      return;
    }

    // 3. Open DB
    const db = new Database(dbPath);
    db.pragma("cipher='sqlcipher'");
    db.pragma(`key="x'${keyX}'"`);
    db.exec('SELECT count(*) FROM sqlite_master');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    console.log('Database opened successfully.');

    // 4. List or locate inspection
    const inspections = db
      .prepare(`SELECT id, title, status, updated_at FROM inspections ORDER BY updated_at DESC`)
      .all();

    if (inspections.length === 0) {
      console.error('No inspections found in this database.');
      app.exit(1);
      return;
    }

    let inspectionId = targetInspectionId;
    if (!inspectionId) {
      console.log('\nAvailable inspections:');
      for (const ins of inspections) {
        console.log(`  ${ins.id}  [${ins.status}]  ${ins.title}`);
      }
      console.log('\nRe-run with the inspection ID as the first argument:');
      console.log('  npx electron scripts/import-idr.mjs <inspectionId>');
      db.close();
      app.exit(0);
      return;
    }

    const row = db
      .prepare('SELECT id, document FROM inspections WHERE id = ?')
      .get(inspectionId);
    if (!row) {
      console.error(`Inspection not found: ${inspectionId}`);
      db.close();
      app.exit(1);
      return;
    }

    // 5. Parse document
    let doc;
    try {
      doc = JSON.parse(row.document);
    } catch {
      console.error('Failed to parse inspection document JSON.');
      db.close();
      app.exit(1);
      return;
    }

    if (!doc.form?.pages) {
      console.error('Document does not appear to be a FormInspectionDocument.');
      db.close();
      app.exit(1);
      return;
    }

    // 6. Determine needed IDR pages
    const totalDataRows = ALL_ROWS.length;
    const pagesNeeded = Math.ceil(totalDataRows / ROW_COUNT);
    console.log(`\nTotal data rows: ${totalDataRows}`);
    console.log(`IDR pages needed: ${pagesNeeded}`);

    let pages = doc.form.pages;
    let values = { ...doc.values };

    let idrEntries = getIdrElementIds(pages);
    console.log(`IDR pages currently in document: ${idrEntries.length}`);

    // Find the last IDR page index so we can append after it
    let lastIdrPageIndex = -1;
    for (let i = 0; i < pages.length; i++) {
      for (const section of pages[i].sections ?? []) {
        for (const el of section.elements ?? []) {
          if (el.kind === 'individualDeviceRecord') lastIdrPageIndex = i;
        }
      }
    }

    // Add pages until we have enough
    while (idrEntries.length < pagesNeeded) {
      const result = addIdrPage(pages, lastIdrPageIndex);
      pages = result.pages;
      values[result.elementId] = buildIdrValue([]);
      lastIdrPageIndex++; // new page is right after the previous last
      idrEntries = getIdrElementIds(pages);
      console.log(`  Added IDR page (now ${idrEntries.length}/${pagesNeeded})`);
    }

    // 7. Fill rows into IDR pages
    idrEntries = getIdrElementIds(pages); // re-read after possible additions
    for (let pageIdx = 0; pageIdx < pagesNeeded; pageIdx++) {
      const entry = idrEntries[pageIdx];
      if (!entry) break;
      const slice = ALL_ROWS.slice(pageIdx * ROW_COUNT, (pageIdx + 1) * ROW_COUNT);
      values[entry.elementId] = buildIdrValue(slice);
    }

    // 8. Write updated document back to DB
    const updatedDoc = {
      ...doc,
      form: { ...doc.form, pages },
      values,
    };

    db.prepare(
      `UPDATE inspections SET document = @document, updated_at = @updatedAt WHERE id = @id`,
    ).run({
      id: inspectionId,
      document: JSON.stringify(updatedDoc),
      updatedAt: new Date().toISOString(),
    });

    console.log(`\nSuccess! ${totalDataRows} rows imported into ${pagesNeeded} IDR pages.`);
    console.log(`Inspection updated: ${row.id}`);

    db.close();
    app.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    app.exit(1);
  }
});
