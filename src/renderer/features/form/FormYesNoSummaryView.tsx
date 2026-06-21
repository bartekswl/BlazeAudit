import type { YesNoSummaryItem, YesNoSummaryItemValue, YesNoSummaryValue } from '../../../shared/form/types';
import {
  normalizeYesNoSummaryValue,
  setYesNoSummaryChoice,
  setYesNoSummaryFillIn,
} from '../../../shared/form/yesNoSummary';

function checkMark(checked: boolean): string {
  return checked ? '☑' : '☐';
}

function SummaryText({
  item,
  row,
  readOnly,
  onFillChange,
}: {
  item: YesNoSummaryItem;
  row: YesNoSummaryItemValue;
  readOnly?: boolean;
  onFillChange?: (next: string) => void;
}) {
  if (!item.fillIn) {
    return <span className="yns-summary-text">{item.text}</span>;
  }

  return (
    <span className="yns-summary-inline">
      <span className="yns-summary-text">{item.text}</span>
      {readOnly ? (
        row.fillIn?.trim() ? (
          <span className="yns-fill-value">{row.fillIn}</span>
        ) : (
          <span className="yns-fill-line" />
        )
      ) : (
        <input
          type="text"
          className="yns-fill-input"
          value={row.fillIn ?? ''}
          onChange={(e) => onFillChange?.(e.target.value)}
          aria-label={`${item.text} fill-in`}
        />
      )}
      {item.textAfterFill ? (
        <span className="yns-summary-text">{item.textAfterFill}</span>
      ) : null}
    </span>
  );
}

function ChoiceCell({
  choice,
  groupName,
  readOnly,
  variant,
  onSelect,
}: {
  choice: 'yes' | 'no' | null;
  groupName: string;
  readOnly?: boolean;
  variant: 'yes' | 'no';
  onSelect: () => void;
}) {
  const tdCls = variant === 'yes' ? 'yns-td yns-td--yes' : 'yns-td yns-td--no';
  const label = choice === 'yes' ? 'Yes' : 'No';

  if (readOnly) {
    return (
      <td className={tdCls}>
        <span className="yns-check-cell yns-check-cell--readonly">
          <span className="yns-check">{checkMark(variant === choice)}</span>
        </span>
      </td>
    );
  }

  return (
    <td className={tdCls}>
      <label className="yns-check-cell">
        <input
          type="radio"
          className="yns-check-input"
          name={groupName}
          checked={choice === variant}
          onChange={onSelect}
        />
        <span className="sr-only">{label}</span>
      </label>
    </td>
  );
}

export function FormYesNoSummaryView({
  items,
  value: rawValue,
  readOnly,
  onChange,
}: {
  items: YesNoSummaryItem[];
  value: unknown;
  readOnly?: boolean;
  onChange?: (value: YesNoSummaryValue) => void;
}) {
  const value = normalizeYesNoSummaryValue(rawValue, items);

  return (
    <div className="yns-table-wrap">
      <table className="yns-table">
        <thead>
          <tr>
            <th className="yns-th yns-th--yes">Yes</th>
            <th className="yns-th yns-th--no">No</th>
            <th className="yns-th yns-th--summary">Summary</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const row = value[item.id] ?? { choice: null };
            const groupName = `yns-${item.id}`;
            const choice = row.choice;
            return (
              <tr className="yns-row" key={item.id}>
                <ChoiceCell
                  choice={choice}
                  groupName={groupName}
                  readOnly={readOnly}
                  variant="yes"
                  onSelect={() => onChange?.(setYesNoSummaryChoice(value, item.id, 'yes'))}
                />
                <ChoiceCell
                  choice={choice}
                  groupName={groupName}
                  readOnly={readOnly}
                  variant="no"
                  onSelect={() => onChange?.(setYesNoSummaryChoice(value, item.id, 'no'))}
                />
                <td className="yns-td yns-td--summary">
                  <SummaryText
                    item={item}
                    row={row}
                    readOnly={readOnly}
                    onFillChange={(next) =>
                      onChange?.(setYesNoSummaryFillIn(value, item.id, next))
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
