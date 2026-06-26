import type { DocumentContext } from '../document';
import { normalizeIsoDateInput } from '../dates';
import {
  formatBusinessCompanyDisplay,
  normalizeUlcSection1Value,
  resolveUlcSection1Field,
  type UlcSection1Value,
} from './ulcSection1';
import { renderCheckGlyphHtml } from './checkGlyph';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? escapeHtml(trimmed) : '&nbsp;';
}

function systemCheck(label: string, checked: boolean): string {
  return `<label class="ulc-s1-check">${renderCheckGlyphHtml('ulc-s1-check-box', checked)}<span>${escapeHtml(label)}</span></label>`;
}

function fieldCell(
  key: keyof UlcSection1Value,
  label: string,
  value: UlcSection1Value,
  context: DocumentContext,
  extraClass = '',
): string {
  const text = resolveUlcSection1Field(key, value, context);
  const cls = extraClass ? `ulc-s1-cell ${extraClass}` : 'ulc-s1-cell';
  return `<div class="${cls}"><div class="ulc-s1-label">${escapeHtml(label)}</div><div class="ulc-s1-value">${dash(text)}</div></div>`;
}

function dateCell(
  key: 'dateOfService' | 'lastServiceDate',
  label: string,
  value: UlcSection1Value,
  context: DocumentContext,
): string {
  const text = normalizeIsoDateInput(resolveUlcSection1Field(key, value, context));
  return `<div class="ulc-s1-cell"><div class="ulc-s1-label">${escapeHtml(label)}</div><div class="ulc-s1-value">${dash(text)}</div></div>`;
}

function phoneFaxCell(
  phoneKey: keyof UlcSection1Value,
  faxKey: keyof UlcSection1Value,
  value: UlcSection1Value,
  context: DocumentContext,
): string {
  const phone = resolveUlcSection1Field(phoneKey, value, context);
  const fax = resolveUlcSection1Field(faxKey, value, context);
  return `<div class="ulc-s1-phone-fax"><div class="ulc-s1-cell"><div class="ulc-s1-label">Phone:</div><div class="ulc-s1-value">${dash(phone)}</div></div><div class="ulc-s1-cell"><div class="ulc-s1-label">Fax:</div><div class="ulc-s1-value">${dash(fax)}</div></div></div>`;
}

function companyBlockHtml(context: DocumentContext): string {
  const placeholder =
    'Service Company Information (Address, Telephone, &amp; Contact Information)';
  const display = formatBusinessCompanyDisplay(context.business);

  if (!display) {
    return `<span class="ulc-s1-company-placeholder">${placeholder}</span>`;
  }

  const parts: string[] = [];
  if (display.name) parts.push(`<div class="ulc-s1-company-name">${escapeHtml(display.name)}</div>`);
  if (display.phone) parts.push(`<div class="ulc-s1-company-line">${escapeHtml(display.phone)}</div>`);
  if (display.email) parts.push(`<div class="ulc-s1-company-line">${escapeHtml(display.email)}</div>`);
  if (display.addressProvince) {
    parts.push(`<div class="ulc-s1-company-line">${escapeHtml(display.addressProvince)}</div>`);
  }
  if (display.postCountry) {
    parts.push(`<div class="ulc-s1-company-line">${escapeHtml(display.postCountry)}</div>`);
  }
  return `<div class="ulc-s1-company-details">${parts.join('')}</div>`;
}

/** Read-only ULC section HTML — same structure/classes as FormUlcSection1View. */
export function renderUlcSection1Html(valueRaw: unknown, context: DocumentContext): string {
  const value = normalizeUlcSection1Value(valueRaw);
  const logoUrl = context.business.logoDataUrl;

  const logoBlock = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="Company logo" class="ulc-s1-logo-img" />`
    : '<span class="ulc-s1-logo-placeholder">Company Logo</span>';

  return [
    '<div class="ulc-s1-panel">',
    '<div class="ulc-s1-top">',
    '<div class="ulc-s1-company">',
    `<div class="ulc-s1-company-inner"><div class="ulc-s1-logo">${logoBlock}</div><div class="ulc-s1-company-text">${companyBlockHtml(context)}</div></div>`,
    '</div>',
    '<div class="ulc-s1-service">',
    `<div class="ulc-s1-service-row ulc-s1-service-row--header">${dateCell('dateOfService', 'Date of Service:', value, context)}${dateCell('lastServiceDate', 'Last Service Date:', value, context)}${fieldCell('workOrderNumber', 'Work Order Number:', value, context)}</div>`,
    `<div class="ulc-s1-service-row ulc-s1-service-row--stage"><span class="ulc-s1-check">${renderCheckGlyphHtml('ulc-s1-check-box', value.stageSingle)}<span>Single Stage</span></span><span class="ulc-s1-check">${renderCheckGlyphHtml('ulc-s1-check-box', value.stageTwo)}<span>Two Stage</span></span><span class="ulc-s1-check ulc-s1-check--other">${renderCheckGlyphHtml('ulc-s1-check-box', value.stageOther)}<span>Other:</span><span class="ulc-s1-value ulc-s1-value--inline">${dash(value.stageOtherText)}</span></span></div>`,
    '<div class="ulc-s1-system-block">',
    `<div class="ulc-s1-system-types"><div class="ulc-s1-system-row">${systemCheck('Addressable', value.systemAddressable)}${systemCheck('Conventional', value.systemConventional)}</div><div class="ulc-s1-system-row ulc-s1-system-row--alt">${systemCheck('Wireless', value.systemWireless)}${systemCheck('Hybrid', value.systemHybrid)}</div></div>`,
    `<div class="ulc-s1-circuits"><div class="ulc-s1-circuits-title">Number of Conventional Circuits</div>${fieldCell('circuitsInitiating', 'Initiating:', value, context)}${fieldCell('circuitsNotification', 'Notification:', value, context)}${fieldCell('circuitsVoicePaging', 'Voice Paging:', value, context)}</div>`,
    '</div>',
    `<div class="ulc-s1-service-row ulc-s1-service-row--header">${fieldCell('manufacturer', 'Manufacturer:', value, context)}${fieldCell('modelNumber', 'Model Number:', value, context)}${fieldCell('ulcSerialNumber', 'ULC Serial Number:', value, context)}</div>`,
    '</div>',
    '</div>',
    '<div class="ulc-s1-bottom">',
    `<div class="ulc-s1-bottom-row ulc-s1-bottom-row--3col">${fieldCell('buildingName', 'Building Name:', value, context, 'ulc-s1-cell--wide')}${fieldCell('contactPerson', 'Contact Person:', value, context, 'ulc-s1-cell--medium')}${phoneFaxCell('contactPhone', 'contactFax', value, context)}</div>`,
    `<div class="ulc-s1-bottom-row ulc-s1-bottom-row--3col">${fieldCell('address', 'Address:', value, context, 'ulc-s1-cell--wide')}${fieldCell('ownerPropertyManager', 'Owner/Property Manager/Strata Number:', value, context, 'ulc-s1-cell--medium')}${phoneFaxCell('ownerPhone', 'ownerFax', value, context)}</div>`,
    `<div class="ulc-s1-bottom-row ulc-s1-bottom-row--3col"><div class="ulc-s1-city-postal">${fieldCell('city', 'City:', value, context)}${fieldCell('postalCode', 'Postal Code:', value, context)}</div>${fieldCell('fireSignalCentre', 'Fire Signal Receiving Centre (Section 22.11):', value, context)}${phoneFaxCell('fireSignalPhone', 'fireSignalFax', value, context)}</div>`,
    '</div>',
    '</div>',
  ].join('');
}
