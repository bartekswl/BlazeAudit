export const FIELD_DEVICE_TESTING_NOTES_TITLE = '23.1.1 Testing Notes';

export const FIELD_DEVICE_TESTING_NOTES_INTRO =
  'The following notes apply to 23.2 Individual Device Record:';

export const FIELD_DEVICE_TESTING_NOTES_ITEMS: readonly string[] = [
  'Smoke detector sensitivity reading confirmed by the control panel or measurement obtained through testing to be recorded in the measurements column.',
  'Smoke detector cleaning or replacement date should also be recorded in the measurements column.',
  'Status change, including time delay (where applicable), should be recorded in the measurements column. Refer to Annex A3.73 and Annex E.',
  'Duct smoke detector pressure differential to be confirmed and recorded in the measurements column. (Sample tubes should be pulled and their alignment confirmed if results indicate any abnormalities.)',
  'Transport time of air sampling type detector to be confirmed and recorded in the measurements column.',
  'Time delay setting of water flow switch to be recorded in the measurements column.',
  'Sprinkler supervisory switches cause a "trouble" condition to be annunciated, but not an alarm condition. (This should be a latching type trouble (or "supervisory trouble") only restorable by pressing "Reset" on the fire alarm control panel. Exceptions should be noted in "Comments".)',
  'Upper and lower pressure setting of supervisory devices to be recorded in the measurements column.',
  'Low temperature setting to be recorded in the measurements column.',
  'Identify the specific ancillary devices in the Comments column.',
  'The date any field device is changed should be recorded in the measurements column. (For smoke detectors, if housing discolouration is noted, attempt to identify the source and note the date of manufacture. Heat detectors whose labels are missing, faded and unreadable, or painted should be considered failed and replacement is recommended. This information should be noted in the "Comments" column.)',
  'Identify correct field device operation (e.g., alarm, trouble, supervisory, annunciation indication).',
  'Identify zone, circuit number, or address.',
  'Identify conventional field device locations',
  'Identify active field device and supporting field device, data communication link (DCL), address and location.',
  'Confirm field device is free of damage.',
  'Confirm field device free of foreign substance.',
  'Confirm field device mechanically supported independently of the wiring.',
  'Confirm field device protective dust shields or covers removed.',
  '"Correctly Installed" refers to the version of ULC 524, Standard for Installation of Fire Alarm Systems, applicable at the time of installation of the device being tested.',
  'Smoke detectors that employ sounder bases or activate local audible signaling device(s), used in lieu of smoke alarms, to be tested to confirm local sounder operation and annunciation at the control panel, including visible device operation, as applicable, and individually recorded.',
  'When batteries are replaced in the short-range radio frequency (wireless) devices, the battery replacement date is to be recorded in the comments Section.',
];

export type FieldDeviceTestingNotesValue = Record<string, never>;

export function emptyFieldDeviceTestingNotesValue(): FieldDeviceTestingNotesValue {
  return {};
}
