import { type CSSProperties } from 'react';
import {
  ATTENDANCE_LOG_COLUMNS,
  ATTENDANCE_LOG_ROW_COUNT,
  normalizeAttendanceLogValue,
  setAttendanceLogCell,
  type AttendanceLogColumnKey,
  type AttendanceLogValue,
} from '../../../shared/form/attendanceLog';
import { cn } from '../../lib/cn';

function AttendanceCell({
  value,
  readOnly,
  onChange,
}: {
  value: string;
  readOnly?: boolean;
  onChange?: (next: string) => void;
}) {
  if (readOnly) {
    return <span className="att-cell-value">{value || '\u00a0'}</span>;
  }
  return (
    <input
      type="text"
      className="att-cell-input"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}

export function FormAttendanceLogView({
  value: rawValue,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (value: AttendanceLogValue) => void;
}) {
  const data = normalizeAttendanceLogValue(rawValue);

  const setCell = (rowIndex: number, columnKey: AttendanceLogColumnKey, next: string) => {
    onChange?.(setAttendanceLogCell(data, rowIndex, columnKey, next));
  };

  return (
    <div
      className="att-table-wrap"
      style={{ '--att-row-count': String(ATTENDANCE_LOG_ROW_COUNT) } as CSSProperties}
    >
      <div className="att-accent-bar" aria-hidden="true" />
      <table className="att-table">
        <thead>
          <tr>
            {ATTENDANCE_LOG_COLUMNS.map((col) => (
              <th
                key={col.key}
                className={cn('att-th', col.align === 'center' && 'att-th--center')}
                style={{ width: `${col.widthPercent}%` }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="att-row">
              {ATTENDANCE_LOG_COLUMNS.map((col) => (
                <td key={col.key} className={cn('att-td', col.align === 'center' && 'att-td--center')}>
                  <AttendanceCell
                    value={row[col.key]}
                    readOnly={readOnly}
                    onChange={(next) => setCell(rowIndex, col.key, next)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
