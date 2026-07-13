import {
  NAME_BADGE_HEIGHT_MM,
  NAME_BADGE_WIDTH_MM,
  nameBadgeGridLayout,
  type NameBadgePrintContext,
  type NameBadgePrintSlot,
} from '../../../shared/nameBadges';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBadge(slot: NameBadgePrintSlot, businessName: string, logoDataUrl: string | null): string {
  const name = escapeHtml(slot.name.trim() || 'Employee Name');
  const title = escapeHtml(slot.title.trim() || 'Job Title');
  const company = escapeHtml(businessName.trim() || 'Company');
  const logo = logoDataUrl
    ? `<img class="badge-logo" src="${logoDataUrl}" alt="" />`
    : `<div class="badge-logo-fallback">${company.slice(0, 2).toUpperCase()}</div>`;
  const photo = slot.photoDataUrl
    ? `<img class="badge-photo" src="${slot.photoDataUrl}" alt="" />`
    : `<div class="badge-photo-fallback"><span>${name.slice(0, 1).toUpperCase() || '?'}</span></div>`;

  return `<article class="badge-card">
    <div class="badge-accent"></div>
    <header class="badge-header">
      ${logo}
      <div class="badge-company">${company}</div>
    </header>
    <div class="badge-body">
      ${photo}
      <div class="badge-text">
        <div class="badge-name">${name}</div>
        <div class="badge-title">${title}</div>
      </div>
    </div>
  </article>`;
}

export function buildNameBadgesPrintHtml(context: NameBadgePrintContext): string {
  const pagesHtml = context.pages
    .map((pageSlots) => {
      const { cols, rows } = nameBadgeGridLayout(pageSlots.length);
      const badges = pageSlots
        .map((slot) => renderBadge(slot, context.businessName, context.logoDataUrl))
        .join('');

      return `<section class="print-page" style="--badge-cols:${cols}; --badge-rows:${rows};">
        <div class="badge-grid">${badges}</div>
      </section>`;
    })
    .join('');

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
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #fff;
    }

    .print-page {
      width: 210mm;
      height: 297mm;
      page-break-after: always;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10mm;
    }

    .print-page:last-child {
      page-break-after: auto;
    }

    .badge-grid {
      display: grid;
      grid-template-columns: repeat(var(--badge-cols), ${NAME_BADGE_WIDTH_MM}mm);
      grid-template-rows: repeat(var(--badge-rows), ${NAME_BADGE_HEIGHT_MM}mm);
      gap: 4mm;
      justify-content: center;
      align-content: center;
    }

    .badge-card {
      width: ${NAME_BADGE_WIDTH_MM}mm;
      height: ${NAME_BADGE_HEIGHT_MM}mm;
      border-radius: 3.2mm;
      overflow: hidden;
      position: relative;
      background: linear-gradient(165deg, #ffffff 0%, #f8fafc 55%, #eef2ff 100%);
      border: 0.35mm solid #cbd5e1;
      box-shadow: 0 1.2mm 3mm rgb(15 23 42 / 0.12);
      display: flex;
      flex-direction: column;
    }

    .badge-accent {
      height: 1.4mm;
      background: linear-gradient(90deg, #ea580c, #f97316, #fb923c);
    }

    .badge-header {
      display: flex;
      align-items: center;
      gap: 2mm;
      padding: 2mm 3mm 1.5mm;
      min-height: 11mm;
    }

    .badge-logo {
      width: 7mm;
      height: 7mm;
      object-fit: contain;
      flex-shrink: 0;
    }

    .badge-logo-fallback {
      width: 7mm;
      height: 7mm;
      border-radius: 1.5mm;
      background: linear-gradient(135deg, #ea580c, #f97316);
      color: #fff;
      font-size: 2.6mm;
      font-weight: 700;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    .badge-company {
      font-size: 2.8mm;
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: #334155;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .badge-body {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 3mm;
      padding: 0 3mm 3mm;
      min-height: 0;
    }

    .badge-photo,
    .badge-photo-fallback {
      width: 18mm;
      height: 18mm;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .badge-photo {
      object-fit: cover;
      border: 0.45mm solid #e2e8f0;
    }

    .badge-photo-fallback {
      background: linear-gradient(145deg, #e2e8f0, #cbd5e1);
      color: #475569;
      display: grid;
      place-items: center;
      font-size: 7mm;
      font-weight: 700;
    }

    .badge-text {
      min-width: 0;
      flex: 1;
    }

    .badge-name {
      font-size: 4.6mm;
      font-weight: 700;
      line-height: 1.1;
      color: #0f172a;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge-title {
      margin-top: 1mm;
      font-size: 3.2mm;
      font-weight: 500;
      line-height: 1.2;
      color: #64748b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  </style>
</head>
<body>${pagesHtml}</body>
</html>`;
}
