import {
  SEQUENTIAL_DISPLAY_TEST_IDENTIFICATION_LABEL,
  SEQUENTIAL_DISPLAY_TEST_LOCATION_LABEL,
  SEQUENTIAL_DISPLAY_TEST_NOT_APPLICABLE_SUFFIX,
  SEQUENTIAL_DISPLAY_TEST_NOT_APPLICABLE_TEXT,
  SEQUENTIAL_DISPLAY_TEST_REF_LINES,
  SEQUENTIAL_DISPLAY_TEST_ROWS,
  normalizeSequentialDisplayTestValue,
} from './sequentialDisplayTest';
import { renderCheckGlyphHtml } from './checkGlyph';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderChoiceCells(choice: 'yes' | 'no' | 'na' | null): string {
  const variants: Array<'yes' | 'no' | 'na'> = ['yes', 'no', 'na'];
  return variants
    .map((variant) => {
      const tdCls =
        variant === 'yes'
          ? 'asd-td asd-td--yes'
          : variant === 'no'
            ? 'asd-td asd-td--no'
            : 'asd-td asd-td--na';
      return `<td class="${tdCls}"><span class="asd-check-cell asd-check-cell--readonly">${renderCheckGlyphHtml('asd-check', variant === choice)}</span></td>`;
    })
    .join('');
}

function renderInfoValue(value: string): string {
  return value.trim()
    ? `<span class="asd-info-value">${escapeHtml(value)}</span>`
    : '<span class="asd-info-line"></span>';
}

export function renderSequentialDisplayTestHtml(value: unknown): string {
  const data = normalizeSequentialDisplayTestValue(value);

  const body = SEQUENTIAL_DISPLAY_TEST_ROWS.map((row, index) => {
    const rowValue = data.checklist[row.id] ?? { choice: null };
    const zebra = index % 2 === 1 ? ' asd-row--alt' : '';
    return `<tr class="asd-row${zebra}"><td class="asd-td asd-td--letter">${escapeHtml(row.letter)}</td><td class="asd-td asd-td--desc"><span class="asd-desc-text">${escapeHtml(row.text)}</span></td>${renderChoiceCells(rowValue.choice)}</tr>`;
  }).join('');

  const refLines = SEQUENTIAL_DISPLAY_TEST_REF_LINES.map(
    (line) => `<div class="asd-ref-line">${escapeHtml(line)}</div>`,
  ).join('');

  return `<div class="asd-panel">
    <div class="asd-na-bar">
      <span class="asd-na-text">${escapeHtml(SEQUENTIAL_DISPLAY_TEST_NOT_APPLICABLE_TEXT)}</span>
      <span class="asd-na-check-wrap">
        ${renderCheckGlyphHtml('asd-na-check', data.sectionNotApplicable)}
        <span class="asd-na-suffix">${escapeHtml(SEQUENTIAL_DISPLAY_TEST_NOT_APPLICABLE_SUFFIX)}</span>
      </span>
    </div>
    <div class="asd-header-strip${data.sectionNotApplicable ? ' asd-header-strip--disabled' : ''}">
      <div class="asd-ref-bar">${refLines}</div>
      <div class="asd-info-row">
        <span class="asd-info-label">${escapeHtml(SEQUENTIAL_DISPLAY_TEST_LOCATION_LABEL)}</span>
        ${renderInfoValue(data.fieldLocation)}
      </div>
      <div class="asd-info-row">
        <span class="asd-info-label">${escapeHtml(SEQUENTIAL_DISPLAY_TEST_IDENTIFICATION_LABEL)}</span>
        ${renderInfoValue(data.identification)}
      </div>
    </div>
    <div class="asd-table-wrap${data.sectionNotApplicable ? ' asd-table-wrap--disabled' : ''}">
      <table class="asd-table">
        <thead>
          <tr>
            <th class="asd-th asd-th--letter" aria-hidden="true"></th>
            <th class="asd-th asd-th--intro" aria-hidden="true"></th>
            <th class="asd-th asd-th--yes">Yes</th>
            <th class="asd-th asd-th--no">No</th>
            <th class="asd-th asd-th--na">N/A</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  </div>`;
}
