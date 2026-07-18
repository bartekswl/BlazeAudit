import fs from 'node:fs/promises';
import { pickPdfSavePath } from './pickPdfSavePath';
import {
  loadPrintHtml,
  waitForPrintReady,
  withPrintWindow,
} from './printHtmlWindow';

export async function pickNameBadgesPdfPath(defaultFilename = 'name-badges'): Promise<string | null> {
  return pickPdfSavePath({
    title: 'Save name badges as PDF',
    defaultFilename: defaultFilename || 'name-badges',
  });
}

export async function exportNameBadgesPdf(
  html: string,
  defaultFilename = 'name-badges',
  targetPath?: string,
): Promise<{ saved: false } | { saved: true; filePath: string }> {
  const filePath = targetPath ?? (await pickNameBadgesPdfPath(defaultFilename));
  if (!filePath) return { saved: false as const };

  const pdf = await withPrintWindow(async (win) => {
    let tmpDir: string | null = null;
    try {
      tmpDir = await loadPrintHtml(win, html);
      await waitForPrintReady(win);
      return await win.webContents.printToPDF({
        printBackground: true,
        preferCSSPageSize: true,
        pageSize: 'A4',
        margins: { marginType: 'none' },
        generateTaggedPDF: false,
        generateDocumentOutline: false,
      });
    } finally {
      if (tmpDir) {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
      }
      try {
        if (!win.isDestroyed()) await win.loadURL('about:blank');
      } catch {
        /* ignore */
      }
    }
  });

  await fs.writeFile(filePath, Buffer.from(pdf));
  return { saved: true as const, filePath };
}
