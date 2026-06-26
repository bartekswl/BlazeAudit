import {
  REMOTE_TROUBLE_SIGNAL_UNIT_TEST_IDENTIFICATION_LABEL,
  REMOTE_TROUBLE_SIGNAL_UNIT_TEST_LOCATION_LABEL,
  REMOTE_TROUBLE_SIGNAL_UNIT_TEST_NOT_APPLICABLE_SUFFIX,
  REMOTE_TROUBLE_SIGNAL_UNIT_TEST_NOT_APPLICABLE_TEXT,
  REMOTE_TROUBLE_SIGNAL_UNIT_TEST_REF,
  REMOTE_TROUBLE_SIGNAL_UNIT_TEST_ROWS,
  normalizeRemoteTroubleSignalUnitTestValue,
} from './remoteTroubleSignalUnitTest';
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
          ? 'rtsu-td rtsu-td--yes'
          : variant === 'no'
            ? 'rtsu-td rtsu-td--no'
            : 'rtsu-td rtsu-td--na';
      return `<td class="${tdCls}"><span class="rtsu-check-cell rtsu-check-cell--readonly">${renderCheckGlyphHtml('rtsu-check', variant === choice)}</span></td>`;
    })
    .join('');
}

function renderInfoValue(value: string): string {
  return value.trim()
    ? `<span class="rtsu-info-value">${escapeHtml(value)}</span>`
    : '<span class="rtsu-info-line"></span>';
}

export function renderRemoteTroubleSignalUnitTestHtml(value: unknown): string {
  const data = normalizeRemoteTroubleSignalUnitTestValue(value);

  const body = REMOTE_TROUBLE_SIGNAL_UNIT_TEST_ROWS.map((row, index) => {
    const rowValue = data.checklist[row.id] ?? { choice: null };
    const zebra = index % 2 === 1 ? ' rtsu-row--alt' : '';
    return `<tr class="rtsu-row${zebra}"><td class="rtsu-td rtsu-td--letter">${escapeHtml(row.letter)}</td><td class="rtsu-td rtsu-td--desc"><span class="rtsu-desc-text">${escapeHtml(row.text)}</span></td>${renderChoiceCells(rowValue.choice)}</tr>`;
  }).join('');

  return `<div class="rtsu-panel">
    <div class="rtsu-na-bar">
      <span class="rtsu-na-text">${escapeHtml(REMOTE_TROUBLE_SIGNAL_UNIT_TEST_NOT_APPLICABLE_TEXT)}</span>
      <span class="rtsu-na-check-wrap">
        ${renderCheckGlyphHtml('rtsu-na-check', data.sectionNotApplicable)}
        <span class="rtsu-na-suffix">${escapeHtml(REMOTE_TROUBLE_SIGNAL_UNIT_TEST_NOT_APPLICABLE_SUFFIX)}</span>
      </span>
    </div>
    <div class="rtsu-header-strip${data.sectionNotApplicable ? ' rtsu-header-strip--disabled' : ''}">
      <div class="rtsu-ref-bar">${escapeHtml(REMOTE_TROUBLE_SIGNAL_UNIT_TEST_REF)}</div>
      <div class="rtsu-info-row">
        <span class="rtsu-info-label">${escapeHtml(REMOTE_TROUBLE_SIGNAL_UNIT_TEST_LOCATION_LABEL)}</span>
        ${renderInfoValue(data.fieldLocation)}
      </div>
      <div class="rtsu-info-row">
        <span class="rtsu-info-label">${escapeHtml(REMOTE_TROUBLE_SIGNAL_UNIT_TEST_IDENTIFICATION_LABEL)}</span>
        ${renderInfoValue(data.identification)}
      </div>
    </div>
    <div class="rtsu-table-wrap${data.sectionNotApplicable ? ' rtsu-table-wrap--disabled' : ''}">
      <table class="rtsu-table">
        <thead>
          <tr>
            <th class="rtsu-th rtsu-th--letter" aria-hidden="true"></th>
            <th class="rtsu-th rtsu-th--intro" aria-hidden="true"></th>
            <th class="rtsu-th rtsu-th--yes">Yes</th>
            <th class="rtsu-th rtsu-th--no">No</th>
            <th class="rtsu-th rtsu-th--na">N/A</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  </div>`;
}
