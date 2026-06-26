import {
  VOICE_COMMUNICATION_TEST_IDENTIFICATION_LABEL,
  VOICE_COMMUNICATION_TEST_LOCATION_LABEL,
  VOICE_COMMUNICATION_TEST_NOT_APPLICABLE_SUFFIX,
  VOICE_COMMUNICATION_TEST_NOT_APPLICABLE_TEXT,
  VOICE_COMMUNICATION_TEST_REF,
  VOICE_COMMUNICATION_TEST_ROWS,
  normalizeVoiceCommunicationTestValue,
} from './voiceCommunicationTest';
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
          ? 'vct-td vct-td--yes'
          : variant === 'no'
            ? 'vct-td vct-td--no'
            : 'vct-td vct-td--na';
      return `<td class="${tdCls}"><span class="vct-check-cell vct-check-cell--readonly">${renderCheckGlyphHtml('vct-check', variant === choice)}</span></td>`;
    })
    .join('');
}

function renderInfoValue(value: string): string {
  return value.trim()
    ? `<span class="vct-info-value">${escapeHtml(value)}</span>`
    : '<span class="vct-info-line"></span>';
}

export function renderVoiceCommunicationTestHtml(value: unknown): string {
  const data = normalizeVoiceCommunicationTestValue(value);

  const body = VOICE_COMMUNICATION_TEST_ROWS.map((row) => {
    const rowValue = data.checklist[row.id] ?? { choice: null };
    return `<tr class="vct-row"><td class="vct-td vct-td--letter">${escapeHtml(row.letter)}</td><td class="vct-td vct-td--desc"><span class="vct-desc-text">${escapeHtml(row.text)}</span></td>${renderChoiceCells(rowValue.choice)}</tr>`;
  }).join('');

  return `<div class="vct-panel">
    <div class="vct-na-bar">
      <span class="vct-na-text">${escapeHtml(VOICE_COMMUNICATION_TEST_NOT_APPLICABLE_TEXT)}</span>
      <span class="vct-na-check-wrap">
        ${renderCheckGlyphHtml('vct-na-check', data.sectionNotApplicable)}
        <span class="vct-na-suffix">${escapeHtml(VOICE_COMMUNICATION_TEST_NOT_APPLICABLE_SUFFIX)}</span>
      </span>
    </div>
    <div class="vct-ref-bar">${escapeHtml(VOICE_COMMUNICATION_TEST_REF)}</div>
    <div class="vct-info-strip">
      <div class="vct-info-row">
        <span class="vct-info-label">${escapeHtml(VOICE_COMMUNICATION_TEST_LOCATION_LABEL)}</span>
        ${renderInfoValue(data.fieldLocation)}
      </div>
      <div class="vct-info-row">
        <span class="vct-info-label">${escapeHtml(VOICE_COMMUNICATION_TEST_IDENTIFICATION_LABEL)}</span>
        ${renderInfoValue(data.identification)}
      </div>
    </div>
    <div class="vct-table-wrap">
      <table class="vct-table">
        <thead>
          <tr>
            <th class="vct-th vct-th--letter" aria-hidden="true"></th>
            <th class="vct-th vct-th--intro" aria-hidden="true"></th>
            <th class="vct-th vct-th--yes">Yes</th>
            <th class="vct-th vct-th--no">No</th>
            <th class="vct-th vct-th--na">N/A</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  </div>`;
}
