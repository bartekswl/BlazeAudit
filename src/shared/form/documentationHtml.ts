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
} from './documentation';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function checkMark(checked: boolean): string {
  return checked ? '☑' : '☐';
}

function renderChoiceCells(
  choice: 'yes' | 'no' | 'na' | null,
  naDisabled?: boolean,
): string {
  const variants: Array<'yes' | 'no' | 'na'> = ['yes', 'no', 'na'];
  return variants
    .map((variant) => {
      if (variant === 'na' && naDisabled) {
        return '<td class="doc-td doc-td--na doc-td--na-disabled" aria-hidden="true"></td>';
      }
      const tdCls =
        variant === 'yes'
          ? 'doc-td doc-td--yes'
          : variant === 'no'
            ? 'doc-td doc-td--no'
            : 'doc-td doc-td--na';
      return `<td class="${tdCls}"><span class="doc-check-cell doc-check-cell--readonly"><span class="doc-check">${checkMark(variant === choice)}</span></span></td>`;
    })
    .join('');
}

function renderDescription(row: (typeof DOCUMENTATION_MAIN_ROWS)[number], measure?: string): string {
  if (row.fillIn) {
    const fill = measure?.trim()
      ? `<span class="doc-fill-value">${escapeHtml(measure)}</span>`
      : '<span class="doc-fill-line"></span>';
    return `<td class="doc-td doc-td--desc"><span class="doc-desc-inline"><span>${escapeHtml(row.fillIn.before)}</span>${fill}<span>${escapeHtml(row.fillIn.after)}</span></span></td>`;
  }

  return `<td class="doc-td doc-td--desc"><span class="doc-desc-text">${escapeHtml(row.text ?? '')}</span></td>`;
}

function renderRuledNotes(value: string, lineCount: number, annex = false): string {
  const lines = value.split('\n').slice(0, lineCount);
  while (lines.length < lineCount) lines.push('');
  const rules = Array.from({ length: lineCount }, () => '<div class="doc-ruled-line"></div>').join('');
  const body = escapeHtml(lines.join('\n')) || '&nbsp;';
  const annexCls = annex ? ' doc-ruled-stack--annex' : ' doc-ruled-stack--location';
  return `<div class="doc-ruled-stack${annexCls}" style="--doc-ruled-line-count:${lineCount}"><div class="doc-ruled-lines" aria-hidden="true">${rules}</div><div class="doc-ruled-body doc-ruled-body--readonly">${body}</div></div>`;
}

function renderISection(data: ReturnType<typeof normalizeDocumentationValue>): string {
  const rowSpan = 1 + DOCUMENTATION_I_SUBITEMS.length;
  const header = `<tr class="doc-row doc-row--group"><td rowspan="${rowSpan}" class="doc-td doc-td--letter doc-td--letter-span">I</td><td colspan="4" class="doc-td doc-td--desc doc-td--group"><span class="doc-desc-text">${escapeHtml(DOCUMENTATION_I_HEADER)}</span></td></tr>`;
  const subitems = DOCUMENTATION_I_SUBITEMS.map((item) => {
    const rowValue = data.checklist[item.id] ?? { choice: null };
    return `<tr class="doc-row"><td class="doc-td doc-td--desc doc-td--sub"><span class="doc-desc-text"><span class="doc-sub-letter">${escapeHtml(item.letter)}.</span> ${escapeHtml(item.text)}</span></td>${renderChoiceCells(rowValue.choice, item.naDisabled)}</tr>`;
  }).join('');
  return header + subitems;
}

export function renderDocumentationHtml(value: unknown): string {
  const data = normalizeDocumentationValue(value);

  const mainRows = DOCUMENTATION_MAIN_ROWS.map((row) => {
    const rowValue = data.checklist[row.id] ?? { choice: null };
    return `<tr class="doc-row"><td class="doc-td doc-td--letter">${escapeHtml(row.letter)}</td>${renderDescription(row, rowValue.measure)}${renderChoiceCells(rowValue.choice, row.naDisabled)}</tr>`;
  }).join('');

  const jRow = `<tr class="doc-row doc-row--notes"><td class="doc-td doc-td--letter">${escapeHtml(DOCUMENTATION_J_ROW.letter)}</td><td class="doc-td doc-td--desc doc-td--notes" colspan="4"><span class="doc-desc-text">${escapeHtml(DOCUMENTATION_J_ROW.text ?? '')}</span>${renderRuledNotes(data.locationNotes, DOCUMENTATION_LOCATION_LINES)}</td></tr>`;

  const body = mainRows + renderISection(data) + jRow;
  const annex = renderRuledNotes(data.annexContents, DOCUMENTATION_ANNEX_LINES, true);

  return `<div class="doc-panel">
    <div class="doc-legend">
      <p><span class="doc-legend-yes">"Yes"</span> — Tested correctly</p>
      <p><span class="doc-legend-no">"No"</span> — Did not test correctly (For NO answers refer to Section 20.2 Deficiencies)</p>
      <p><span class="doc-legend-na">"NA"</span> — Not applicable (the feature is not available or has not been programmed).</p>
    </div>
    <div class="doc-note-bar">${escapeHtml(DOCUMENTATION_NOTE)}</div>
    <div class="doc-table-wrap">
      <table class="doc-table">
        <thead>
          <tr>
            <th class="doc-th doc-th--letter" aria-hidden="true"></th>
            <th class="doc-th doc-th--intro">${escapeHtml(DOCUMENTATION_INTRO)}</th>
            <th class="doc-th doc-th--yes">Yes</th>
            <th class="doc-th doc-th--no">No</th>
            <th class="doc-th doc-th--na">N/A</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <div class="doc-annex">
      <div class="doc-annex-header">ANNEX TABLE OF CONTENTS</div>
      <div class="doc-annex-body">${annex}</div>
    </div>
  </div>`;
}
