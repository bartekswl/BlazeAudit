import { type CSSProperties } from 'react';
import {
  DOCUMENTATION_ANNEX_LINES,
  DOCUMENTATION_I_HEADER,
  DOCUMENTATION_I_SUBITEMS,
  DOCUMENTATION_INTRO,
  DOCUMENTATION_J_ROW,
  DOCUMENTATION_LOCATION_LINES,
  DOCUMENTATION_MAIN_ROWS,
  DOCUMENTATION_NOTE,
  normalizeDocumentationValue,
  setDocumentationAnnexContents,
  setDocumentationChoice,
  setDocumentationLocationNotes,
  setDocumentationMeasure,
  type DocumentationChoice,
  type DocumentationISubitem,
  type DocumentationRowDef,
  type DocumentationValue,
} from '../../../shared/form/documentation';
import { clampLinedNotesToMaxLines } from '../../../shared/form/linedNotes';
import { DocRuleRows } from './DocRuleRows';
import { cn } from '../../lib/cn';

function checkMark(checked: boolean): string {
  return checked ? '☑' : '☐';
}

function ChoiceCell({
  choice,
  groupName,
  readOnly,
  variant,
  disabled,
  onSelect,
}: {
  choice: DocumentationChoice | null;
  groupName: string;
  readOnly?: boolean;
  variant: DocumentationChoice;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const tdCls = cn(
    'doc-td',
    variant === 'yes' && 'doc-td--yes',
    variant === 'no' && 'doc-td--no',
    variant === 'na' && 'doc-td--na',
    disabled && 'doc-td--na-disabled',
  );
  const label = variant === 'yes' ? 'Yes' : variant === 'no' ? 'No' : 'N/A';

  if (disabled) {
    return <td className={tdCls} aria-hidden="true" />;
  }

  if (readOnly) {
    return (
      <td className={tdCls}>
        <span className="doc-check-cell doc-check-cell--readonly">
          <span className="doc-check">{checkMark(variant === choice)}</span>
        </span>
      </td>
    );
  }

  return (
    <td className={tdCls}>
      <label className="doc-check-cell">
        <input
          type="radio"
          className="doc-check-input"
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
  naDisabled,
  rowValue,
  readOnly,
  onChoice,
}: {
  rowId: string;
  naDisabled?: boolean;
  rowValue: { choice: DocumentationChoice | null };
  readOnly?: boolean;
  onChoice: (choice: DocumentationChoice) => void;
}) {
  const groupName = `doc-${rowId}`;

  return (
    <>
      <ChoiceCell
        choice={rowValue.choice}
        groupName={groupName}
        readOnly={readOnly}
        variant="yes"
        onSelect={() => onChoice('yes')}
      />
      <ChoiceCell
        choice={rowValue.choice}
        groupName={groupName}
        readOnly={readOnly}
        variant="no"
        onSelect={() => onChoice('no')}
      />
      <ChoiceCell
        choice={rowValue.choice}
        groupName={groupName}
        readOnly={readOnly}
        variant="na"
        disabled={naDisabled}
        onSelect={() => onChoice('na')}
      />
    </>
  );
}

function DescriptionCell({
  row,
  rowValue,
  readOnly,
  onMeasure,
}: {
  row: DocumentationRowDef;
  rowValue?: { measure?: string };
  readOnly?: boolean;
  onMeasure?: (next: string) => void;
}) {
  if (row.fillIn) {
    return (
      <td className="doc-td doc-td--desc">
        <span className="doc-desc-inline">
          <span>{row.fillIn.before}</span>
          {readOnly ? (
            rowValue?.measure?.trim() ? (
              <span className="doc-fill-value">{rowValue.measure}</span>
            ) : (
              <span className="doc-fill-line" />
            )
          ) : (
            <input
              type="text"
              className="doc-fill-input"
              value={rowValue?.measure ?? ''}
              onChange={(e) => onMeasure?.(e.target.value)}
              aria-label="Smoke control measure"
            />
          )}
          <span>{row.fillIn.after}</span>
        </span>
      </td>
    );
  }

  return (
    <td className="doc-td doc-td--desc">
      <span className="doc-desc-text">{row.text}</span>
    </td>
  );
}

function SubitemDescription({ item }: { item: DocumentationISubitem }) {
  return (
    <td className="doc-td doc-td--desc doc-td--sub">
      <span className="doc-desc-text">
        <span className="doc-sub-letter">{item.letter}.</span> {item.text}
      </span>
    </td>
  );
}

function DocRuledNotes({
  lineCount,
  value,
  readOnly,
  className,
  onChange,
}: {
  lineCount: number;
  value: string;
  readOnly?: boolean;
  className?: string;
  onChange?: (next: string) => void;
}) {
  const clamped = clampLinedNotesToMaxLines(value, lineCount);

  return (
    <div
      className={cn('doc-ruled-stack', className)}
      style={{ '--doc-ruled-line-count': String(lineCount) } as CSSProperties}
    >
      <DocRuleRows count={lineCount} />
      {readOnly ? (
        <div className="doc-ruled-body doc-ruled-body--readonly">{clamped || '\u00a0'}</div>
      ) : (
        <textarea
          className="doc-ruled-body doc-ruled-body--input"
          value={clamped}
          spellCheck={false}
          onChange={(e) => onChange?.(clampLinedNotesToMaxLines(e.target.value, lineCount))}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            const lines = clamped.split('\n').length;
            if (lines >= lineCount) e.preventDefault();
          }}
        />
      )}
    </div>
  );
}

function DocumentationISection({
  data,
  readOnly,
  onChoice,
}: {
  data: DocumentationValue;
  readOnly?: boolean;
  onChoice: (rowId: string, choice: DocumentationChoice) => void;
}) {
  const rowSpan = 1 + DOCUMENTATION_I_SUBITEMS.length;

  return (
    <>
      <tr className="doc-row doc-row--group">
        <td rowSpan={rowSpan} className="doc-td doc-td--letter doc-td--letter-span">
          I
        </td>
        <td colSpan={4} className="doc-td doc-td--desc doc-td--group">
          <span className="doc-desc-text">{DOCUMENTATION_I_HEADER}</span>
        </td>
      </tr>
      {DOCUMENTATION_I_SUBITEMS.map((item) => {
        const rowValue = data.checklist[item.id] ?? { choice: null };
        return (
          <tr key={item.id} className="doc-row">
            <SubitemDescription item={item} />
            <ChoiceCells
              rowId={item.id}
              naDisabled={item.naDisabled}
              rowValue={rowValue}
              readOnly={readOnly}
              onChoice={(choice) => onChoice(item.id, choice)}
            />
          </tr>
        );
      })}
    </>
  );
}

export function FormDocumentationView({
  value: rawValue,
  readOnly,
  onChange,
}: {
  value: unknown;
  readOnly?: boolean;
  onChange?: (value: DocumentationValue) => void;
}) {
  const data = normalizeDocumentationValue(rawValue);

  const setChoice = (rowId: string, choice: DocumentationChoice) => {
    onChange?.(setDocumentationChoice(data, rowId, choice));
  };

  return (
    <div className="doc-panel">
      <div className="doc-legend">
        <p>
          <span className="doc-legend-yes">&quot;Yes&quot;</span> — Tested correctly
        </p>
        <p>
          <span className="doc-legend-no">&quot;No&quot;</span> — Did not test correctly (For NO
          answers refer to Section 20.2 Deficiencies)
        </p>
        <p>
          <span className="doc-legend-na">&quot;NA&quot;</span> — Not applicable (the feature is not
          available or has not been programmed).
        </p>
      </div>

      <div className="doc-note-bar">{DOCUMENTATION_NOTE}</div>

      <div className="doc-table-wrap">
        <table className="doc-table">
          <thead>
            <tr>
              <th className="doc-th doc-th--letter" aria-hidden="true" />
              <th className="doc-th doc-th--intro">{DOCUMENTATION_INTRO}</th>
              <th className="doc-th doc-th--yes">Yes</th>
              <th className="doc-th doc-th--no">No</th>
              <th className="doc-th doc-th--na">N/A</th>
            </tr>
          </thead>
          <tbody>
            {DOCUMENTATION_MAIN_ROWS.map((row) => {
              const rowValue = data.checklist[row.id] ?? { choice: null };
              return (
                <tr key={row.id} className="doc-row">
                  <td className="doc-td doc-td--letter">{row.letter}</td>
                  <DescriptionCell
                    row={row}
                    rowValue={rowValue}
                    readOnly={readOnly}
                    onMeasure={(next) => onChange?.(setDocumentationMeasure(data, next))}
                  />
                  <ChoiceCells
                    rowId={row.id}
                    naDisabled={row.naDisabled}
                    rowValue={rowValue}
                    readOnly={readOnly}
                    onChoice={(choice) => setChoice(row.id, choice)}
                  />
                </tr>
              );
            })}

            <DocumentationISection data={data} readOnly={readOnly} onChoice={setChoice} />

            <tr className="doc-row doc-row--notes">
              <td className="doc-td doc-td--letter">{DOCUMENTATION_J_ROW.letter}</td>
              <td className="doc-td doc-td--desc doc-td--notes" colSpan={4}>
                <span className="doc-desc-text">{DOCUMENTATION_J_ROW.text}</span>
                <DocRuledNotes
                  lineCount={DOCUMENTATION_LOCATION_LINES}
                  className="doc-ruled-stack--location"
                  value={data.locationNotes}
                  readOnly={readOnly}
                  onChange={(next) => onChange?.(setDocumentationLocationNotes(data, next))}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="doc-annex">
        <div className="doc-annex-header">ANNEX TABLE OF CONTENTS</div>
        <div className="doc-annex-body">
          <DocRuledNotes
            lineCount={DOCUMENTATION_ANNEX_LINES}
            className="doc-ruled-stack--annex"
            value={data.annexContents}
            readOnly={readOnly}
            onChange={(next) => onChange?.(setDocumentationAnnexContents(data, next))}
          />
        </div>
      </div>
    </div>
  );
}
