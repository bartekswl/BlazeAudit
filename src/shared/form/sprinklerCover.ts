export type SprinklerCoverValue = {
  date: string;
  jobContactNo: string;
  inspectorName: string;
  signatureName: string;
  /** Overrides for DB-bound fields — `null` follows the client / business record. */
  buildingName: string | null;
  address: string | null;
  companyName: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
};

export type SprinklerCoverBoundKey =
  | 'buildingName'
  | 'address'
  | 'companyName'
  | 'companyAddress'
  | 'companyPhone';

export function emptySprinklerCoverValue(): SprinklerCoverValue {
  return {
    date: '',
    jobContactNo: '',
    inspectorName: '',
    signatureName: '',
    buildingName: null,
    address: null,
    companyName: null,
    companyAddress: null,
    companyPhone: null,
  };
}

function optionalString(raw: unknown): string | null {
  return typeof raw === 'string' ? raw : null;
}

export function normalizeSprinklerCoverValue(raw: unknown): SprinklerCoverValue {
  const base = emptySprinklerCoverValue();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  return {
    date: typeof r.date === 'string' ? r.date : base.date,
    jobContactNo: typeof r.jobContactNo === 'string' ? r.jobContactNo : base.jobContactNo,
    inspectorName: typeof r.inspectorName === 'string' ? r.inspectorName : base.inspectorName,
    signatureName: typeof r.signatureName === 'string' ? r.signatureName : base.signatureName,
    buildingName: optionalString(r.buildingName),
    address: optionalString(r.address),
    companyName: optionalString(r.companyName),
    companyAddress: optionalString(r.companyAddress),
    companyPhone: optionalString(r.companyPhone),
  };
}
