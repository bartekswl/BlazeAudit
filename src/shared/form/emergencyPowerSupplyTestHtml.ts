import {
  EMERGENCY_POWER_SUPPLY_BATTERY_CAPACITY_LABEL,
  EMERGENCY_POWER_SUPPLY_BATTERY_TYPE_LABEL,
  EMERGENCY_POWER_SUPPLY_BATTERY_TYPE_OPTIONS,
  EMERGENCY_POWER_SUPPLY_GENERATOR_ROWS,
  EMERGENCY_POWER_SUPPLY_GENERATOR_TITLE,
  EMERGENCY_POWER_SUPPLY_NBC_TIME_LABEL,
  EMERGENCY_POWER_SUPPLY_NBC_TIME_OPTIONS,
  EMERGENCY_POWER_SUPPLY_PROVIDED_BY_LABEL,
  EMERGENCY_POWER_SUPPLY_PROVIDED_BY_OPTIONS,
  EMERGENCY_POWER_SUPPLY_TEST_FIELD_LOCATION_LABEL,
  EMERGENCY_POWER_SUPPLY_TEST_IDENTIFICATION_LABEL,
  EMERGENCY_POWER_SUPPLY_TEST_ROWS,
  EMERGENCY_POWER_SUPPLY_TEST_SUBTITLE,
  EMERGENCY_POWER_SUPPLY_TEST_TYPE_OPTIONS,
  EMERGENCY_POWER_SUPPLY_TEST_REF,
  measureCurrentLabel,
  measureCurrentUnit,
  measureVoltageLabel,
  normalizeEmergencyPowerSupplyTestValue,
} from './emergencyPowerSupplyTest';
import { renderCheckGlyphHtml } from './checkGlyph';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInfoValue(value: string): string {
  return `<span class="epst-info-value">${escapeHtml(value.trim() || '\u00a0')}</span>`;
}

function renderChoiceCells(choice: 'yes' | 'no' | 'na' | null): string {
  return (['yes', 'no', 'na'] as const)
    .map((variant) => {
      const tdCls =
        variant === 'yes'
          ? 'epst-td epst-td--yes'
          : variant === 'no'
            ? 'epst-td epst-td--no'
            : 'epst-td epst-td--na';
      return `<td class="${tdCls}"><span class="epst-check-cell epst-check-cell--readonly">${renderCheckGlyphHtml('epst-check', variant === choice)}</span></td>`;
    })
    .join('');
}

function renderOliveChoiceBlock(variant?: 'c' | 'd' | 'e', rowSpan?: number): string {
  const variantCls =
    variant === 'c'
      ? ' epst-td--choice-block-c'
      : variant === 'd'
        ? ' epst-td--choice-block-d'
        : variant === 'e'
          ? ' epst-td--choice-block-e'
          : '';
  const rowSpanAttr = rowSpan ? ` rowspan="${rowSpan}"` : '';
  return `<td class="epst-td epst-td--choice-block${variantCls}" colspan="3"${rowSpanAttr} aria-hidden="true"></td>`;
}

function renderFieldValue(value: string, flex = false, spec = false): string {
  const cls = flex
    ? 'epst-field-value epst-field-value--flex'
    : spec
      ? 'epst-spec-input epst-field-input epst-field-value'
      : 'epst-field-value';
  return `<span class="${cls}">${escapeHtml(value || '\u00a0')}</span>`;
}

function renderDescLine(
  label: string,
  value?: string,
  unit?: string,
  flex = false,
  wide = false,
): string {
  const lineCls = wide ? 'epst-desc-line epst-desc-line--wide' : 'epst-desc-line';
  const fieldHtml =
    value !== undefined
      ? `${renderFieldValue(value, flex)}${unit ? `<span class="epst-field-unit">${escapeHtml(unit)}</span>` : ''}`
      : '';
  return `<div class="${lineCls}"><span class="epst-desc-text">${escapeHtml(label)}</span>${fieldHtml}</div>`;
}

function renderMeasureRows(
  variant: 'c' | 'd' | 'e',
  letter: string,
  fields: { voltage: string; current: string },
): string {
  const measureBg = `epst-td--measure-${variant}`;
  const lines = [
    { field: 'voltage' as const, label: measureVoltageLabel(variant), unit: 'VDC' },
    {
      field: 'current' as const,
      label: measureCurrentLabel(variant),
      unit: measureCurrentUnit(variant),
    },
  ];

  return lines
    .map(
      (line, index) =>
        `<tr class="epst-row epst-row--measure-${variant}"><td class="epst-td epst-td--letter ${measureBg}">${index === 0 ? escapeHtml(letter) : ''}</td><td class="epst-td epst-td--desc ${measureBg}">${renderDescLine(line.label, fields[line.field], line.unit)}</td>${index === 0 ? renderOliveChoiceBlock(variant, 2) : ''}</tr>`,
    )
    .join('');
}

const EPST_COLGROUP = `<colgroup><col class="epst-col-letter" /><col class="epst-col-desc" /><col class="epst-col-yes" /><col class="epst-col-no" /><col class="epst-col-na" /></colgroup>`;

export function renderEmergencyPowerSupplyTestHtml(value: unknown): string {
  const data = normalizeEmergencyPowerSupplyTestValue(value);

  const specProvided = EMERGENCY_POWER_SUPPLY_PROVIDED_BY_OPTIONS.map(
    (opt) =>
      `<span class="epst-spec-option">${renderCheckGlyphHtml('epst-spec-check', data.providedBy[opt.id] ?? false)}<span>${escapeHtml(opt.label)}</span></span>`,
  ).join('');
  const specBatteryType = EMERGENCY_POWER_SUPPLY_BATTERY_TYPE_OPTIONS.map(
    (opt) =>
      `<span class="epst-spec-option">${renderCheckGlyphHtml('epst-spec-check', data.batteryType[opt.id] ?? false)}<span>${escapeHtml(opt.label)}</span></span>`,
  ).join('');
  const specNbc = EMERGENCY_POWER_SUPPLY_NBC_TIME_OPTIONS.map(
    (opt) =>
      `<span class="epst-spec-option">${renderCheckGlyphHtml('epst-spec-check', data.nbcAlarmTime === opt.id)}<span>${escapeHtml(opt.label)}</span></span>`,
  ).join('');

  const body = EMERGENCY_POWER_SUPPLY_TEST_ROWS.map((row, rowIndex) => {
    const altRow = rowIndex % 2 === 1 ? ' epst-row--alt' : '';
    if (row.kind === 'batteryMeasure' && row.measureVariant) {
      return renderMeasureRows(row.measureVariant, row.letter, data.measures[row.measureVariant]);
    }
    if (row.kind === 'textFill') {
      return `<tr class="epst-row${altRow}"><td class="epst-td epst-td--letter">${escapeHtml(row.letter)}</td><td class="epst-td epst-td--desc epst-td--text-fill">${renderDescLine(row.text, data.dateCode, undefined, true, true)}</td>${renderOliveChoiceBlock()}</tr>`;
    }
    if (row.kind === 'valueFill') {
      const key = row.valueKey ?? (row.id === 'epst-p' ? 'p' : row.id === 'epst-q' ? 'q' : 's');
      return `<tr class="epst-row${altRow}"><td class="epst-td epst-td--letter">${escapeHtml(row.letter)}</td><td class="epst-td epst-td--desc epst-td--value-fill">${renderDescLine(row.text, data.valueFills[key], row.valueUnit)}</td>${renderOliveChoiceBlock()}</tr>`;
    }
    if (row.kind === 'testType') {
      const subs = EMERGENCY_POWER_SUPPLY_TEST_TYPE_OPTIONS.map((opt) => {
        const choice = data.testType[opt.key];
        const specify =
          opt.key === 'iii'
            ? ` ${renderFieldValue(data.testType.specify, true)}`
            : '';
        return `<tr class="epst-row epst-row--sub"><td class="epst-td epst-td--letter"></td><td class="epst-td epst-td--desc epst-td--sub"><span class="epst-desc-text">(${escapeHtml(opt.id)}) ${escapeHtml(opt.label)}</span>${specify}</td>${renderChoiceCells(choice)}</tr>`;
      }).join('');
      return `<tr class="epst-row epst-row--group-head"><td class="epst-td epst-td--letter">${escapeHtml(row.letter)}</td><td class="epst-td epst-td--desc" colspan="4"><span class="epst-desc-text">${escapeHtml(row.text)}</span></td></tr>${subs}`;
    }
    const rowValue = data.checklist[row.id] ?? { choice: null };
    return `<tr class="epst-row${altRow}"><td class="epst-td epst-td--letter">${escapeHtml(row.letter)}</td><td class="epst-td epst-td--desc"><span class="epst-desc-text">${escapeHtml(row.text)}</span></td>${renderChoiceCells(rowValue.choice)}</tr>`;
  }).join('');

  const generator = EMERGENCY_POWER_SUPPLY_GENERATOR_ROWS.map((row, index) => {
    const rowValue = data.checklist[row.id] ?? { choice: null };
    const altRow = index % 2 === 1 ? ' epst-row--alt' : '';
    return `<tr class="epst-row${altRow}"><td class="epst-td epst-td--letter">${escapeHtml(row.letter)}</td><td class="epst-td epst-td--desc"><span class="epst-desc-text">${escapeHtml(row.text)}</span></td>${renderChoiceCells(rowValue.choice)}</tr>`;
  }).join('');

  return `<div class="epst-panel">
    <div class="epst-banner">
      <div class="epst-banner-line">${escapeHtml(EMERGENCY_POWER_SUPPLY_TEST_SUBTITLE)}</div>
      <div class="epst-banner-line">${escapeHtml(EMERGENCY_POWER_SUPPLY_TEST_REF)}</div>
    </div>
    <div class="epst-info-strip">
      <div class="epst-info-row"><span class="epst-info-label">${escapeHtml(EMERGENCY_POWER_SUPPLY_TEST_FIELD_LOCATION_LABEL)}</span>${renderInfoValue(data.fieldLocation)}</div>
      <div class="epst-info-row"><span class="epst-info-label">${escapeHtml(EMERGENCY_POWER_SUPPLY_TEST_IDENTIFICATION_LABEL)}</span>${renderInfoValue(data.identification)}</div>
    </div>
    <div class="epst-spec-strip">
      <div class="epst-spec-row"><span class="epst-spec-label">${escapeHtml(EMERGENCY_POWER_SUPPLY_PROVIDED_BY_LABEL)}</span><span class="epst-spec-options">${specProvided}</span></div>
      <div class="epst-spec-row"><span class="epst-spec-label">${escapeHtml(EMERGENCY_POWER_SUPPLY_BATTERY_TYPE_LABEL)}</span><span class="epst-spec-options">${specBatteryType}</span></div>
      <div class="epst-spec-row"><span class="epst-spec-label">${escapeHtml(EMERGENCY_POWER_SUPPLY_BATTERY_CAPACITY_LABEL)}</span><span class="epst-spec-inline">${renderFieldValue(data.batteryCapacity, false, true)}<span class="epst-spec-unit">AH</span></span></div>
      <div class="epst-spec-row"><span class="epst-spec-label">${escapeHtml(EMERGENCY_POWER_SUPPLY_NBC_TIME_LABEL)}</span><span class="epst-spec-options">${specNbc}</span></div>
    </div>
    <div class="epst-table-wrap"><table class="epst-table">${EPST_COLGROUP}<thead><tr><th class="epst-th epst-th--letter"></th><th class="epst-th epst-th--intro"></th><th class="epst-th epst-th--yes">Yes</th><th class="epst-th epst-th--no">No</th><th class="epst-th epst-th--na">N/A</th></tr></thead><tbody>${body}</tbody></table></div>
    <div class="epst-generator"><div class="epst-generator-title">${escapeHtml(EMERGENCY_POWER_SUPPLY_GENERATOR_TITLE)}</div><table class="epst-table epst-table--generator">${EPST_COLGROUP}<tbody>${generator}</tbody></table></div>
  </div>`;
}
