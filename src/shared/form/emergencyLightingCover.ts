export type EmergencyLightingCoverValue = {
  date: string;
  jobContactNo: string;
  certifyTested: boolean;
  certifyFunctional: boolean;
  technicianName: string;
  signatureName: string;
};

export function emptyEmergencyLightingCoverValue(): EmergencyLightingCoverValue {
  return {
    date: '',
    jobContactNo: '',
    certifyTested: false,
    certifyFunctional: false,
    technicianName: '',
    signatureName: '',
  };
}

export function normalizeEmergencyLightingCoverValue(raw: unknown): EmergencyLightingCoverValue {
  const base = emptyEmergencyLightingCoverValue();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  return {
    date: typeof r.date === 'string' ? r.date : base.date,
    jobContactNo: typeof r.jobContactNo === 'string' ? r.jobContactNo : base.jobContactNo,
    certifyTested: Boolean(r.certifyTested),
    certifyFunctional: Boolean(r.certifyFunctional),
    technicianName: typeof r.technicianName === 'string' ? r.technicianName : base.technicianName,
    signatureName: typeof r.signatureName === 'string' ? r.signatureName : base.signatureName,
  };
}

export const EMERGENCY_LIGHTING_TEST_NOTES: readonly string[] = [
  'All units should be inspected to ensure terminal connections are clean, free of corrosion and lubricated. Terminal clamps must be clean and tight. The electrolyte level and specific gravity must be maintained as per manufacturers specifications. Battery surface is to be kept clean and dry.',
  'Emergency lighting unit equipment shall be tested to ensure that the unit will provide emergency lighting for a duration equal to the design criteria under simulated power failure conditions.',
  'After completion of the test, the charging conditions for voltage and current and the recovery period shall be tested to ensure that the charging system is in accordance with manufacturers specifications.',
];
