import { type CSSProperties } from 'react';
import {
  cycleReportGridChoice,
  setReportGridChoiceCell,
  setReportGridTextCell,
  type ReportGridChoice,
  type ReportGridColumnDef,
  type ReportGridValue,
} from '../../../shared/form/reportRecordGrid';
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
    return <span className="rrg-cell-value">{value || '\u00a0'}</span>;
  }
  return (
    <VisibleWidthInput
      className="rrg-cell-input"
      value={value}
      onChange={(next) => onChange?.(next)}
      onKeyDown={handleFixedRowGridTextInputKeyDown}
    />
  );
}

function ChoiceCell({
  value,
  readOnly,
  onCycle,
}: {
  value: ReportGridChoice;
  readOnly?: boolean;
  onCycle?: () => void;
}) {
  const label = value === 'yes' ? 'Y' : value === 'no' ? 'N' : '';
  const className = cn(
    'rrg-choice',
    value === 'yes' && 'rrg-choice--yes',
    value === 'no' && 'rrg-choice--no',
    !value && 'rrg-choice--blank',
  );
  if (readOnly) {
    return <span className={className}>{label || '\u00a0'}</span>;
  }
  return (
    <button
      type="button"
      className={cn(className, 'rrg-choice-btn')}
      onClick={onCycle}
      title="Cycle: blank → Yes → No"
    >
      {label || '\u00a0'}
    </button>
  );
}

export function FormReportRecordGridView({
  columns,
  value,
  readOnly,
  onChange,
  panelClassName = 'rrg-panel',
  rowCountVar = '--rrg-row-count',
}: {
  columns: readonly ReportGridColumnDef[];
  value: ReportGridValue;
  readOnly?: boolean;
  onChange?: (value: ReportGridValue) => void;
  panelClassName?: string;
  rowCountVar?: string;
}) {
  return (
    <div
      className={panelClassName}
      style={{ [rowCountVar]: String(value.rows.length) } as CSSProperties}
    >
      <div className="rrg-accent-bar" aria-hidden="true" />
      <table className="rrg-table" data-row-count={value.rows.length}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'rrg-th',
                  col.orientation === 'vertical' && 'rrg-th--vertical',
                  col.kind === 'choice' && 'rrg-th--choice',
                )}
                style={{ width: `${col.widthPercent}%` }}
              >
                <span className="rrg-th-label">{col.title}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {value.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="rrg-row">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn('rrg-td', col.kind === 'choice' && 'rrg-td--choice')}
                >
                  {col.kind === 'choice' ? (
                    <ChoiceCell
                      value={(row[col.key] as ReportGridChoice) ?? null}
                      readOnly={readOnly}
                      onCycle={() => {
                        const current = (row[col.key] as ReportGridChoice) ?? null;
                        onChange?.(
                          setReportGridChoiceCell(
                            value,
                            rowIndex,
                            col.key,
                            cycleReportGridChoice(current),
                          ),
                        );
                      }}
                    />
                  ) : (
                    <TextCell
                      value={typeof row[col.key] === 'string' ? (row[col.key] as string) : ''}
                      readOnly={readOnly}
                      onChange={(next) =>
                        onChange?.(setReportGridTextCell(value, rowIndex, col.key, next))
                      }
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
