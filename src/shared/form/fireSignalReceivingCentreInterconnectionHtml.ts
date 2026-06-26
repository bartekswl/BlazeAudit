import {
  FSRC_CIRCUIT_DISCONNECT_LOCATION_LABEL,
  FSRC_CIRCUIT_PANEL_BREAKER_LABEL,
  FSRC_COMMUNICATOR_LOCATION_LABEL,
  FSRC_FOOTNOTE,
  FSRC_NOT_APPLICABLE_SUFFIX,
  FSRC_NOT_APPLICABLE_TEXT,
  FSRC_REF,
  FSRC_ROWS,
  normalizeFireSignalReceivingCentreInterconnectionValue,
  type FsrcChoice,
  type FsrcRowDef,
} from './fireSignalReceivingCentreInterconnection';
import { renderCheckGlyphHtml } from './checkGlyph';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderDescCell(row: FsrcRowDef): string {
  if (row.bullets?.length) {
    return `<ul class="fsrc-desc-list">${row.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  }
  return `<span class="fsrc-desc-text">${escapeHtml(row.text ?? '')}</span>`;
}

function renderChoiceCell(variant: FsrcChoice, choice: FsrcChoice | null): string {
  const tdCls =
    variant === 'yes'
      ? 'fsrc-td fsrc-td--yes'
      : variant === 'no'
        ? 'fsrc-td fsrc-td--no'
        : 'fsrc-td fsrc-td--na';
  return `<td class="${tdCls}"><span class="fsrc-check-cell fsrc-check-cell--readonly">${renderCheckGlyphHtml('fsrc-check', variant === choice)}</span></td>`;
}

function renderChoiceCells(choice: FsrcChoice | null, mode: FsrcRowDef['choiceMode']): string {
  if (mode === 'record-fields') {
    return '<td colspan="3" class="fsrc-td fsrc-td--choice-block" aria-hidden="true"></td>';
  }
  if (mode === 'yes-no-na-blocked') {
    return `${renderChoiceCell('yes', choice)}${renderChoiceCell('no', choice)}<td class="fsrc-td fsrc-td--na-blocked" aria-hidden="true"></td>`;
  }
  return `${renderChoiceCell('yes', choice)}${renderChoiceCell('no', choice)}${renderChoiceCell('na', choice)}`;
}

function renderInfoValue(value: string): string {
  return value.trim()
    ? `<span class="fsrc-info-value">${escapeHtml(value)}</span>`
    : '<span class="fsrc-info-line"></span>';
}

function renderRecordFields(
  company: string,
  address: string,
  telephone: string,
): string {
  return `<div class="fsrc-record-fields">
    <div class="fsrc-record-row"><span class="fsrc-record-label">Company:</span>${renderInfoValue(company)}</div>
    <div class="fsrc-record-row"><span class="fsrc-record-label">Address:</span>${renderInfoValue(address)}</div>
    <div class="fsrc-record-row"><span class="fsrc-record-label">Telephone:</span>${renderInfoValue(telephone)}</div>
  </div>`;
}

export function renderFireSignalReceivingCentreInterconnectionHtml(value: unknown): string {
  const data = normalizeFireSignalReceivingCentreInterconnectionValue(value);

  const body = FSRC_ROWS.map((row, index) => {
    const zebra = index % 2 === 1 ? ' fsrc-row--alt' : '';
    const rowValue = data.checklist[row.id] ?? { choice: null };
    const desc =
      row.choiceMode === 'record-fields'
        ? `${renderDescCell(row)}${renderRecordFields(
            data.recordFields.company,
            data.recordFields.address,
            data.recordFields.telephone,
          )}`
        : renderDescCell(row);

    return `<tr class="fsrc-row${zebra}"><td class="fsrc-td fsrc-td--letter">${escapeHtml(row.letter)}</td><td class="fsrc-td fsrc-td--desc">${desc}</td>${renderChoiceCells(rowValue.choice, row.choiceMode)}</tr>`;
  }).join('');

  return `<div class="fsrc-panel">
    <div class="fsrc-na-bar">
      <span class="fsrc-na-text">${escapeHtml(FSRC_NOT_APPLICABLE_TEXT)}</span>
      <span class="fsrc-na-check-wrap">${renderCheckGlyphHtml('fsrc-na-check', data.sectionNotApplicable)}<span class="fsrc-na-suffix">${escapeHtml(FSRC_NOT_APPLICABLE_SUFFIX)}</span></span>
    </div>
    <div class="fsrc-header-strip">
      <div class="fsrc-ref-bar">${escapeHtml(FSRC_REF)}</div>
      <div class="fsrc-info-row"><span class="fsrc-info-label">${escapeHtml(FSRC_COMMUNICATOR_LOCATION_LABEL)}</span>${renderInfoValue(data.communicatorLocation)}</div>
      <div class="fsrc-info-row"><span class="fsrc-info-label">${escapeHtml(FSRC_CIRCUIT_DISCONNECT_LOCATION_LABEL)}</span>${renderInfoValue(data.circuitDisconnectMeansLocation)}</div>
      <div class="fsrc-info-row"><span class="fsrc-info-label">${escapeHtml(FSRC_CIRCUIT_PANEL_BREAKER_LABEL)}</span>${renderInfoValue(data.circuitPanelBreakerIdentification)}</div>
    </div>
    <div class="fsrc-table-wrap">
      <table class="fsrc-table">
        <thead>
          <tr>
            <th class="fsrc-th fsrc-th--letter" aria-hidden="true"></th>
            <th class="fsrc-th fsrc-th--intro" aria-hidden="true"></th>
            <th class="fsrc-th fsrc-th--yes">Yes</th>
            <th class="fsrc-th fsrc-th--no">No</th>
            <th class="fsrc-th fsrc-th--na">N/A</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <p class="fsrc-footer-note">${escapeHtml(FSRC_FOOTNOTE)}</p>
  </div>`;
}
