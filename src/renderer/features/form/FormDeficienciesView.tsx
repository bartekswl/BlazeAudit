import type { ReactNode } from 'react';
import {
  normalizeDeficienciesValue,
  type DeficienciesValue,
  type DeficiencyControlRow,
  type DeficiencyDeviceRow,
  type DeficiencyRepairFields,
} from '../../../shared/form/deficiencies';
import { cn } from '../../lib/cn';

function CellInput({
  value,
  readOnly,
  onChange,
  className,
}: {
  value: string;
  readOnly?: boolean;
  onChange?: (next: string) => void;
  className?: string;
}) {
  if (readOnly) {
    return <span className={cn('def-cell-value', className)}>{value || '\u00a0'}</span>;
  }
  return (
    <input
      type="text"
      className={cn('def-cell-input', className)}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}

function RepairFields({
  repair,
  readOnly,
  onChange,
}: {
  repair: DeficiencyRepairFields;
  readOnly?: boolean;
  onChange?: (next: DeficiencyRepairFields) => void;
}) {
  const set = (key: keyof DeficiencyRepairFields, next: string) =>
    onChange?.({ ...repair, [key]: next });

  return (
    <>
      <div className="def-cell def-cell--repair">
        <CellInput
          value={repair.dateCorrected}
          readOnly={readOnly}
          onChange={(v) => set('dateCorrected', v)}
        />
      </div>
      <div className="def-cell def-cell--repair">
        <CellInput value={repair.workOrder} readOnly={readOnly} onChange={(v) => set('workOrder', v)} />
      </div>
      <div className="def-cell def-cell--repair">
        <CellInput
          value={repair.serviceProvider}
          readOnly={readOnly}
          onChange={(v) => set('serviceProvider', v)}
        />
      </div>
      <div className="def-cell def-cell--repair">
        <CellInput
          value={repair.technician}
          readOnly={readOnly}
          onChange={(v) => set('technician', v)}
        />
      </div>
    </>
  );
}

function HeadLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('def-head-cell', className)}>{children}</div>;
}

export function FormDeficienciesView({
  value: rawValue,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (value: DeficienciesValue) => void;
}) {
  const value = normalizeDeficienciesValue(rawValue);

  const updateDeviceRow = (index: number, next: DeficiencyDeviceRow) => {
    const deviceRows = value.deviceRows.map((row, i) => (i === index ? next : row));
    onChange?.({ ...value, deviceRows });
  };

  const updateControlRow = (index: number, next: DeficiencyControlRow) => {
    const controlRows = value.controlRows.map((row, i) => (i === index ? next : row));
    onChange?.({ ...value, controlRows });
  };

  return (
    <div className="def-panel">
      <div className="def-red-bar" aria-hidden="true" />

      <p className="def-instruction">
        The inspection and Testing of any corrections/repairs of deficiencies noted on this form has been
        completed by qualified personnel identified in the column marked &apos;Technician Name &amp;
        Certificate No.&apos;
      </p>

      <div className="def-grid">
        <div className={cn('def-grid-left', 'def-banner', 'def-banner--inspect')}>
          To be completed by the primary individual who conducted the test and inspection.
        </div>
        <div className={cn('def-grid-right', 'def-banner', 'def-banner--repair')}>
          To be completed by the primary individual responsible for the repair.
        </div>

        <div className="def-grid-left def-head-strip def-head-strip--device-left">
          <HeadLabel>Item #</HeadLabel>
          <HeadLabel>Device Type</HeadLabel>
          <HeadLabel>Device Location</HeadLabel>
          <HeadLabel>Deficiency</HeadLabel>
          <HeadLabel>ULC 536 Clause Reference</HeadLabel>
        </div>
        <div className="def-grid-right def-head-strip def-head-strip--repair">
          <HeadLabel>Date Corrected (MM/DD/YY)</HeadLabel>
          <HeadLabel>Work Order or Reference #</HeadLabel>
          <HeadLabel>Name of Service Provider Responsible for the Repair</HeadLabel>
          <HeadLabel>Technician Name &amp; Identification Number</HeadLabel>
        </div>

        {value.deviceRows.map((row, index) => (
          <div key={`device-row-${index}`} className="def-grid-row def-grid-row--data contents">
            <div className="def-grid-left def-data-strip def-data-strip--device-left">
              <div className="def-cell def-cell--item">
                <CellInput
                  value={row.itemNumber}
                  readOnly={readOnly}
                  onChange={(v) => updateDeviceRow(index, { ...row, itemNumber: v })}
                />
              </div>
              <div className="def-cell">
                <CellInput
                  value={row.deviceType}
                  readOnly={readOnly}
                  onChange={(v) => updateDeviceRow(index, { ...row, deviceType: v })}
                />
              </div>
              <div className="def-cell">
                <CellInput
                  value={row.deviceLocation}
                  readOnly={readOnly}
                  onChange={(v) => updateDeviceRow(index, { ...row, deviceLocation: v })}
                />
              </div>
              <div className="def-cell">
                <CellInput
                  value={row.deficiency}
                  readOnly={readOnly}
                  onChange={(v) => updateDeviceRow(index, { ...row, deficiency: v })}
                />
              </div>
              <div className="def-cell">
                <CellInput
                  value={row.ulcClause}
                  readOnly={readOnly}
                  onChange={(v) => updateDeviceRow(index, { ...row, ulcClause: v })}
                />
              </div>
            </div>
            <div className="def-grid-right def-data-strip def-data-strip--repair">
              <RepairFields
                repair={row.repair}
                readOnly={readOnly}
                onChange={(repair) => updateDeviceRow(index, { ...row, repair })}
              />
            </div>
          </div>
        ))}

        <div className="def-grid-left def-head-strip def-head-strip--control-left def-section-divider">
          <HeadLabel>Item #</HeadLabel>
          <HeadLabel className="def-head-span-2">Control Function or Feature</HeadLabel>
          <HeadLabel>Deficiency</HeadLabel>
          <HeadLabel>ULC 536 Clause Reference</HeadLabel>
        </div>
        <div className="def-grid-right def-head-strip def-head-strip--repair def-section-divider">
          <HeadLabel>Date Corrected (MM/DD/YY)</HeadLabel>
          <HeadLabel>Work Order or Reference #</HeadLabel>
          <HeadLabel>Name of Service Provider Responsible for the Repair</HeadLabel>
          <HeadLabel>Technician Name &amp; Identification Number</HeadLabel>
        </div>

        {value.controlRows.map((row, index) => (
          <div key={`control-row-${index}`} className="def-grid-row def-grid-row--data contents">
            <div className="def-grid-left def-data-strip def-data-strip--control-left">
              <div className="def-cell def-cell--item">
                <CellInput
                  value={row.itemNumber}
                  readOnly={readOnly}
                  onChange={(v) => updateControlRow(index, { ...row, itemNumber: v })}
                />
              </div>
              <div className="def-cell def-cell--span-2">
                <CellInput
                  value={row.controlFunction}
                  readOnly={readOnly}
                  onChange={(v) => updateControlRow(index, { ...row, controlFunction: v })}
                />
              </div>
              <div className="def-cell">
                <CellInput
                  value={row.deficiency}
                  readOnly={readOnly}
                  onChange={(v) => updateControlRow(index, { ...row, deficiency: v })}
                />
              </div>
              <div className="def-cell">
                <CellInput
                  value={row.ulcClause}
                  readOnly={readOnly}
                  onChange={(v) => updateControlRow(index, { ...row, ulcClause: v })}
                />
              </div>
            </div>
            <div className="def-grid-right def-data-strip def-data-strip--repair">
              <RepairFields
                repair={row.repair}
                readOnly={readOnly}
                onChange={(repair) => updateControlRow(index, { ...row, repair })}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="def-compliance">
        <p className="def-compliance-title">BUILDING OWNER&apos;S / REPRESENTATIVE&apos;S COMPLIANCE STATEMENT</p>
        <p className="def-compliance-text">
          I understand that all deficiencies noted in the table above have been corrected.
        </p>
        <div className="def-compliance-fields">
          <label className="def-compliance-field">
            <span className="def-compliance-label">Printed Name:</span>
            {readOnly ? (
              <span className="def-compliance-value">{value.compliancePrintedName || '\u00a0'}</span>
            ) : (
              <input
                type="text"
                className="def-compliance-input"
                value={value.compliancePrintedName}
                onChange={(e) => onChange?.({ ...value, compliancePrintedName: e.target.value })}
              />
            )}
          </label>
          <label className="def-compliance-field">
            <span className="def-compliance-label">Signature:</span>
            {readOnly ? (
              <span className="def-compliance-value">{value.complianceSignature || '\u00a0'}</span>
            ) : (
              <input
                type="text"
                className="def-compliance-input"
                value={value.complianceSignature}
                onChange={(e) => onChange?.({ ...value, complianceSignature: e.target.value })}
              />
            )}
          </label>
          <label className="def-compliance-field def-compliance-field--date">
            <span className="def-compliance-label">Date:</span>
            <div className="def-date-control">
              <div className="def-date-parts">
                {(['complianceDateMm', 'complianceDateDd', 'complianceDateYy'] as const).map((key, i) => (
                  <div key={key} className="def-date-part">
                    {readOnly ? (
                      <span className="def-date-box">{value[key] || '\u00a0'}</span>
                    ) : (
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        className="def-date-box def-date-input"
                        value={value[key]}
                        onChange={(e) => onChange?.({ ...value, [key]: e.target.value })}
                      />
                    )}
                    <span className="def-date-part-label">{['MM', 'DD', 'YY'][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
