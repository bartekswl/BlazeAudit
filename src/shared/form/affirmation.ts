export interface AffirmationTechnicianValue {
  inspectorId: string | null;
  /** Denormalized for read-only / PDF when inspector list is unavailable. */
  name: string;
  identification: string;
  date: string | null;
  signature: string;
}

export interface AffirmationValue {
  primary: AffirmationTechnicianValue;
  conducting: AffirmationTechnicianValue;
}

export type AffirmationTechnicianKey = 'primary' | 'conducting';

export type AffirmationTechnicianField = keyof AffirmationTechnicianValue;

export interface AffirmationInspectorOption {
  id: string;
  name: string;
  licenseNumber: string;
}

export const AFFIRMATION_TEXT_BEFORE_PAGES =
  'The information in this report, which comprises';

export const AFFIRMATION_TEXT_AFTER_PAGES =
  ' pages, affirms that the equipment listed here-in was tested and inspected in conformance with ULC 536:2019 (2024), Standard for Inspection and Testing of Fire Alarm Systems, applicable codes, bylaws, Standards, and the manufacturer\u2019s requirements by a qualified technician. The equipment was left in an operational condition except as noted above.';

export const AFFIRMATION_PRIMARY_LABELS = [
  'Supervising / Primary Technician Name',
  'Identification Number / Seal',
  'Date',
  'Signature',
] as const;

export const AFFIRMATION_CONDUCTING_LABELS = [
  'Technician Conducting Test and Inspection',
  'Identification Number / Seal',
  'Date',
  'Signature',
] as const;

function emptyTechnicianValue(): AffirmationTechnicianValue {
  return { inspectorId: null, name: '', identification: '', date: null, signature: '' };
}

export function emptyAffirmationValue(): AffirmationValue {
  return {
    primary: emptyTechnicianValue(),
    conducting: emptyTechnicianValue(),
  };
}

function normalizeTechnician(raw: unknown): AffirmationTechnicianValue {
  const base = emptyTechnicianValue();
  if (!raw || typeof raw !== 'object') return base;
  const row = raw as Record<string, unknown>;
  const legacyName = typeof row.name === 'string' ? row.name : '';
  return {
    inspectorId: typeof row.inspectorId === 'string' && row.inspectorId ? row.inspectorId : null,
    name: legacyName,
    identification: typeof row.identification === 'string' ? row.identification : '',
    date: typeof row.date === 'string' && row.date ? row.date : null,
    signature: typeof row.signature === 'string' ? row.signature : '',
  };
}

export function normalizeAffirmationValue(raw: unknown): AffirmationValue {
  const base = emptyAffirmationValue();
  if (!raw || typeof raw !== 'object') return base;
  const record = raw as Record<string, unknown>;
  return {
    primary: normalizeTechnician(record.primary),
    conducting: normalizeTechnician(record.conducting),
  };
}

export function resolveAffirmationTechnicianName(
  tech: AffirmationTechnicianValue,
  inspectors: AffirmationInspectorOption[],
): string {
  if (tech.inspectorId) {
    const match = inspectors.find((row) => row.id === tech.inspectorId);
    if (match?.name.trim()) return match.name.trim();
  }
  return tech.name.trim();
}

export function resolveAffirmationTechnicianIdentification(
  tech: AffirmationTechnicianValue,
  inspectors: AffirmationInspectorOption[],
): string {
  if (tech.inspectorId) {
    const match = inspectors.find((row) => row.id === tech.inspectorId);
    if (match?.licenseNumber.trim()) return match.licenseNumber.trim();
  }
  return tech.identification.trim();
}

export function setAffirmationTechnicianField(
  value: AffirmationValue,
  technician: AffirmationTechnicianKey,
  field: AffirmationTechnicianField,
  next: string | null,
): AffirmationValue {
  return {
    ...value,
    [technician]: {
      ...value[technician],
      [field]: field === 'date' || field === 'inspectorId' ? next : (next ?? ''),
    },
  };
}

export function setAffirmationInspector(
  value: AffirmationValue,
  technician: AffirmationTechnicianKey,
  inspector: AffirmationInspectorOption | null,
): AffirmationValue {
  return {
    ...value,
    [technician]: {
      ...value[technician],
      inspectorId: inspector?.id ?? null,
      name: inspector?.name ?? '',
      identification: inspector?.licenseNumber ?? '',
    },
  };
}

export function applyAffirmationDefaults(
  value: AffirmationValue,
  options: {
    inspectionDate: string | null;
    inspectors: AffirmationInspectorOption[];
    preferredInspectorName?: string | null;
  },
): AffirmationValue {
  let next = normalizeAffirmationValue(value);
  let changed = false;

  const matchInspectorByName = (name: string | null | undefined) => {
    const needle = name?.trim().toLowerCase();
    if (!needle) return null;
    return options.inspectors.find((row) => row.name.trim().toLowerCase() === needle) ?? null;
  };

  const ensureTechnicianDefaults = (
    technician: AffirmationTechnicianKey,
    preferMatch: AffirmationInspectorOption | null,
  ) => {
    const tech = next[technician];
    if (!tech.inspectorId && tech.name.trim()) {
      const matched = matchInspectorByName(tech.name);
      if (matched) {
        next = setAffirmationInspector(next, technician, matched);
        changed = true;
      }
    }
    if (!next[technician].inspectorId && preferMatch) {
      next = setAffirmationInspector(next, technician, preferMatch);
      changed = true;
    }
    if (!next[technician].date && options.inspectionDate) {
      next = setAffirmationTechnicianField(next, technician, 'date', options.inspectionDate);
      changed = true;
    }
  };

  const preferred = matchInspectorByName(options.preferredInspectorName);
  ensureTechnicianDefaults('primary', preferred);
  ensureTechnicianDefaults('conducting', null);

  return changed ? next : value;
}
