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
import { cn } from '../../lib/cn';
import { FormCheckGlyph } from './FormCheckGlyph';

function ChoiceCell({
  choice,
  groupName,
  readOnly,
  variant,
  onSelect,
}: {
  choice: DclftChoice | null;
  groupName: string;
  readOnly?: boolean;
  variant: DclftChoice;
  onSelect: () => void;
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
          checked={choice === variant}
          onChange={onSelect}
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
  blockId,
  block,
  readOnly,
  onEmit,
}: {
  blockId: DclftBlockId;
  block: DclftBlockValue;
  readOnly?: boolean;
  onEmit: (
    updater: (
      current: DataCommunicationLinkFaultToleranceValue,
    ) => DataCommunicationLinkFaultToleranceValue,
  ) => void;
}) {
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
              <th className="dclft-th dclft-th--yes">Yes</th>
              <th className="dclft-th dclft-th--no">No</th>
              <th className="dclft-th dclft-th--na">N/A</th>
            </tr>
          </thead>
          <tbody>
            {DCLFT_ROWS.map((row, index) => {
              const rowValue = block.checklist[row.id] ?? { choice: null };
              const groupName = `dclft-${blockId}-${row.id}`;
              return (
                <tr key={row.id} className={cn('dclft-row', index % 2 === 1 && 'dclft-row--alt')}>
                  <td className="dclft-td dclft-td--letter">{row.letter}</td>
                  <td className="dclft-td dclft-td--desc">
                    <span className="dclft-desc-text">{row.text}</span>
                  </td>
                  <ChoiceCell
                    choice={rowValue.choice}
                    groupName={groupName}
                    readOnly={readOnly}
                    variant="yes"
                    onSelect={() =>
                      onEmit((value) => setDclftChoice(value, blockId, row.id, 'yes'))
                    }
                  />
                  <ChoiceCell
                    choice={rowValue.choice}
                    groupName={groupName}
                    readOnly={readOnly}
                    variant="no"
                    onSelect={() =>
                      onEmit((value) => setDclftChoice(value, blockId, row.id, 'no'))
                    }
                  />
                  <ChoiceCell
                    choice={rowValue.choice}
                    groupName={groupName}
                    readOnly={readOnly}
                    variant="na"
                    onSelect={() =>
                      onEmit((value) => setDclftChoice(value, blockId, row.id, 'na'))
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

export function FormDataCommunicationLinkFaultToleranceView({
  value: rawValue,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (next: DataCommunicationLinkFaultToleranceValue) => void;
}) {
  const value = normalizeDataCommunicationLinkFaultToleranceValue(rawValue);
  const emit = (
    updater: (current: DataCommunicationLinkFaultToleranceValue) => DataCommunicationLinkFaultToleranceValue,
  ) => onChange?.(updater(value));

  return (
    <div className="dclft-stack">
      <DclftPanel
        blockId="primary"
        block={value.primary}
        readOnly={readOnly}
        onEmit={emit}
      />
      <DclftPanel
        blockId="additional"
        block={value.additional}
        readOnly={readOnly}
        onEmit={emit}
      />
    </div>
  );
}
