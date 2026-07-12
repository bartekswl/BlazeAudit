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
  choice: PrinterTestChoice | null;
  groupName: string;
  readOnly?: boolean;
  variant: PrinterTestChoice;
  onSelect: () => void;
  onClear: () => void;
}) {
  const tdCls = cn(
    'prt-td',
    variant === 'yes' && 'prt-td--yes',
    variant === 'no' && 'prt-td--no',
    variant === 'na' && 'prt-td--na',
  );
  const label = variant === 'yes' ? 'Yes' : variant === 'no' ? 'No' : 'N/A';

  if (readOnly) {
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
  rowValue: { choice: PrinterTestChoice | null };
  readOnly?: boolean;
  onChoice: (choice: PrinterTestChoice | null) => void;
}) {
  const groupName = `prt-${rowId}`;

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
    <div className="prt-info-row">
      <span className="prt-info-label">{label}</span>
      {readOnly ? (
        value.trim() ? (
          <span className="prt-info-value">{value}</span>
        ) : (
          <span className="prt-info-line" />
        )
      ) : (
        <VisibleWidthInput
          className="prt-info-input"
          value={value}
          onChange={(next) => onChange?.(next)}
        />
      )}
    </div>
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

      <div className="prt-header-strip">
        <div className="prt-ref-bar">{PRINTER_TEST_REF}</div>
        <InfoRow
          label={PRINTER_TEST_LOCATION_LABEL}
          value={data.fieldLocation}
          readOnly={readOnly}
          onChange={(next) => emit(setPrinterTestFieldLocation(data, next))}
        />
        <InfoRow
          label={PRINTER_TEST_IDENTIFICATION_LABEL}
          value={data.identification}
          readOnly={readOnly}
          onChange={(next) => emit(setPrinterTestIdentification(data, next))}
        />
      </div>

      <div className="prt-table-wrap">
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
