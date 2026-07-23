export type PortableExtinguisherCoverValue = {
  date: string;
  jobContactNo: string;
  inspectorName: string;
  signatureName: string;
  recommendationsNotes: string;
};

export function emptyPortableExtinguisherCoverValue(): PortableExtinguisherCoverValue {
  return {
    date: '',
    jobContactNo: '',
    inspectorName: '',
    signatureName: '',
    recommendationsNotes: '',
  };
}

export function normalizePortableExtinguisherCoverValue(raw: unknown): PortableExtinguisherCoverValue {
  const base = emptyPortableExtinguisherCoverValue();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  return {
    date: typeof r.date === 'string' ? r.date : base.date,
    jobContactNo: typeof r.jobContactNo === 'string' ? r.jobContactNo : base.jobContactNo,
    inspectorName: typeof r.inspectorName === 'string' ? r.inspectorName : base.inspectorName,
    signatureName: typeof r.signatureName === 'string' ? r.signatureName : base.signatureName,
    recommendationsNotes:
      typeof r.recommendationsNotes === 'string' ? r.recommendationsNotes : base.recommendationsNotes,
  };
}
