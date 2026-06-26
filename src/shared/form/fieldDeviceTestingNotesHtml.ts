import {
  FIELD_DEVICE_TESTING_NOTES_INTRO,
  FIELD_DEVICE_TESTING_NOTES_ITEMS,
} from './fieldDeviceTestingNotes';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderFieldDeviceTestingNotesHtml(): string {
  const items = FIELD_DEVICE_TESTING_NOTES_ITEMS.map(
    (text) => `<li class="fdtn-item">${escapeHtml(text)}</li>`,
  ).join('');

  return `<div class="fdtn-panel">
    <p class="fdtn-intro">${escapeHtml(FIELD_DEVICE_TESTING_NOTES_INTRO)}</p>
    <ol class="fdtn-list">${items}</ol>
  </div>`;
}
