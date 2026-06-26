import { type KeyboardEvent as ReactKeyboardEvent } from 'react';

/** Enter in a fixed-row grid: move to the same column on the next row, never past the last row. */
export function handleFixedRowGridTextInputKeyDown(
  event: ReactKeyboardEvent<HTMLInputElement>,
): void {
  if (event.key !== 'Enter') return;
  event.preventDefault();

  const input = event.currentTarget;
  const cell = input.closest('td');
  const row = input.closest('tr');
  const table = input.closest('table');
  if (!cell || !row || !table) return;

  const rowCount = Number(table.dataset.rowCount);
  if (!Number.isFinite(rowCount) || rowCount < 1) return;

  const tbody = row.parentElement;
  if (!tbody || tbody.tagName !== 'TBODY') return;

  const rowIndex = Array.prototype.indexOf.call(tbody.children, row);
  if (rowIndex < 0 || rowIndex >= rowCount - 1) return;

  const nextRow = tbody.children[rowIndex + 1] as HTMLTableRowElement | undefined;
  if (!nextRow) return;

  const nextCell = nextRow.children[cell.cellIndex] as HTMLElement | undefined;
  if (!nextCell) return;

  const nextField = nextCell.querySelector<HTMLInputElement>(
    'input:not([type=radio]):not([type=checkbox])',
  );
  nextField?.focus();
}
