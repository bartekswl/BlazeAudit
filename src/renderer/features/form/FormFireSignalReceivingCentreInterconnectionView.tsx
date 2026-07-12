import {
  FSRC_CIRCUIT_DISCONNECT_LOCATION_LABEL,
  FSRC_CIRCUIT_PANEL_BREAKER_LABEL,
  FSRC_COMMUNICATOR_LOCATION_LABEL,
  FSRC_FOOTNOTE,
  FSRC_NOT_APPLICABLE_SUFFIX,
  FSRC_NOT_APPLICABLE_TEXT,
  FSRC_REF,
  FSRC_ROWS,
  normalizeFireSignalReceivingCentreInterconnectionValue,
  setFsrcChoice,
  setFsrcCircuitDisconnectMeansLocation,
  setFsrcCircuitPanelBreakerIdentification,
  setFsrcCommunicatorLocation,
  setFsrcRecordField,
  setFsrcSectionNotApplicable,
  type FsrcChoice,
  type FsrcRowDef,
  type FireSignalReceivingCentreInterconnectionValue,
} from '../../../shared/form/fireSignalReceivingCentreInterconnection';
import { cn } from '../../lib/cn';
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
  choice: FsrcChoice | null;
  groupName: string;
  readOnly?: boolean;
  variant: FsrcChoice;
  onSelect: () => void;
  onClear: () => void;
}) {
  const tdCls = cn(
    'fsrc-td',
    variant === 'yes' && 'fsrc-td--yes',
    variant === 'no' && 'fsrc-td--no',
    variant === 'na' && 'fsrc-td--na',
  );
  const label = variant === 'yes' ? 'Yes' : variant === 'no' ? 'No' : 'N/A';

  if (readOnly) {
    return (
      <td className={tdCls}>
        <span className="fsrc-check-cell fsrc-check-cell--readonly">
          <FormCheckGlyph checked={variant === choice} className="fsrc-check" />
        </span>
      </td>
    );
  }

  return (
    <td className={tdCls}>
      <label className="fsrc-check-cell">
        <input
          type="radio"
          className="fsrc-check-input"
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
  mode,
  readOnly,
  onChoice,
}: {
  rowId: string;
  rowValue: { choice: FsrcChoice | null };
  mode: FsrcRowDef['choiceMode'];
  readOnly?: boolean;
  onChoice: (choice: FsrcChoice | null) => void;
}) {
  const groupName = `fsrc-${rowId}`;

  if (mode === 'record-fields') {
    return <td colSpan={3} className="fsrc-td fsrc-td--choice-block" aria-hidden="true" />;
  }

  if (mode === 'yes-no-na-blocked') {
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
        <td className="fsrc-td fsrc-td--na-blocked" aria-hidden="true" />
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
    <div className="fsrc-info-row">
      <span className="fsrc-info-label">{label}</span>
      {readOnly ? (
        value.trim() ? (
          <span className="fsrc-info-value">{value}</span>
        ) : (
          <span className="fsrc-info-line" />
        )
      ) : (
        <input
          type="text"
          className="fsrc-info-input"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
        />
      )}
    </div>
  );
}

function RecordField({
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
    <div className="fsrc-record-row">
      <span className="fsrc-record-label">{label}</span>
      {readOnly ? (
        value.trim() ? (
          <span className="fsrc-info-value">{value}</span>
        ) : (
          <span className="fsrc-info-line" />
        )
      ) : (
        <input
          type="text"
          className="fsrc-info-input"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
        />
      )}
    </div>
  );
}

function DescCell({ row }: { row: FsrcRowDef }) {
  return <span className="fsrc-desc-text">{row.text}</span>;
}

function renderFsrcTableRows(
  data: FireSignalReceivingCentreInterconnectionValue,
  readOnly: boolean | undefined,
  emit: (next: FireSignalReceivingCentreInterconnectionValue) => void,
) {
  return FSRC_ROWS.flatMap((row, index) => {
    const alt = index % 2 === 1;

    if (row.subItems?.length) {
      return row.subItems.map((subItem, subIndex) => (
        <tr key={subItem.id} className={cn('fsrc-row', alt && 'fsrc-row--alt')}>
          {subIndex === 0 ? (
            <td rowSpan={row.subItems!.length} className="fsrc-td fsrc-td--letter">
              {row.letter}
            </td>
          ) : null}
          <td className="fsrc-td fsrc-td--desc">
            <span className="fsrc-desc-text">{subItem.text}</span>
          </td>
          <ChoiceCells
            rowId={subItem.id}
            rowValue={data.checklist[subItem.id] ?? { choice: null }}
            mode={row.choiceMode}
            readOnly={readOnly}
            onChoice={(choice) => emit(setFsrcChoice(data, subItem.id, choice))}
          />
        </tr>
      ));
    }

    const rowValue = data.checklist[row.id] ?? { choice: null };
    return (
      <tr key={row.id} className={cn('fsrc-row', alt && 'fsrc-row--alt')}>
        <td className="fsrc-td fsrc-td--letter">{row.letter}</td>
        <td className="fsrc-td fsrc-td--desc">
          <DescCell row={row} />
          {row.choiceMode === 'record-fields' ? (
            <div className="fsrc-record-fields">
              <RecordField
                label="Company:"
                value={data.recordFields.company}
                readOnly={readOnly}
                onChange={(next) => emit(setFsrcRecordField(data, 'company', next))}
              />
              <RecordField
                label="Address:"
                value={data.recordFields.address}
                readOnly={readOnly}
                onChange={(next) => emit(setFsrcRecordField(data, 'address', next))}
              />
              <RecordField
                label="Telephone:"
                value={data.recordFields.telephone}
                readOnly={readOnly}
                onChange={(next) => emit(setFsrcRecordField(data, 'telephone', next))}
              />
            </div>
          ) : null}
        </td>
        <ChoiceCells
          rowId={row.id}
          rowValue={rowValue}
          mode={row.choiceMode}
          readOnly={readOnly}
          onChoice={(choice) => emit(setFsrcChoice(data, row.id, choice))}
        />
      </tr>
    );
  });
}

export function FormFireSignalReceivingCentreInterconnectionView({
  value: rawValue,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (next: FireSignalReceivingCentreInterconnectionValue) => void;
}) {
  const data = normalizeFireSignalReceivingCentreInterconnectionValue(rawValue);

  const emit = (next: FireSignalReceivingCentreInterconnectionValue) => onChange?.(next);

  return (
    <div className="fsrc-panel">
      <div className="fsrc-na-bar">
        <span className="fsrc-na-text">{FSRC_NOT_APPLICABLE_TEXT}</span>
        {readOnly ? (
          <span className="fsrc-na-check-wrap">
            <FormCheckGlyph checked={data.sectionNotApplicable} className="fsrc-na-check" />
            <span className="fsrc-na-suffix">{FSRC_NOT_APPLICABLE_SUFFIX}</span>
          </span>
        ) : (
          <label className="fsrc-na-check-wrap">
            <input
              type="checkbox"
              className="fsrc-na-check-input"
              checked={data.sectionNotApplicable}
              onChange={(event) =>
                emit(setFsrcSectionNotApplicable(data, event.target.checked))
              }
            />
            <span className="fsrc-na-suffix">{FSRC_NOT_APPLICABLE_SUFFIX}</span>
          </label>
        )}
      </div>

      <div className="fsrc-header-strip">
        <div className="fsrc-ref-bar">{FSRC_REF}</div>
        <InfoRow
          label={FSRC_COMMUNICATOR_LOCATION_LABEL}
          value={data.communicatorLocation}
          readOnly={readOnly}
          onChange={(next) => emit(setFsrcCommunicatorLocation(data, next))}
        />
        <InfoRow
          label={FSRC_CIRCUIT_DISCONNECT_LOCATION_LABEL}
          value={data.circuitDisconnectMeansLocation}
          readOnly={readOnly}
          onChange={(next) => emit(setFsrcCircuitDisconnectMeansLocation(data, next))}
        />
        <InfoRow
          label={FSRC_CIRCUIT_PANEL_BREAKER_LABEL}
          value={data.circuitPanelBreakerIdentification}
          readOnly={readOnly}
          onChange={(next) => emit(setFsrcCircuitPanelBreakerIdentification(data, next))}
        />
      </div>

      <div className="fsrc-table-wrap">
        <table className="fsrc-table">
          <thead>
            <tr>
              <th className="fsrc-th fsrc-th--letter" aria-hidden="true" />
              <th className="fsrc-th fsrc-th--intro" aria-hidden="true" />
              <th className="fsrc-th fsrc-th--yes">Yes</th>
              <th className="fsrc-th fsrc-th--no">No</th>
              <th className="fsrc-th fsrc-th--na">N/A</th>
            </tr>
          </thead>
          <tbody>{renderFsrcTableRows(data, readOnly, emit)}</tbody>
        </table>
      </div>

      <p className="fsrc-footer-note">{FSRC_FOOTNOTE}</p>
    </div>
  );
}
