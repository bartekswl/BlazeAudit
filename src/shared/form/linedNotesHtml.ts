import {
  RECOMMENDATIONS_ROW_COUNT,
  TESTING_NOTES_ROW_COUNT,
  normalizeLinedNotesValue,
} from './linedNotes';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderRuleRows(count: number): string {
  const safeCount = Math.max(1, count);
  return `<div class="ln-rows" aria-hidden="true">${Array.from({ length: safeCount }, () => '<div class="ln-row"></div>').join('')}</div>`;
}

function renderBody(value: unknown, lineCount: number): string {
  const text = normalizeLinedNotesValue(value).trim();
  const content = text ? escapeHtml(text) : '&nbsp;';
  return `<div class="ln-body-stack ln-body-stack--fill" style="--ln-visible-lines: ${lineCount}">
    ${renderRuleRows(lineCount)}
    <div class="ln-body ln-body--readonly">${content}</div>
  </div>`;
}

export function renderRecommendationsHtml(value: unknown, lineCount = RECOMMENDATIONS_ROW_COUNT): string {
  return `<div class="ln-panel ln-panel--green">
    <div class="ln-head-bar" aria-hidden="true"></div>
    ${renderBody(value, lineCount)}
  </div>`;
}

export function renderTestingNotesHtml(value: unknown, lineCount = TESTING_NOTES_ROW_COUNT): string {
  return `<div class="ln-panel ln-panel--blue">
    <div class="ln-head-bar" aria-hidden="true"></div>
    ${renderBody(value, lineCount)}
  </div>`;
}
