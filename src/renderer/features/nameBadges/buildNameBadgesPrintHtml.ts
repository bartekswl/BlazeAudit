import {
  NAME_BADGE_HEIGHT_MM,
  NAME_BADGE_WIDTH_MM,
  nameBadgeGridLayout,
  type NameBadgePrintContext,
  type NameBadgePrintSlot,
} from '../../../shared/nameBadges';

const MAROON = '#7a1029';
const MAROON_LIGHT = '#9b1b30';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeCssUrl(dataUrl: string): string {
  // data: URLs used here are base64 — no quotes/newlines expected; still harden.
  return dataUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '');
}

const ICON_PERSON = `<svg class="badge-label-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

const ICON_BRIEFCASE = `<svg class="badge-label-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="8" width="18" height="12" rx="1.5" stroke="currentColor" stroke-width="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2"/></svg>`;

const ICON_SHIELD = `<svg class="badge-banner-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2l8 3v6c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V5l8-3z" fill="white" stroke="white" stroke-width="0.5"/><path d="M12 7c-1.5 1.2-2.5 2.8-2.8 4.8h5.6C14.5 9.8 13.5 8.2 12 7z" fill="${MAROON}"/><path d="M10 13.5h4l-.4 2.2c-.2.9-.9 1.5-1.8 1.5s-1.6-.6-1.8-1.5L10 13.5z" fill="${MAROON}"/></svg>`;

function renderBrandLogo(businessName: string, hasLogo: boolean): string {
  const company = escapeHtml(businessName.trim() || 'Company');
  if (hasLogo) {
    // Background image is declared once in CSS (--badge-logo) — identical look to <img object-fit:contain>.
    return `<div class="badge-brand-logo badge-logo-bg" aria-hidden="true"></div>`;
  }
  return `<div class="badge-brand-logo-fallback">${company.slice(0, 3).toUpperCase()}</div>`;
}

function renderWatermark(hasLogo: boolean, businessName: string): string {
  if (hasLogo) {
    return `<div class="badge-watermark badge-logo-bg" aria-hidden="true"></div>`;
  }
  const initials = escapeHtml(businessName.trim().slice(0, 2).toUpperCase() || 'CO');
  return `<div class="badge-watermark badge-watermark-fallback">${initials}</div>`;
}

function renderBadge(
  slot: NameBadgePrintSlot,
  businessName: string,
  hasLogo: boolean,
  photoClass: string | null,
): string {
  const name = escapeHtml(slot.name.trim() || 'Employee Name');
  const title = escapeHtml(slot.title.trim() || 'Employee Title');
  const company = escapeHtml(businessName.trim() || 'Company');

  const photo = photoClass
    ? `<div class="badge-photo ${photoClass}" aria-hidden="true"></div>`
    : `<div class="badge-photo-fallback">
        <svg viewBox="0 0 64 80" fill="none" aria-hidden="true">
          <circle cx="32" cy="24" r="12" fill="#cbd5e1"/>
          <path d="M12 72c0-12 9-22 20-22s20 10 20 22" fill="#cbd5e1"/>
        </svg>
        <span>PHOTO</span>
      </div>`;

  return `<article class="badge-card">
    ${renderWatermark(hasLogo, businessName)}
    <header class="badge-brand">
      ${renderBrandLogo(businessName, hasLogo)}
      <div class="badge-brand-text">
        <div class="badge-company-name">${company}</div>
      </div>
    </header>
    <div class="badge-id-banner">
      <div class="badge-id-banner-inner">
        ${ICON_SHIELD}
        <span class="badge-id-banner-label">Employee Identification Card</span>
      </div>
      <div class="badge-id-banner-cut" aria-hidden="true"></div>
    </div>
    <div class="badge-body">
      <div class="badge-photo-wrap">${photo}</div>
      <div class="badge-fields">
        <div class="badge-field">
          <div class="badge-field-label">${ICON_PERSON}<span>Name</span></div>
          <div class="badge-field-rule"></div>
          <div class="badge-employee-name">${name}</div>
        </div>
        <div class="badge-field badge-field--title">
          <div class="badge-field-label">${ICON_BRIEFCASE}<span>Title</span></div>
          <div class="badge-field-rule"></div>
          <div class="badge-employee-title">${title}</div>
        </div>
      </div>
    </div>
    <footer class="badge-footer">
      <div class="badge-footer-curve" aria-hidden="true"></div>
      <span class="badge-footer-label">Contractor</span>
    </footer>
  </article>`;
}

/**
 * Build print HTML. Logo + unique photos are declared once in CSS and reused
 * across padded/repeated badge slots — same pixels, much smaller HTML and faster
 * Chromium decode.
 */
export function buildNameBadgesPrintHtml(context: NameBadgePrintContext): string {
  const hasLogo = Boolean(context.logoDataUrl);
  const photoClassByUrl = new Map<string, string>();
  const photoCssRules: string[] = [];

  const resolvePhotoClass = (photoDataUrl: string | null): string | null => {
    if (!photoDataUrl) return null;
    let cls = photoClassByUrl.get(photoDataUrl);
    if (!cls) {
      cls = `badge-photo-bg-${photoClassByUrl.size}`;
      photoClassByUrl.set(photoDataUrl, cls);
      photoCssRules.push(
        `.${cls}{background-image:url("${escapeCssUrl(photoDataUrl)}");background-size:cover;background-position:center;background-repeat:no-repeat;}`,
      );
    }
    return cls;
  };

  const pagesHtml = context.pages
    .map((pageSlots) => {
      const { cols, rows } = nameBadgeGridLayout(pageSlots.length);
      const badges = pageSlots
        .map((slot) =>
          renderBadge(
            slot,
            context.businessName,
            hasLogo,
            resolvePhotoClass(slot.photoDataUrl),
          ),
        )
        .join('');

      return `<section class="print-page" style="--badge-cols:${cols}; --badge-rows:${rows};">
        <div class="badge-grid">${badges}</div>
      </section>`;
    })
    .join('');

  const logoCss = hasLogo
    ? `:root{--badge-logo:url("${escapeCssUrl(context.logoDataUrl!)}");}
.badge-logo-bg{background-image:var(--badge-logo);background-size:contain;background-repeat:no-repeat;background-position:center;}`
    : '';

  // Hidden <img> preloads so printToPDF waits on document.images while visible
  // badges reuse the same decoded bitmaps via CSS (no per-slot base64 copies).
  const preloadUrls: string[] = [];
  if (hasLogo && context.logoDataUrl) preloadUrls.push(context.logoDataUrl);
  for (const url of photoClassByUrl.keys()) preloadUrls.push(url);
  const preloadHtml =
    preloadUrls.length > 0
      ? `<div class="ba-print-preload" aria-hidden="true">${preloadUrls
          .map((url) => `<img src="${url}" alt="" />`)
          .join('')}</div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Name Badges</title>
  <style>
    @page { size: A4 portrait; margin: 0; }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: "Segoe UI", Calibri, Arial, sans-serif;
      color: #1a1a1a;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .ba-print-preload {
      position: absolute;
      width: 0;
      height: 0;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
    }

    ${logoCss}
    ${photoCssRules.join('\n')}

    .print-page {
      width: 210mm;
      height: 297mm;
      page-break-after: always;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 12mm 10mm 10mm;
    }

    .print-page:last-child {
      page-break-after: auto;
    }

    .badge-grid {
      display: grid;
      grid-template-columns: repeat(var(--badge-cols), ${NAME_BADGE_WIDTH_MM}mm);
      grid-template-rows: repeat(var(--badge-rows), ${NAME_BADGE_HEIGHT_MM}mm);
      gap: 6mm;
      justify-content: center;
      align-content: start;
    }

    .badge-card {
      width: ${NAME_BADGE_WIDTH_MM}mm;
      height: ${NAME_BADGE_HEIGHT_MM}mm;
      border-radius: 2.8mm;
      overflow: hidden;
      position: relative;
      background: #ffffff;
      border: 0.3mm solid #d1d5db;
      box-shadow: 0 0.8mm 2mm rgb(0 0 0 / 0.1);
      display: flex;
      flex-direction: column;
    }

    /* See-through watermark logo */
    .badge-watermark {
      position: absolute;
      right: -2mm;
      top: 50%;
      transform: translateY(-42%);
      width: 28mm;
      height: 28mm;
      opacity: 0.07;
      pointer-events: none;
      z-index: 0;
    }

    .badge-watermark-fallback {
      display: grid;
      place-items: center;
      font-size: 14mm;
      font-weight: 800;
      color: ${MAROON};
      opacity: 0.06;
    }

    /* Top brand row — logo + company name, centered */
    .badge-brand {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2.2mm;
      padding: 2.2mm 3mm 1.6mm;
      min-height: 12mm;
    }

    .badge-brand-logo {
      width: 10mm;
      height: 10mm;
      flex-shrink: 0;
    }

    .badge-brand-logo-fallback {
      width: 10mm;
      height: 10mm;
      border-radius: 1.5mm;
      background: ${MAROON};
      color: #fff;
      font-size: 3mm;
      font-weight: 800;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      letter-spacing: 0.03em;
    }

    .badge-brand-text {
      min-width: 0;
      flex: 0 1 auto;
      text-align: center;
    }

    .badge-company-name {
      font-size: 4.2mm;
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: 0.01em;
      color: ${MAROON};
      text-transform: uppercase;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      text-align: center;
    }

    /* Red identification banner with angled cut */
    .badge-id-banner {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: stretch;
      height: 7mm;
      margin-bottom: 1.5mm;
    }

    .badge-id-banner-inner {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1.5mm;
      padding: 0 2.5mm;
      background: ${MAROON};
      clip-path: polygon(0 0, calc(100% - 5mm) 0, 100% 100%, 0 100%);
    }

    .badge-banner-icon {
      width: 4mm;
      height: 4mm;
      flex-shrink: 0;
    }

    .badge-id-banner-label {
      font-size: 2.5mm;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #ffffff;
      white-space: nowrap;
    }

    .badge-id-banner-cut {
      width: 6mm;
      background: linear-gradient(135deg, #9ca3af 0%, #d1d5db 100%);
      clip-path: polygon(0 0, 100% 0, 100% 100%, 35% 100%);
      margin-left: -1mm;
    }

    /* Body: photo left, fields right */
    .badge-body {
      position: relative;
      z-index: 1;
      flex: 1;
      display: flex;
      align-items: flex-start;
      gap: 2.5mm;
      padding: 0 3mm;
      min-height: 0;
    }

    .badge-photo-wrap {
      flex-shrink: 0;
      width: 19mm;
      height: 24mm;
      border: 0.35mm solid #cbd5e1;
      border-radius: 1.5mm;
      overflow: hidden;
      background: #f8fafc;
    }

    .badge-photo {
      width: 100%;
      height: 100%;
      display: block;
    }

    .badge-photo-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1mm;
      color: #94a3b8;
    }

    .badge-photo-fallback svg {
      width: 9mm;
      height: auto;
    }

    .badge-photo-fallback span {
      font-size: 2mm;
      font-weight: 600;
      letter-spacing: 0.08em;
    }

    .badge-fields {
      flex: 1;
      min-width: 0;
      padding-top: 0.5mm;
    }

    .badge-field {
      margin-bottom: 2mm;
    }

    .badge-field--title {
      margin-bottom: 0;
    }

    .badge-field-label {
      display: flex;
      align-items: center;
      gap: 1mm;
      font-size: 2mm;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${MAROON_LIGHT};
    }

    .badge-label-icon {
      width: 3mm;
      height: 3mm;
      color: ${MAROON_LIGHT};
      flex-shrink: 0;
    }

    .badge-field-rule {
      height: 0.25mm;
      background: #cbd5e1;
      margin: 0.8mm 0 1mm;
    }

    .badge-employee-name {
      font-size: 4.8mm;
      font-weight: 800;
      line-height: 1.1;
      color: #111827;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge-employee-title {
      font-size: 3.2mm;
      font-weight: 500;
      line-height: 1.2;
      color: #374151;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Footer — CONTRACTOR on maroon bar with curved top edge */
    .badge-footer {
      position: relative;
      z-index: 1;
      margin-top: auto;
      height: 6.5mm;
      background: ${MAROON};
      display: flex;
      align-items: center;
      padding: 0 3mm;
    }

    .badge-footer-curve {
      position: absolute;
      top: -2.5mm;
      right: 0;
      width: 18mm;
      height: 3mm;
      background: #ffffff;
      border-bottom: 0.35mm solid #e5e7eb;
      border-radius: 0 0 0 3mm;
    }

    .badge-footer-label {
      font-size: 2.8mm;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #ffffff;
    }
  </style>
</head>
<body>${preloadHtml}${pagesHtml}</body>
</html>`;
}
