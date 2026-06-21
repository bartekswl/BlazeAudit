import type { YesNoSummaryItem, YesNoSummaryItemValue } from './types';
import { normalizeYesNoSummaryValue } from './yesNoSummary';

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

function fillInHtml(text: string | undefined): string {
  const trimmed = text?.trim();
  return trimmed
    ? `<span class="yns-fill-value">${escapeHtml(trimmed)}</span>`
    : '<span class="yns-fill-line"></span>';
}

function summaryCellHtml(
  item: YesNoSummaryItem,
  row: YesNoSummaryItemValue | undefined,
): string {
  if (!item.fillIn) {
    return `<span class="yns-summary-text">${escapeHtml(item.text)}</span>`;
  }
  const after = item.textAfterFill
    ? `<span class="yns-summary-text">${escapeHtml(item.textAfterFill)}</span>`
    : '';
  return `<span class="yns-summary-text">${escapeHtml(item.text)}</span>${fillInHtml(row?.fillIn)}${after}`;
}

/** Read-only Yes/No/Summary table — same structure/classes as FormYesNoSummaryView. */
export function renderYesNoSummaryHtml(
  items: YesNoSummaryItem[],
  valueRaw: unknown,
): string {
  const value = normalizeYesNoSummaryValue(valueRaw, items);

  const body = items
    .map((item) => {
      const row = value[item.id];
      return `<tr class="yns-row">
        <td class="yns-td yns-td--yes"><span class="yns-check">${checkMark(row?.choice === 'yes')}</span></td>
        <td class="yns-td yns-td--no"><span class="yns-check">${checkMark(row?.choice === 'no')}</span></td>
        <td class="yns-td yns-td--summary">${summaryCellHtml(item, row)}</td>
      </tr>`;
    })
    .join('');

  return `<div class="yns-table-wrap"><table class="yns-table">
    <thead><tr>
      <th class="yns-th yns-th--yes">Yes</th>
      <th class="yns-th yns-th--no">No</th>
      <th class="yns-th yns-th--summary">Summary</th>
    </tr></thead>
    <tbody>${body}</tbody>
  </table></div>`;
}
