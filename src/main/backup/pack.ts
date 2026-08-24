import fs from 'node:fs';
import path from 'node:path';

export type PackedEntry = {
  relativePath: string;
  data: Buffer;
};

function assertSafeRelativePath(relativePath: string): void {
  const normalized = relativePath.replace(/\\/g, '/');
  if (
    !normalized ||
    normalized.startsWith('/') ||
    normalized.includes('..') ||
    normalized.startsWith('auth/') ||
    normalized === 'auth'
  ) {
    throw new Error('Backup archive contains an unsafe path.');
  }
}

/** Minimal binary archive — no extra npm dependency; easy to delete with the feature. */
export function packEntries(entries: PackedEntry[]): Buffer {
  const parts: Buffer[] = [];
  const count = Buffer.alloc(4);
  count.writeUInt32BE(entries.length, 0);
  parts.push(count);

  for (const entry of entries) {
    assertSafeRelativePath(entry.relativePath);
    const pathBuf = Buffer.from(entry.relativePath, 'utf8');
    if (pathBuf.length > 0xffff) {
      throw new Error(`Backup path too long: ${entry.relativePath}`);
    }
    const header = Buffer.alloc(2 + 4);
    header.writeUInt16BE(pathBuf.length, 0);
    header.writeUInt32BE(entry.data.length, 2);
    parts.push(header, pathBuf, entry.data);
  }

  return Buffer.concat(parts);
}

export function unpackEntries(blob: Buffer): PackedEntry[] {
  if (blob.length < 4) throw new Error('Backup archive is corrupt.');
  let offset = 0;
  const count = blob.readUInt32BE(offset);
  offset += 4;
  const entries: PackedEntry[] = [];

  for (let i = 0; i < count; i += 1) {
    if (offset + 6 > blob.length) throw new Error('Backup archive is corrupt.');
    const pathLen = blob.readUInt16BE(offset);
    offset += 2;
    const dataLen = blob.readUInt32BE(offset);
    offset += 4;
    if (offset + pathLen + dataLen > blob.length) {
      throw new Error('Backup archive is corrupt.');
    }
    const relativePath = blob.subarray(offset, offset + pathLen).toString('utf8');
    offset += pathLen;
    const data = Buffer.from(blob.subarray(offset, offset + dataLen));
    offset += dataLen;

    assertSafeRelativePath(relativePath);
    entries.push({ relativePath, data });
  }

  return entries;
}

export function readFileEntry(absolutePath: string, relativePath: string): PackedEntry {
  assertSafeRelativePath(relativePath);
  return { relativePath, data: fs.readFileSync(absolutePath) };
}

export function resolvePackedPath(root: string, relativePath: string): string {
  assertSafeRelativePath(relativePath);
  const rootResolved = path.resolve(root);
  const absolute = path.resolve(rootResolved, relativePath);
  const rel = path.relative(rootResolved, absolute);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Backup archive contains an unsafe path.');
  }
  return absolute;
}
