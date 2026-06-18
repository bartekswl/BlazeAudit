import { formatAddress } from '../../shared/address';
import { cadenceLabel } from '../../shared/cadence';
import type { Block } from '../../shared/document';
import type { PdfInspectionExport } from '../../shared/pdf';
import type { Inspection } from '../../shared/inspection';
import type { Client } from '../../shared/types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? escapeHtml(trimmed) : '—';
}

function renderBlocks(blocks: Block[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'section') {
        const included = (block.value as { included?: boolean } | null)?.included ?? true;
        if (block.config.optional && !included) return '';
        const children = block.children ? renderBlocks(block.children) : '';
        if (!children.trim()) return '';
        const landscape = block.config.pageOrientation === 'landscape';
        return `
          <section class="block section${landscape ? ' section-landscape' : ''}">
            ${block.label ? `<h3 class="section-title">${escapeHtml(block.label)}</h3>` : ''}
            ${children}
          </section>`;
      }
      return renderBlock(block);
    })
    .join('');
}

function renderBlock(block: Block): string {
  switch (block.type) {
    case 'heading': {
      const level = Math.min(3, Math.max(1, (block.config.level as number) ?? 2));
      const text = escapeHtml((block.config.text as string) ?? '');
      return `<h${level + 1} class="heading level-${level}">${text}</h${level + 1}>`;
    }
    case 'paragraph':
      return `<p class="paragraph">${escapeHtml((block.config.text as string) ?? '')}</p>`;
    case 'textField':
      return `
        <div class="block field">
          <div class="field-label">${escapeHtml(block.label || 'Notes')}</div>
          <div class="field-value">${dash(block.value as string)}</div>
        </div>`;
    case 'lines': {
      const count = Math.max(1, (block.config.count as number) ?? 1);
      const values = normalizeLines(block.value, count);
      return `
        <div class="block lines">
          <div class="field-label">${escapeHtml(block.label || 'Notes')}</div>
          ${values
            .map(
              (line) =>
                `<div class="line-row"><span class="line-text">${dash(line)}</span></div>`,
            )
            .join('')}
        </div>`;
    }
    case 'checklist': {
      const items = (block.config.items as { id: string; label: string }[]) ?? [];
      const values = (block.value as Record<string, string | null>) ?? {};
      return `
        <div class="block checklist">
          ${block.label ? `<div class="field-label">${escapeHtml(block.label)}</div>` : ''}
          <table class="checklist-table">
            <thead><tr><th>Item</th><th>Result</th></tr></thead>
            <tbody>
              ${items
                .map((item) => {
                  const result = values[item.id];
                  const label =
                    result === 'pass'
                      ? 'Pass'
                      : result === 'fail'
                        ? 'Fail'
                        : result === 'na'
                          ? 'N/A'
                          : '—';
                  const cls =
                    result === 'pass' ? 'pass' : result === 'fail' ? 'fail' : result === 'na' ? 'na' : '';
                  return `<tr><td>${escapeHtml(item.label)}</td><td class="result ${cls}">${label}</td></tr>`;
                })
                .join('')}
            </tbody>
          </table>
        </div>`;
    }
    case 'table': {
      const columns = (block.config.columns as { key: string; title: string; width?: number }[]) ?? [];
      const tableValue = block.value as { rows?: Record<string, string>[]; rowHeights?: number[] } | null;
      const rows = tableValue?.rows ?? [];
      const rowHeights = tableValue?.rowHeights ?? [];
      if (columns.length === 0) return '';
      const defaultColWidth = 140;
      const defaultRowHeight = 36;
      const totalWidth = columns.reduce((sum, col) => sum + (col.width ?? defaultColWidth), 0);
      const colGroup = columns
        .map((col) => `<col style="width: ${col.width ?? defaultColWidth}px" />`)
        .join('');
      const headerCells = columns
        .map((col) => {
          const width = col.width ?? defaultColWidth;
          return `<th style="width: ${width}px; min-width: ${width}px; max-width: ${width}px">${escapeHtml(col.title)}</th>`;
        })
        .join('');
      const bodyRows =
        rows.length > 0
          ? rows
              .map((row, rowIndex) => {
                const height = rowHeights[rowIndex] ?? defaultRowHeight;
                const cells = columns
                  .map((col) => {
                    const width = col.width ?? defaultColWidth;
                    return `<td style="width: ${width}px; min-width: ${width}px; max-width: ${width}px; height: ${height}px">${dash(row[col.key])}</td>`;
                  })
                  .join('');
                return `<tr style="height: ${height}px">${cells}</tr>`;
              })
              .join('')
          : `<tr><td colspan="${columns.length}" class="empty">No rows</td></tr>`;
      return `
        <div class="block table-block">
          ${block.label ? `<div class="field-label">${escapeHtml(block.label)}</div>` : ''}
          <table class="data-table" style="table-layout: fixed; width: ${totalWidth}px; max-width: 100%;">
            <colgroup>${colGroup}</colgroup>
            <thead><tr>${headerCells}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>`;
    }
    case 'signature': {
      const value = (block.value as { name?: string; date?: string | null }) ?? {};
      return `
        <div class="block signature">
          <div class="field-label">${escapeHtml(block.label || 'Signature')}</div>
          <div class="signature-grid">
            <div><span class="meta-label">Name</span><span>${dash(value.name)}</span></div>
            <div><span class="meta-label">Date</span><span>${dash(value.date ?? undefined)}</span></div>
          </div>
          <div class="signature-line"></div>
        </div>`;
    }
    case 'spacer':
      return `<div class="spacer size-${escapeHtml((block.config.size as string) ?? 'md')}"></div>`;
    case 'image':
      return block.label
        ? `<div class="block image-placeholder">${escapeHtml(block.label)}</div>`
        : '';
    default:
      return '';
  }
}

function normalizeLines(value: unknown, count: number): string[] {
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    const lines = value as string[];
    if (lines.length >= count) return lines.slice(0, count);
    return [...lines, ...Array.from({ length: count - lines.length }, () => '')];
  }
  return Array.from({ length: count }, () => '');
}

export function renderInspectionHtml(
  inspection: Inspection,
  client: Client | null,
  exportPayload: PdfInspectionExport,
): string {
  const address = client ? formatAddress(client) : '';
  const embedJson = JSON.stringify(exportPayload).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(inspection.title)}</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    @page landscape { size: A4 landscape; margin: 14mm 12mm; }
    .section-landscape { page: landscape; page-break-before: always; }
    .section-landscape .data-table { font-size: 8pt; }
    .section-landscape .checklist-table { font-size: 8.5pt; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #f97316;
      padding-bottom: 10px;
      margin-bottom: 18px;
    }
    .brand-name { font-size: 14pt; font-weight: 700; letter-spacing: 0.04em; }
    .brand-name span { color: #f97316; }
    .brand-meta { font-size: 9pt; color: #666; text-align: right; }
    .doc-title {
      font-size: 20pt;
      font-weight: 700;
      margin: 0 0 16px;
      color: #111;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 22px;
    }
    .info-card {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 12px 14px;
      background: #fafafa;
    }
    .info-card h2 {
      margin: 0 0 8px;
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #f97316;
    }
    .info-row {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 6px;
      font-size: 10pt;
      margin-bottom: 4px;
    }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { color: #666; font-weight: 600; }
    .body { margin-top: 8px; }
    .block { margin-bottom: 14px; break-inside: avoid-page; }
    .field-label {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #555;
      margin-bottom: 4px;
    }
    .field-value {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 8px 10px;
      min-height: 2.2em;
      background: #fff;
    }
    .heading { margin: 16px 0 8px; color: #111; }
    .heading.level-1 { font-size: 16pt; }
    .heading.level-2 { font-size: 13pt; }
    .heading.level-3 { font-size: 11pt; }
    .paragraph { margin: 0 0 10px; color: #333; }
    .section {
      border-left: 3px solid #f97316;
      padding-left: 12px;
      margin-bottom: 16px;
    }
    .section-title { margin: 0 0 10px; font-size: 12pt; }
    .line-row {
      border-bottom: 1px solid #bbb;
      min-height: 1.8em;
      padding: 4px 0 2px;
      margin-bottom: 6px;
    }
    .line-text { color: #111; }
    table {
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    .data-table th, .data-table td,
    .checklist-table th, .checklist-table td {
      border: 1px solid #ccc;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
      overflow: hidden;
      word-wrap: break-word;
    }
    .data-table th, .checklist-table th {
      background: #f3f4f6;
      font-weight: 700;
      color: #333;
    }
    .checklist-table .result.pass { color: #15803d; font-weight: 700; }
    .checklist-table .result.fail { color: #b91c1c; font-weight: 700; }
    .checklist-table .result.na { color: #6b7280; font-weight: 600; }
    .data-table .empty { text-align: center; color: #888; font-style: italic; }
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 28px;
      font-size: 10pt;
    }
    .meta-label { display: block; font-size: 8pt; color: #666; text-transform: uppercase; margin-bottom: 2px; }
    .signature-line {
      border-bottom: 1px solid #333;
      height: 36px;
      margin-top: 8px;
    }
    .spacer.size-sm { height: 8px; }
    .spacer.size-md { height: 16px; }
    .spacer.size-lg { height: 28px; }
    .footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #e5e5e5;
      font-size: 8pt;
      color: #888;
      text-align: center;
    }
    .embed { display: none; }
  </style>
</head>
<body>
  <header class="brand">
    <div class="brand-name"><span>Blaze</span>Audit</div>
    <div class="brand-meta">
      Fire inspection report<br />
      Generated ${escapeHtml(new Date().toLocaleString())}
    </div>
  </header>

  <h1 class="doc-title">${escapeHtml(inspection.title)}</h1>

  <div class="info-grid">
    <section class="info-card">
      <h2>Client</h2>
      <div class="info-row"><span class="info-label">Building</span><span>${dash(client?.name)}</span></div>
      <div class="info-row"><span class="info-label">Address</span><span>${dash(address)}</span></div>
      <div class="info-row"><span class="info-label">Contact person</span><span>${dash(client?.contactName)}</span></div>
      <div class="info-row"><span class="info-label">Contact phone</span><span>${dash(client?.phone)}</span></div>
      <div class="info-row"><span class="info-label">Email</span><span>${dash(client?.email)}</span></div>
      <div class="info-row"><span class="info-label">Owner / manager</span><span>${dash(client?.ownerManagerName)}</span></div>
      <div class="info-row"><span class="info-label">Owner / manager phone</span><span>${dash(client?.ownerManagerPhone)}</span></div>
      <div class="info-row"><span class="info-label">Signal receiving center</span><span>${dash(client?.signalReceivingCenterName)}</span></div>
      <div class="info-row"><span class="info-label">Signal receiving center phone</span><span>${dash(client?.signalReceivingCenterPhone)}</span></div>
    </section>
    <section class="info-card">
      <h2>Inspection</h2>
      <div class="info-row"><span class="info-label">Type</span><span>${dash(inspection.document.meta.inspectionType)}</span></div>
      <div class="info-row"><span class="info-label">Inspector</span><span>${dash(inspection.inspector)}</span></div>
      <div class="info-row"><span class="info-label">Date</span><span>${dash(inspection.inspectedAt)}</span></div>
      <div class="info-row"><span class="info-label">Status</span><span>${inspection.status === 'complete' ? 'Complete' : 'Draft'}</span></div>
      <div class="info-row"><span class="info-label">Cadence</span><span>${escapeHtml(cadenceLabel(inspection.cadence))}</span></div>
      ${
        inspection.nextDueAt
          ? `<div class="info-row"><span class="info-label">Next due</span><span>${escapeHtml(inspection.nextDueAt)}</span></div>`
          : ''
      }
    </section>
  </div>

  <main class="body">
    ${renderBlocks(inspection.document.blocks)}
  </main>

  <footer class="footer">
    Exported from BlazeAudit · ${escapeHtml(inspection.clientName)}
  </footer>

  <script type="application/json" id="blazeaudit-document" class="embed">${embedJson}</script>
</body>
</html>`;
}
