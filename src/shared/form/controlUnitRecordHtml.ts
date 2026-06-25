import {
  CONTROL_UNIT_RECORD_FIELD_LOCATION_LABEL,
  CONTROL_UNIT_RECORD_FOOTER_NOTE,
  CONTROL_UNIT_RECORD_IDENTIFICATION_LABEL,
  CONTROL_UNIT_RECORD_REF,
  CONTROL_UNIT_RECORD_ROWS,
  CONTROL_UNIT_RECORD_TITLE,
  normalizeControlUnitRecordValue,
} from './controlUnitRecord';

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
  yesDisabled?: boolean,
  noDisabled?: boolean,
): string {
  if (yesDisabled && noDisabled) {
    return `<td colspan="2" class="cur-td cur-td--choice-block" aria-hidden="true"></td><td class="cur-td cur-td--na"><span class="cur-check-cell cur-check-cell--readonly"><span class="cur-check">${checkMark(choice === 'na')}</span></span></td>`;
  }

  const variants: Array<'yes' | 'no' | 'na'> = ['yes', 'no', 'na'];
  return variants
    .map((variant) => {
      const tdCls =
        variant === 'yes'
          ? 'cur-td cur-td--yes'
          : variant === 'no'
            ? 'cur-td cur-td--no'
            : 'cur-td cur-td--na';
      return `<td class="${tdCls}"><span class="cur-check-cell cur-check-cell--readonly"><span class="cur-check">${checkMark(variant === choice)}</span></span></td>`;
    })
    .join('');
}

function renderInfoValue(value: string): string {
  return value.trim()
    ? `<span class="cur-info-value">${escapeHtml(value)}</span>`
    : '<span class="cur-info-line"></span>';
}

function renderTimeValue(value: string): string {
  return value.trim()
    ? `<span class="cur-time-value">${escapeHtml(value)}</span>`
    : '<span class="cur-time-line"></span>';
}

function renderDescription(row: (typeof CONTROL_UNIT_RECORD_ROWS)[number], time: string): string {
  if (row.kind === 'timeFill') {
    return `<span class="cur-desc-text">${escapeHtml(row.text)}</span><span class="cur-time-suffix"> Time: ${renderTimeValue(time)}</span>`;
  }
  return `<span class="cur-desc-text">${escapeHtml(row.text)}</span>`;
}

export function renderControlUnitRecordHtml(value: unknown): string {
  const data = normalizeControlUnitRecordValue(value);

  const body = CONTROL_UNIT_RECORD_ROWS.map((row) => {
    const rowValue = data.checklist[row.id] ?? { choice: null };
    const time = rowValue.time ?? '';
    return `<tr class="cur-row"><td class="cur-td cur-td--letter">${escapeHtml(row.letter)}</td><td class="cur-td cur-td--desc">${renderDescription(row, time)}</td>${renderChoiceCells(rowValue.choice, row.yesDisabled, row.noDisabled)}</tr>`;
  }).join('');

  return `<div class="cur-panel">
    <div class="cur-title-bar">${escapeHtml(CONTROL_UNIT_RECORD_TITLE)}</div>
    <div class="cur-ref-bar">${escapeHtml(CONTROL_UNIT_RECORD_REF)}</div>
    <div class="cur-info-strip">
      <div class="cur-info-row">
        <span class="cur-info-label">${escapeHtml(CONTROL_UNIT_RECORD_FIELD_LOCATION_LABEL)}</span>
        ${renderInfoValue(data.fieldLocation)}
      </div>
      <div class="cur-info-row">
        <span class="cur-info-label">${escapeHtml(CONTROL_UNIT_RECORD_IDENTIFICATION_LABEL)}</span>
        ${renderInfoValue(data.identification)}
      </div>
    </div>
    <div class="cur-table-wrap">
      <table class="cur-table">
        <thead>
          <tr>
            <th class="cur-th cur-th--letter" aria-hidden="true"></th>
            <th class="cur-th cur-th--intro" aria-hidden="true"></th>
            <th class="cur-th cur-th--yes">Yes</th>
            <th class="cur-th cur-th--no">No</th>
            <th class="cur-th cur-th--na">N/A</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <p class="cur-footer-note">${escapeHtml(CONTROL_UNIT_RECORD_FOOTER_NOTE)}</p>
  </div>`;
}
