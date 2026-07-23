import { useEffect, useRef } from 'react';
import type { DocumentContext } from '../../../shared/document';
import {
  EMERGENCY_LIGHTING_TEST_NOTES,
  normalizeEmergencyLightingCoverValue,
  type EmergencyLightingCoverValue,
} from '../../../shared/form/emergencyLightingCover';
import { InspectionDateField } from '../../components/InspectionDateField';
import { cn } from '../../lib/cn';
import { FormCheckGlyph } from './FormCheckGlyph';
import { VisibleWidthInput } from './VisibleWidthInput';

const inputCls = 'irc-input';
const labelCls = 'irc-label';

function LineField({
  label,
  value,
  readOnly,
  onChange,
  className,
}: {
  label: string;
  value: string;
  readOnly?: boolean;
  onChange?: (next: string) => void;
  className?: string;
}) {
  return (
    <label className={cn('irc-field', className)}>
      <span className={labelCls}>{label}</span>
      {readOnly ? (
        <span className="irc-value">{value || '\u00a0'}</span>
      ) : (
        <VisibleWidthInput
          className={inputCls}
          value={value}
          onChange={(v) => onChange?.(v)}
          data-visible-width-fill
        />
      )}
    </label>
  );
}

function BoundLine({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('irc-field', className)}>
      <span className={labelCls}>{label}</span>
      <span className="irc-value">{value || '\u00a0'}</span>
    </div>
  );
}

function CertCheck({
  id,
  label,
  checked,
  readOnly,
  onToggle,
}: {
  id: string;
  label: string;
  checked: boolean;
  readOnly?: boolean;
  onToggle?: () => void;
}) {
  return (
    <label className="irc-check" htmlFor={id}>
      {readOnly ? (
        <FormCheckGlyph checked={checked} className="irc-check-box" />
      ) : (
        <button
          id={id}
          type="button"
          className="irc-check-toggle"
          aria-pressed={checked}
          onClick={onToggle}
        >
          <FormCheckGlyph checked={checked} className="irc-check-box" />
        </button>
      )}
      <span>{label}</span>
    </label>
  );
}

export function FormEmergencyLightingCoverView({
  value: rawValue,
  context,
  readOnly,
  onChange,
}: {
  value: unknown;
  context: DocumentContext | null;
  readOnly?: boolean;
  onChange?: (value: EmergencyLightingCoverValue) => void;
}) {
  const value = normalizeEmergencyLightingCoverValue(rawValue);
  const seededRef = useRef(false);
  const patch = (partial: Partial<EmergencyLightingCoverValue>) =>
    onChange?.({ ...value, ...partial });

  const buildingName = context?.client.name?.trim() || '';
  const address = context?.client.addressFormatted?.trim() || '';
  const companyName = context?.business.businessName?.trim() || '';
  const companyAddress = context?.business.addressFormatted?.trim() || '';
  const companyPhone = context?.business.phone?.trim() || '';
  const techDefault =
    context?.inspector?.name?.trim() || context?.inspection.inspector?.trim() || '';

  useEffect(() => {
    if (seededRef.current || readOnly || !onChange) {
      seededRef.current = true;
      return;
    }
    let next = value;
    let changed = false;
    if (!next.technicianName.trim() && techDefault) {
      next = { ...next, technicianName: techDefault };
      changed = true;
    }
    if (!next.date.trim()) {
      const inspected = context?.inspection.inspectedAt?.trim() || '';
      if (inspected) {
        next = { ...next, date: inspected };
        changed = true;
      }
    }
    seededRef.current = true;
    if (changed) onChange(next);
  }, [readOnly, onChange, context, value, techDefault]);

  return (
    <div className="irc-panel">
      <div className="irc-meta-grid">
        <BoundLine label="Building Name" value={buildingName} className="irc-span-2" />
        <div className="irc-field">
          <span className={labelCls}>Date</span>
          {readOnly ? (
            <span className="irc-value">{value.date || '\u00a0'}</span>
          ) : (
            <InspectionDateField
              value={value.date}
              onChange={(next) => patch({ date: next })}
              className="irc-date-field"
            />
          )}
        </div>
        <BoundLine label="Address" value={address} className="irc-span-3 irc-address" />
        <LineField
          label="Job / Contact No."
          value={value.jobContactNo}
          readOnly={readOnly}
          onChange={(jobContactNo) => patch({ jobContactNo })}
          className="irc-span-3"
        />
      </div>

      <div className="irc-cert-box">
        <div className="irc-cert-banner">Certification</div>
        <div className="irc-cert-body">
          <CertCheck
            id="el-cert-tested"
            label="This is to Certify that Emergency Lighting has been tested and inspected in accordance with the Fire Code requirements."
            checked={value.certifyTested}
            readOnly={readOnly}
            onToggle={() => patch({ certifyTested: !value.certifyTested })}
          />
          <CertCheck
            id="el-cert-functional"
            label="All units inspected are now fully functional."
            checked={value.certifyFunctional}
            readOnly={readOnly}
            onToggle={() => patch({ certifyFunctional: !value.certifyFunctional })}
          />
          <BoundLine label="Company issuing this report" value={companyName} />
          <BoundLine label="Company Address" value={companyAddress} className="irc-address" />
          <BoundLine label="Company Telephone" value={companyPhone} />
          <div className="irc-tech-row">
            <LineField
              label="Technician Conducting Test"
              value={value.technicianName}
              readOnly={readOnly}
              onChange={(technicianName) => patch({ technicianName })}
              className="irc-flex-1"
            />
            <LineField
              label="Signature"
              value={value.signatureName}
              readOnly={readOnly}
              onChange={(signatureName) => patch({ signatureName })}
              className="irc-flex-1"
            />
          </div>
        </div>
      </div>

      <div className="irc-static-notes irc-notes--blue">
        <div className="irc-notes-title">Inspection Test Notes</div>
        <ol className="irc-static-list">
          {EMERGENCY_LIGHTING_TEST_NOTES.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
