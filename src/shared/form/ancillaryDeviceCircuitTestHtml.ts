import {
  ANCILLARY_DEVICE_CIRCUIT_TEST_BODY_ROW_HEIGHT,
  ANCILLARY_DEVICE_CIRCUIT_TEST_FACU_HEADER,
  ANCILLARY_DEVICE_CIRCUIT_TEST_FOOTNOTE_FACU,
  ANCILLARY_DEVICE_CIRCUIT_TEST_FOOTNOTE_NOTE,
  ANCILLARY_DEVICE_CIRCUIT_TEST_IDENTIFY_HEADER,
  ANCILLARY_DEVICE_CIRCUIT_TEST_METHOD_HEADER,
  ANCILLARY_DEVICE_CIRCUIT_TEST_NO_HEADER,
  ANCILLARY_DEVICE_CIRCUIT_TEST_OPERATION_HEADER,
  ANCILLARY_DEVICE_CIRCUIT_TEST_OTHER_HEADER,
  ANCILLARY_DEVICE_CIRCUIT_TEST_POWERED_BY_HEADER,
  ANCILLARY_DEVICE_CIRCUIT_TEST_DATA_COLUMNS,
  ANCILLARY_DEVICE_CIRCUIT_TEST_ROW_COUNT,
  ANCILLARY_DEVICE_CIRCUIT_TEST_YES_HEADER,
  normalizeAncillaryDeviceCircuitTestValue,
} from './ancillaryDeviceCircuitTest';
import { renderCheckGlyphHtml } from './checkGlyph';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cellValue(value: string): string {
  const trimmed = value.trim();
  return trimmed ? escapeHtml(trimmed) : '&nbsp;';
}

function renderOperationCells(choice: 'yes' | 'no' | null): string {
  const variants: Array<'yes' | 'no'> = ['yes', 'no'];
  return variants
    .map((variant) => {
      const tdCls =
        variant === 'yes' ? 'adc-td adc-td--yes' : 'adc-td adc-td--no';
      return `<td class="${tdCls}"><span class="adc-check-cell adc-check-cell--readonly">${renderCheckGlyphHtml('adc-check', variant === choice)}</span></td>`;
    })
    .join('');
}

export function renderAncillaryDeviceCircuitTestHtml(value: unknown): string {
  const data = normalizeAncillaryDeviceCircuitTestValue(value);

  const body = data.rows
    .map(
      (row) =>
        `<tr class="adc-row">
          <td class="adc-td adc-td--identify"><span class="adc-cell-value">${cellValue(row.identify)}</span></td>
          <td class="adc-td adc-td--facu"><span class="adc-check-cell adc-check-cell--readonly">${renderCheckGlyphHtml('adc-check', row.poweredByFacu)}</span></td>
          <td class="adc-td adc-td--other"><span class="adc-cell-value">${cellValue(row.poweredByOther)}</span></td>
          ${renderOperationCells(row.operationConfirmed)}
          <td class="adc-td adc-td--method"><span class="adc-cell-value">${cellValue(row.confirmationMethod)}</span></td>
        </tr>`,
    )
    .join('');

  const colgroup = ANCILLARY_DEVICE_CIRCUIT_TEST_DATA_COLUMNS.map(
    (col) =>
      `<col class="adc-col adc-col--${col.key}" style="width:${col.widthPercent}%" />`,
  ).join('');

  return `<div class="adc-panel" style="--adc-body-row-height:${ANCILLARY_DEVICE_CIRCUIT_TEST_BODY_ROW_HEIGHT}">
    <div class="adc-table-wrap">
      <table class="adc-table" data-row-count="${ANCILLARY_DEVICE_CIRCUIT_TEST_ROW_COUNT}">
        <colgroup>${colgroup}</colgroup>
        <thead>
          <tr>
            <th class="adc-th adc-th--identify" rowspan="2">${escapeHtml(ANCILLARY_DEVICE_CIRCUIT_TEST_IDENTIFY_HEADER)}</th>
            <th class="adc-th adc-th--powered-group" colspan="2">${escapeHtml(ANCILLARY_DEVICE_CIRCUIT_TEST_POWERED_BY_HEADER)}</th>
            <th class="adc-th adc-th--operation-group" colspan="3">${escapeHtml(ANCILLARY_DEVICE_CIRCUIT_TEST_OPERATION_HEADER)}</th>
          </tr>
          <tr>
            <th class="adc-th adc-th--facu">${escapeHtml(ANCILLARY_DEVICE_CIRCUIT_TEST_FACU_HEADER)}</th>
            <th class="adc-th adc-th--other">${escapeHtml(ANCILLARY_DEVICE_CIRCUIT_TEST_OTHER_HEADER)}</th>
            <th class="adc-th adc-th--yes">${escapeHtml(ANCILLARY_DEVICE_CIRCUIT_TEST_YES_HEADER)}</th>
            <th class="adc-th adc-th--no">${escapeHtml(ANCILLARY_DEVICE_CIRCUIT_TEST_NO_HEADER)}</th>
            <th class="adc-th adc-th--method">${escapeHtml(ANCILLARY_DEVICE_CIRCUIT_TEST_METHOD_HEADER)}</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <div class="adc-footnotes">
      <p class="adc-footnote">${escapeHtml(ANCILLARY_DEVICE_CIRCUIT_TEST_FOOTNOTE_FACU)}</p>
      <p class="adc-footnote">${escapeHtml(ANCILLARY_DEVICE_CIRCUIT_TEST_FOOTNOTE_NOTE)}</p>
    </div>
  </div>`;
}
