export const FIELD_DEVICE_TESTING_LEGEND_CHAPTER = '23 Field Device Records';

export const FIELD_DEVICE_TESTING_LEGEND_TITLE =
  '23.1 Field Device Testing - Legend and Notes';

export const FDTL_SENSITIVITY_METHOD_LABEL =
  'Sensitivity Test Method (or Test Equipment Model/Method):';

export const FDTL_SENSITIVITY_RANGE_LABEL = "Manufacturer's Sensitivity Test Range:";

export type FdtlDeviceEntry = {
  type: string;
  modelNumber: string;
  sensitivityTestMethod: string;
  manufacturerSensitivityRange: string;
};

export type FieldDeviceTestingLegendValue = {
  devices: Record<string, FdtlDeviceEntry>;
};

export type FdtlTableItem =
  | { kind: 'section'; id: string; title: string }
  | { kind: 'simple'; id: string; device: string; description: string }
  | { kind: 'smoke'; id: string; device: string; description: string };

export const FDTL_TABLE_ITEMS: FdtlTableItem[] = [
  { kind: 'section', id: 'fdtl-sec-manual', title: 'Manual Initiating Devices' },
  { kind: 'simple', id: 'fdtl-m', device: 'M', description: 'Manual pull station' },
  { kind: 'simple', id: 'fdtl-mas', device: 'MAS', description: 'Manual Abort Station' },

  { kind: 'section', id: 'fdtl-sec-auto', title: 'Automatic Fire Detection Devices' },
  {
    kind: 'simple',
    id: 'fdtl-ht',
    device: 'HT',
    description: 'Heat Detector, restorable or non-restorable, fixed temperature',
  },
  {
    kind: 'simple',
    id: 'fdtl-rht',
    device: 'RHT',
    description: 'Heat Detector, restorable, rate-of-rise thermostat',
  },
  { kind: 'smoke', id: 'fdtl-s', device: 'S', description: 'Ionization Smoke detector' },
  {
    kind: 'smoke',
    id: 'fdtl-ps',
    device: 'PS',
    description: 'Photo-electric Smoke detector',
  },
  { kind: 'smoke', id: 'fdtl-ds', device: 'DS', description: 'Duct Smoke detector' },
  {
    kind: 'smoke',
    id: 'fdtl-mc',
    device: 'MC',
    description: 'Multi-Criteria type detector (specify detection types)',
  },
  { kind: 'simple', id: 'fdtl-co', device: 'CO', description: 'Carbon Monoxide detector' },
  { kind: 'simple', id: 'fdtl-od', device: 'OD', description: 'Other Detector type (specify)' },
  {
    kind: 'simple',
    id: 'fdtl-eol',
    device: 'EOL(R)',
    description: 'End-of-Line resistor ("R" indicates "Power Supervision Relay")',
  },

  { kind: 'section', id: 'fdtl-sec-sprinkler', title: 'Fire Sprinkler Devices' },
  { kind: 'simple', id: 'fdtl-fs', device: 'FS', description: 'Sprinkler Flow Switch' },
  {
    kind: 'simple',
    id: 'fdtl-fps',
    device: 'FPS',
    description: 'Sprinkler Flow Pressure Switch',
  },
  {
    kind: 'simple',
    id: 'fdtl-ts',
    device: 'TS',
    description: 'Sprinkler valve supervisory Tamper Switch',
  },
  { kind: 'simple', id: 'fdtl-la', device: 'LA', description: 'Low Air supervisory device' },
  {
    kind: 'simple',
    id: 'fdtl-lt',
    device: 'LT',
    description: 'Low Temperature supervisory device',
  },
  { kind: 'simple', id: 'fdtl-htc', device: 'HTC', description: 'Heat Trace Controller' },
  {
    kind: 'simple',
    id: 'fdtl-tlw',
    device: 'TLW',
    description: 'Tank Low Water supervisory device',
  },

  { kind: 'section', id: 'fdtl-sec-signaling', title: 'Fire Alarm Signaling Devices' },
  { kind: 'simple', id: 'fdtl-b', device: 'B', description: 'Bell' },
  { kind: 'simple', id: 'fdtl-h', device: 'H', description: 'Horn' },
  {
    kind: 'simple',
    id: 'fdtl-ssad',
    device: 'SSAD',
    description: 'Suite Silencing Audible Device',
  },
  { kind: 'simple', id: 'fdtl-sb', device: 'SB', description: 'Smoke Sounder Base' },
  {
    kind: 'simple',
    id: 'fdtl-v',
    device: 'V',
    description: 'Visual alarm device (specify strobe type or corridor indicator)',
  },
  { kind: 'simple', id: 'fdtl-sp', device: 'SP', description: 'Cone type Speaker' },
  { kind: 'simple', id: 'fdtl-hsp', device: 'HSP', description: 'Horn Speaker' },
  {
    kind: 'simple',
    id: 'fdtl-av',
    device: 'AV',
    description: 'Combination Audible/Visual Device - specify type (i.e. Horn/Strobe Unit)',
  },
  {
    kind: 'simple',
    id: 'fdtl-scim',
    device: 'SCIM',
    description: 'Signal Circuit Isolation Module',
  },
  {
    kind: 'simple',
    id: 'fdtl-et',
    device: 'ET',
    description: "Emergency Telephone (Fire Fighter's Phone)",
  },
  {
    kind: 'simple',
    id: 'fdtl-sync',
    device: 'SYNC',
    description: 'Signaling Circuit Synchronization Module',
  },

  {
    kind: 'section',
    id: 'fdtl-sec-supporting',
    title: 'Supporting Field Devices (Addressable Systems)',
  },
  { kind: 'simple', id: 'fdtl-rpm', device: 'RPM', description: 'Remote Point Module' },
  {
    kind: 'simple',
    id: 'fdtl-srim',
    device: 'SRIM',
    description: 'Single point Remote Initiating Module',
  },
  {
    kind: 'simple',
    id: 'fdtl-drim',
    device: 'DRIM',
    description: 'Dual input Remote Initiating Module',
  },
  { kind: 'simple', id: 'fdtl-em', device: 'EM', description: 'Isolator Module' },
  {
    kind: 'simple',
    id: 'fdtl-scrm',
    device: 'SCRM',
    description: 'Signal Circuit Remote Module',
  },
  {
    kind: 'simple',
    id: 'fdtl-rrm',
    device: 'RRM(S)',
    description: 'Remote Relay Module ("S" provides supervised outputs)',
  },

  { kind: 'section', id: 'fdtl-sec-extinguish', title: 'Extinguishment Releasing Devices' },
  { kind: 'simple', id: 'fdtl-rs', device: 'RS', description: 'Releasing Solenoid' },
  {
    kind: 'simple',
    id: 'fdtl-pds',
    device: 'PDS',
    description: 'Pressure Discharge Switch',
  },
  {
    kind: 'simple',
    id: 'fdtl-lps',
    device: 'LPS',
    description: 'Low Cylinder Pressure Switch',
  },

  { kind: 'section', id: 'fdtl-sec-ancillary', title: 'Ancillary Devices' },
  {
    kind: 'simple',
    id: 'fdtl-dh',
    device: 'DH(M,FL)',
    description: 'Door Holder ("M" is Magnetic, "FL" is Fusible Link)',
  },
  { kind: 'simple', id: 'fdtl-dm', device: 'DM', description: 'Damper Motor' },
  { kind: 'simple', id: 'fdtl-r', device: 'R', description: 'Relay' },
  { kind: 'simple', id: 'fdtl-ad', device: 'AD', description: 'Other Ancillary Device' },
  {
    kind: 'simple',
    id: 'fdtl-sa',
    device: 'SA',
    description: 'Smoke Alarm (specify single or multi-station type)',
  },
];

function emptyDeviceEntry(): FdtlDeviceEntry {
  return {
    type: '',
    modelNumber: '',
    sensitivityTestMethod: '',
    manufacturerSensitivityRange: '',
  };
}

function deviceIds(): string[] {
  return FDTL_TABLE_ITEMS.filter((item) => item.kind !== 'section').map((item) => item.id);
}

export function emptyFieldDeviceTestingLegendValue(): FieldDeviceTestingLegendValue {
  return {
    devices: Object.fromEntries(deviceIds().map((id) => [id, emptyDeviceEntry()])),
  };
}

export function normalizeFieldDeviceTestingLegendValue(
  value: unknown,
): FieldDeviceTestingLegendValue {
  const base = emptyFieldDeviceTestingLegendValue();
  if (!value || typeof value !== 'object') return base;

  const record = value as Record<string, unknown>;
  const devicesRaw = record.devices;
  if (!devicesRaw || typeof devicesRaw !== 'object') return base;

  const devices = { ...base.devices };
  for (const id of deviceIds()) {
    const entry = (devicesRaw as Record<string, unknown>)[id];
    if (!entry || typeof entry !== 'object') continue;
    const cells = entry as Record<string, unknown>;
    devices[id] = {
      type: typeof cells.type === 'string' ? cells.type : '',
      modelNumber: typeof cells.modelNumber === 'string' ? cells.modelNumber : '',
      sensitivityTestMethod:
        typeof cells.sensitivityTestMethod === 'string' ? cells.sensitivityTestMethod : '',
      manufacturerSensitivityRange:
        typeof cells.manufacturerSensitivityRange === 'string'
          ? cells.manufacturerSensitivityRange
          : '',
    };
  }

  return { devices };
}

export function setFdtlDeviceField(
  value: FieldDeviceTestingLegendValue,
  deviceId: string,
  field: keyof FdtlDeviceEntry,
  next: string,
): FieldDeviceTestingLegendValue {
  const entry = value.devices[deviceId] ?? emptyDeviceEntry();
  return {
    devices: {
      ...value.devices,
      [deviceId]: { ...entry, [field]: next },
    },
  };
}

export function fdtlDataRowZebraIndexes(): Map<string, number> {
  const map = new Map<string, number>();
  let zebra = 0;
  for (const item of FDTL_TABLE_ITEMS) {
    if (item.kind === 'section') continue;
    map.set(item.id, zebra);
    zebra += 1;
  }
  return map;
}
