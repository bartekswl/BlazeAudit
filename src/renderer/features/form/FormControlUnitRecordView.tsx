import {
  CONTROL_UNIT_RECORD_FIELD_LOCATION_LABEL,
  CONTROL_UNIT_RECORD_FOOTER_NOTE,
  CONTROL_UNIT_RECORD_IDENTIFICATION_LABEL,
  CONTROL_UNIT_RECORD_REF,
  CONTROL_UNIT_RECORD_ROWS,
  CONTROL_UNIT_RECORD_TITLE,
  normalizeControlUnitRecordValue,
  setControlUnitRecordChoice,
  setControlUnitRecordFieldLocation,
  setControlUnitRecordIdentification,
  setControlUnitRecordTime,
  type ControlUnitRecordChoice,
  type ControlUnitRecordValue,
} from '../../../shared/form/controlUnitRecord';
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
  choice: ControlUnitRecordChoice | null;
  groupName: string;
  readOnly?: boolean;
  variant: ControlUnitRecordChoice;
  onSelect: () => void;
}) {
  const tdCls = cn(
    'cur-td',
    variant === 'yes' && 'cur-td--yes',
    variant === 'no' && 'cur-td--no',
    variant === 'na' && 'cur-td--na',
  );
  const label = variant === 'yes' ? 'Yes' : variant === 'no' ? 'No' : 'N/A';

  if (readOnly) {
    return (
      <td className={tdCls}>
        <span className="cur-check-cell cur-check-cell--readonly">
          <span className="cur-check">{checkMark(variant === choice)}</span>
        </span>
      </td>
    );
  }

  return (
    <td className={tdCls}>
      <label className="cur-check-cell">
        <input
          type="radio"
          className="cur-check-input"
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
  yesDisabled,
  noDisabled,
  readOnly,
  onChoice,
}: {
  rowId: string;
  rowValue: { choice: ControlUnitRecordChoice | null };
  yesDisabled?: boolean;
  noDisabled?: boolean;
  readOnly?: boolean;
  onChoice: (choice: ControlUnitRecordChoice) => void;
}) {
  const groupName = `cur-${rowId}`;

  if (yesDisabled && noDisabled) {
    return (
      <>
        <td colSpan={2} className="cur-td cur-td--choice-block" aria-hidden="true" />
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
    <div className="cur-info-row">
      <span className="cur-info-label">{label}</span>
      {readOnly ? (
        <span className="cur-info-value">{value || '\u00a0'}</span>
      ) : (
        <VisibleWidthInput
          className="cur-info-input"
          value={value}
          onChange={(next) => onChange?.(next)}
        />
      )}
    </div>
  );
}

export function FormControlUnitRecordView({
  value: rawValue,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (value: ControlUnitRecordValue) => void;
}) {
  const data = normalizeControlUnitRecordValue(rawValue);

  return (
    <div className="cur-panel">
      <div className="cur-title-bar">{CONTROL_UNIT_RECORD_TITLE}</div>
      <div className="cur-ref-bar">{CONTROL_UNIT_RECORD_REF}</div>

      <div className="cur-info-strip">
        <InfoRow
          label={CONTROL_UNIT_RECORD_FIELD_LOCATION_LABEL}
          value={data.fieldLocation}
          readOnly={readOnly}
          onChange={(next) => onChange?.(setControlUnitRecordFieldLocation(data, next))}
        />
        <InfoRow
          label={CONTROL_UNIT_RECORD_IDENTIFICATION_LABEL}
          value={data.identification}
          readOnly={readOnly}
          onChange={(next) => onChange?.(setControlUnitRecordIdentification(data, next))}
        />
      </div>

      <div className="cur-table-wrap">
        <table className="cur-table">
          <thead>
            <tr>
              <th className="cur-th cur-th--letter" aria-hidden="true" />
              <th className="cur-th cur-th--intro" aria-hidden="true" />
              <th className="cur-th cur-th--yes">Yes</th>
              <th className="cur-th cur-th--no">No</th>
              <th className="cur-th cur-th--na">N/A</th>
            </tr>
          </thead>
          <tbody>
            {CONTROL_UNIT_RECORD_ROWS.map((row) => {
              const rowValue = data.checklist[row.id] ?? { choice: null };
              const time = rowValue.time ?? '';

              return (
                <tr key={row.id} className="cur-row">
                  <td className="cur-td cur-td--letter">{row.letter}</td>
                  <td className="cur-td cur-td--desc">
                    <span className="cur-desc-text">{row.text}</span>
                    {row.kind === 'timeFill' && (
                      <span className="cur-time-suffix">
                        {' '}
                        Time:{' '}
                        {readOnly ? (
                          <span className="cur-time-value">{time || '\u00a0'}</span>
                        ) : (
                          <VisibleWidthInput
                            className="cur-time-input"
                            value={time}
                            onChange={(next) => onChange?.(setControlUnitRecordTime(data, row.id, next))}
                          />
                        )}
                      </span>
                    )}
                  </td>
                  <ChoiceCells
                    rowId={row.id}
                    rowValue={rowValue}
                    yesDisabled={row.yesDisabled}
                    noDisabled={row.noDisabled}
                    readOnly={readOnly}
                    onChoice={(choice) => onChange?.(setControlUnitRecordChoice(data, row.id, choice))}
                  />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="cur-footer-note">{CONTROL_UNIT_RECORD_FOOTER_NOTE}</p>
    </div>
  );
}
