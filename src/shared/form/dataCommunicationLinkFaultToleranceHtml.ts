import {
  DCLFT_CONTROL_UNIT_IDENTIFICATION_LABEL,
  DCLFT_CONTROL_UNIT_LOCATION_LABEL,
  DCLFT_DCL_CIRCUIT_IDENTIFICATION_LABEL,
  DCLFT_NOT_APPLICABLE_SUFFIX,
  DCLFT_REF,
  DCLFT_ROWS,
  dclftNotApplicableText,
  normalizeDataCommunicationLinkFaultToleranceValue,
  type DclftBlockId,
  type DclftBlockValue,
  type DclftChoice,
} from './dataCommunicationLinkFaultTolerance';
import { renderCheckGlyphHtml } from './checkGlyph';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInfoValue(value: string): string {
  return value.trim()
    ? `<span class="dclft-info-value">${escapeHtml(value)}</span>`
    : '<span class="dclft-info-line"></span>';
}

function renderChoiceCell(variant: DclftChoice, choice: DclftChoice | null): string {
  const tdCls =
    variant === 'yes'
      ? 'dclft-td dclft-td--yes'
      : variant === 'no'
        ? 'dclft-td dclft-td--no'
        : 'dclft-td dclft-td--na';
  return `<td class="${tdCls}"><span class="dclft-check-cell dclft-check-cell--readonly">${renderCheckGlyphHtml('dclft-check', variant === choice)}</span></td>`;
}

function renderChoiceCells(choice: DclftChoice | null): string {
  return `${renderChoiceCell('yes', choice)}${renderChoiceCell('no', choice)}${renderChoiceCell('na', choice)}`;
}

function renderBlockPanel(blockId: DclftBlockId, block: DclftBlockValue): string {
  const body = DCLFT_ROWS.map((row, index) => {
    const zebra = index % 2 === 1 ? ' dclft-row--alt' : '';
    const rowValue = block.checklist[row.id] ?? { choice: null };
    return `<tr class="dclft-row${zebra}"><td class="dclft-td dclft-td--letter">${escapeHtml(row.letter)}</td><td class="dclft-td dclft-td--desc"><span class="dclft-desc-text">${escapeHtml(row.text)}</span></td>${renderChoiceCells(rowValue.choice)}</tr>`;
  }).join('');

  return `<div class="dclft-panel">
    <div class="dclft-na-bar">
      <span class="dclft-na-text">${escapeHtml(dclftNotApplicableText(blockId))}</span>
      <span class="dclft-na-check-wrap">${renderCheckGlyphHtml('dclft-na-check', block.sectionNotApplicable)}<span class="dclft-na-suffix">${escapeHtml(DCLFT_NOT_APPLICABLE_SUFFIX)}</span></span>
    </div>
    <div class="dclft-header-strip">
      <div class="dclft-ref-bar">${escapeHtml(DCLFT_REF)}</div>
      <div class="dclft-info-row"><span class="dclft-info-label">${escapeHtml(DCLFT_CONTROL_UNIT_LOCATION_LABEL)}</span>${renderInfoValue(block.controlUnitLocation)}</div>
      <div class="dclft-info-row"><span class="dclft-info-label">${escapeHtml(DCLFT_CONTROL_UNIT_IDENTIFICATION_LABEL)}</span>${renderInfoValue(block.controlUnitIdentification)}</div>
      <div class="dclft-info-row"><span class="dclft-info-label">${escapeHtml(DCLFT_DCL_CIRCUIT_IDENTIFICATION_LABEL)}</span>${renderInfoValue(block.dclCircuitIdentification)}</div>
    </div>
    <div class="dclft-table-wrap">
      <table class="dclft-table">
        <thead>
          <tr>
            <th class="dclft-th dclft-th--letter" aria-hidden="true"></th>
            <th class="dclft-th dclft-th--intro" aria-hidden="true"></th>
            <th class="dclft-th dclft-th--yes">Yes</th>
            <th class="dclft-th dclft-th--no">No</th>
            <th class="dclft-th dclft-th--na">N/A</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  </div>`;
}

export function renderDataCommunicationLinkFaultToleranceHtml(value: unknown): string {
  const data = normalizeDataCommunicationLinkFaultToleranceValue(value);
  return `<div class="dclft-stack">${renderBlockPanel('primary', data.primary)}${renderBlockPanel('additional', data.additional)}</div>`;
}
