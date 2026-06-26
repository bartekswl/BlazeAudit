import {
  PRINTER_TEST_IDENTIFICATION_LABEL,
  PRINTER_TEST_LOCATION_LABEL,
  PRINTER_TEST_NOT_APPLICABLE_SUFFIX,
  PRINTER_TEST_NOT_APPLICABLE_TEXT,
  PRINTER_TEST_REF,
  PRINTER_TEST_ROWS,
  normalizePrinterTestValue,
  setPrinterTestChoice,
  setPrinterTestFieldLocation,
  setPrinterTestIdentification,
  setPrinterTestSectionNotApplicable,
  type PrinterTestChoice,
  type PrinterTestValue,
} from '../../../shared/form/printerTest';
import { cn } from '../../lib/cn';
import { FormCheckGlyph } from './FormCheckGlyph';

function ChoiceCell({
  choice,
  groupName,
  readOnly,
  variant,
  disabled,
  onSelect,
}: {
  choice: PrinterTestChoice | null;
  groupName: string;
  readOnly?: boolean;
  variant: PrinterTestChoice;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const tdCls = cn(
    'prt-td',
    variant === 'yes' && 'prt-td--yes',
    variant === 'no' && 'prt-td--no',
    variant === 'na' && 'prt-td--na',
    disabled && 'prt-td--disabled',
  );
  const label = variant === 'yes' ? 'Yes' : variant === 'no' ? 'No' : 'N/A';

  if (readOnly || disabled) {
    return (
      <td className={tdCls}>
        <span className="prt-check-cell prt-check-cell--readonly">
          <FormCheckGlyph checked={variant === choice} className="prt-check" />
        </span>
      </td>
    );
  }

  return (
    <td className={tdCls}>
      <label className="prt-check-cell">
        <input
          type="radio"
          className="prt-check-input"
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
  disabled,
  onChoice,
}: {
  rowId: string;
  rowValue: { choice: PrinterTestChoice | null };
  readOnly?: boolean;
  disabled?: boolean;
  onChoice: (choice: PrinterTestChoice) => void;
}) {
  const groupName = `prt-${rowId}`;

  return (
    <>
      <ChoiceCell
        choice={rowValue.choice}
        groupName={groupName}
        readOnly={readOnly}
        disabled={disabled}
        variant="yes"
        onSelect={() => onChoice('yes')}
      />
      <ChoiceCell
        choice={rowValue.choice}
        groupName={groupName}
        readOnly={readOnly}
        disabled={disabled}
        variant="no"
        onSelect={() => onChoice('no')}
      />
      <ChoiceCell
        choice={rowValue.choice}
        groupName={groupName}
        readOnly={readOnly}
        disabled={disabled}
        variant="na"
        onSelect={() => onChoice('na')}
      />
    </>
  );
}

export function FormPrinterTestView({
  value,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (next: PrinterTestValue) => void;
}) {
  const data = normalizePrinterTestValue(value);
  const disabled = data.sectionNotApplicable;

  const emit = (next: PrinterTestValue) => onChange?.(next);

  return (
    <div className="prt-panel">
      <div className="prt-na-bar">
        <span className="prt-na-text">{PRINTER_TEST_NOT_APPLICABLE_TEXT}</span>
        {readOnly ? (
          <span className="prt-na-check-wrap">
            <FormCheckGlyph checked={data.sectionNotApplicable} className="prt-na-check" />
            <span className="prt-na-suffix">{PRINTER_TEST_NOT_APPLICABLE_SUFFIX}</span>
          </span>
        ) : (
          <label className="prt-na-check-wrap">
            <input
              type="checkbox"
              className="prt-na-check-input"
              checked={data.sectionNotApplicable}
              onChange={(event) =>
                emit(setPrinterTestSectionNotApplicable(data, event.target.checked))
              }
            />
            <span className="prt-na-suffix">{PRINTER_TEST_NOT_APPLICABLE_SUFFIX}</span>
          </label>
        )}
      </div>

      <div className={cn('prt-header-strip', disabled && 'prt-header-strip--disabled')}>
        <div className="prt-ref-bar">{PRINTER_TEST_REF}</div>
        <div className="prt-info-row">
          <span className="prt-info-label">{PRINTER_TEST_LOCATION_LABEL}</span>
          {readOnly || disabled ? (
            data.fieldLocation.trim() ? (
              <span className="prt-info-value">{data.fieldLocation}</span>
            ) : (
              <span className="prt-info-line" />
            )
          ) : (
            <input
              type="text"
              className="prt-info-input"
              value={data.fieldLocation}
              onChange={(event) => emit(setPrinterTestFieldLocation(data, event.target.value))}
            />
          )}
        </div>
        <div className="prt-info-row">
          <span className="prt-info-label">{PRINTER_TEST_IDENTIFICATION_LABEL}</span>
          {readOnly || disabled ? (
            data.identification.trim() ? (
              <span className="prt-info-value">{data.identification}</span>
            ) : (
              <span className="prt-info-line" />
            )
          ) : (
            <input
              type="text"
              className="prt-info-input"
              value={data.identification}
              onChange={(event) => emit(setPrinterTestIdentification(data, event.target.value))}
            />
          )}
        </div>
      </div>

      <div className={cn('prt-table-wrap', disabled && 'prt-table-wrap--disabled')}>
        <table className="prt-table">
          <thead>
            <tr>
              <th className="prt-th prt-th--letter" aria-hidden="true" />
              <th className="prt-th prt-th--intro" aria-hidden="true" />
              <th className="prt-th prt-th--yes">Yes</th>
              <th className="prt-th prt-th--no">No</th>
              <th className="prt-th prt-th--na">N/A</th>
            </tr>
          </thead>
          <tbody>
            {PRINTER_TEST_ROWS.map((row, index) => {
              const rowValue = data.checklist[row.id] ?? { choice: null };
              return (
                <tr key={row.id} className={cn('prt-row', index % 2 === 1 && 'prt-row--alt')}>
                  <td className="prt-td prt-td--letter">{row.letter}</td>
                  <td className="prt-td prt-td--desc">
                    <span className="prt-desc-text">{row.text}</span>
                  </td>
                  <ChoiceCells
                    rowId={row.id}
                    rowValue={rowValue}
                    readOnly={readOnly}
                    disabled={disabled}
                    onChoice={(choice) => emit(setPrinterTestChoice(data, row.id, choice))}
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
