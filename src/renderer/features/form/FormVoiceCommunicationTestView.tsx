import {
  VOICE_COMMUNICATION_TEST_IDENTIFICATION_LABEL,
  VOICE_COMMUNICATION_TEST_LOCATION_LABEL,
  VOICE_COMMUNICATION_TEST_NOT_APPLICABLE_SUFFIX,
  VOICE_COMMUNICATION_TEST_NOT_APPLICABLE_TEXT,
  VOICE_COMMUNICATION_TEST_REF,
  VOICE_COMMUNICATION_TEST_ROWS,
  normalizeVoiceCommunicationTestValue,
  setVoiceCommunicationTestChoice,
  setVoiceCommunicationTestFieldLocation,
  setVoiceCommunicationTestIdentification,
  setVoiceCommunicationTestSectionNotApplicable,
  type VoiceCommunicationTestChoice,
  type VoiceCommunicationTestValue,
} from '../../../shared/form/voiceCommunicationTest';
import { cn } from '../../lib/cn';
import { VisibleWidthInput } from './VisibleWidthInput';

import { FormCheckGlyph } from './FormCheckGlyph';

function ChoiceCell({
  choice,
  groupName,
  readOnly,
  variant,
  onSelect,
}: {
  choice: VoiceCommunicationTestChoice | null;
  groupName: string;
  readOnly?: boolean;
  variant: VoiceCommunicationTestChoice;
  onSelect: () => void;
}) {
  const tdCls = cn(
    'vct-td',
    variant === 'yes' && 'vct-td--yes',
    variant === 'no' && 'vct-td--no',
    variant === 'na' && 'vct-td--na',
  );
  const label = variant === 'yes' ? 'Yes' : variant === 'no' ? 'No' : 'N/A';

  if (readOnly) {
    return (
      <td className={tdCls}>
        <span className="vct-check-cell vct-check-cell--readonly">
          <FormCheckGlyph checked={variant === choice} className="vct-check" />
        </span>
      </td>
    );
  }

  return (
    <td className={tdCls}>
      <label className="vct-check-cell">
        <input
          type="radio"
          className="vct-check-input"
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
  rowValue: { choice: VoiceCommunicationTestChoice | null };
  readOnly?: boolean;
  onChoice: (choice: VoiceCommunicationTestChoice) => void;
}) {
  const groupName = `vct-${rowId}`;

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
    <div className="vct-info-row">
      <span className="vct-info-label">{label}</span>
      {readOnly ? (
        <span className="vct-info-value">{value || '\u00a0'}</span>
      ) : (
        <VisibleWidthInput
          className="vct-info-input"
          value={value}
          onChange={(next) => onChange?.(next)}
        />
      )}
    </div>
  );
}

export function FormVoiceCommunicationTestView({
  value: rawValue,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (value: VoiceCommunicationTestValue) => void;
}) {
  const data = normalizeVoiceCommunicationTestValue(rawValue);

  return (
    <div className="vct-panel">
      <div className="vct-na-bar">
        <span className="vct-na-text">{VOICE_COMMUNICATION_TEST_NOT_APPLICABLE_TEXT}</span>
        {readOnly ? (
          <span className="vct-na-check-wrap">
            <FormCheckGlyph checked={data.sectionNotApplicable} className="vct-na-check" />
            <span className="vct-na-suffix">{VOICE_COMMUNICATION_TEST_NOT_APPLICABLE_SUFFIX}</span>
          </span>
        ) : (
          <label className="vct-na-check-wrap">
            <input
              type="checkbox"
              className="vct-na-check-input"
              checked={data.sectionNotApplicable}
              onChange={(event) =>
                onChange?.(
                  setVoiceCommunicationTestSectionNotApplicable(data, event.target.checked),
                )
              }
            />
            <span className="vct-na-suffix">{VOICE_COMMUNICATION_TEST_NOT_APPLICABLE_SUFFIX}</span>
          </label>
        )}
      </div>

      <div className="vct-ref-bar">{VOICE_COMMUNICATION_TEST_REF}</div>

      <div className="vct-info-strip">
        <InfoRow
          label={VOICE_COMMUNICATION_TEST_LOCATION_LABEL}
          value={data.fieldLocation}
          readOnly={readOnly}
          onChange={(next) => onChange?.(setVoiceCommunicationTestFieldLocation(data, next))}
        />
        <InfoRow
          label={VOICE_COMMUNICATION_TEST_IDENTIFICATION_LABEL}
          value={data.identification}
          readOnly={readOnly}
          onChange={(next) => onChange?.(setVoiceCommunicationTestIdentification(data, next))}
        />
      </div>

      <div className="vct-table-wrap">
        <table className="vct-table">
          <thead>
            <tr>
              <th className="vct-th vct-th--letter" aria-hidden="true" />
              <th className="vct-th vct-th--intro" aria-hidden="true" />
              <th className="vct-th vct-th--yes">Yes</th>
              <th className="vct-th vct-th--no">No</th>
              <th className="vct-th vct-th--na">N/A</th>
            </tr>
          </thead>
          <tbody>
            {VOICE_COMMUNICATION_TEST_ROWS.map((row) => {
              const rowValue = data.checklist[row.id] ?? { choice: null };
              return (
                <tr key={row.id} className="vct-row">
                  <td className="vct-td vct-td--letter">{row.letter}</td>
                  <td className="vct-td vct-td--desc">
                    <span className="vct-desc-text">{row.text}</span>
                  </td>
                  <ChoiceCells
                    rowId={row.id}
                    rowValue={rowValue}
                    readOnly={readOnly}
                    onChoice={(choice) =>
                      onChange?.(setVoiceCommunicationTestChoice(data, row.id, choice))
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
