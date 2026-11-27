import {
  DCLFT_CONTROL_UNIT_IDENTIFICATION_LABEL,
  DCLFT_CONTROL_UNIT_LOCATION_LABEL,
  DCLFT_DCL_CIRCUIT_IDENTIFICATION_LABEL,
  DCLFT_NOT_APPLICABLE_SUFFIX,
  DCLFT_REF,
  DCLFT_ROWS,
  dclftNotApplicableText,
  normalizeDataCommunicationLinkFaultToleranceValue,
  setDclftChoice,
  setDclftControlUnitIdentification,
  setDclftControlUnitLocation,
  setDclftDclCircuitIdentification,
  setDclftSectionNotApplicable,
  type DataCommunicationLinkFaultToleranceValue,
  type DclftBlockId,
  type DclftBlockValue,
  type DclftChoice,
} from '../../../shared/form/dataCommunicationLinkFaultTolerance';
import { nextRadioColumnChoice } from '../../../shared/form/columnChoiceFill';
import { cn } from '../../lib/cn';
import { ChoiceColumnHeader } from './ChoiceColumnHeader';
import { checklistLineClearIds } from '../../../shared/form/formLineSelect';
import { isLogicalTemplateLineCollapsed, mergeElementValuePatch } from '../../../shared/form/rowTextOverrides';
import { EditableRowLetter, EditableRowText } from './EditableRowText';
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
  choice: DclftChoice | null;
  groupName: string;
  readOnly?: boolean;
  variant: DclftChoice;
  onSelect: () => void;
  onClear: () => void;
}) {
  const tdCls = cn(
    'dclft-td',
    variant === 'yes' && 'dclft-td--yes',
    variant === 'no' && 'dclft-td--no',
    variant === 'na' && 'dclft-td--na',
  );
  const label = variant === 'yes' ? 'Yes' : variant === 'no' ? 'No' : 'N/A';

  if (readOnly) {
    return (
      <td className={tdCls}>
        <span className="dclft-check-cell dclft-check-cell--readonly">
          <FormCheckGlyph checked={variant === choice} className="dclft-check" />
        </span>
      </td>
    );
  }

  return (
    <td className={tdCls}>
      <label className="dclft-check-cell">
        <input
          type="radio"
          className="dclft-check-input"
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
    <div className="dclft-info-row">
      <span className="dclft-info-label">{label}</span>
      {readOnly ? (
        value.trim() ? (
          <span className="dclft-info-value">{value}</span>
        ) : (
          <span className="dclft-info-line" />
        )
      ) : (
        <input
          type="text"
          className="dclft-info-input"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
        />
      )}
    </div>
  );
}

function DclftPanel({
  elementId,
  blockId,
  block,
  documentValue,
  readOnly,
  onEmit,
}: {
  elementId: string;
  blockId: DclftBlockId;
  block: DclftBlockValue;
  documentValue: unknown;
  readOnly?: boolean;
  onEmit: (
    updater: (
      current: DataCommunicationLinkFaultToleranceValue,
    ) => DataCommunicationLinkFaultToleranceValue,
  ) => void;
}) {
  const applyColumn = (variant: DclftChoice) => {
    const ids = DCLFT_ROWS.map((row) => row.id);
    const values = ids.map((id) => block.checklist[id]?.choice ?? null);
    const next = nextRadioColumnChoice(values, variant);
    onEmit((value) => {
      let nextValue = value;
      for (const id of ids) {
        nextValue = setDclftChoice(nextValue, blockId, id, next);
      }
      return nextValue;
    });
  };

  return (
    <div className="dclft-panel">
      <div className="dclft-na-bar">
        <span className="dclft-na-text">{dclftNotApplicableText(blockId)}</span>
        {readOnly ? (
          <span className="dclft-na-check-wrap">
            <FormCheckGlyph checked={block.sectionNotApplicable} className="dclft-na-check" />
            <span className="dclft-na-suffix">{DCLFT_NOT_APPLICABLE_SUFFIX}</span>
          </span>
        ) : (
          <label className="dclft-na-check-wrap">
            <input
              type="checkbox"
              className="dclft-na-check-input"
              checked={block.sectionNotApplicable}
              onChange={(event) =>
                onEmit((value) => setDclftSectionNotApplicable(value, blockId, event.target.checked))
              }
            />
            <span className="dclft-na-suffix">{DCLFT_NOT_APPLICABLE_SUFFIX}</span>
          </label>
        )}
      </div>

      <div className="dclft-header-strip">
        <div className="dclft-ref-bar">{DCLFT_REF}</div>
        <InfoRow
          label={DCLFT_CONTROL_UNIT_LOCATION_LABEL}
          value={block.controlUnitLocation}
          readOnly={readOnly}
          onChange={(next) =>
            onEmit((value) => setDclftControlUnitLocation(value, blockId, next))
          }
        />
        <InfoRow
          label={DCLFT_CONTROL_UNIT_IDENTIFICATION_LABEL}
          value={block.controlUnitIdentification}
          readOnly={readOnly}
          onChange={(next) =>
            onEmit((value) => setDclftControlUnitIdentification(value, blockId, next))
          }
        />
        <InfoRow
          label={DCLFT_DCL_CIRCUIT_IDENTIFICATION_LABEL}
          value={block.dclCircuitIdentification}
          readOnly={readOnly}
          onChange={(next) =>
            onEmit((value) => setDclftDclCircuitIdentification(value, blockId, next))
          }
        />
      </div>

      <div className="dclft-table-wrap">
        <table className="dclft-table">
          <thead>
            <tr>
              <th className="dclft-th dclft-th--letter" aria-hidden="true" />
              <th className="dclft-th dclft-th--intro" aria-hidden="true" />
              <ChoiceColumnHeader
                className="dclft-th dclft-th--yes"
                readOnly={readOnly}
                applyLabel="Set all rows to Yes"
                onApply={() => applyColumn('yes')}
              >
                Yes
              </ChoiceColumnHeader>
              <ChoiceColumnHeader
                className="dclft-th dclft-th--no"
                readOnly={readOnly}
                applyLabel="Set all rows to No"
                onApply={() => applyColumn('no')}
              >
                No
              </ChoiceColumnHeader>
              <ChoiceColumnHeader
                className="dclft-th dclft-th--na"
                readOnly={readOnly}
                applyLabel="Set all rows to N/A"
                onApply={() => applyColumn('na')}
              >
                N/A
              </ChoiceColumnHeader>
            </tr>
          </thead>
          <tbody>
            {DCLFT_ROWS.map((row, index) => {
              const lineId = `${blockId}.${row.id}`;
              if (isLogicalTemplateLineCollapsed(documentValue, lineId)) return null;
              const rowValue = block.checklist[row.id] ?? { choice: null };
              const groupName = `dclft-${elementId}-${blockId}-${row.id}`;
              return (
                <tr
                  key={row.id}
                  className={cn('dclft-row', index % 2 === 1 && 'dclft-row--alt')}
                  data-ba-line-row=""
                  data-ba-line-row-hide={`${blockId}.${row.id}`}
                  data-ba-line-row-clear={checklistLineClearIds(`${blockId}.${row.id}`)}
                >
                  <td className="dclft-td dclft-td--letter">
                    <EditableRowLetter
                      rowId={`${blockId}.${row.id}`}
                      letter={row.letter}
                      className="dclft-letter-text"
                    />
                  </td>
                  <td className="dclft-td dclft-td--desc">
                    <EditableRowText
                      rowId={`${blockId}.${row.id}`}
                      text={row.text}
                      className="dclft-desc-text"
                    />
                  </td>
                  <ChoiceCell
                    choice={rowValue.choice}
                    groupName={groupName}
                    readOnly={readOnly}
                    variant="yes"
                    onSelect={() =>
                      onEmit((value) => setDclftChoice(value, blockId, row.id, 'yes'))
                    }
        onClear={() => onEmit((value) => setDclftChoice(value, blockId, row.id, null))}
                  />
                  <ChoiceCell
                    choice={rowValue.choice}
                    groupName={groupName}
                    readOnly={readOnly}
                    variant="no"
                    onSelect={() =>
                      onEmit((value) => setDclftChoice(value, blockId, row.id, 'no'))
                    }
        onClear={() => onEmit((value) => setDclftChoice(value, blockId, row.id, null))}
                  />
                  <ChoiceCell
                    choice={rowValue.choice}
                    groupName={groupName}
                    readOnly={readOnly}
                    variant="na"
                    onSelect={() =>
                      onEmit((value) => setDclftChoice(value, blockId, row.id, 'na'))
                    }
        onClear={() => onEmit((value) => setDclftChoice(value, blockId, row.id, null))}
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

export function FormDataCommunicationLinkFaultToleranceView({
  elementId,
  value: rawValue,
  readOnly,
  onChange,
}: {
  elementId: string;
  value: unknown;
  readOnly?: boolean;
  onChange?: (next: unknown) => void;
}) {
  const value = normalizeDataCommunicationLinkFaultToleranceValue(rawValue);
  const emit = (
    updater: (current: DataCommunicationLinkFaultToleranceValue) => DataCommunicationLinkFaultToleranceValue,
  ) => {
    const next = updater(value);
    onChange?.(mergeElementValuePatch(rawValue, next));
  };

  return (
    <div className="dclft-stack">
      <DclftPanel
        elementId={elementId}
        blockId="primary"
        block={value.primary}
        documentValue={rawValue}
        readOnly={readOnly}
        onEmit={emit}
      />
      <DclftPanel
        elementId={elementId}
        blockId="additional"
        block={value.additional}
        documentValue={rawValue}
        readOnly={readOnly}
        onEmit={emit}
      />
    </div>
  );
}
