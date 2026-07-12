import {
  ANNUNCIATOR_DEVICE_TEST_IDENTIFICATION_LABEL,
  ANNUNCIATOR_DEVICE_TEST_LOCATION_LABEL,
  ANNUNCIATOR_DEVICE_TEST_NOT_APPLICABLE_SUFFIX,
  ANNUNCIATOR_DEVICE_TEST_NOT_APPLICABLE_TEXT,
  ANNUNCIATOR_DEVICE_TEST_REF_LINES,
  ANNUNCIATOR_DEVICE_TEST_ROWS,
  normalizeAnnunciatorDeviceTestValue,
  setAnnunciatorDeviceTestChoice,
  setAnnunciatorDeviceTestFieldLocation,
  setAnnunciatorDeviceTestIdentification,
  setAnnunciatorDeviceTestSectionNotApplicable,
  type AnnunciatorDeviceTestChoice,
  type AnnunciatorDeviceTestValue,
} from '../../../shared/form/annunciatorDeviceTest';
import { cn } from '../../lib/cn';
import { FormCheckGlyph } from './FormCheckGlyph';
import { formToggleRadioInputProps } from './formToggleRadioInputProps';
import { VisibleWidthInput } from './VisibleWidthInput';

function ChoiceCell({
  choice,
  groupName,
  readOnly,
  variant,
  onSelect,
  onClear,
}: {
  choice: AnnunciatorDeviceTestChoice | null;
  groupName: string;
  readOnly?: boolean;
  variant: AnnunciatorDeviceTestChoice;
  onSelect: () => void;
  onClear: () => void;
}) {
  const tdCls = cn(
    'artu-td',
    variant === 'yes' && 'artu-td--yes',
    variant === 'no' && 'artu-td--no',
    variant === 'na' && 'artu-td--na',
  );
  const label = variant === 'yes' ? 'Yes' : variant === 'no' ? 'No' : 'N/A';

  if (readOnly) {
    return (
      <td className={tdCls}>
        <span className="artu-check-cell artu-check-cell--readonly">
          <FormCheckGlyph checked={variant === choice} className="artu-check" />
        </span>
      </td>
    );
  }

  return (
    <td className={tdCls}>
      <label className="artu-check-cell">
        <input
          type="radio"
          className="artu-check-input"
          name={groupName}
          {...formToggleRadioInputProps({ choice, variant, onSelect, onClear })}
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
  rowValue: { choice: AnnunciatorDeviceTestChoice | null };
  readOnly?: boolean;
  onChoice: (choice: AnnunciatorDeviceTestChoice | null) => void;
}) {
  const groupName = `artu-${rowId}`;

  return (
    <>
      <ChoiceCell
        choice={rowValue.choice}
        groupName={groupName}
        readOnly={readOnly}
        variant="yes"
        onSelect={() => onChoice('yes')}
        onClear={() => onChoice(null)}
      />
      <ChoiceCell
        choice={rowValue.choice}
        groupName={groupName}
        readOnly={readOnly}
        variant="no"
        onSelect={() => onChoice('no')}
        onClear={() => onChoice(null)}
      />
      <ChoiceCell
        choice={rowValue.choice}
        groupName={groupName}
        readOnly={readOnly}
        variant="na"
        onSelect={() => onChoice('na')}
        onClear={() => onChoice(null)}
      />
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
    <div className="artu-info-row">
      <span className="artu-info-label">{label}</span>
      {readOnly ? (
        value.trim() ? (
          <span className="artu-info-value">{value}</span>
        ) : (
          <span className="artu-info-line" />
        )
      ) : (
        <VisibleWidthInput
          className="artu-info-input"
          value={value}
          onChange={(next) => onChange?.(next)}
        />
      )}
    </div>
  );
}

export function FormAnnunciatorDeviceTestView({
  value,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (next: AnnunciatorDeviceTestValue) => void;
}) {
  const data = normalizeAnnunciatorDeviceTestValue(value);

  const emit = (next: AnnunciatorDeviceTestValue) => onChange?.(next);

  return (
    <div className="artu-panel">
      <div className="artu-na-bar">
        <span className="artu-na-text">{ANNUNCIATOR_DEVICE_TEST_NOT_APPLICABLE_TEXT}</span>
        {readOnly ? (
          <span className="artu-na-check-wrap">
            <FormCheckGlyph checked={data.sectionNotApplicable} className="artu-na-check" />
            <span className="artu-na-suffix">{ANNUNCIATOR_DEVICE_TEST_NOT_APPLICABLE_SUFFIX}</span>
          </span>
        ) : (
          <label className="artu-na-check-wrap">
            <input
              type="checkbox"
              className="artu-na-check-input"
              checked={data.sectionNotApplicable}
              onChange={(event) =>
                emit(setAnnunciatorDeviceTestSectionNotApplicable(data, event.target.checked))
              }
            />
            <span className="artu-na-suffix">{ANNUNCIATOR_DEVICE_TEST_NOT_APPLICABLE_SUFFIX}</span>
          </label>
        )}
      </div>

      <div className="artu-ref-bar">
        {ANNUNCIATOR_DEVICE_TEST_REF_LINES.map((line) => (
          <div key={line} className="artu-ref-line">
            {line}
          </div>
        ))}
      </div>

      <div className="artu-info-strip">
        <InfoRow
          label={ANNUNCIATOR_DEVICE_TEST_LOCATION_LABEL}
          value={data.fieldLocation}
          readOnly={readOnly}
          onChange={(next) => emit(setAnnunciatorDeviceTestFieldLocation(data, next))}
        />
        <InfoRow
          label={ANNUNCIATOR_DEVICE_TEST_IDENTIFICATION_LABEL}
          value={data.identification}
          readOnly={readOnly}
          onChange={(next) => emit(setAnnunciatorDeviceTestIdentification(data, next))}
        />
      </div>

      <div className="artu-table-wrap">
        <table className="artu-table">
          <thead>
            <tr>
              <th className="artu-th artu-th--letter" aria-hidden="true" />
              <th className="artu-th artu-th--intro" aria-hidden="true" />
              <th className="artu-th artu-th--yes">Yes</th>
              <th className="artu-th artu-th--no">No</th>
              <th className="artu-th artu-th--na">N/A</th>
            </tr>
          </thead>
          <tbody>
            {ANNUNCIATOR_DEVICE_TEST_ROWS.map((row) => {
              const rowValue = data.checklist[row.id] ?? { choice: null };
              return (
                <tr key={row.id} className="artu-row">
                  <td className="artu-td artu-td--letter">{row.letter}</td>
                  <td className="artu-td artu-td--desc">
                    <span className="artu-desc-text">{row.text}</span>
                  </td>
                  <ChoiceCells
                    rowId={row.id}
                    rowValue={rowValue}
                    readOnly={readOnly}
                    onChoice={(choice) =>
                      emit(setAnnunciatorDeviceTestChoice(data, row.id, choice))
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
