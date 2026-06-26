import {
  CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_BODY_ROW_HEIGHT,
  CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_DATA_COLUMNS,
  CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW1,
  CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW2,
  CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_LEGEND,
  CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_ROW_COUNT,
  circuitFaultToleranceTestSheetChoiceSymbol,
  normalizeCircuitFaultToleranceTestSheetValue,
} from './circuitFaultToleranceTestSheet';

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

function choiceValue(
  choice: ReturnType<typeof normalizeCircuitFaultToleranceTestSheetValue>['rows'][number]['passOrFail'],
): string {
  if (choice === 'pass' || choice === 'fail' || choice === 'na') {
    const symbol = circuitFaultToleranceTestSheetChoiceSymbol(choice);
    const tone =
      choice === 'pass'
        ? 'cfts-choice-value--pass'
        : choice === 'fail'
          ? 'cfts-choice-value--fail'
          : 'cfts-choice-value--na';
    return `<span class="cfts-choice-value ${tone}">${escapeHtml(symbol)}</span>`;
  }
  return '&nbsp;';
}

export function renderCircuitFaultToleranceTestSheetHtml(value: unknown): string {
  const data = normalizeCircuitFaultToleranceTestSheetValue(value);
  const legend = CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_LEGEND.map(
    (item) =>
      `<span class="cfts-legend-item cfts-legend-item--${item.tone}"><span class="cfts-legend-symbol">&quot;${escapeHtml(item.legendSymbol)}&quot;</span> ${escapeHtml(item.label)}</span>`,
  ).join('');

  const colgroup = CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_DATA_COLUMNS.map(
    (col) =>
      `<col class="cfts-col cfts-col--${col.key}" style="width:${col.widthPercent}%"></col>`,
  ).join('');

  const header = `<thead>
    <tr>
      <th class="cfts-th cfts-th--banner cfts-th--location">${escapeHtml(CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW1.location)}</th>
      <th class="cfts-th cfts-th--banner cfts-th--fault-group" colspan="3">${escapeHtml(CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW1.faultGroup)}</th>
      <th class="cfts-th cfts-th--banner cfts-th--isolation">${escapeHtml(CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW1.isolation)}</th>
      <th class="cfts-th cfts-th--banner cfts-th--non-faulted-group" colspan="2">${escapeHtml(CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW1.nonFaultedGroup)}</th>
    </tr>
    <tr>
      <th class="cfts-th cfts-th--sub cfts-th--location-detail">${escapeHtml(CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW2.location)}</th>
      <th class="cfts-th cfts-th--sub cfts-th--short">${escapeHtml(CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW2.short)}</th>
      <th class="cfts-th cfts-th--sub cfts-th--open">${escapeHtml(CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW2.open)}</th>
      <th class="cfts-th cfts-th--sub cfts-th--ground">${escapeHtml(CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW2.ground)}</th>
      <th class="cfts-th cfts-th--sub cfts-th--isolation-detail">${escapeHtml(CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW2.isolation)}</th>
      <th class="cfts-th cfts-th--sub cfts-th--non-faulted-device">${escapeHtml(CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW2.nonFaultedDevice)}</th>
      <th class="cfts-th cfts-th--sub cfts-th--pass-fail">${escapeHtml(CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_HEADER_ROW2.passOrFail)}</th>
    </tr>
  </thead>`;

  const body = data.rows
    .map((row, rowIndex) => {
      const alt = rowIndex % 2 === 1 ? ' cfts-row--alt' : '';
      const cells = [
        `<td class="cfts-td cfts-td--circuitFaultTestLocation"><span class="cfts-cell-value">${cellValue(row.circuitFaultTestLocation)}</span></td>`,
        `<td class="cfts-td cfts-td--short"><span class="cfts-cell-value">${cellValue(row.short)}</span></td>`,
        `<td class="cfts-td cfts-td--open"><span class="cfts-cell-value">${cellValue(row.open)}</span></td>`,
        `<td class="cfts-td cfts-td--ground"><span class="cfts-cell-value">${cellValue(row.ground)}</span></td>`,
        `<td class="cfts-td cfts-td--isolationResults"><span class="cfts-cell-value">${cellValue(row.isolationResults)}</span></td>`,
        `<td class="cfts-td cfts-td--nonFaultedDeviceLocation"><span class="cfts-cell-value">${cellValue(row.nonFaultedDeviceLocation)}</span></td>`,
        `<td class="cfts-td cfts-td--passOrFail">${choiceValue(row.passOrFail)}</td>`,
      ].join('');
      return `<tr class="cfts-row${alt}">${cells}</tr>`;
    })
    .join('');

  return `<div class="cfts-panel" style="--cfts-row-count:${CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_ROW_COUNT};--cfts-body-row-height:${CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_BODY_ROW_HEIGHT}">
    <div class="cfts-legend">${legend}</div>
    <div class="cfts-table-wrap">
      <table class="cfts-table" data-row-count="${CIRCUIT_FAULT_TOLERANCE_TEST_SHEET_ROW_COUNT}">
        <colgroup>${colgroup}</colgroup>
        ${header}
        <tbody>${body}</tbody>
      </table>
    </div>
  </div>`;
}
