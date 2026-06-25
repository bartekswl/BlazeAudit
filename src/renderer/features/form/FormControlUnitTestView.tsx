import {
  CONTROL_UNIT_TEST_FIELD_LOCATION_LABEL,
  CONTROL_UNIT_TEST_FIRMWARE_PROMPT,
  CONTROL_UNIT_TEST_IDENTIFICATION_LABEL,
  CONTROL_UNIT_TEST_INTRO,
  CONTROL_UNIT_TEST_REF,
  CONTROL_UNIT_TEST_ROWS,
  CONTROL_UNIT_TEST_SOFTWARE_PROMPT,
  normalizeControlUnitTestValue,
  setControlUnitTestChoice,
  setControlUnitTestFieldLocation,
  setControlUnitTestFirmware,
  setControlUnitTestIdentification,
  setControlUnitTestSoftware,
  type ControlUnitTestChoice,
  type ControlUnitTestValue,
  type ControlUnitTestVersionFields,
} from '../../../shared/form/controlUnitTest';
import { cn } from '../../lib/cn';
import { VisibleWidthInput } from './VisibleWidthInput';

function checkMark(checked: boolean): string {
  return checked ? '☑' : '☐';
}

function ChoiceCell({
  choice,
  groupName,
  readOnly,
  variant,
  onSelect,
}: {
  choice: ControlUnitTestChoice | null;
  groupName: string;
  readOnly?: boolean;
  variant: ControlUnitTestChoice;
  onSelect: () => void;
}) {
  const tdCls = cn(
    'cut-td',
    variant === 'yes' && 'cut-td--yes',
    variant === 'no' && 'cut-td--no',
    variant === 'na' && 'cut-td--na',
  );
  const label = variant === 'yes' ? 'Yes' : variant === 'no' ? 'No' : 'N/A';

  if (readOnly) {
    return (
      <td className={tdCls}>
        <span className="cut-check-cell cut-check-cell--readonly">
          <span className="cut-check">{checkMark(variant === choice)}</span>
        </span>
      </td>
    );
  }

  return (
    <td className={tdCls}>
      <label className="cut-check-cell">
        <input
          type="radio"
          className="cut-check-input"
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
  rowValue,
  readOnly,
  onChoice,
}: {
  rowId: string;
  rowValue: { choice: ControlUnitTestChoice | null };
  readOnly?: boolean;
  onChoice: (choice: ControlUnitTestChoice) => void;
}) {
  const groupName = `cut-${rowId}`;

  return (
    <>
      <ChoiceCell
        choice={rowValue.choice}
        groupName={groupName}
        readOnly={readOnly}
        variant="yes"
        onSelect={() => onChoice('yes')}
      />
      <ChoiceCell
        choice={rowValue.choice}
        groupName={groupName}
        readOnly={readOnly}
        variant="no"
        onSelect={() => onChoice('no')}
      />
      <ChoiceCell
        choice={rowValue.choice}
        groupName={groupName}
        readOnly={readOnly}
        variant="na"
        onSelect={() => onChoice('na')}
      />
    </>
  );
}

function VersionFields({
  fields,
  readOnly,
  onChange,
}: {
  fields: ControlUnitTestVersionFields;
  readOnly?: boolean;
  onChange?: (next: ControlUnitTestVersionFields) => void;
}) {
  const update = (key: keyof ControlUnitTestVersionFields, value: string) => {
    onChange?.({ ...fields, [key]: value });
  };

  const items: Array<{ key: keyof ControlUnitTestVersionFields; label: string }> = [
    { key: 'date', label: 'Date:' },
    { key: 'revision', label: 'Revision:' },
    { key: 'version', label: 'Version:' },
  ];

  return (
    <div className="cut-version-fields">
      {items.map(({ key, label }) => (
        <span key={key} className="cut-version-field">
          <span className="cut-version-label">{label}</span>
          {readOnly ? (
            <span className="cut-version-value">{fields[key] || '\u00a0'}</span>
          ) : (
            <VisibleWidthInput
              className="cut-version-input"
              value={fields[key]}
              onChange={(next) => update(key, next)}
            />
          )}
        </span>
      ))}
    </div>
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
    <div className="cut-info-row">
      <span className="cut-info-label">{label}</span>
      {readOnly ? (
        <span className="cut-info-value">{value || '\u00a0'}</span>
      ) : (
        <VisibleWidthInput
          className="cut-info-input"
          value={value}
          onChange={(next) => onChange?.(next)}
        />
      )}
    </div>
  );
}

export function FormControlUnitTestView({
  value: rawValue,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (value: ControlUnitTestValue) => void;
}) {
  const data = normalizeControlUnitTestValue(rawValue);

  return (
    <div className="cut-panel">
      <div className="cut-legend">
        <p>
          <span className="cut-legend-yes">&quot;Yes&quot;</span> — Tested correctly
        </p>
        <p>
          <span className="cut-legend-no">&quot;No&quot;</span> — Did not test correctly (For NO
          answers refer to Section 20.2 Deficiencies)
        </p>
        <p>
          <span className="cut-legend-na">&quot;NA&quot;</span> — Not applicable (the feature is not
          available or has not been programmed).
        </p>
      </div>

      <div className="cut-ref-bar">{CONTROL_UNIT_TEST_REF}</div>

      <div className="cut-info-strip">
        <InfoRow
          label={CONTROL_UNIT_TEST_FIELD_LOCATION_LABEL}
          value={data.fieldLocation}
          readOnly={readOnly}
          onChange={(next) => onChange?.(setControlUnitTestFieldLocation(data, next))}
        />
        <InfoRow
          label={CONTROL_UNIT_TEST_IDENTIFICATION_LABEL}
          value={data.identification}
          readOnly={readOnly}
          onChange={(next) => onChange?.(setControlUnitTestIdentification(data, next))}
        />
      </div>

      <div className="cut-table-wrap">
        <table className="cut-table">
          <thead>
            <tr>
              <th className="cut-th cut-th--letter" aria-hidden="true" />
              <th className="cut-th cut-th--intro">{CONTROL_UNIT_TEST_INTRO}</th>
              <th className="cut-th cut-th--yes">Yes</th>
              <th className="cut-th cut-th--no">No</th>
              <th className="cut-th cut-th--na">N/A</th>
            </tr>
          </thead>
          <tbody>
            {CONTROL_UNIT_TEST_ROWS.map((row) => {
              if (row.kind === 'firmware') {
                return (
                  <tr key={row.id} className="cut-row cut-row--f">
                    <td className="cut-td cut-td--letter">{row.letter}</td>
                    <td className="cut-td cut-td--desc cut-td--f">
                      <div className="cut-f-section">
                        <p className="cut-f-prompt">{CONTROL_UNIT_TEST_FIRMWARE_PROMPT}</p>
                        <VersionFields
                          fields={data.firmware}
                          readOnly={readOnly}
                          onChange={(next) => onChange?.(setControlUnitTestFirmware(data, next))}
                        />
                      </div>
                      <div className="cut-f-section">
                        <p className="cut-f-prompt">{CONTROL_UNIT_TEST_SOFTWARE_PROMPT}</p>
                        <VersionFields
                          fields={data.software}
                          readOnly={readOnly}
                          onChange={(next) => onChange?.(setControlUnitTestSoftware(data, next))}
                        />
                      </div>
                    </td>
                    <td colSpan={3} className="cut-td cut-td--choice-block" aria-hidden="true" />
                  </tr>
                );
              }

              const rowValue = data.checklist[row.id] ?? { choice: null };
              return (
                <tr key={row.id} className="cut-row">
                  <td className="cut-td cut-td--letter">{row.letter}</td>
                  <td className="cut-td cut-td--desc">
                    <span className="cut-desc-text">{row.text}</span>
                  </td>
                  <ChoiceCells
                    rowId={row.id}
                    rowValue={rowValue}
                    readOnly={readOnly}
                    onChoice={(choice) => onChange?.(setControlUnitTestChoice(data, row.id, choice))}
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
