import {
  CONTROL_UNIT_TEST_FIELD_LOCATION_LABEL,
  CONTROL_UNIT_TEST_FIRMWARE_PROMPT,
  CONTROL_UNIT_TEST_IDENTIFICATION_LABEL,
  CONTROL_UNIT_TEST_INTRO,
  CONTROL_UNIT_TEST_REF,
  CONTROL_UNIT_TEST_ROWS,
  CONTROL_UNIT_TEST_SOFTWARE_PROMPT,
  normalizeControlUnitTestValue,
  type ControlUnitTestVersionFields,
} from './controlUnitTest';
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
          ? 'cut-td cut-td--yes'
          : variant === 'no'
            ? 'cut-td cut-td--no'
            : 'cut-td cut-td--na';
      return `<td class="${tdCls}"><span class="cut-check-cell cut-check-cell--readonly">${renderCheckGlyphHtml('cut-check', variant === choice)}</span></td>`;
    })
    .join('');
}

function renderVersionFields(fields: ControlUnitTestVersionFields): string {
  const renderField = (label: string, value: string) => {
    const display = value.trim()
      ? `<span class="cut-version-value">${escapeHtml(value)}</span>`
      : '<span class="cut-version-line"></span>';
    return `<span class="cut-version-field"><span class="cut-version-label">${escapeHtml(label)}</span>${display}</span>`;
  };

  return `<div class="cut-version-fields">${renderField('Date:', fields.date)}${renderField('Revision:', fields.revision)}${renderField('Version:', fields.version)}</div>`;
}

function renderFirmwareRow(data: ReturnType<typeof normalizeControlUnitTestValue>): string {
  return `<tr class="cut-row cut-row--f">
    <td class="cut-td cut-td--letter">F</td>
    <td class="cut-td cut-td--desc cut-td--f">
      <div class="cut-f-section">
        <p class="cut-f-prompt">${escapeHtml(CONTROL_UNIT_TEST_FIRMWARE_PROMPT)}</p>
        ${renderVersionFields(data.firmware)}
      </div>
      <div class="cut-f-section">
        <p class="cut-f-prompt">${escapeHtml(CONTROL_UNIT_TEST_SOFTWARE_PROMPT)}</p>
        ${renderVersionFields(data.software)}
      </div>
    </td>
    <td colspan="3" class="cut-td cut-td--choice-block" aria-hidden="true"></td>
  </tr>`;
}

function renderInfoValue(value: string): string {
  return value.trim()
    ? `<span class="cut-info-value">${escapeHtml(value)}</span>`
    : '<span class="cut-info-line"></span>';
}

export function renderControlUnitTestHtml(value: unknown): string {
  const data = normalizeControlUnitTestValue(value);

  const body = CONTROL_UNIT_TEST_ROWS.map((row) => {
    if (row.kind === 'firmware') {
      return renderFirmwareRow(data);
    }
    const rowValue = data.checklist[row.id] ?? { choice: null };
    return `<tr class="cut-row"><td class="cut-td cut-td--letter">${escapeHtml(row.letter)}</td><td class="cut-td cut-td--desc"><span class="cut-desc-text">${escapeHtml(row.text)}</span></td>${renderChoiceCells(rowValue.choice)}</tr>`;
  }).join('');

  return `<div class="cut-panel">
    <div class="cut-legend">
      <p><span class="cut-legend-yes">"Yes"</span> — Tested correctly</p>
      <p><span class="cut-legend-no">"No"</span> — Did not test correctly (For NO answers refer to Section 20.2 Deficiencies)</p>
      <p><span class="cut-legend-na">"NA"</span> — Not applicable (the feature is not available or has not been programmed).</p>
    </div>
    <div class="cut-ref-bar">${escapeHtml(CONTROL_UNIT_TEST_REF)}</div>
    <div class="cut-info-strip">
      <div class="cut-info-row">
        <span class="cut-info-label">${escapeHtml(CONTROL_UNIT_TEST_FIELD_LOCATION_LABEL)}</span>
        ${renderInfoValue(data.fieldLocation)}
      </div>
      <div class="cut-info-row">
        <span class="cut-info-label">${escapeHtml(CONTROL_UNIT_TEST_IDENTIFICATION_LABEL)}</span>
        ${renderInfoValue(data.identification)}
      </div>
    </div>
    <div class="cut-table-wrap">
      <table class="cut-table">
        <thead>
          <tr>
            <th class="cut-th cut-th--letter" aria-hidden="true"></th>
            <th class="cut-th cut-th--intro">${escapeHtml(CONTROL_UNIT_TEST_INTRO)}</th>
            <th class="cut-th cut-th--yes">Yes</th>
            <th class="cut-th cut-th--no">No</th>
            <th class="cut-th cut-th--na">N/A</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  </div>`;
}
