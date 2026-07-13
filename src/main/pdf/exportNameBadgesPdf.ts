import { BrowserWindow, dialog } from 'electron';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export async function exportNameBadgesPdf(
  html: string,
  defaultFilename = 'name-badges',
): Promise<{ saved: false } | { saved: true; filePath: string }> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blazeaudit-badges-'));
  const htmlPath = path.join(tmpDir, 'badges.html');
  fs.writeFileSync(htmlPath, html, 'utf8');

  const win = new BrowserWindow({
    show: false,
    width: 816,
    height: 1056,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  try {
    await win.loadFile(htmlPath);
    await win.webContents.executeJavaScript(`
      (async () => {
        if (document.fonts?.ready) await document.fonts.ready;
        await Promise.all(Array.from(document.images).map((img) =>
          img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; })
        ));
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      })()
    `);

    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      pageSize: 'A4',
      margins: { marginType: 'none' },
    });

    const safeName = defaultFilename.replace(/[^\w\-]+/g, '-').replace(/-+/g, '-');
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save name badges as PDF',
      defaultPath: `${safeName || 'name-badges'}.pdf`,
      filters: [
        { name: 'PDF', extensions: ['pdf'] },
        { name: 'All files', extensions: ['*'] },
      ],
    });

    if (canceled || !filePath) return { saved: false as const };

    fs.writeFileSync(filePath, Buffer.from(pdf));
    return { saved: true as const, filePath };
  } finally {
    win.destroy();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
