import {
  FDTL_SENSITIVITY_METHOD_LABEL,
  FDTL_SENSITIVITY_RANGE_LABEL,
  FDTL_TABLE_ITEMS,
  fdtlDataRowZebraIndexes,
  normalizeFieldDeviceTestingLegendValue,
  type FdtlDeviceEntry,
  type FdtlTableItem,
} from './fieldDeviceTestingLegend';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function zebraClass(zebra: number): string {
  return zebra % 2 === 0 ? 'fdtl-row--yellow' : 'fdtl-row--white';
}

function renderFieldValue(value: string): string {
  const text = value.trim() ? escapeHtml(value) : '&nbsp;';
  return `<div class="fdtl-field-box"><span class="fdtl-field-value">${text}</span></div>`;
}

function renderTypeModelCells(entry: FdtlDeviceEntry): string {
  return `<td class="fdtl-td fdtl-td--type">${renderFieldValue(entry.type)}</td><td class="fdtl-td fdtl-td--model">${renderFieldValue(entry.modelNumber)}</td>`;
}

function renderBlockedTypeModelCells(): string {
  return '<td class="fdtl-td fdtl-td--type fdtl-td--blocked" aria-hidden="true"></td><td class="fdtl-td fdtl-td--model fdtl-td--blocked" aria-hidden="true"></td>';
}

function renderSmokeSubRow(
  label: string,
  value: string,
  zebra: number,
): string {
  return `<tr class="fdtl-row ${zebraClass(zebra)} fdtl-row--sub">
    <td class="fdtl-td fdtl-td--desc fdtl-td--sub">
      <div class="fdtl-sub-field">
        <span class="fdtl-sub-label">${escapeHtml(label)}</span>
        <div class="fdtl-sub-input">${renderFieldValue(value)}</div>
      </div>
    </td>
    ${renderBlockedTypeModelCells()}
  </tr>`;
}

function renderSimpleRow(item: Extract<FdtlTableItem, { kind: 'simple' }>, entry: FdtlDeviceEntry, zebra: number): string {
  return `<tr class="fdtl-row ${zebraClass(zebra)}">
    <td class="fdtl-td fdtl-td--device">${escapeHtml(item.device)}</td>
    <td class="fdtl-td fdtl-td--desc">${escapeHtml(item.description)}</td>
    ${renderTypeModelCells(entry)}
  </tr>`;
}

function renderSmokeRows(item: Extract<FdtlTableItem, { kind: 'smoke' }>, entry: FdtlDeviceEntry, zebra: number): string {
  return `<tr class="fdtl-row ${zebraClass(zebra)} fdtl-row--smoke-main">
    <td class="fdtl-td fdtl-td--device" rowspan="3">${escapeHtml(item.device)}</td>
    <td class="fdtl-td fdtl-td--desc">${escapeHtml(item.description)}</td>
    ${renderTypeModelCells(entry)}
  </tr>${renderSmokeSubRow(FDTL_SENSITIVITY_METHOD_LABEL, entry.sensitivityTestMethod, zebra)}${renderSmokeSubRow(FDTL_SENSITIVITY_RANGE_LABEL, entry.manufacturerSensitivityRange, zebra)}`;
}

function renderTableBody(value: unknown): string {
  const data = normalizeFieldDeviceTestingLegendValue(value);
  const zebraMap = fdtlDataRowZebraIndexes();

  return FDTL_TABLE_ITEMS.map((item) => {
    if (item.kind === 'section') {
      return `<tr class="fdtl-row fdtl-row--section"><td class="fdtl-td fdtl-td--section" colspan="4">${escapeHtml(item.title)}</td></tr>`;
    }
    const entry = data.devices[item.id] ?? {
      type: '',
      modelNumber: '',
      sensitivityTestMethod: '',
      manufacturerSensitivityRange: '',
    };
    const zebra = zebraMap.get(item.id) ?? 0;
    return item.kind === 'smoke'
      ? renderSmokeRows(item, entry, zebra)
      : renderSimpleRow(item, entry, zebra);
  }).join('');
}

export function renderFieldDeviceTestingLegendHtml(value: unknown): string {
  return `<div class="fdtl-panel">
    <div class="fdtl-table-wrap">
      <table class="fdtl-table">
        <colgroup>
          <col class="fdtl-col fdtl-col--device" />
          <col class="fdtl-col fdtl-col--desc" />
          <col class="fdtl-col fdtl-col--type" />
          <col class="fdtl-col fdtl-col--model" />
        </colgroup>
        <thead>
          <tr>
            <th class="fdtl-th fdtl-th--device">Device</th>
            <th class="fdtl-th fdtl-th--desc">Description</th>
            <th class="fdtl-th fdtl-th--type">Type</th>
            <th class="fdtl-th fdtl-th--model">Model Number</th>
          </tr>
        </thead>
        <tbody>${renderTableBody(value)}</tbody>
      </table>
    </div>
  </div>`;
}
