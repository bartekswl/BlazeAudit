import { type CSSProperties } from 'react';
import {
  ANCILLARY_DEVICE_CIRCUIT_TEST_BODY_ROW_HEIGHT,
  ANCILLARY_DEVICE_CIRCUIT_TEST_DATA_COLUMNS,
  ANCILLARY_DEVICE_CIRCUIT_TEST_FACU_HEADER,
  ANCILLARY_DEVICE_CIRCUIT_TEST_FOOTNOTE_FACU,
  ANCILLARY_DEVICE_CIRCUIT_TEST_FOOTNOTE_NOTE,
  ANCILLARY_DEVICE_CIRCUIT_TEST_IDENTIFY_HEADER,
  ANCILLARY_DEVICE_CIRCUIT_TEST_METHOD_HEADER,
  ANCILLARY_DEVICE_CIRCUIT_TEST_NO_HEADER,
  ANCILLARY_DEVICE_CIRCUIT_TEST_OPERATION_HEADER,
  ANCILLARY_DEVICE_CIRCUIT_TEST_OTHER_HEADER,
  ANCILLARY_DEVICE_CIRCUIT_TEST_POWERED_BY_HEADER,
  ANCILLARY_DEVICE_CIRCUIT_TEST_ROW_COUNT,
  ANCILLARY_DEVICE_CIRCUIT_TEST_YES_HEADER,
  normalizeAncillaryDeviceCircuitTestValue,
  setAncillaryDeviceCircuitConfirmationMethod,
  setAncillaryDeviceCircuitIdentify,
  setAncillaryDeviceCircuitOperationConfirmed,
  setAncillaryDeviceCircuitPoweredByFacu,
  setAncillaryDeviceCircuitPoweredByOther,
  type AncillaryDeviceCircuitOperationChoice,
  type AncillaryDeviceCircuitTestValue,
} from '../../../shared/form/ancillaryDeviceCircuitTest';
import { cn } from '../../lib/cn';
import { FormCheckGlyph } from './FormCheckGlyph';
import { handleFixedRowGridTextInputKeyDown } from './formGridTableKeyboard';

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
    return <span className="adc-cell-value">{value || '\u00a0'}</span>;
  }
  return (
    <input
      type="text"
      className="adc-cell-input"
      value={value}
      spellCheck={false}
      onChange={(e) => onChange?.(e.target.value)}
      onKeyDown={handleFixedRowGridTextInputKeyDown}
    />
  );
}

function OperationCell({
  choice,
  groupName,
  readOnly,
  variant,
  onSelect,
}: {
  choice: AncillaryDeviceCircuitOperationChoice | null;
  groupName: string;
  readOnly?: boolean;
  variant: AncillaryDeviceCircuitOperationChoice;
  onSelect: () => void;
}) {
  const tdCls = cn('adc-td', variant === 'yes' && 'adc-td--yes', variant === 'no' && 'adc-td--no');
  const label = variant === 'yes' ? 'Yes' : 'No';

  if (readOnly) {
    return (
      <td className={tdCls}>
        <span className="adc-check-cell adc-check-cell--readonly">
          <FormCheckGlyph checked={variant === choice} className="adc-check" />
        </span>
      </td>
    );
  }

  return (
    <td className={tdCls}>
      <label className="adc-check-cell">
        <input
          type="radio"
          className="adc-check-input"
          name={groupName}
          checked={choice === variant}
          onChange={onSelect}
        />
        <span className="sr-only">{label}</span>
      </label>
    </td>
  );
}

export function FormAncillaryDeviceCircuitTestView({
  value: rawValue,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (next: AncillaryDeviceCircuitTestValue) => void;
}) {
  const data = normalizeAncillaryDeviceCircuitTestValue(rawValue);

  const emit = (next: AncillaryDeviceCircuitTestValue) => onChange?.(next);

  return (
    <div
      className="adc-panel"
      style={
        {
          '--adc-body-row-height': ANCILLARY_DEVICE_CIRCUIT_TEST_BODY_ROW_HEIGHT,
        } as CSSProperties
      }
    >
      <div className="adc-table-wrap">
        <table
          className="adc-table"
          data-row-count={ANCILLARY_DEVICE_CIRCUIT_TEST_ROW_COUNT}
        >
          <colgroup>
            {ANCILLARY_DEVICE_CIRCUIT_TEST_DATA_COLUMNS.map((col) => (
              <col
                key={col.key}
                className={`adc-col adc-col--${col.key}`}
                style={{ width: `${col.widthPercent}%` }}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="adc-th adc-th--identify" rowSpan={2}>
                {ANCILLARY_DEVICE_CIRCUIT_TEST_IDENTIFY_HEADER}
              </th>
              <th className="adc-th adc-th--powered-group" colSpan={2}>
                {ANCILLARY_DEVICE_CIRCUIT_TEST_POWERED_BY_HEADER}
              </th>
              <th className="adc-th adc-th--operation-group" colSpan={3}>
                {ANCILLARY_DEVICE_CIRCUIT_TEST_OPERATION_HEADER}
              </th>
            </tr>
            <tr>
              <th className="adc-th adc-th--facu">{ANCILLARY_DEVICE_CIRCUIT_TEST_FACU_HEADER}</th>
              <th className="adc-th adc-th--other">{ANCILLARY_DEVICE_CIRCUIT_TEST_OTHER_HEADER}</th>
              <th className="adc-th adc-th--yes">{ANCILLARY_DEVICE_CIRCUIT_TEST_YES_HEADER}</th>
              <th className="adc-th adc-th--no">{ANCILLARY_DEVICE_CIRCUIT_TEST_NO_HEADER}</th>
              <th className="adc-th adc-th--method">{ANCILLARY_DEVICE_CIRCUIT_TEST_METHOD_HEADER}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="adc-row">
                <td className="adc-td adc-td--identify">
                  <TextCell
                    value={row.identify}
                    readOnly={readOnly}
                    onChange={(next) => emit(setAncillaryDeviceCircuitIdentify(data, rowIndex, next))}
                  />
                </td>
                <td className="adc-td adc-td--facu">
                  {readOnly ? (
                    <span className="adc-check-cell adc-check-cell--readonly">
                      <FormCheckGlyph checked={row.poweredByFacu} className="adc-check" />
                    </span>
                  ) : (
                    <label className="adc-check-cell">
                      <input
                        type="checkbox"
                        className="adc-check-input"
                        checked={row.poweredByFacu}
                        onChange={(event) =>
                          emit(
                            setAncillaryDeviceCircuitPoweredByFacu(
                              data,
                              rowIndex,
                              event.target.checked,
                            ),
                          )
                        }
                      />
                      <span className="sr-only">FACU</span>
                    </label>
                  )}
                </td>
                <td className="adc-td adc-td--other">
                  <TextCell
                    value={row.poweredByOther}
                    readOnly={readOnly}
                    onChange={(next) =>
                      emit(setAncillaryDeviceCircuitPoweredByOther(data, rowIndex, next))
                    }
                  />
                </td>
                <OperationCell
                  choice={row.operationConfirmed}
                  groupName={`adc-op-${rowIndex}`}
                  readOnly={readOnly}
                  variant="yes"
                  onSelect={() =>
                    emit(setAncillaryDeviceCircuitOperationConfirmed(data, rowIndex, 'yes'))
                  }
                />
                <OperationCell
                  choice={row.operationConfirmed}
                  groupName={`adc-op-${rowIndex}`}
                  readOnly={readOnly}
                  variant="no"
                  onSelect={() =>
                    emit(setAncillaryDeviceCircuitOperationConfirmed(data, rowIndex, 'no'))
                  }
                />
                <td className="adc-td adc-td--method">
                  <TextCell
                    value={row.confirmationMethod}
                    readOnly={readOnly}
                    onChange={(next) =>
                      emit(setAncillaryDeviceCircuitConfirmationMethod(data, rowIndex, next))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="adc-footnotes">
        <p className="adc-footnote">{ANCILLARY_DEVICE_CIRCUIT_TEST_FOOTNOTE_FACU}</p>
        <p className="adc-footnote">{ANCILLARY_DEVICE_CIRCUIT_TEST_FOOTNOTE_NOTE}</p>
      </div>
    </div>
  );
}
