import { type CSSProperties } from 'react';
import {
  CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_BODY_ROW_HEIGHT,
  CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_DATA_COLUMNS,
  CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW1,
  CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW2,
  CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_LEGEND,
  CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_ROW_COUNT,
  circuitFaultToleranceTestSheetChoiceSymbol,
  cycleCircuitFaultToleranceTestSheetChoice,
  normalizeCircuitFaultToleranceTestSheetValue,
  setCircuitFaultToleranceTestSheetChoice,
  setCircuitFaultToleranceTestSheetText,
  type CircuitFaultToleranceTestSheetChoice,
  type CircuitFaultToleranceTestSheetDataColumnKey,
  type CircuitFaultToleranceTestSheetValue,
} from '../../../shared/form/circuitFaultToleranceTestSheet';
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
    return <span className="cfts-cell-value">{value || '\u00a0'}</span>;
  }
  return (
    <VisibleWidthInput
      className="cfts-cell-input"
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
  choice: CircuitFaultToleranceTestSheetChoice | null;
  readOnly?: boolean;
  onChange?: (next: CircuitFaultToleranceTestSheetChoice | null) => void;
}) {
  const symbol = circuitFaultToleranceTestSheetChoiceSymbol(choice);

  if (readOnly) {
    if (!symbol) return <span className="cfts-choice-value">{'\u00a0'}</span>;
    return (
      <span
        className={cn(
          'cfts-choice-value',
          choice === 'pass' && 'cfts-choice-value--pass',
          choice === 'fail' && 'cfts-choice-value--fail',
          choice === 'na' && 'cfts-choice-value--na',
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
        'cfts-choice-cell',
        choice === 'pass' && 'cfts-choice-cell--pass',
        choice === 'fail' && 'cfts-choice-cell--fail',
        choice === 'na' && 'cfts-choice-cell--na',
      )}
      onClick={() => onChange?.(cycleCircuitFaultToleranceTestSheetChoice(choice))}
      aria-label={
        choice === 'pass'
          ? 'Pass — click to change'
          : choice === 'fail'
            ? 'Fail — click to change'
            : choice === 'na'
              ? 'Not applicable — click to change'
              : 'Empty — click to set Pass'
      }
    >
      {symbol || '\u00a0'}
    </button>
  );
}

export function FormCircuitFaultToleranceTestSheetView({
  value: rawValue,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (value: CircuitFaultToleranceTestSheetValue) => void;
}) {
  const data = normalizeCircuitFaultToleranceTestSheetValue(rawValue);

  const setText = (
    rowIndex: number,
    key: Exclude<CircuitFaultToleranceTestSheetDataColumnKey, 'passOrFail'>,
    next: string,
  ) => {
    onChange?.(setCircuitFaultToleranceTestSheetText(data, rowIndex, key, next));
  };

  const textKeys = new Set<Exclude<CircuitFaultToleranceTestSheetDataColumnKey, 'passOrFail'>>([
    'circuitFaultTestLocation',
    'short',
    'open',
    'ground',
    'isolationResults',
    'nonFaultedDeviceLocation',
  ]);

  return (
    <div
      className="cfts-panel"
      style={
        {
          '--cfts-row-count': String(CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_ROW_COUNT),
          '--cfts-body-row-height': CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_BODY_ROW_HEIGHT,
        } as CSSProperties
      }
    >
      <div className="cfts-legend">
        {CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_LEGEND.map((item) => (
          <span key={item.tone} className={cn('cfts-legend-item', `cfts-legend-item--${item.tone}`)}>
            <span className="cfts-legend-symbol">&quot;{item.legendSymbol}&quot;</span> {item.label}
          </span>
        ))}
      </div>

      <div className="cfts-table-wrap">
        <table
          className="cfts-table"
          data-row-count={CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_ROW_COUNT}
        >
          <colgroup>
            {CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_DATA_COLUMNS.map((col) => (
              <col
                key={col.key}
                className={`cfts-col cfts-col--${col.key}`}
                style={{ width: `${col.widthPercent}%` }}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="cfts-th cfts-th--banner cfts-th--location">
                {CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW1.location}
              </th>
              <th className="cfts-th cfts-th--banner cfts-th--fault-group" colSpan={3}>
                {CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW1.faultGroup}
              </th>
              <th className="cfts-th cfts-th--banner cfts-th--isolation">
                {CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW1.isolation}
              </th>
              <th className="cfts-th cfts-th--banner cfts-th--non-faulted-group" colSpan={2}>
                {CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW1.nonFaultedGroup}
              </th>
            </tr>
            <tr>
              <th className="cfts-th cfts-th--sub cfts-th--location-detail">
                {CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW2.location}
              </th>
              <th className="cfts-th cfts-th--sub cfts-th--short">
                {CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW2.short}
              </th>
              <th className="cfts-th cfts-th--sub cfts-th--open">
                {CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW2.open}
              </th>
              <th className="cfts-th cfts-th--sub cfts-th--ground">
                {CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW2.ground}
              </th>
              <th className="cfts-th cfts-th--sub cfts-th--isolation-detail">
                {CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW2.isolation}
              </th>
              <th className="cfts-th cfts-th--sub cfts-th--non-faulted-device">
                {CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW2.nonFaultedDevice}
              </th>
              <th className="cfts-th cfts-th--sub cfts-th--pass-fail">
                {CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW2.passOrFail}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={cn('cfts-row', rowIndex % 2 === 1 && 'cfts-row--alt')}>
                {CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_DATA_COLUMNS.map((col) => (
                  <td key={col.key} className={cn('cfts-td', `cfts-td--${col.key}`)}>
                    {col.key === 'passOrFail' ? (
                      <ChoiceCell
                        choice={row.passOrFail}
                        readOnly={readOnly}
                        onChange={(next) =>
                          onChange?.(setCircuitFaultToleranceTestSheetChoice(data, rowIndex, next))
                        }
                      />
                    ) : textKeys.has(
                        col.key as Exclude<CircuitFaultToleranceTestSheetDataColumnKey, 'passOrFail'>,
                      ) ? (
                      <TextCell
                        value={row[col.key]}
                        readOnly={readOnly}
                        onChange={(next) =>
                          setText(
                            rowIndex,
                            col.key as Exclude<
                              CircuitFaultToleranceTestSheetDataColumnKey,
                              'passOrFail'
                            >,
                            next,
                          )
                        }
                      />
                    ) : null}
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
