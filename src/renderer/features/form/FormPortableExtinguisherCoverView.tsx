import { useEffect, useRef } from 'react';
import type { DocumentContext } from '../../../shared/document';
import {
  normalizePortableExtinguisherCoverValue,
  type PortableExtinguisherCoverValue,
} from '../../../shared/form/portableExtinguisherCover';
import { InspectionDateField } from '../../components/InspectionDateField';
import { cn } from '../../lib/cn';
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

export function FormPortableExtinguisherCoverView({
  value: rawValue,
  context,
  readOnly,
  onChange,
}: {
  value: unknown;
  context: DocumentContext | null;
  readOnly?: boolean;
  onChange?: (value: PortableExtinguisherCoverValue) => void;
}) {
  const value = normalizePortableExtinguisherCoverValue(rawValue);
  const seededRef = useRef(false);
  const patch = (partial: Partial<PortableExtinguisherCoverValue>) =>
    onChange?.({ ...value, ...partial });

  const buildingName = context?.client.name?.trim() || '';
  const address = context?.client.addressFormatted?.trim() || '';
  const companyName = context?.business.businessName?.trim() || '';
  const companyAddress = context?.business.addressFormatted?.trim() || '';
  const companyPhone = context?.business.phone?.trim() || '';
  const inspectorDefault =
    context?.inspector?.name?.trim() || context?.inspection.inspector?.trim() || '';

  useEffect(() => {
    if (seededRef.current || readOnly || !onChange) {
      seededRef.current = true;
      return;
    }
    let next = value;
    let changed = false;
    if (!next.inspectorName.trim() && inspectorDefault) {
      next = { ...next, inspectorName: inspectorDefault };
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
  }, [readOnly, onChange, context, value, inspectorDefault]);

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
          className="irc-span-2"
        />
        <LineField
          label="Inspector Conducting Test"
          value={value.inspectorName}
          readOnly={readOnly}
          onChange={(inspectorName) => patch({ inspectorName })}
          className="irc-span-2"
        />
        <LineField
          label="Signature"
          value={value.signatureName}
          readOnly={readOnly}
          onChange={(signatureName) => patch({ signatureName })}
        />
        <BoundLine
          label="Company Issuing This Report"
          value={companyName}
          className="irc-span-3"
        />
        <BoundLine label="Company Address" value={companyAddress} className="irc-span-3" />
        <BoundLine label="Company Telephone" value={companyPhone} className="irc-span-3" />
      </div>

      <div className="irc-notes irc-notes--green">
        <div className="irc-notes-title">Inspection Recommendations and Notes</div>
        {readOnly ? (
          <div className="irc-notes-body irc-notes-body--readonly">
            {value.recommendationsNotes || '\u00a0'}
          </div>
        ) : (
          <textarea
            className="irc-notes-body"
            value={value.recommendationsNotes}
            onChange={(e) => patch({ recommendationsNotes: e.target.value })}
            rows={12}
          />
        )}
      </div>
    </div>
  );
}
