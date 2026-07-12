import {
  POWER_SUPPLY_INSPECTION_BREAKER_LABEL,
  POWER_SUPPLY_INSPECTION_DISCONNECT_LOCATION_LABEL,
  POWER_SUPPLY_INSPECTION_FIELD_LOCATION_LABEL,
  POWER_SUPPLY_INSPECTION_IDENTIFICATION_LABEL,
  POWER_SUPPLY_INSPECTION_REF,
  POWER_SUPPLY_INSPECTION_ROWS,
  POWER_SUPPLY_INSPECTION_SUBTITLE,
  normalizePowerSupplyInspectionValue,
  setPowerSupplyInspectionBreakerIdentification,
  setPowerSupplyInspectionChoice,
  setPowerSupplyInspectionDisconnectLocation,
  setPowerSupplyInspectionFieldLocation,
  setPowerSupplyInspectionIdentification,
  type PowerSupplyInspectionChoice,
  type PowerSupplyInspectionValue,
} from '../../../shared/form/powerSupplyInspection';
import { cn } from '../../lib/cn';
import { VisibleWidthInput } from './VisibleWidthInput';

import { FormCheckGlyph } from './FormCheckGlyph';
import { formToggleRadioInputProps } from './formToggleRadioInputProps';

function ChoiceCell({
  choice,
  groupName,
  readOnly,
  variant,
  onSelect,
  onClear,
}: {
  choice: PowerSupplyInspectionChoice | null;
  groupName: string;
  readOnly?: boolean;
  variant: PowerSupplyInspectionChoice;
  onSelect: () => void;
  onClear: () => void;
}) {
  const tdCls = cn(
    'psi-td',
    variant === 'yes' && 'psi-td--yes',
    variant === 'no' && 'psi-td--no',
    variant === 'na' && 'psi-td--na',
  );
  const label = variant === 'yes' ? 'Yes' : variant === 'no' ? 'No' : 'N/A';

  if (readOnly) {
    return (
      <td className={tdCls}>
        <span className="psi-check-cell psi-check-cell--readonly">
          <FormCheckGlyph checked={variant === choice} className="psi-check" />
        </span>
      </td>
    );
  }

  return (
    <td className={tdCls}>
      <label className="psi-check-cell">
        <input
          type="radio"
          className="psi-check-input"
          name={groupName}
          {...formToggleRadioInputProps({ choice, variant, onSelect, onClear })}
        />
        <span className="sr-only">{label}</span>
      </label>
    </td>
  );
}

function InfoRow({
  label,
  value,
  readOnly,
  onChange,
}: {
  label: string;
  value: string;
  readOnly?: boolean;
  onChange?: (next: string) => void;
}) {
  return (
    <div className="psi-info-row">
      <span className="psi-info-label">{label}</span>
      {readOnly ? (
        <span className="psi-info-value">{value || '\u00a0'}</span>
      ) : (
        <VisibleWidthInput
          className="psi-info-input"
          value={value}
          onChange={(next) => onChange?.(next)}
        />
      )}
    </div>
  );
}

export function FormPowerSupplyInspectionView({
  value: rawValue,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (value: PowerSupplyInspectionValue) => void;
}) {
  const data = normalizePowerSupplyInspectionValue(rawValue);

  return (
    <div className="psi-panel">
      <div className="psi-banner">
        <div className="psi-banner-line">{POWER_SUPPLY_INSPECTION_SUBTITLE}</div>
        <div className="psi-banner-line">{POWER_SUPPLY_INSPECTION_REF}</div>
      </div>

      <div className="psi-info-strip">
        <InfoRow
          label={POWER_SUPPLY_INSPECTION_FIELD_LOCATION_LABEL}
          value={data.fieldLocation}
          readOnly={readOnly}
          onChange={(next) => onChange?.(setPowerSupplyInspectionFieldLocation(data, next))}
        />
        <InfoRow
          label={POWER_SUPPLY_INSPECTION_IDENTIFICATION_LABEL}
          value={data.identification}
          readOnly={readOnly}
          onChange={(next) => onChange?.(setPowerSupplyInspectionIdentification(data, next))}
        />
        <InfoRow
          label={POWER_SUPPLY_INSPECTION_DISCONNECT_LOCATION_LABEL}
          value={data.disconnectLocation}
          readOnly={readOnly}
          onChange={(next) => onChange?.(setPowerSupplyInspectionDisconnectLocation(data, next))}
        />
        <InfoRow
          label={POWER_SUPPLY_INSPECTION_BREAKER_LABEL}
          value={data.breakerIdentification}
          readOnly={readOnly}
          onChange={(next) => onChange?.(setPowerSupplyInspectionBreakerIdentification(data, next))}
        />
      </div>

      <div className="psi-table-wrap">
        <table className="psi-table">
          <thead>
            <tr>
              <th className="psi-th psi-th--letter" aria-hidden="true" />
              <th className="psi-th psi-th--intro" aria-hidden="true" />
              <th className="psi-th psi-th--yes">Yes</th>
              <th className="psi-th psi-th--no">No</th>
              <th className="psi-th psi-th--na">N/A</th>
            </tr>
          </thead>
          <tbody>
            {POWER_SUPPLY_INSPECTION_ROWS.map((row, index) => {
              const rowValue = data.checklist[row.id] ?? { choice: null };
              return (
                <tr key={row.id} className={cn('psi-row', index % 2 === 1 && 'psi-row--alt')}>
                  <td className="psi-td psi-td--letter">{row.letter}</td>
                  <td className="psi-td psi-td--desc">
                    <span className="psi-desc-text">{row.text}</span>
                  </td>
                  {(['yes', 'no', 'na'] as const).map((variant) => (
                    <ChoiceCell
                      key={variant}
                      choice={rowValue.choice}
                      groupName={`psi-${row.id}`}
                      readOnly={readOnly}
                      variant={variant}
                      onSelect={() => onChange?.(setPowerSupplyInspectionChoice(data, row.id, variant))}
                      onClear={() => onChange?.(setPowerSupplyInspectionChoice(data, row.id, null))}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
