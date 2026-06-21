import { formatInspectionDateLabel } from '../dates';
import {
  AFFIRMATION_CONDUCTING_LABELS,
  AFFIRMATION_PRIMARY_LABELS,
  AFFIRMATION_TEXT_AFTER_PAGES,
  AFFIRMATION_TEXT_BEFORE_PAGES,
  normalizeAffirmationValue,
  resolveAffirmationTechnicianIdentification,
  resolveAffirmationTechnicianName,
  type AffirmationInspectorOption,
  type AffirmationTechnicianKey,
  type AffirmationTechnicianValue,
  type AffirmationValue,
} from './affirmation';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fieldValue(text: string | null | undefined): string {
  const trimmed = text?.trim();
  return trimmed ? escapeHtml(trimmed) : '&nbsp;';
}

function formatAffirmationDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return '&nbsp;';
  return escapeHtml(formatInspectionDateLabel(iso));
}

function technicianFieldsHtml(
  tech: AffirmationTechnicianValue,
  inspectors: AffirmationInspectorOption[],
): string {
  const name = resolveAffirmationTechnicianName(tech, inspectors);
  const identification = resolveAffirmationTechnicianIdentification(tech, inspectors);
  return `<div class="aff-fields">
    <div class="aff-cell aff-cell--name">${fieldValue(name)}</div>
    <div class="aff-cell aff-cell--identification">${fieldValue(identification)}</div>
    <div class="aff-cell aff-cell--date">${formatAffirmationDate(tech.date)}</div>
    <div class="aff-cell aff-cell--sig">${fieldValue(tech.signature)}</div>
  </div>`;
}

function labelsHtml(labels: readonly string[]): string {
  return `<div class="aff-labels">${labels
    .map((label) => `<div class="aff-label">${escapeHtml(label)}</div>`)
    .join('')}</div>`;
}

function technicianBlockHtml(
  technician: AffirmationTechnicianKey,
  value: AffirmationValue,
  labels: readonly string[],
  inspectors: AffirmationInspectorOption[],
): string {
  const tech = value[technician];
  return `<div class="aff-tech">${technicianFieldsHtml(tech, inspectors)}${labelsHtml(labels)}</div>`;
}

/** Read-only Affirmation block — same structure/classes as FormAffirmationView. */
export function renderAffirmationHtml(
  valueRaw: unknown,
  options: {
    totalPages: number;
    inspectors?: AffirmationInspectorOption[];
  },
): string {
  const value = normalizeAffirmationValue(valueRaw);
  const inspectors = options.inspectors ?? [];
  const pageCount = String(Math.max(1, options.totalPages));

  return `<div class="aff-panel">
    <div class="aff-title">Affirmation</div>
    <div class="aff-body">
      <span class="aff-body-text">${escapeHtml(AFFIRMATION_TEXT_BEFORE_PAGES)} <span class="aff-page-count-value">${pageCount}</span>${escapeHtml(AFFIRMATION_TEXT_AFTER_PAGES)}</span>
    </div>
    ${technicianBlockHtml('primary', value, AFFIRMATION_PRIMARY_LABELS, inspectors)}
    ${technicianBlockHtml('conducting', value, AFFIRMATION_CONDUCTING_LABELS, inspectors)}
  </div>`;
}
