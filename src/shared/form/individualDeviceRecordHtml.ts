import {
  INDIVIDUAL_DEVICE_RECORD_COLUMNS,
  INDIVIDUAL_DEVICE_RECORD_LEGEND,
  INDIVIDUAL_DEVICE_RECORD_ROW_COUNT,
  individualDeviceRecordChoiceSymbol,
  normalizeIndividualDeviceRecordValue,
} from './individualDeviceRecord';

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

function choiceValue(choice: ReturnType<typeof normalizeIndividualDeviceRecordValue>['rows'][number][keyof ReturnType<typeof normalizeIndividualDeviceRecordValue>['rows'][number]]): string {
  if (choice === 'yes' || choice === 'no' || choice === 'na') {
    const symbol = individualDeviceRecordChoiceSymbol(choice);
    const tone =
      choice === 'yes' ? 'idr-choice-value--yes' : choice === 'no' ? 'idr-choice-value--no' : 'idr-choice-value--na';
    return `<span class="idr-choice-value ${tone}">${escapeHtml(symbol)}</span>`;
  }
  return '&nbsp;';
}

export function renderIndividualDeviceRecordHtml(value: unknown): string {
  const data = normalizeIndividualDeviceRecordValue(value);
  const legend = INDIVIDUAL_DEVICE_RECORD_LEGEND.map(
    (item) =>
      `<span class="idr-legend-item idr-legend-item--${item.tone}"><span class="idr-legend-symbol">&quot;${escapeHtml(item.legendSymbol)}&quot;</span> ${escapeHtml(item.label)}</span>`,
  ).join('');

  const header = INDIVIDUAL_DEVICE_RECORD_COLUMNS.map((col) => {
    const vertical = col.orientation === 'vertical' ? ' idr-th--vertical' : ' idr-th--horizontal';
    const titleHtml = escapeHtml(col.title).replace(/\n/g, '<br />');
    return `<th class="idr-th${vertical} idr-th--${col.key}" style="width:${col.widthPercent}%"><span class="idr-th-text">${titleHtml}</span></th>`;
  }).join('');

  const body = data.rows
    .map((row, rowIndex) => {
      const alt = rowIndex % 2 === 1 ? ' idr-row--alt' : '';
      const cells = INDIVIDUAL_DEVICE_RECORD_COLUMNS.map((col) => {
        const cell = row[col.key];
        const inner =
          col.kind === 'choice'
            ? choiceValue(cell as 'yes' | 'no' | 'na' | null)
            : `<span class="idr-cell-value">${cellValue(cell as string)}</span>`;
        return `<td class="idr-td idr-td--${col.key}">${inner}</td>`;
      }).join('');
      return `<tr class="idr-row${alt}">${cells}</tr>`;
    })
    .join('');

  return `<div class="idr-panel" style="--idr-row-count:${INDIVIDUAL_DEVICE_RECORD_ROW_COUNT}">
    <div class="idr-legend">${legend}</div>
    <div class="idr-table-wrap">
      <table class="idr-table" data-row-count="${INDIVIDUAL_DEVICE_RECORD_ROW_COUNT}">
        <colgroup>${INDIVIDUAL_DEVICE_RECORD_COLUMNS.map(
          (col) =>
            `<col class="idr-col idr-col--${col.key}" style="width:${col.widthPercent}%"></col>`,
        ).join('')}</colgroup>
        <thead><tr>${header}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  </div>`;
}
