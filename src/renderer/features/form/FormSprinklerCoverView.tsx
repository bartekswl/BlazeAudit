import { useEffect, useRef } from 'react';
import type { DocumentContext } from '../../../shared/document';
import {
  normalizeSprinklerCoverValue,
  type SprinklerCoverValue,
} from '../../../shared/form/sprinklerCover';
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

function MultiLineField({
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
        <textarea
          className={cn(inputCls, 'irc-textarea')}
          value={value}
          rows={2}
          spellCheck={false}
          onChange={(e) => {
            const el = e.target;
            // Reject growth that would spill below the visible box.
            if (el.value.length > value.length && el.scrollHeight > el.clientHeight + 1) return;
            onChange?.(el.value);
          }}
        />
      )}
    </label>
  );
}

export function FormSprinklerCoverView({
  value: rawValue,
  context,
  readOnly,
  onChange,
}: {
  value: unknown;
  context: DocumentContext | null;
  readOnly?: boolean;
  onChange?: (value: SprinklerCoverValue) => void;
}) {
  const value = normalizeSprinklerCoverValue(rawValue);
  const seededRef = useRef(false);
  const patch = (partial: Partial<SprinklerCoverValue>) => onChange?.({ ...value, ...partial });

  const buildingName = value.buildingName ?? (context?.client.name?.trim() || '');
  const address = value.address ?? (context?.client.addressFormatted?.trim() || '');
  const companyName = value.companyName ?? (context?.business.businessName?.trim() || '');
  const companyAddress =
    value.companyAddress ?? (context?.business.addressFormatted?.trim() || '');
  const companyPhone = value.companyPhone ?? (context?.business.phone?.trim() || '');
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
    <div className="irc-panel irc-panel--sprinkler">
      <div className="irc-meta-grid">
        <LineField
          label="Building Name"
          value={buildingName}
          readOnly={readOnly}
          onChange={(next) => patch({ buildingName: next })}
          className="irc-span-2 irc-building-name"
        />
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
        <MultiLineField
          label="Address"
          value={address}
          readOnly={readOnly}
          onChange={(next) => patch({ address: next })}
          className="irc-span-2 irc-address"
        />
        <LineField
          label="Project Number"
          value={value.jobContactNo}
          readOnly={readOnly}
          onChange={(jobContactNo) => patch({ jobContactNo })}
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
        <LineField
          label="Company Issuing This Report"
          value={companyName}
          readOnly={readOnly}
          onChange={(next) => patch({ companyName: next })}
        />
        <MultiLineField
          label="Company Address"
          value={companyAddress}
          readOnly={readOnly}
          onChange={(next) => patch({ companyAddress: next })}
          className="irc-company-address"
        />
        <LineField
          label="Company Telephone"
          value={companyPhone}
          readOnly={readOnly}
          onChange={(next) => patch({ companyPhone: next })}
        />
      </div>
    </div>
  );
}
