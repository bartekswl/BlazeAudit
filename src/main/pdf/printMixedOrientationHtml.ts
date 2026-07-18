import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import type { PDFDocument as PDFDocumentType } from 'pdf-lib';
import {
  loadPrintHtml,
  waitForPrintLayout,
  waitForPrintReady,
  withPrintWindow,
} from './printHtmlWindow';

/** Load pdf-lib via CJS — ESM interop from the Vite main bundle is unreliable. */
const require = createRequire(import.meta.url);
const { PDFDocument } = require('pdf-lib') as {
  PDFDocument: typeof PDFDocumentType;
};

/** A4 in inches (Electron `pageSize` object uses inches). */
const A4_PORTRAIT_IN = { width: 8.2677165354, height: 11.6929133858 } as const;
const A4_LANDSCAPE_IN = { width: 11.6929133858, height: 8.2677165354 } as const;

type Orientation = 'portrait' | 'landscape';

interface PageSegment {
  start: number;
  end: number;
  orientation: Orientation;
}

function groupOrientationSegments(flags: boolean[]): PageSegment[] {
  if (flags.length === 0) return [];
  const segments: PageSegment[] = [];
  let start = 0;
  let current: Orientation = flags[0] ? 'landscape' : 'portrait';

  for (let i = 1; i < flags.length; i += 1) {
    const next: Orientation = flags[i] ? 'landscape' : 'portrait';
    if (next !== current) {
      segments.push({ start, end: i, orientation: current });
      start = i;
      current = next;
    }
  }
  segments.push({ start, end: flags.length, orientation: current });
  return segments;
}

const PRINT_OPTS_BASE = {
  printBackground: true,
  preferCSSPageSize: true,
  margins: { marginType: 'none' as const },
  generateTaggedPDF: false,
  generateDocumentOutline: false,
};

/**
 * Print HTML that mixes portrait and landscape A4 sheets into one PDF.
 *
 * Chromium's single `printToPDF` pass often mishandles named `@page` landscape
 * rules in mixed docs (on-screen PDF can look landscape while printers treat
 * those pages as portrait and shrink-to-fit). We print each consecutive
 * orientation run separately with an explicit `landscape` flag + matching
 * page size, then merge with pdf-lib so each page's MediaBox is correct.
 */
export async function printMixedOrientationHtmlToPdf(html: string): Promise<Buffer> {
  return withPrintWindow(async (win) => {
    let tmpDir: string | null = null;
    try {
      tmpDir = await loadPrintHtml(win, html);
      await waitForPrintReady(win);

      const landscapeFlags = (await win.webContents.executeJavaScript(`
        (() => {
          const root = document.querySelector('.form-print-root') || document.body;
          let sheets = Array.from(root.querySelectorAll(':scope > .form-page-sheet'));
          if (!sheets.length) {
            sheets = Array.from(root.querySelectorAll(':scope > .form-page'));
          }
          if (!sheets.length) {
            sheets = Array.from(document.querySelectorAll('.form-page-sheet'));
          }
          window.__baPdfRoot = root;
          window.__baPdfSheets = sheets;
          return sheets.map((el) =>
            el.classList.contains('form-page-sheet--landscape') ||
            el.classList.contains('section-landscape'),
          );
        })()
      `)) as boolean[];

      if (!Array.isArray(landscapeFlags) || landscapeFlags.length === 0) {
        const pdf = await win.webContents.printToPDF({
          ...PRINT_OPTS_BASE,
          landscape: false,
          pageSize: A4_PORTRAIT_IN,
        });
        return Buffer.from(pdf);
      }

      const segments = groupOrientationSegments(landscapeFlags);
      const parts: Uint8Array[] = [];

      for (const segment of segments) {
        const isLandscape = segment.orientation === 'landscape';

        await win.webContents.executeJavaScript(`
          (() => {
            const root = window.__baPdfRoot;
            const sheets = window.__baPdfSheets;
            if (!root || !Array.isArray(sheets)) return;
            const start = ${segment.start};
            const end = ${segment.end};

            for (const el of sheets) el.remove();
            for (let i = start; i < end; i += 1) {
              const el = sheets[i];
              el.style.display = '';
              el.style.pageBreakAfter = i < end - 1 ? 'always' : 'auto';
              root.appendChild(el);
            }

            let style = document.getElementById('ba-pdf-orientation-force');
            if (!style) {
              style = document.createElement('style');
              style.id = 'ba-pdf-orientation-force';
              document.head.appendChild(style);
            }
            style.textContent = ${JSON.stringify(
              isLandscape
                ? `@page { size: A4 landscape; margin: 0; }
.form-page-sheet, .form-page {
  page: auto;
  width: 297mm;
  height: 210mm;
  min-height: 210mm;
  max-height: 210mm;
}`
                : `@page { size: A4 portrait; margin: 0; }
.form-page-sheet, .form-page {
  page: auto;
  width: 210mm;
  height: 297mm;
  min-height: 297mm;
  max-height: 297mm;
}`,
            )};
          })()
        `);

        // Fonts/images already resolved on initial load; segment swaps only
        // reshuffle in-DOM nodes, so a layout settle is enough.
        await waitForPrintLayout(win);

        const pdf = await win.webContents.printToPDF({
          ...PRINT_OPTS_BASE,
          landscape: isLandscape,
          pageSize: isLandscape ? A4_LANDSCAPE_IN : A4_PORTRAIT_IN,
        });
        parts.push(pdf);
      }

      if (parts.length === 1) {
        return Buffer.from(parts[0]);
      }

      const merged = await PDFDocument.create();
      for (const part of parts) {
        const src = await PDFDocument.load(part, { ignoreEncryption: true });
        const copied = await merged.copyPages(src, src.getPageIndices());
        for (const page of copied) {
          merged.addPage(page);
        }
      }

      const bytes = await merged.save();
      return Buffer.from(bytes);
    } finally {
      if (tmpDir) {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
      }
      // Drop document memory between jobs; keep the process warm.
      try {
        if (!win.isDestroyed()) await win.loadURL('about:blank');
      } catch {
        /* ignore */
      }
    }
  });
}
