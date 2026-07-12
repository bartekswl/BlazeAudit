import {
  PRINTER_TEST_IDENTIFICATION_LABEL,
  PRINTER_TEST_LOCATION_LABEL,
  PRINTER_TEST_NOT_APPLICABLE_SUFFIX,
  PRINTER_TEST_NOT_APPLICABLE_TEXT,
  PRINTER_TEST_REF,
  PRINTER_TEST_ROWS,
  normalizePrinterTestValue,
} from './printerTest';
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
          ? 'prt-td prt-td--yes'
          : variant === 'no'
            ? 'prt-td prt-td--no'
            : 'prt-td prt-td--na';
      return `<td class="${tdCls}"><span class="prt-check-cell prt-check-cell--readonly">${renderCheckGlyphHtml('prt-check', variant === choice)}</span></td>`;
    })
    .join('');
}

function renderInfoValue(value: string): string {
  return value.trim()
    ? `<span class="prt-info-value">${escapeHtml(value)}</span>`
    : '<span class="prt-info-line"></span>';
}

export function renderPrinterTestHtml(value: unknown): string {
  const data = normalizePrinterTestValue(value);

  const body = PRINTER_TEST_ROWS.map((row, index) => {
    const rowValue = data.checklist[row.id] ?? { choice: null };
    const zebra = index % 2 === 1 ? ' prt-row--alt' : '';
    return `<tr class="prt-row${zebra}"><td class="prt-td prt-td--letter">${escapeHtml(row.letter)}</td><td class="prt-td prt-td--desc"><span class="prt-desc-text">${escapeHtml(row.text)}</span></td>${renderChoiceCells(rowValue.choice)}</tr>`;
  }).join('');

  return `<div class="prt-panel">
    <div class="prt-na-bar">
      <span class="prt-na-text">${escapeHtml(PRINTER_TEST_NOT_APPLICABLE_TEXT)}</span>
      <span class="prt-na-check-wrap">
        ${renderCheckGlyphHtml('prt-na-check', data.sectionNotApplicable)}
        <span class="prt-na-suffix">${escapeHtml(PRINTER_TEST_NOT_APPLICABLE_SUFFIX)}</span>
      </span>
    </div>
    <div class="prt-header-strip">
      <div class="prt-ref-bar">${escapeHtml(PRINTER_TEST_REF)}</div>
      <div class="prt-info-row">
        <span class="prt-info-label">${escapeHtml(PRINTER_TEST_LOCATION_LABEL)}</span>
        ${renderInfoValue(data.fieldLocation)}
      </div>
      <div class="prt-info-row">
        <span class="prt-info-label">${escapeHtml(PRINTER_TEST_IDENTIFICATION_LABEL)}</span>
        ${renderInfoValue(data.identification)}
      </div>
    </div>
    <div class="prt-table-wrap">
      <table class="prt-table">
        <thead>
          <tr>
            <th class="prt-th prt-th--letter" aria-hidden="true"></th>
            <th class="prt-th prt-th--intro" aria-hidden="true"></th>
            <th class="prt-th prt-th--yes">Yes</th>
            <th class="prt-th prt-th--no">No</th>
            <th class="prt-th prt-th--na">N/A</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  </div>`;
}
