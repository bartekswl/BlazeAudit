import { useEffect, useMemo, useRef, useState } from 'react';
import type { DocumentContext } from '../../../shared/document';
import { formatInspectionDateLabel } from '../../../shared/dates';
import {
  AFFIRMATION_CONDUCTING_LABELS,
  AFFIRMATION_PRIMARY_LABELS,
  AFFIRMATION_TEXT_AFTER_PAGES,
  AFFIRMATION_TEXT_BEFORE_PAGES,
  applyAffirmationDefaults,
  normalizeAffirmationValue,
  resolveAffirmationTechnicianIdentification,
  resolveAffirmationTechnicianName,
  setAffirmationInspector,
  setAffirmationTechnicianField,
  type AffirmationInspectorOption,
  type AffirmationTechnicianKey,
  type AffirmationTechnicianValue,
  type AffirmationValue,
} from '../../../shared/form/affirmation';
import type { Inspector } from '../../../shared/profile';
import { InspectionDateField } from '../../components/InspectionDateField';

function TextCell({
  text,
  readOnly,
  ariaLabel,
  onChange,
}: {
  text: string;
  readOnly?: boolean;
  ariaLabel: string;
  onChange?: (next: string) => void;
}) {
  if (readOnly) {
    return <span className="aff-cell-value">{text.trim() || '\u00a0'}</span>;
  }
  return (
    <input
      type="text"
      className="aff-cell-input"
      value={text}
      aria-label={ariaLabel}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}

function SignatureCell({
  tech,
  readOnly,
  onChange,
}: {
  tech: AffirmationTechnicianValue;
  readOnly?: boolean;
  onChange?: (next: string) => void;
}) {
  return (
    <div className="aff-cell aff-cell--sig">
      <TextCell
        text={tech.signature}
        readOnly={readOnly}
        ariaLabel="Signature"
        onChange={onChange}
      />
    </div>
  );
}

function InspectorSelect({
  tech,
  inspectors,
  ariaLabel,
  onChange,
}: {
  tech: AffirmationTechnicianValue;
  inspectors: AffirmationInspectorOption[];
  ariaLabel: string;
  onChange: (inspector: AffirmationInspectorOption | null) => void;
}) {
  return (
    <select
      className="aff-cell-select ba-select"
      value={tech.inspectorId ?? ''}
      aria-label={ariaLabel}
      onChange={(e) => {
        const inspector = inspectors.find((row) => row.id === e.target.value) ?? null;
        onChange(inspector);
      }}
    >
      <option value="">Select inspector…</option>
      {inspectors.map((inspector) => (
        <option key={inspector.id} value={inspector.id}>
          {inspector.name}
        </option>
      ))}
    </select>
  );
}

function TechnicianBlock({
  technician,
  labels,
  value,
  inspectors,
  readOnly,
  onChange,
}: {
  technician: AffirmationTechnicianKey;
  labels: readonly string[];
  value: AffirmationValue;
  inspectors: AffirmationInspectorOption[];
  readOnly?: boolean;
  onChange?: (value: AffirmationValue) => void;
}) {
  const tech = value[technician];
  const displayName = resolveAffirmationTechnicianName(tech, inspectors);
  const displayIdentification = resolveAffirmationTechnicianIdentification(tech, inspectors);
  const setField = (field: keyof AffirmationTechnicianValue, next: string | null) =>
    onChange?.(setAffirmationTechnicianField(value, technician, field, next));

  return (
    <div className="aff-tech">
      <div className="aff-tech-grid">
        <div className="aff-cell aff-cell--name">
          {readOnly ? (
            <span className="aff-cell-value">{displayName || '\u00a0'}</span>
          ) : (
            <InspectorSelect
              tech={tech}
              inspectors={inspectors}
              ariaLabel={labels[0] ?? 'Technician name'}
              onChange={(inspector) =>
                onChange?.(setAffirmationInspector(value, technician, inspector))
              }
            />
          )}
        </div>
        <div className="aff-cell aff-cell--identification">
          <span className="aff-cell-value">{displayIdentification || '\u00a0'}</span>
        </div>
        <div className="aff-cell aff-cell--date">
          {readOnly ? (
            <span className="aff-cell-value">
              {tech.date ? formatInspectionDateLabel(tech.date) : '\u00a0'}
            </span>
          ) : (
            <div className="aff-date-wrap">
              <InspectionDateField
                compact
                value={tech.date ?? ''}
                onChange={(iso) => setField('date', iso)}
                className="aff-date-field"
              />
            </div>
          )}
        </div>
        <SignatureCell
          tech={tech}
          readOnly={readOnly}
          onChange={(next) => setField('signature', next)}
        />
        {labels.map((label) => (
          <div className="aff-label" key={label}>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function toInspectorOptions(rows: Inspector[]): AffirmationInspectorOption[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    licenseNumber: row.licenseNumber,
  }));
}

export function FormAffirmationView({
  value: rawValue,
  context,
  totalPages,
  readOnly,
  onChange,
}: {
  value: unknown;
  context?: DocumentContext | null;
  totalPages: number;
  readOnly?: boolean;
  onChange?: (value: AffirmationValue) => void;
}) {
  const value = normalizeAffirmationValue(rawValue);
  const [inspectors, setInspectors] = useState<AffirmationInspectorOption[]>([]);
  const [inspectorsReady, setInspectorsReady] = useState(readOnly);
  const defaultsAppliedRef = useRef(false);

  useEffect(() => {
    if (readOnly) return;
    let cancelled = false;
    void window.blazeaudit.profile
      .listInspectors()
      .then((rows) => {
        if (!cancelled) setInspectors(toInspectorOptions(rows));
      })
      .catch(() => {
        if (!cancelled) setInspectors([]);
      })
      .finally(() => {
        if (!cancelled) setInspectorsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [readOnly]);

  const preferredInspectorName = useMemo(() => {
    return context?.inspector?.name?.trim() || context?.inspection.inspector?.trim() || null;
  }, [context]);

  useEffect(() => {
    if (readOnly || !onChange || defaultsAppliedRef.current || !context || !inspectorsReady) return;

    const next = applyAffirmationDefaults(value, {
      inspectionDate: context.inspection.inspectedAt ?? null,
      inspectors,
      preferredInspectorName,
    });
    defaultsAppliedRef.current = true;
    if (next !== value) onChange(next);
  }, [readOnly, onChange, context, value, inspectors, inspectorsReady, preferredInspectorName]);

  const pageCountLabel = String(Math.max(1, totalPages));

  return (
    <div className="aff-panel">
      <div className="aff-title">Affirmation</div>
      <div className="aff-body">
        <span className="aff-body-text">
          {AFFIRMATION_TEXT_BEFORE_PAGES}{' '}
          <span className="aff-page-count-value">{pageCountLabel}</span>
          {AFFIRMATION_TEXT_AFTER_PAGES}
        </span>
      </div>
      <TechnicianBlock
        technician="primary"
        labels={AFFIRMATION_PRIMARY_LABELS}
        value={value}
        inspectors={inspectors}
        readOnly={readOnly}
        onChange={onChange}
      />
      <TechnicianBlock
        technician="conducting"
        labels={AFFIRMATION_CONDUCTING_LABELS}
        value={value}
        inspectors={inspectors}
        readOnly={readOnly}
        onChange={onChange}
      />
    </div>
  );
}
