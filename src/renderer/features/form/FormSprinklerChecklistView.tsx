import {
  normalizeSprinklerChecklistValue,
  SPRINKLER_CHECKLIST_INLINE_HEADER_ROW,
  setSprinklerChecklistChoice,
  setSprinklerChecklistField,
  setSprinklerChecklistOption,
  sprinklerChecklistRows,
  sprinklerFieldKey,
  sprinklerRowHasChoice,
  type SprinklerChecklistGroupId,
  type SprinklerChecklistRowDef,
  type SprinklerChecklistValue,
  type SprinklerChoice,
} from '../../../shared/form/sprinklerChecklist';
import { nextRadioColumnChoice } from '../../../shared/form/columnChoiceFill';
import { cn } from '../../lib/cn';
import { ChoiceColumnHeader } from './ChoiceColumnHeader';
import { FormCheckGlyph } from './FormCheckGlyph';
import { formToggleRadioInputProps } from './formToggleRadioInputProps';
import { VisibleWidthInput } from './VisibleWidthInput';

type ItemRow = Extract<SprinklerChecklistRowDef, { type: 'item' }>;

const CHOICES: readonly { variant: SprinklerChoice; label: string }[] = [
  { variant: 'yes', label: 'Yes' },
  { variant: 'no', label: 'No' },
  { variant: 'na', label: 'N/A' },
];

function ChoiceCell({
  choice,
  groupName,
  variant,
  label,
  readOnly,
  onSelect,
  onClear,
}: {
  choice: SprinklerChoice | null;
  groupName: string;
  variant: SprinklerChoice;
  label: string;
  readOnly?: boolean;
  onSelect: () => void;
  onClear: () => void;
}) {
  const tdCls = cn('spr-td', `spr-td--${variant}`);
  if (readOnly) {
    return (
      <td className={tdCls}>
        <span className="spr-check-cell spr-check-cell--readonly">
          <FormCheckGlyph checked={choice === variant} className="spr-check" />
        </span>
      </td>
    );
  }
  return (
    <td className={tdCls}>
      <label className="spr-check-cell">
        <input
          type="radio"
          className="spr-check-input"
          name={groupName}
          {...formToggleRadioInputProps({ choice, variant, onSelect, onClear })}
        />
        <span className="sr-only">{label}</span>
      </label>
    </td>
  );
}

function RowExtras({
  row,
  data,
  readOnly,
  groupName,
  onChange,
}: {
  row: ItemRow;
  data: SprinklerChecklistValue;
  readOnly?: boolean;
  groupName: string;
  onChange?: (value: SprinklerChecklistValue) => void;
}) {
  if (!row.options?.length && !row.fields?.length) return null;
  const selected = data.options[row.id] ?? null;
  return (
    <span className="spr-extras">
      {row.options?.map((option) => (
        <span key={option.value} className="spr-option">
          {readOnly ? (
            <FormCheckGlyph checked={selected === option.value} className="spr-check" />
          ) : (
            <input
              type="radio"
              className="spr-check-input"
              name={`${groupName}-opt`}
              aria-label={option.label}
              {...formToggleRadioInputProps({
                choice: selected,
                variant: option.value,
                onSelect: () => onChange?.(setSprinklerChecklistOption(data, row.id, option.value)),
                onClear: () => onChange?.(setSprinklerChecklistOption(data, row.id, null)),
              })}
            />
          )}
          <span>{option.label}</span>
        </span>
      ))}
      {row.fields?.map((field) => {
        const current = data.fields[sprinklerFieldKey(row.id, field.key)] ?? '';
        return (
          <span
            key={field.key}
            className={cn('spr-field', !field.label && 'spr-field--wide')}
          >
            {field.label ? <span className="spr-field-label">{field.label}</span> : null}
            {readOnly ? (
              <span className="spr-fill-value">{current || '\u00a0'}</span>
            ) : (
              <VisibleWidthInput
                className="spr-fill-input"
                value={current}
                aria-label={field.label || row.text}
                onChange={(next) =>
                  onChange?.(setSprinklerChecklistField(data, row.id, field.key, next))
                }
              />
            )}
          </span>
        );
      })}
    </span>
  );
}

export function FormSprinklerChecklistView({
  elementId,
  group,
  value: rawValue,
  readOnly,
  onChange,
}: {
  elementId: string;
  group: SprinklerChecklistGroupId;
  value: unknown;
  readOnly?: boolean;
  onChange?: (value: SprinklerChecklistValue) => void;
}) {
  const data = normalizeSprinklerChecklistValue(rawValue);
  const rows = sprinklerChecklistRows(group);
  const choiceRowIds = rows.filter(sprinklerRowHasChoice).map((row) => row.id);
  const inlineHeaderRowId = SPRINKLER_CHECKLIST_INLINE_HEADER_ROW[group] ?? null;

  const choiceHeaders = CHOICES.map(({ variant, label }) => (
    <ChoiceColumnHeader
      key={variant}
      className={cn('spr-th', `spr-th--${variant}`)}
      readOnly={readOnly}
      applyLabel={`Set all rows to ${label}`}
      onApply={() => applyColumn(variant)}
    >
      {label}
    </ChoiceColumnHeader>
  ));

  const applyColumn = (variant: SprinklerChoice) => {
    const next = nextRadioColumnChoice(
      choiceRowIds.map((id) => data.answers[id] ?? null),
      variant,
    );
    let nextData = data;
    for (const id of choiceRowIds) {
      nextData = setSprinklerChecklistChoice(nextData, id, next);
    }
    onChange?.(nextData);
  };

  return (
    <div className="spr-panel">
      <table className="spr-table">
        <colgroup>
          <col className="spr-col--letter" />
          <col />
          <col className="spr-col--choice" />
          <col className="spr-col--choice" />
          <col className="spr-col--choice" />
        </colgroup>
        <thead>
          {inlineHeaderRowId ? (
            <tr>
              <th className="spr-th spr-th--bar" colSpan={5} aria-hidden="true" />
            </tr>
          ) : (
            <tr>
              <th className="spr-th spr-th--letter" aria-hidden="true" />
              <th className="spr-th spr-th--desc" aria-hidden="true" />
              {choiceHeaders}
            </tr>
          )}
        </thead>
        <tbody>
          {rows.map((row) => {
            if (row.type === 'heading') {
              return (
                <tr key={row.id} className="spr-row spr-row--heading">
                  <td className="spr-td spr-td--heading" colSpan={5}>
                    {row.text}
                  </td>
                </tr>
              );
            }
            const groupName = `spr-${elementId}-${row.id}`;
            const hasChoice = sprinklerRowHasChoice(row);
            const choice = data.answers[row.id] ?? null;
            const isInlineHeaderRow = row.id === inlineHeaderRowId;
            return (
              <tr key={row.id} className="spr-row">
                <td className="spr-td spr-td--letter">{row.letter?.toUpperCase() ?? ''}</td>
                <td className={cn('spr-td spr-td--desc', row.indent && 'spr-td--indent')}>
                  <span className="spr-desc-text">{row.text}</span>
                  <RowExtras
                    row={row}
                    data={data}
                    readOnly={readOnly}
                    groupName={groupName}
                    onChange={onChange}
                  />
                </td>
                {isInlineHeaderRow ? (
                  choiceHeaders
                ) : hasChoice ? (
                  CHOICES.map(({ variant, label }) => (
                    <ChoiceCell
                      key={variant}
                      choice={choice}
                      groupName={groupName}
                      variant={variant}
                      label={label}
                      readOnly={readOnly}
                      onSelect={() =>
                        onChange?.(setSprinklerChecklistChoice(data, row.id, variant))
                      }
                      onClear={() => onChange?.(setSprinklerChecklistChoice(data, row.id, null))}
                    />
                  ))
                ) : (
                  <td
                    className={cn(
                      'spr-td spr-td--blocked',
                      inlineHeaderRowId && 'spr-td--blocked-blue',
                    )}
                    colSpan={3}
                    aria-hidden="true"
                  />
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
