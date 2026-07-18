import { BrowserWindow, app } from 'electron';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

/**
 * Reused hidden BrowserWindow for Chromium printToPDF.
 *
 * Creating a new BrowserWindow per export pays a large cold-start cost (often
 * ~1–2s on first loadFile). Keeping one pre-warmed window and serializing
 * jobs through it is the standard Electron PDF optimization and keeps output
 * identical — only the host lifecycle changes.
 */

let printWindow: BrowserWindow | null = null;
let queue: Promise<void> = Promise.resolve();
let warmed = false;

function createPrintWindow(): BrowserWindow {
  const win = new BrowserWindow({
    show: false,
    width: 1200,
    height: 900,
    paintWhenInitiallyHidden: true,
    skipTaskbar: true,
    // Do not keep the app alive when the main window is gone.
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      spellcheck: false,
      devTools: false,
    },
  });

  win.on('closed', () => {
    if (printWindow === win) printWindow = null;
    warmed = false;
  });

  return win;
}

function getPrintWindow(): BrowserWindow {
  if (printWindow && !printWindow.isDestroyed()) return printWindow;
  printWindow = createPrintWindow();
  warmed = false;
  return printWindow;
}

/** Wait until fonts/images are ready and layout has settled. */
export async function waitForPrintReady(
  win: BrowserWindow,
  options?: { waitImages?: boolean; waitFonts?: boolean },
): Promise<void> {
  const waitImages = options?.waitImages !== false;
  const waitFonts = options?.waitFonts !== false;
  await win.webContents.executeJavaScript(`
    (async () => {
      ${waitFonts ? 'if (document.fonts?.ready) await document.fonts.ready;' : ''}
      ${
        waitImages
          ? `await Promise.all(Array.from(document.images).map((img) =>
              img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; })
            ));`
          : ''
      }
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    })()
  `);
}

/** Lightweight settle after DOM-only mutations (no new network/image loads). */
export async function waitForPrintLayout(win: BrowserWindow): Promise<void> {
  await win.webContents.executeJavaScript(`
    (async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    })()
  `);
}

/**
 * Load self-contained HTML into the print window via a temp file.
 * Prefer file:// over data: URLs — large form HTML can exceed URL limits.
 */
export async function loadPrintHtml(win: BrowserWindow, html: string): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'blazeaudit-pdf-'));
  const htmlPath = path.join(tmpDir, 'print.html');
  await fs.writeFile(htmlPath, html, 'utf8');
  await win.loadFile(htmlPath);
  return tmpDir;
}

/** Run exclusive work against the shared print window. */
export async function withPrintWindow<T>(run: (win: BrowserWindow) => Promise<T>): Promise<T> {
  const previous = queue;
  let release!: () => void;
  queue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  const win = getPrintWindow();
  try {
    return await run(win);
  } catch (error) {
    try {
      if (!win.isDestroyed()) win.destroy();
    } catch {
      /* ignore */
    }
    printWindow = null;
    warmed = false;
    throw error;
  } finally {
    release();
  }
}

/** Pre-create and warm the print window so the first export skips cold start. */
export async function warmPrintWindow(): Promise<void> {
  if (!app.isReady()) return;
  if (warmed && printWindow && !printWindow.isDestroyed()) return;

  try {
    await withPrintWindow(async (win) => {
      await win.loadURL('about:blank');
      warmed = true;
    });
  } catch {
    /* warm is best-effort */
  }
}

export function disposePrintWindow(): void {
  if (printWindow && !printWindow.isDestroyed()) {
    printWindow.destroy();
  }
  printWindow = null;
  warmed = false;
}
