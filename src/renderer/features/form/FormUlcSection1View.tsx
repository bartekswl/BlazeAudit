import { useEffect, useRef } from 'react';
import type { DocumentContext } from '../../../shared/document';
import { normalizeIsoDateInput } from '../../../shared/dates';
import {
  formatBusinessCompanyDisplay,
  normalizeUlcSection1Value,
  resolveUlcSection1Field,
  ULC_SECTION1_PHONE_KEYS,
  type UlcSection1Value,
} from '../../../shared/form/ulcSection1';
import { InspectionDateField } from '../../components/InspectionDateField';
import { cn } from '../../lib/cn';
import { FormCheckGlyph } from './FormCheckGlyph';
import { VisibleWidthInput } from './VisibleWidthInput';

const inputCls = 'ulc-s1-input';
const labelCls = 'ulc-s1-label';
const cellCls = 'ulc-s1-cell';

function updateField(
  value: UlcSection1Value,
  key: keyof UlcSection1Value,
  next: string | boolean,
): UlcSection1Value {
  return { ...value, [key]: next };
}

function setStage(value: UlcSection1Value, stage: 'single' | 'two' | 'other'): UlcSection1Value {
  return {
    ...value,
    stageSingle: stage === 'single',
    stageTwo: stage === 'two',
    stageOther: stage === 'other',
  };
}

function setSystemType(
  value: UlcSection1Value,
  system: 'addressable' | 'conventional' | 'wireless' | 'hybrid',
): UlcSection1Value {
  return {
    ...value,
    systemAddressable: system === 'addressable',
    systemConventional: system === 'conventional',
    systemWireless: system === 'wireless',
    systemHybrid: system === 'hybrid',
  };
}

function effectiveFieldText(
  fieldKey: keyof UlcSection1Value,
  value: UlcSection1Value,
  context: DocumentContext | null,
): string {
  return resolveUlcSection1Field(fieldKey, value, context);
}

function TextField({
  label,
  fieldKey,
  value,
  context,
  readOnly,
  onChange,
  className,
}: {
  label: string;
  fieldKey: keyof UlcSection1Value;
  value: UlcSection1Value;
  context: DocumentContext | null;
  readOnly?: boolean;
  onChange?: (next: UlcSection1Value) => void;
  className?: string;
}) {
  const shown = effectiveFieldText(fieldKey, value, context);
  return (
    <div className={cn(cellCls, className)}>
      <div className={labelCls}>{label}</div>
      {readOnly ? (
        <div className="ulc-s1-value">{shown || '\u00a0'}</div>
      ) : (
        <VisibleWidthInput
          className={inputCls}
          value={shown}
          onChange={(v) => onChange?.(updateField(value, fieldKey, v))}
        />
      )}
    </div>
  );
}

function DateField({
  label,
  fieldKey,
  value,
  context,
  readOnly,
  onChange,
  className,
}: {
  label: string;
  fieldKey: 'dateOfService' | 'lastServiceDate';
  value: UlcSection1Value;
  context: DocumentContext | null;
  readOnly?: boolean;
  onChange?: (next: UlcSection1Value) => void;
  className?: string;
}) {
  const shown = normalizeIsoDateInput(effectiveFieldText(fieldKey, value, context));
  return (
    <div className={cn(cellCls, className)}>
      <div className={labelCls}>{label}</div>
      {readOnly ? (
        <div className="ulc-s1-value">{shown || '\u00a0'}</div>
      ) : (
        <div className="ulc-s1-date-wrap">
          <InspectionDateField
            compact
            value={shown}
            onChange={(iso) => onChange?.(updateField(value, fieldKey, iso))}
            className="ulc-s1-date-field"
          />
        </div>
      )}
    </div>
  );
}

function PhoneStack({
  phoneKey,
  value,
  context,
  readOnly,
  onChange,
}: {
  phoneKey: 'contactPhone' | 'ownerPhone' | 'fireSignalPhone';
  value: UlcSection1Value;
  context: DocumentContext | null;
  readOnly?: boolean;
  onChange?: (next: UlcSection1Value) => void;
}) {
  // Always show stored value when phones have been edited; otherwise prefer
  // client binding, then empty (still editable).
  const shown = effectiveFieldText(phoneKey, value, context);

  return (
    <div className="ulc-s1-phone-fax">
      <div className={cn(cellCls, 'ulc-s1-phone-value')}>
        <div className={labelCls}>Phone:</div>
        {readOnly ? (
          <div className="ulc-s1-value">{shown || '\u00a0'}</div>
        ) : (
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={cn(inputCls, 'ulc-s1-phone-input')}
            value={shown}
            placeholder=""
            spellCheck={false}
            onChange={(e) => {
              const next = e.target.value;
              onChange?.({
                ...value,
                [phoneKey]: next,
                phonesEdited: true,
              });
            }}
          />
        )}
      </div>
      {/* Former Fax half — decorative empty cell only (not interactive). */}
      <div className="ulc-s1-cell ulc-s1-fax-disabled" aria-hidden="true" />
    </div>
  );
}

function StageCheckbox({
  id,
  label,
  checked,
  readOnly,
  onCheck,
}: {
  id: string;
  label: string;
  checked: boolean;
  readOnly?: boolean;
  onCheck: () => void;
}) {
  return (
    <label className="ulc-s1-check" htmlFor={id}>
      {readOnly ? (
        <FormCheckGlyph checked={checked} className="ulc-s1-check-box" />
      ) : (
        <input id={id} type="checkbox" className="ulc-s1-check-input" checked={checked} onChange={onCheck} />
      )}
      <span>{label}</span>
    </label>
  );
}

function companyBlock(context: DocumentContext | null) {
  const placeholder =
    'Service Company Information (Address, Telephone, & Contact Information)';

  if (!context) {
    return <span className="ulc-s1-company-placeholder">{placeholder}</span>;
  }

  const display = formatBusinessCompanyDisplay(context.business);
  if (!display) {
    return <span className="ulc-s1-company-placeholder">{placeholder}</span>;
  }

  return (
    <div className="ulc-s1-company-details">
      {display.name && <div className="ulc-s1-company-name">{display.name}</div>}
      {display.phone && <div className="ulc-s1-company-line">{display.phone}</div>}
      {display.email && <div className="ulc-s1-company-line">{display.email}</div>}
      {display.addressProvince && (
        <div className="ulc-s1-company-line">{display.addressProvince}</div>
      )}
      {display.postCountry && <div className="ulc-s1-company-line">{display.postCountry}</div>}
    </div>
  );
}

export function FormUlcSection1View({
  value: rawValue,
  context,
  readOnly,
  onChange,
}: {
  value: unknown;
  context: DocumentContext | null;
  readOnly?: boolean;
  onChange?: (value: UlcSection1Value) => void;
}) {
  const value = normalizeUlcSection1Value(rawValue);
  const phonesSeededRef = useRef(false);

  // Copy client phones into the document once so the inputs are real editable
  // fields (still empty + editable when the client has no phone on file).
  useEffect(() => {
    if (phonesSeededRef.current || readOnly || !onChange || !context || value.phonesEdited) {
      phonesSeededRef.current = true;
      return;
    }
    let next = value;
    let changed = false;
    for (const key of ULC_SECTION1_PHONE_KEYS) {
      if (next[key].trim()) continue;
      const fromClient = resolveUlcSection1Field(key, next, context);
      if (!fromClient) continue;
      next = { ...next, [key]: fromClient };
      changed = true;
    }
    phonesSeededRef.current = true;
    if (changed) onChange(next);
  }, [readOnly, onChange, context, value]);

  return (
    <div className="ulc-s1-panel">
      <div className="ulc-s1-top">
        <div className="ulc-s1-company">
          <div className="ulc-s1-company-inner">
            <div className="ulc-s1-company-text">{companyBlock(context)}</div>
          </div>
        </div>

        <div className="ulc-s1-service">
          <div className="ulc-s1-service-row ulc-s1-service-row--header">
            <DateField
              label="Date of Service:"
              fieldKey="dateOfService"
              value={value}
              context={context}
              readOnly={readOnly}
              onChange={onChange}
            />
            <DateField
              label="Last Service Date:"
              fieldKey="lastServiceDate"
              value={value}
              context={context}
              readOnly={readOnly}
              onChange={onChange}
            />
            <TextField
              label="Project Number:"
              fieldKey="projectNumber"
              value={value}
              context={context}
              readOnly={readOnly}
              onChange={onChange}
            />
          </div>

          <div className="ulc-s1-service-row ulc-s1-service-row--stage">
            <StageCheckbox
              id="ulc-stage-single"
              label="Single Stage"
              checked={value.stageSingle}
              readOnly={readOnly}
              onCheck={() => onChange?.(setStage(value, 'single'))}
            />
            <StageCheckbox
              id="ulc-stage-two"
              label="Two Stage"
              checked={value.stageTwo}
              readOnly={readOnly}
              onCheck={() => onChange?.(setStage(value, 'two'))}
            />
            <label className="ulc-s1-check ulc-s1-check--other">
              {readOnly ? (
                <FormCheckGlyph checked={value.stageOther} className="ulc-s1-check-box" />
              ) : (
                <input
                  type="checkbox"
                  className="ulc-s1-check-input"
                  checked={value.stageOther}
                  onChange={() => onChange?.(setStage(value, 'other'))}
                />
              )}
              <span>Other:</span>
              {readOnly ? (
                <span className="ulc-s1-value ulc-s1-value--inline">{value.stageOtherText || '\u00a0'}</span>
              ) : (
                <VisibleWidthInput
                  className={cn(inputCls, 'ulc-s1-input--inline')}
                  value={value.stageOtherText}
                  onChange={(v) => onChange?.(updateField(value, 'stageOtherText', v))}
                />
              )}
            </label>
          </div>

          <div className="ulc-s1-system-block">
            <div className="ulc-s1-system-types">
              <div className="ulc-s1-system-row">
                <StageCheckbox
                  id="ulc-sys-addressable"
                  label="Addressable"
                  checked={value.systemAddressable}
                  readOnly={readOnly}
                  onCheck={() => onChange?.(setSystemType(value, 'addressable'))}
                />
                <StageCheckbox
                  id="ulc-sys-conventional"
                  label="Conventional"
                  checked={value.systemConventional}
                  readOnly={readOnly}
                  onCheck={() => onChange?.(setSystemType(value, 'conventional'))}
                />
              </div>
              <div className="ulc-s1-system-row ulc-s1-system-row--alt">
                <StageCheckbox
                  id="ulc-sys-wireless"
                  label="Wireless"
                  checked={value.systemWireless}
                  readOnly={readOnly}
                  onCheck={() => onChange?.(setSystemType(value, 'wireless'))}
                />
                <StageCheckbox
                  id="ulc-sys-hybrid"
                  label="Hybrid"
                  checked={value.systemHybrid}
                  readOnly={readOnly}
                  onCheck={() => onChange?.(setSystemType(value, 'hybrid'))}
                />
              </div>
            </div>
            <div className="ulc-s1-circuits">
              <div className="ulc-s1-circuits-title">Number of Conventional Circuits</div>
              <TextField
                label="Initiating:"
                fieldKey="circuitsInitiating"
                value={value}
                context={context}
                readOnly={readOnly}
                onChange={onChange}
              />
              <TextField
                label="Notification:"
                fieldKey="circuitsNotification"
                value={value}
                context={context}
                readOnly={readOnly}
                onChange={onChange}
              />
              <TextField
                label="Voice Paging:"
                fieldKey="circuitsVoicePaging"
                value={value}
                context={context}
                readOnly={readOnly}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="ulc-s1-service-row ulc-s1-service-row--header">
            <TextField
              label="Manufacturer:"
              fieldKey="manufacturer"
              value={value}
              context={context}
              readOnly={readOnly}
              onChange={onChange}
            />
            <TextField
              label="Model Number:"
              fieldKey="modelNumber"
              value={value}
              context={context}
              readOnly={readOnly}
              onChange={onChange}
            />
            <TextField
              label="ULC Serial Number:"
              fieldKey="ulcSerialNumber"
              value={value}
              context={context}
              readOnly={readOnly}
              onChange={onChange}
            />
          </div>
        </div>
      </div>

      <div className="ulc-s1-bottom">
        <div className="ulc-s1-bottom-row ulc-s1-bottom-row--3col">
          <TextField
            label="Building Name:"
            fieldKey="buildingName"
            value={value}
            context={context}
            readOnly={readOnly}
            onChange={onChange}
            className="ulc-s1-cell--wide"
          />
          <TextField
            label="Contact Person:"
            fieldKey="contactPerson"
            value={value}
            context={context}
            readOnly={readOnly}
            onChange={onChange}
            className="ulc-s1-cell--medium"
          />
          <PhoneStack
            phoneKey="contactPhone"
            value={value}
            context={context}
            readOnly={readOnly}
            onChange={onChange}
          />
        </div>
        <div className="ulc-s1-bottom-row ulc-s1-bottom-row--3col">
          <TextField
            label="Address:"
            fieldKey="address"
            value={value}
            context={context}
            readOnly={readOnly}
            onChange={onChange}
            className="ulc-s1-cell--wide"
          />
          <TextField
            label="Owner / Property Manager:"
            fieldKey="ownerPropertyManager"
            value={value}
            context={context}
            readOnly={readOnly}
            onChange={onChange}
            className="ulc-s1-cell--medium"
          />
          <PhoneStack
            phoneKey="ownerPhone"
            value={value}
            context={context}
            readOnly={readOnly}
            onChange={onChange}
          />
        </div>
        <div className="ulc-s1-bottom-row ulc-s1-bottom-row--3col">
          <div className="ulc-s1-city-postal">
            <TextField
              label="City:"
              fieldKey="city"
              value={value}
              context={context}
              readOnly={readOnly}
              onChange={onChange}
            />
            <TextField
              label="Postal Code:"
              fieldKey="postalCode"
              value={value}
              context={context}
              readOnly={readOnly}
              onChange={onChange}
            />
          </div>
          <TextField
            label="Fire Signal Receiving Centre (Section 22.11):"
            fieldKey="fireSignalCentre"
            value={value}
            context={context}
            readOnly={readOnly}
            onChange={onChange}
          />
          <PhoneStack
            phoneKey="fireSignalPhone"
            value={value}
            context={context}
            readOnly={readOnly}
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  );
}
