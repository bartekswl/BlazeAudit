import {
  EMERGENCY_POWER_SUPPLY_BATTERY_CAPACITY_LABEL,
  EMERGENCY_POWER_SUPPLY_BATTERY_TYPE_LABEL,
  EMERGENCY_POWER_SUPPLY_BATTERY_TYPE_OPTIONS,
  EMERGENCY_POWER_SUPPLY_GENERATOR_ROWS,
  EMERGENCY_POWER_SUPPLY_GENERATOR_TITLE,
  EMERGENCY_POWER_SUPPLY_NBC_TIME_LABEL,
  EMERGENCY_POWER_SUPPLY_NBC_TIME_OPTIONS,
  EMERGENCY_POWER_SUPPLY_PROVIDED_BY_LABEL,
  EMERGENCY_POWER_SUPPLY_PROVIDED_BY_OPTIONS,
  EMERGENCY_POWER_SUPPLY_FIELD_WIDTH_CH,
  EMERGENCY_POWER_SUPPLY_TEST_FIELD_LOCATION_LABEL,
  EMERGENCY_POWER_SUPPLY_TEST_IDENTIFICATION_LABEL,
  EMERGENCY_POWER_SUPPLY_TEST_ROWS,
  EMERGENCY_POWER_SUPPLY_TEST_SUBTITLE,
  EMERGENCY_POWER_SUPPLY_TEST_TYPE_OPTIONS,
  EMERGENCY_POWER_SUPPLY_TEST_REF,
  measureCurrentLabel,
  measureCurrentUnit,
  measureVoltageLabel,
  normalizeEmergencyPowerSupplyTestValue,
  setEmergencyPowerSupplyBatteryCapacity,
  setEmergencyPowerSupplyDateCode,
  setEmergencyPowerSupplyMeasure,
  setEmergencyPowerSupplyNbcAlarmTime,
  setEmergencyPowerSupplyTestChoice,
  setEmergencyPowerSupplyTestFieldLocation,
  setEmergencyPowerSupplyTestIdentification,
  setEmergencyPowerSupplyTestTypeChoice,
  setEmergencyPowerSupplyTestTypeSpecify,
  setEmergencyPowerSupplyValueFill,
  toggleEmergencyPowerSupplyBatteryType,
  toggleEmergencyPowerSupplyProvidedBy,
  type EmergencyPowerSupplyMeasureVariant,
  type EmergencyPowerSupplyTestChoice,
  type EmergencyPowerSupplyTestValue,
} from '../../../shared/form/emergencyPowerSupplyTest';
import { cn } from '../../lib/cn';
import { VisibleWidthInput } from './VisibleWidthInput';

import { FormCheckGlyph } from './FormCheckGlyph';

function OliveChoiceBlock({
  variant,
  rowSpan,
}: {
  variant?: 'c' | 'd' | 'e';
  rowSpan?: number;
}) {
  return (
    <td
      rowSpan={rowSpan}
      colSpan={3}
      className={cn(
        'epst-td epst-td--choice-block',
        variant === 'c' && 'epst-td--choice-block-c',
        variant === 'd' && 'epst-td--choice-block-d',
        variant === 'e' && 'epst-td--choice-block-e',
      )}
      aria-hidden="true"
    />
  );
}

function FieldInput({
  className,
  value,
  readOnly,
  fixedWidth = true,
  onChange,
}: {
  className?: string;
  value: string;
  readOnly?: boolean;
  fixedWidth?: boolean;
  onChange?: (next: string) => void;
}) {
  const cls = cn(
    'epst-field-input',
    !fixedWidth && 'epst-field-input--flex',
    className,
  );
  if (readOnly) {
    return (
      <span className={cn(cls, 'epst-field-value', !fixedWidth && 'epst-field-value--flex')}>
        {value || '\u00a0'}
      </span>
    );
  }
  if (!fixedWidth) {
    return (
      <VisibleWidthInput
        className={cls}
        value={value}
        onChange={(next) => onChange?.(next)}
      />
    );
  }
  return (
    <VisibleWidthInput
      className={cls}
      value={value}
      maxLength={EMERGENCY_POWER_SUPPLY_FIELD_WIDTH_CH}
      onChange={(next) => onChange?.(next.slice(0, EMERGENCY_POWER_SUPPLY_FIELD_WIDTH_CH))}
    />
  );
}

function ChoiceCell({
  choice,
  groupName,
  readOnly,
  variant,
  onSelect,
}: {
  choice: EmergencyPowerSupplyTestChoice | null;
  groupName: string;
  readOnly?: boolean;
  variant: EmergencyPowerSupplyTestChoice;
  onSelect: () => void;
}) {
  const tdCls = cn(
    'epst-td',
    variant === 'yes' && 'epst-td--yes',
    variant === 'no' && 'epst-td--no',
    variant === 'na' && 'epst-td--na',
  );
  const label = variant === 'yes' ? 'Yes' : variant === 'no' ? 'No' : 'N/A';

  if (readOnly) {
    return (
      <td className={tdCls}>
        <span className="epst-check-cell epst-check-cell--readonly">
          <FormCheckGlyph checked={variant === choice} className="epst-check" />
        </span>
      </td>
    );
  }

  return (
    <td className={tdCls}>
      <label className="epst-check-cell">
        <input
          type="radio"
          className="epst-check-input"
          name={groupName}
          checked={choice === variant}
          onChange={onSelect}
        />
        <span className="sr-only">{label}</span>
      </label>
    </td>
  );
}

function ChoiceCells({
  rowId,
  choice,
  readOnly,
  onChoice,
}: {
  rowId: string;
  choice: EmergencyPowerSupplyTestChoice | null;
  readOnly?: boolean;
  onChoice: (choice: EmergencyPowerSupplyTestChoice) => void;
}) {
  return (
    <>
      {(['yes', 'no', 'na'] as const).map((variant) => (
        <ChoiceCell
          key={variant}
          choice={choice}
          groupName={`epst-${rowId}`}
          readOnly={readOnly}
          variant={variant}
          onSelect={() => onChoice(variant)}
        />
      ))}
    </>
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
    <div className="epst-info-row">
      <span className="epst-info-label">{label}</span>
      {readOnly ? (
        <span className="epst-info-value">{value || '\u00a0'}</span>
      ) : (
        <VisibleWidthInput
          className="epst-info-input"
          value={value}
          onChange={(next) => onChange?.(next)}
        />
      )}
    </div>
  );
}

function CheckboxOption({
  label,
  checked,
  readOnly,
  onChange,
}: {
  label: string;
  checked: boolean;
  readOnly?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  if (readOnly) {
    return (
      <span className="epst-spec-option">
        <FormCheckGlyph checked={checked} className="epst-spec-check" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <label className="epst-spec-option">
      <input
        type="checkbox"
        className="epst-spec-check-input"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function DescLine({
  label,
  value,
  unit,
  readOnly,
  fixedWidth = true,
  wideInput = false,
  onChange,
}: {
  label: string;
  value?: string;
  unit?: string;
  readOnly?: boolean;
  fixedWidth?: boolean;
  wideInput?: boolean;
  onChange?: (next: string) => void;
}) {
  return (
    <div className={cn('epst-desc-line', wideInput && 'epst-desc-line--wide')}>
      <span className="epst-desc-text">{label}</span>
      {value !== undefined ? (
        <>
          <FieldInput
            fixedWidth={fixedWidth && !wideInput}
            value={value}
            readOnly={readOnly}
            onChange={onChange}
          />
          {unit ? <span className="epst-field-unit">{unit}</span> : null}
        </>
      ) : null}
    </div>
  );
}

function MeasureRows({
  variant,
  letter,
  fields,
  readOnly,
  onChange,
}: {
  variant: EmergencyPowerSupplyMeasureVariant;
  letter: string;
  fields: { voltage: string; current: string };
  readOnly?: boolean;
  onChange?: (field: 'voltage' | 'current', value: string) => void;
}) {
  const measureBg = `epst-td--measure-${variant}`;
  const lines = [
    { field: 'voltage' as const, label: measureVoltageLabel(variant), unit: 'VDC' },
    {
      field: 'current' as const,
      label: measureCurrentLabel(variant),
      unit: measureCurrentUnit(variant),
    },
  ];

  return (
    <>
      {lines.map((line, index) => (
        <tr key={`${variant}-${line.field}`} className={cn('epst-row', `epst-row--measure-${variant}`)}>
          <td className={cn('epst-td', 'epst-td--letter', measureBg)}>{index === 0 ? letter : ''}</td>
          <td className={cn('epst-td', 'epst-td--desc', measureBg)}>
            <DescLine
              label={line.label}
              value={fields[line.field]}
              unit={line.unit}
              readOnly={readOnly}
              onChange={(next) => onChange?.(line.field, next)}
            />
          </td>
          {index === 0 ? <OliveChoiceBlock variant={variant} rowSpan={2} /> : null}
        </tr>
      ))}
    </>
  );
}

export function FormEmergencyPowerSupplyTestView({
  value: rawValue,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (value: EmergencyPowerSupplyTestValue) => void;
}) {
  const data = normalizeEmergencyPowerSupplyTestValue(rawValue);

  const renderMainRow = (
    row: (typeof EMERGENCY_POWER_SUPPLY_TEST_ROWS)[number],
    rowIndex: number,
  ) => {
    const altRow = rowIndex % 2 === 1 ? 'epst-row--alt' : '';
    if (row.kind === 'batteryMeasure' && row.measureVariant) {
      const variant = row.measureVariant;
      return (
        <MeasureRows
          key={row.id}
          variant={variant}
          letter={row.letter}
          fields={data.measures[variant]}
          readOnly={readOnly}
          onChange={(field, value) =>
            onChange?.(setEmergencyPowerSupplyMeasure(data, variant, field, value))
          }
        />
      );
    }

    if (row.kind === 'textFill' && row.id === 'epst-m') {
      return (
        <tr key={row.id} className={cn('epst-row', altRow)}>
          <td className="epst-td epst-td--letter">{row.letter}</td>
          <td className="epst-td epst-td--desc epst-td--text-fill">
            <DescLine
              label={row.text}
              value={data.dateCode}
              readOnly={readOnly}
              fixedWidth={false}
              wideInput
              onChange={(next) => onChange?.(setEmergencyPowerSupplyDateCode(data, next))}
            />
          </td>
          <OliveChoiceBlock />
        </tr>
      );
    }

    if (row.kind === 'valueFill') {
      const key = row.valueKey ?? (row.id === 'epst-p' ? 'p' : row.id === 'epst-q' ? 'q' : 's');
      return (
        <tr key={row.id} className={cn('epst-row', altRow)}>
          <td className="epst-td epst-td--letter">{row.letter}</td>
          <td className="epst-td epst-td--desc epst-td--value-fill">
            <DescLine
              label={row.text}
              value={data.valueFills[key]}
              unit={row.valueUnit}
              readOnly={readOnly}
              onChange={(next) => onChange?.(setEmergencyPowerSupplyValueFill(data, key, next))}
            />
          </td>
          <OliveChoiceBlock />
        </tr>
      );
    }

    if (row.kind === 'testType') {
      return (
        <>
          <tr key={row.id} className="epst-row epst-row--group-head">
            <td className="epst-td epst-td--letter">{row.letter}</td>
            <td className="epst-td epst-td--desc" colSpan={4}>
              <span className="epst-desc-text">{row.text}</span>
            </td>
          </tr>
          {EMERGENCY_POWER_SUPPLY_TEST_TYPE_OPTIONS.map((opt) => {
            const choice = data.testType[opt.key];
            return (
              <tr key={opt.id} className="epst-row epst-row--sub">
                <td className="epst-td epst-td--letter" aria-hidden="true" />
                <td className="epst-td epst-td--desc epst-td--sub">
                  <span className="epst-desc-text epst-desc-text--sub">
                    ({opt.id}) {opt.label}
                  </span>
                  {opt.key === 'iii' ? (
                    <FieldInput
                      fixedWidth={false}
                      value={data.testType.specify}
                      readOnly={readOnly}
                      onChange={(next) =>
                        onChange?.(setEmergencyPowerSupplyTestTypeSpecify(data, next))
                      }
                    />
                  ) : null}
                </td>
                <ChoiceCells
                  rowId={`test-${opt.id}`}
                  choice={choice}
                  readOnly={readOnly}
                  onChoice={(next) =>
                    onChange?.(setEmergencyPowerSupplyTestTypeChoice(data, opt.key, next))
                  }
                />
              </tr>
            );
          })}
        </>
      );
    }

    const rowValue = data.checklist[row.id] ?? { choice: null };
    return (
      <tr key={row.id} className={cn('epst-row', altRow)}>
        <td className="epst-td epst-td--letter">{row.letter}</td>
        <td className="epst-td epst-td--desc">
          <span className="epst-desc-text">{row.text}</span>
        </td>
        <ChoiceCells
          rowId={row.id}
          choice={rowValue.choice}
          readOnly={readOnly}
          onChoice={(choice) => onChange?.(setEmergencyPowerSupplyTestChoice(data, row.id, choice))}
        />
      </tr>
    );
  };

  return (
    <div className="epst-panel">
      <div className="epst-banner">
        <div className="epst-banner-line">{EMERGENCY_POWER_SUPPLY_TEST_SUBTITLE}</div>
        <div className="epst-banner-line">{EMERGENCY_POWER_SUPPLY_TEST_REF}</div>
      </div>

      <div className="epst-info-strip">
        <InfoRow
          label={EMERGENCY_POWER_SUPPLY_TEST_FIELD_LOCATION_LABEL}
          value={data.fieldLocation}
          readOnly={readOnly}
          onChange={(next) => onChange?.(setEmergencyPowerSupplyTestFieldLocation(data, next))}
        />
        <InfoRow
          label={EMERGENCY_POWER_SUPPLY_TEST_IDENTIFICATION_LABEL}
          value={data.identification}
          readOnly={readOnly}
          onChange={(next) => onChange?.(setEmergencyPowerSupplyTestIdentification(data, next))}
        />
      </div>

      <div className="epst-spec-strip">
        <div className="epst-spec-row">
          <span className="epst-spec-label">{EMERGENCY_POWER_SUPPLY_PROVIDED_BY_LABEL}</span>
          <span className="epst-spec-options">
            {EMERGENCY_POWER_SUPPLY_PROVIDED_BY_OPTIONS.map((opt) => (
              <CheckboxOption
                key={opt.id}
                label={opt.label}
                checked={data.providedBy[opt.id] ?? false}
                readOnly={readOnly}
                onChange={(checked) =>
                  onChange?.(toggleEmergencyPowerSupplyProvidedBy(data, opt.id, checked))
                }
              />
            ))}
          </span>
        </div>
        <div className="epst-spec-row">
          <span className="epst-spec-label">{EMERGENCY_POWER_SUPPLY_BATTERY_TYPE_LABEL}</span>
          <span className="epst-spec-options">
            {EMERGENCY_POWER_SUPPLY_BATTERY_TYPE_OPTIONS.map((opt) => (
              <CheckboxOption
                key={opt.id}
                label={opt.label}
                checked={data.batteryType[opt.id] ?? false}
                readOnly={readOnly}
                onChange={(checked) =>
                  onChange?.(toggleEmergencyPowerSupplyBatteryType(data, opt.id, checked))
                }
              />
            ))}
          </span>
        </div>
        <div className="epst-spec-row">
          <span className="epst-spec-label">{EMERGENCY_POWER_SUPPLY_BATTERY_CAPACITY_LABEL}</span>
          <span className="epst-spec-inline">
            <FieldInput
              className="epst-spec-input"
              value={data.batteryCapacity}
              readOnly={readOnly}
              onChange={(next) => onChange?.(setEmergencyPowerSupplyBatteryCapacity(data, next))}
            />
            <span className="epst-spec-unit">AH</span>
          </span>
        </div>
        <div className="epst-spec-row">
          <span className="epst-spec-label">{EMERGENCY_POWER_SUPPLY_NBC_TIME_LABEL}</span>
          <span className="epst-spec-options">
            {EMERGENCY_POWER_SUPPLY_NBC_TIME_OPTIONS.map((opt) =>
              readOnly ? (
                <span key={opt.id} className="epst-spec-option">
                  <FormCheckGlyph
                    checked={data.nbcAlarmTime === opt.id}
                    className="epst-spec-check"
                  />
                  <span>{opt.label}</span>
                </span>
              ) : (
                <label key={opt.id} className="epst-spec-option">
                  <input
                    type="radio"
                    className="epst-spec-radio"
                    name="epst-nbc-time"
                    checked={data.nbcAlarmTime === opt.id}
                    onChange={() => onChange?.(setEmergencyPowerSupplyNbcAlarmTime(data, opt.id))}
                  />
                  <span>{opt.label}</span>
                </label>
              ),
            )}
          </span>
        </div>
      </div>

      <div className="epst-table-wrap">
        <table className="epst-table">
          <colgroup>
            <col className="epst-col-letter" />
            <col className="epst-col-desc" />
            <col className="epst-col-yes" />
            <col className="epst-col-no" />
            <col className="epst-col-na" />
          </colgroup>
          <thead>
            <tr>
              <th className="epst-th epst-th--letter" aria-hidden="true" />
              <th className="epst-th epst-th--intro" aria-hidden="true" />
              <th className="epst-th epst-th--yes">Yes</th>
              <th className="epst-th epst-th--no">No</th>
              <th className="epst-th epst-th--na">N/A</th>
            </tr>
          </thead>
          <tbody>
            {EMERGENCY_POWER_SUPPLY_TEST_ROWS.map((row, index) => renderMainRow(row, index))}
          </tbody>
        </table>
      </div>

      <div className="epst-generator">
        <div className="epst-generator-title">{EMERGENCY_POWER_SUPPLY_GENERATOR_TITLE}</div>
        <table className="epst-table epst-table--generator">
          <colgroup>
            <col className="epst-col-letter" />
            <col className="epst-col-desc" />
            <col className="epst-col-yes" />
            <col className="epst-col-no" />
            <col className="epst-col-na" />
          </colgroup>
          <tbody>
            {EMERGENCY_POWER_SUPPLY_GENERATOR_ROWS.map((row, index) => {
              const rowValue = data.checklist[row.id] ?? { choice: null };
              return (
                <tr key={row.id} className={cn('epst-row', index % 2 === 1 && 'epst-row--alt')}>
                  <td className="epst-td epst-td--letter">{row.letter}</td>
                  <td className="epst-td epst-td--desc">
                    <span className="epst-desc-text">{row.text}</span>
                  </td>
                  <ChoiceCells
                    rowId={row.id}
                    choice={rowValue.choice}
                    readOnly={readOnly}
                    onChoice={(choice) =>
                      onChange?.(setEmergencyPowerSupplyTestChoice(data, row.id, choice))
                    }
                  />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
