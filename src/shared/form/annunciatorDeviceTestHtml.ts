import {
  ANNUNCIATOR_DEVICE_TEST_IDENTIFICATION_LABEL,
  ANNUNCIATOR_DEVICE_TEST_LOCATION_LABEL,
  ANNUNCIATOR_DEVICE_TEST_NOT_APPLICABLE_SUFFIX,
  ANNUNCIATOR_DEVICE_TEST_NOT_APPLICABLE_TEXT,
  ANNUNCIATOR_DEVICE_TEST_REF_LINES,
  ANNUNCIATOR_DEVICE_TEST_ROWS,
  normalizeAnnunciatorDeviceTestValue,
} from './annunciatorDeviceTest';
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
          ? 'artu-td artu-td--yes'
          : variant === 'no'
            ? 'artu-td artu-td--no'
            : 'artu-td artu-td--na';
      return `<td class="${tdCls}"><span class="artu-check-cell artu-check-cell--readonly">${renderCheckGlyphHtml('artu-check', variant === choice)}</span></td>`;
    })
    .join('');
}

function renderInfoValue(value: string): string {
  return value.trim()
    ? `<span class="artu-info-value">${escapeHtml(value)}</span>`
    : '<span class="artu-info-line"></span>';
}

export function renderAnnunciatorDeviceTestHtml(value: unknown): string {
  const data = normalizeAnnunciatorDeviceTestValue(value);

  const body = ANNUNCIATOR_DEVICE_TEST_ROWS.map((row) => {
    const rowValue = data.checklist[row.id] ?? { choice: null };
    return `<tr class="artu-row"><td class="artu-td artu-td--letter">${escapeHtml(row.letter)}</td><td class="artu-td artu-td--desc"><span class="artu-desc-text">${escapeHtml(row.text)}</span></td>${renderChoiceCells(rowValue.choice)}</tr>`;
  }).join('');

  const refLines = ANNUNCIATOR_DEVICE_TEST_REF_LINES.map(
    (line) => `<div class="artu-ref-line">${escapeHtml(line)}</div>`,
  ).join('');

  return `<div class="artu-panel">
    <div class="artu-na-bar">
      <span class="artu-na-text">${escapeHtml(ANNUNCIATOR_DEVICE_TEST_NOT_APPLICABLE_TEXT)}</span>
      <span class="artu-na-check-wrap">
        ${renderCheckGlyphHtml('artu-na-check', data.sectionNotApplicable)}
        <span class="artu-na-suffix">${escapeHtml(ANNUNCIATOR_DEVICE_TEST_NOT_APPLICABLE_SUFFIX)}</span>
      </span>
    </div>
    <div class="artu-ref-bar">${refLines}</div>
    <div class="artu-info-strip">
      <div class="artu-info-row">
        <span class="artu-info-label">${escapeHtml(ANNUNCIATOR_DEVICE_TEST_LOCATION_LABEL)}</span>
        ${renderInfoValue(data.fieldLocation)}
      </div>
      <div class="artu-info-row">
        <span class="artu-info-label">${escapeHtml(ANNUNCIATOR_DEVICE_TEST_IDENTIFICATION_LABEL)}</span>
        ${renderInfoValue(data.identification)}
      </div>
    </div>
    <div class="artu-table-wrap">
      <table class="artu-table">
        <thead>
          <tr>
            <th class="artu-th artu-th--letter" aria-hidden="true"></th>
            <th class="artu-th artu-th--intro" aria-hidden="true"></th>
            <th class="artu-th artu-th--yes">Yes</th>
            <th class="artu-th artu-th--no">No</th>
            <th class="artu-th artu-th--na">N/A</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  </div>`;
}
