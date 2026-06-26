import { type CSSProperties } from 'react';
import {
  cycleIndividualDeviceRecordChoice,
  INDIVIDUAL_DEVICE_RECORD_BODY_ROW_HEIGHT,
  INDIVIDUAL_DEVICE_RECORD_COLUMNS,
  INDIVIDUAL_DEVICE_RECORD_LEGEND,
  INDIVIDUAL_DEVICE_RECORD_ROW_COUNT,
  individualDeviceRecordChoiceSymbol,
  normalizeIndividualDeviceRecordValue,
  setIndividualDeviceRecordChoice,
  setIndividualDeviceRecordText,
  type IndividualDeviceRecordChoice,
  type IndividualDeviceRecordRow,
  type IndividualDeviceRecordValue,
} from '../../../shared/form/individualDeviceRecord';
import { cn } from '../../lib/cn';
import { handleFixedRowGridTextInputKeyDown } from './formGridTableKeyboard';
import { VisibleWidthInput } from './VisibleWidthInput';

function TextCell({
  value,
  readOnly,
  onChange,
}: {
  value: string;
  readOnly?: boolean;
  onChange?: (next: string) => void;
}) {
  if (readOnly) {
    return <span className="idr-cell-value">{value || '\u00a0'}</span>;
  }
  return (
    <VisibleWidthInput
      className="idr-cell-input"
      value={value}
      onChange={(next) => onChange?.(next)}
      onKeyDown={handleFixedRowGridTextInputKeyDown}
    />
  );
}

function ChoiceCell({
  choice,
  readOnly,
  onChange,
}: {
  choice: IndividualDeviceRecordChoice | null;
  readOnly?: boolean;
  onChange?: (next: IndividualDeviceRecordChoice | null) => void;
}) {
  const symbol = individualDeviceRecordChoiceSymbol(choice);

  if (readOnly) {
    if (!symbol) return <span className="idr-choice-value">{'\u00a0'}</span>;
    return (
      <span
        className={cn(
          'idr-choice-value',
          choice === 'yes' && 'idr-choice-value--yes',
          choice === 'no' && 'idr-choice-value--no',
          choice === 'na' && 'idr-choice-value--na',
        )}
      >
        {symbol}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        'idr-choice-cell',
        choice === 'yes' && 'idr-choice-cell--yes',
        choice === 'no' && 'idr-choice-cell--no',
        choice === 'na' && 'idr-choice-cell--na',
      )}
      onClick={() => onChange?.(cycleIndividualDeviceRecordChoice(choice))}
      aria-label={
        choice === 'yes'
          ? 'Yes — click to change'
          : choice === 'no'
            ? 'No — click to change'
            : choice === 'na'
              ? 'Not applicable — click to change'
              : 'Empty — click to set Yes'
      }
    >
      {symbol || '\u00a0'}
    </button>
  );
}

export function FormIndividualDeviceRecordView({
  value: rawValue,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (value: IndividualDeviceRecordValue) => void;
}) {
  const data = normalizeIndividualDeviceRecordValue(rawValue);

  const setText = (rowIndex: number, key: keyof IndividualDeviceRecordRow, next: string) => {
    onChange?.(setIndividualDeviceRecordText(data, rowIndex, key, next));
  };

  const setChoice = (
    rowIndex: number,
    key: keyof IndividualDeviceRecordRow,
    next: IndividualDeviceRecordChoice | null,
  ) => {
    onChange?.(setIndividualDeviceRecordChoice(data, rowIndex, key, next));
  };

  return (
    <div
      className="idr-panel"
      style={
        {
          '--idr-row-count': String(INDIVIDUAL_DEVICE_RECORD_ROW_COUNT),
          '--idr-body-row-height': INDIVIDUAL_DEVICE_RECORD_BODY_ROW_HEIGHT,
        } as CSSProperties
      }
    >
      <div className="idr-legend">
        {INDIVIDUAL_DEVICE_RECORD_LEGEND.map((item) => (
          <span key={item.tone} className={cn('idr-legend-item', `idr-legend-item--${item.tone}`)}>
            <span className="idr-legend-symbol">&quot;{item.legendSymbol}&quot;</span> {item.label}
          </span>
        ))}
      </div>

      <div className="idr-table-wrap">
        <table className="idr-table" data-row-count={INDIVIDUAL_DEVICE_RECORD_ROW_COUNT}>
          <colgroup>
            {INDIVIDUAL_DEVICE_RECORD_COLUMNS.map((col) => (
              <col
                key={col.key}
                className={`idr-col idr-col--${col.key}`}
                style={{ width: `${col.widthPercent}%` }}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              {INDIVIDUAL_DEVICE_RECORD_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'idr-th',
                    `idr-th--${col.key}`,
                    col.orientation === 'vertical' ? 'idr-th--vertical' : 'idr-th--horizontal',
                  )}
                  style={{ width: `${col.widthPercent}%` }}
                >
                  <span className="idr-th-text">{col.title}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={cn('idr-row', rowIndex % 2 === 1 && 'idr-row--alt')}>
                {INDIVIDUAL_DEVICE_RECORD_COLUMNS.map((col) => (
                  <td key={col.key} className={cn('idr-td', `idr-td--${col.key}`)}>
                    {col.kind === 'choice' ? (
                      <ChoiceCell
                        choice={row[col.key] as IndividualDeviceRecordChoice | null}
                        readOnly={readOnly}
                        onChange={(next) => setChoice(rowIndex, col.key, next)}
                      />
                    ) : (
                      <TextCell
                        value={row[col.key] as string}
                        readOnly={readOnly}
                        onChange={(next) => setText(rowIndex, col.key, next)}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
