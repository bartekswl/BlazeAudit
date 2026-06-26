import {
  POWER_SUPPLY_INSPECTION_BREAKER_LABEL,
  POWER_SUPPLY_INSPECTION_DISCONNECT_LOCATION_LABEL,
  POWER_SUPPLY_INSPECTION_FIELD_LOCATION_LABEL,
  POWER_SUPPLY_INSPECTION_IDENTIFICATION_LABEL,
  POWER_SUPPLY_INSPECTION_REF,
  POWER_SUPPLY_INSPECTION_ROWS,
  POWER_SUPPLY_INSPECTION_SUBTITLE,
  normalizePowerSupplyInspectionValue,
} from './powerSupplyInspection';

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

function renderInfoValue(value: string): string {
  return `<span class="psi-info-value">${escapeHtml(value.trim() || '\u00a0')}</span>`;
}

function renderChoiceCells(choice: 'yes' | 'no' | 'na' | null): string {
  const variants: Array<'yes' | 'no' | 'na'> = ['yes', 'no', 'na'];
  return variants
    .map((variant) => {
      const tdCls =
        variant === 'yes'
          ? 'psi-td psi-td--yes'
          : variant === 'no'
            ? 'psi-td psi-td--no'
            : 'psi-td psi-td--na';
      return `<td class="${tdCls}"><span class="psi-check-cell psi-check-cell--readonly"><span class="psi-check">${checkMark(variant === choice)}</span></span></td>`;
    })
    .join('');
}

export function renderPowerSupplyInspectionHtml(value: unknown): string {
  const data = normalizePowerSupplyInspectionValue(value);
  const body = POWER_SUPPLY_INSPECTION_ROWS.map((row, index) => {
    const rowValue = data.checklist[row.id] ?? { choice: null };
    const rowCls = index % 2 === 1 ? 'psi-row psi-row--alt' : 'psi-row';
    return `<tr class="${rowCls}"><td class="psi-td psi-td--letter">${escapeHtml(row.letter)}</td><td class="psi-td psi-td--desc"><span class="psi-desc-text">${escapeHtml(row.text)}</span></td>${renderChoiceCells(rowValue.choice)}</tr>`;
  }).join('');

  return `<div class="psi-panel">
    <div class="psi-banner">
      <div class="psi-banner-line">${escapeHtml(POWER_SUPPLY_INSPECTION_SUBTITLE)}</div>
      <div class="psi-banner-line">${escapeHtml(POWER_SUPPLY_INSPECTION_REF)}</div>
    </div>
    <div class="psi-info-strip">
      <div class="psi-info-row"><span class="psi-info-label">${escapeHtml(POWER_SUPPLY_INSPECTION_FIELD_LOCATION_LABEL)}</span>${renderInfoValue(data.fieldLocation)}</div>
      <div class="psi-info-row"><span class="psi-info-label">${escapeHtml(POWER_SUPPLY_INSPECTION_IDENTIFICATION_LABEL)}</span>${renderInfoValue(data.identification)}</div>
      <div class="psi-info-row"><span class="psi-info-label">${escapeHtml(POWER_SUPPLY_INSPECTION_DISCONNECT_LOCATION_LABEL)}</span>${renderInfoValue(data.disconnectLocation)}</div>
      <div class="psi-info-row"><span class="psi-info-label">${escapeHtml(POWER_SUPPLY_INSPECTION_BREAKER_LABEL)}</span>${renderInfoValue(data.breakerIdentification)}</div>
    </div>
    <div class="psi-table-wrap">
      <table class="psi-table">
        <thead>
          <tr>
            <th class="psi-th psi-th--letter" aria-hidden="true"></th>
            <th class="psi-th psi-th--intro" aria-hidden="true"></th>
            <th class="psi-th psi-th--yes">Yes</th>
            <th class="psi-th psi-th--no">No</th>
            <th class="psi-th psi-th--na">N/A</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  </div>`;
}
