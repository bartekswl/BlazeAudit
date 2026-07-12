import {
  SEQUENTIAL_DISPLAY_TEST_IDENTIFICATION_LABEL,
  SEQUENTIAL_DISPLAY_TEST_LOCATION_LABEL,
  SEQUENTIAL_DISPLAY_TEST_NOT_APPLICABLE_SUFFIX,
  SEQUENTIAL_DISPLAY_TEST_NOT_APPLICABLE_TEXT,
  SEQUENTIAL_DISPLAY_TEST_REF_LINES,
  SEQUENTIAL_DISPLAY_TEST_ROWS,
  normalizeSequentialDisplayTestValue,
  setSequentialDisplayTestChoice,
  setSequentialDisplayTestFieldLocation,
  setSequentialDisplayTestIdentification,
  setSequentialDisplayTestSectionNotApplicable,
  type SequentialDisplayTestChoice,
  type SequentialDisplayTestValue,
} from '../../../shared/form/sequentialDisplayTest';
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
  choice: SequentialDisplayTestChoice | null;
  groupName: string;
  readOnly?: boolean;
  variant: SequentialDisplayTestChoice;
  onSelect: () => void;
  onClear: () => void;
}) {
  const tdCls = cn(
    'asd-td',
    variant === 'yes' && 'asd-td--yes',
    variant === 'no' && 'asd-td--no',
    variant === 'na' && 'asd-td--na',
  );
  const label = variant === 'yes' ? 'Yes' : variant === 'no' ? 'No' : 'N/A';

  if (readOnly) {
    return (
      <td className={tdCls}>
        <span className="asd-check-cell asd-check-cell--readonly">
          <FormCheckGlyph checked={variant === choice} className="asd-check" />
        </span>
      </td>
    );
  }

  return (
    <td className={tdCls}>
      <label className="asd-check-cell">
        <input
          type="radio"
          className="asd-check-input"
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
  rowValue: { choice: SequentialDisplayTestChoice | null };
  readOnly?: boolean;
  onChoice: (choice: SequentialDisplayTestChoice | null) => void;
}) {
  const groupName = `asd-${rowId}`;

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
    <div className="asd-info-row">
      <span className="asd-info-label">{label}</span>
      {readOnly ? (
        value.trim() ? (
          <span className="asd-info-value">{value}</span>
        ) : (
          <span className="asd-info-line" />
        )
      ) : (
        <VisibleWidthInput
          className="asd-info-input"
          value={value}
          onChange={(next) => onChange?.(next)}
        />
      )}
    </div>
  );
}

export function FormSequentialDisplayTestView({
  value,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (next: SequentialDisplayTestValue) => void;
}) {
  const data = normalizeSequentialDisplayTestValue(value);

  const emit = (next: SequentialDisplayTestValue) => onChange?.(next);

  return (
    <div className="asd-panel">
      <div className="asd-na-bar">
        <span className="asd-na-text">{SEQUENTIAL_DISPLAY_TEST_NOT_APPLICABLE_TEXT}</span>
        {readOnly ? (
          <span className="asd-na-check-wrap">
            <FormCheckGlyph checked={data.sectionNotApplicable} className="asd-na-check" />
            <span className="asd-na-suffix">{SEQUENTIAL_DISPLAY_TEST_NOT_APPLICABLE_SUFFIX}</span>
          </span>
        ) : (
          <label className="asd-na-check-wrap">
            <input
              type="checkbox"
              className="asd-na-check-input"
              checked={data.sectionNotApplicable}
              onChange={(event) =>
                emit(setSequentialDisplayTestSectionNotApplicable(data, event.target.checked))
              }
            />
            <span className="asd-na-suffix">{SEQUENTIAL_DISPLAY_TEST_NOT_APPLICABLE_SUFFIX}</span>
          </label>
        )}
      </div>

      <div className="asd-header-strip">
        <div className="asd-ref-bar">
          {SEQUENTIAL_DISPLAY_TEST_REF_LINES.map((line) => (
            <div key={line} className="asd-ref-line">
              {line}
            </div>
          ))}
        </div>
        <InfoRow
          label={SEQUENTIAL_DISPLAY_TEST_LOCATION_LABEL}
          value={data.fieldLocation}
          readOnly={readOnly}
          onChange={(next) => emit(setSequentialDisplayTestFieldLocation(data, next))}
        />
        <InfoRow
          label={SEQUENTIAL_DISPLAY_TEST_IDENTIFICATION_LABEL}
          value={data.identification}
          readOnly={readOnly}
          onChange={(next) => emit(setSequentialDisplayTestIdentification(data, next))}
        />
      </div>

      <div className="asd-table-wrap">
        <table className="asd-table">
          <thead>
            <tr>
              <th className="asd-th asd-th--letter" aria-hidden="true" />
              <th className="asd-th asd-th--intro" aria-hidden="true" />
              <th className="asd-th asd-th--yes">Yes</th>
              <th className="asd-th asd-th--no">No</th>
              <th className="asd-th asd-th--na">N/A</th>
            </tr>
          </thead>
          <tbody>
            {SEQUENTIAL_DISPLAY_TEST_ROWS.map((row, index) => {
              const rowValue = data.checklist[row.id] ?? { choice: null };
              return (
                <tr key={row.id} className={cn('asd-row', index % 2 === 1 && 'asd-row--alt')}>
                  <td className="asd-td asd-td--letter">{row.letter}</td>
                  <td className="asd-td asd-td--desc">
                    <span className="asd-desc-text">{row.text}</span>
                  </td>
                  <ChoiceCells
                    rowId={row.id}
                    rowValue={rowValue}
                    readOnly={readOnly}
                    onChoice={(choice) =>
                      emit(setSequentialDisplayTestChoice(data, row.id, choice))
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
