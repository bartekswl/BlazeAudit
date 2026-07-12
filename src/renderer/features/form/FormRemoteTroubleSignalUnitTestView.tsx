import {
  REMOTE_TROUBLE_SIGNAL_UNIT_TEST_IDENTIFICATION_LABEL,
  REMOTE_TROUBLE_SIGNAL_UNIT_TEST_LOCATION_LABEL,
  REMOTE_TROUBLE_SIGNAL_UNIT_TEST_NOT_APPLICABLE_SUFFIX,
  REMOTE_TROUBLE_SIGNAL_UNIT_TEST_NOT_APPLICABLE_TEXT,
  REMOTE_TROUBLE_SIGNAL_UNIT_TEST_REF,
  REMOTE_TROUBLE_SIGNAL_UNIT_TEST_ROWS,
  normalizeRemoteTroubleSignalUnitTestValue,
  setRemoteTroubleSignalUnitTestChoice,
  setRemoteTroubleSignalUnitTestFieldLocation,
  setRemoteTroubleSignalUnitTestIdentification,
  setRemoteTroubleSignalUnitTestSectionNotApplicable,
  type RemoteTroubleSignalUnitTestChoice,
  type RemoteTroubleSignalUnitTestValue,
} from '../../../shared/form/remoteTroubleSignalUnitTest';
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
  choice: RemoteTroubleSignalUnitTestChoice | null;
  groupName: string;
  readOnly?: boolean;
  variant: RemoteTroubleSignalUnitTestChoice;
  onSelect: () => void;
  onClear: () => void;
}) {
  const tdCls = cn(
    'rtsu-td',
    variant === 'yes' && 'rtsu-td--yes',
    variant === 'no' && 'rtsu-td--no',
    variant === 'na' && 'rtsu-td--na',
  );
  const label = variant === 'yes' ? 'Yes' : variant === 'no' ? 'No' : 'N/A';

  if (readOnly) {
    return (
      <td className={tdCls}>
        <span className="rtsu-check-cell rtsu-check-cell--readonly">
          <FormCheckGlyph checked={variant === choice} className="rtsu-check" />
        </span>
      </td>
    );
  }

  return (
    <td className={tdCls}>
      <label className="rtsu-check-cell">
        <input
          type="radio"
          className="rtsu-check-input"
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
  rowValue: { choice: RemoteTroubleSignalUnitTestChoice | null };
  readOnly?: boolean;
  onChoice: (choice: RemoteTroubleSignalUnitTestChoice | null) => void;
}) {
  const groupName = `rtsu-${rowId}`;

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
    <div className="rtsu-info-row">
      <span className="rtsu-info-label">{label}</span>
      {readOnly ? (
        value.trim() ? (
          <span className="rtsu-info-value">{value}</span>
        ) : (
          <span className="rtsu-info-line" />
        )
      ) : (
        <VisibleWidthInput
          className="rtsu-info-input"
          value={value}
          onChange={(next) => onChange?.(next)}
        />
      )}
    </div>
  );
}

export function FormRemoteTroubleSignalUnitTestView({
  value,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (next: RemoteTroubleSignalUnitTestValue) => void;
}) {
  const data = normalizeRemoteTroubleSignalUnitTestValue(value);

  const emit = (next: RemoteTroubleSignalUnitTestValue) => onChange?.(next);

  return (
    <div className="rtsu-panel">
      <div className="rtsu-na-bar">
        <span className="rtsu-na-text">{REMOTE_TROUBLE_SIGNAL_UNIT_TEST_NOT_APPLICABLE_TEXT}</span>
        {readOnly ? (
          <span className="rtsu-na-check-wrap">
            <FormCheckGlyph checked={data.sectionNotApplicable} className="rtsu-na-check" />
            <span className="rtsu-na-suffix">{REMOTE_TROUBLE_SIGNAL_UNIT_TEST_NOT_APPLICABLE_SUFFIX}</span>
          </span>
        ) : (
          <label className="rtsu-na-check-wrap">
            <input
              type="checkbox"
              className="rtsu-na-check-input"
              checked={data.sectionNotApplicable}
              onChange={(event) =>
                emit(setRemoteTroubleSignalUnitTestSectionNotApplicable(data, event.target.checked))
              }
            />
            <span className="rtsu-na-suffix">{REMOTE_TROUBLE_SIGNAL_UNIT_TEST_NOT_APPLICABLE_SUFFIX}</span>
          </label>
        )}
      </div>

      <div className="rtsu-header-strip">
        <div className="rtsu-ref-bar">{REMOTE_TROUBLE_SIGNAL_UNIT_TEST_REF}</div>
        <InfoRow
          label={REMOTE_TROUBLE_SIGNAL_UNIT_TEST_LOCATION_LABEL}
          value={data.fieldLocation}
          readOnly={readOnly}
          onChange={(next) => emit(setRemoteTroubleSignalUnitTestFieldLocation(data, next))}
        />
        <InfoRow
          label={REMOTE_TROUBLE_SIGNAL_UNIT_TEST_IDENTIFICATION_LABEL}
          value={data.identification}
          readOnly={readOnly}
          onChange={(next) => emit(setRemoteTroubleSignalUnitTestIdentification(data, next))}
        />
      </div>

      <div className="rtsu-table-wrap">
        <table className="rtsu-table">
          <thead>
            <tr>
              <th className="rtsu-th rtsu-th--letter" aria-hidden="true" />
              <th className="rtsu-th rtsu-th--intro" aria-hidden="true" />
              <th className="rtsu-th rtsu-th--yes">Yes</th>
              <th className="rtsu-th rtsu-th--no">No</th>
              <th className="rtsu-th rtsu-th--na">N/A</th>
            </tr>
          </thead>
          <tbody>
            {REMOTE_TROUBLE_SIGNAL_UNIT_TEST_ROWS.map((row, index) => {
              const rowValue = data.checklist[row.id] ?? { choice: null };
              return (
                <tr key={row.id} className={cn('rtsu-row', index % 2 === 1 && 'rtsu-row--alt')}>
                  <td className="rtsu-td rtsu-td--letter">{row.letter}</td>
                  <td className="rtsu-td rtsu-td--desc">
                    <span className="rtsu-desc-text">{row.text}</span>
                  </td>
                  <ChoiceCells
                    rowId={row.id}
                    rowValue={rowValue}
                    readOnly={readOnly}
                    onChoice={(choice) =>
                      emit(setRemoteTroubleSignalUnitTestChoice(data, row.id, choice))
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
