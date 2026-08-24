import fs from 'node:fs';
import path from 'node:path';
import { accountDir, dbFilePath } from '../db/paths';

/** Max mtime across DB + settings + assets — used for backup recency checks. */
export function computeLocalDataStamp(root = accountDir()): string {
  let latestMs = 0;

  const consider = (filePath: string) => {
    try {
      const st = fs.statSync(filePath);
      if (st.mtimeMs > latestMs) latestMs = st.mtimeMs;
    } catch {
      /* missing is fine */
    }
  };

  consider(path.join(root, 'blazeaudit.db'));
  consider(path.join(root, 'blazeaudit.db-wal'));
  consider(path.join(root, 'blazeaudit.db-shm'));
  consider(path.join(root, 'settings.bin'));
  consider(path.join(root, 'settings.json'));

  const assetsRoot = path.join(root, 'assets');
  if (fs.existsSync(assetsRoot)) {
    walkFiles(assetsRoot, (filePath) => consider(filePath));
  }

  if (latestMs === 0) return new Date(0).toISOString();
  return new Date(latestMs).toISOString();
}

export function walkFiles(dir: string, visit: (filePath: string) => void): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, visit);
    else if (entry.isFile()) visit(full);
  }
}

export function listBackupSourceFiles(root = accountDir()): Array<{ relativePath: string; absolutePath: string }> {
  const out: Array<{ relativePath: string; absolutePath: string }> = [];

  const db = dbFilePath();
  if (fs.existsSync(db)) {
    out.push({ relativePath: 'blazeaudit.db', absolutePath: db });
  }

  for (const name of ['settings.bin', 'settings.json'] as const) {
    const absolutePath = path.join(root, name);
    if (fs.existsSync(absolutePath)) {
      out.push({ relativePath: name, absolutePath });
    }
  }

  const assetsRoot = path.join(root, 'assets');
  walkFiles(assetsRoot, (absolutePath) => {
    const relativePath = path.relative(root, absolutePath).split(path.sep).join('/');
    out.push({ relativePath, absolutePath });
  });

  return out;
}

export function normalizeAccountEmail(email: string): string {
  return email.trim().toLowerCase();
}
