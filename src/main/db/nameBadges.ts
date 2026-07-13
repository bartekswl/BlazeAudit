import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { dialog } from 'electron';
import type { NameBadge, NameBadgeInput } from '../../shared/nameBadges';
import { accountDir } from './paths';
import { getDatabase } from './connection';

interface NameBadgeRow {
  id: string;
  name: string;
  title: string;
  photo_path: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function badgePhotosDir(): string {
  return path.join(accountDir(), 'assets', 'badge-photos');
}

function mimeForPhoto(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    default:
      return 'image/png';
  }
}

function toNameBadge(row: NameBadgeRow): NameBadge {
  const photoPath = row.photo_path?.trim() ?? '';
  return {
    id: row.id,
    name: row.name ?? '',
    title: row.title ?? '',
    hasPhoto: Boolean(photoPath && fs.existsSync(path.join(accountDir(), photoPath))),
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getRow(id: string): NameBadgeRow {
  const row = getDatabase()
    .prepare(`SELECT * FROM name_badges WHERE id = ?`)
    .get(id) as NameBadgeRow | undefined;
  if (!row) throw new Error('Name badge not found.');
  return row;
}

function normalizeInput(input: NameBadgeInput): NameBadgeInput {
  return {
    name: input.name.trim(),
    title: input.title.trim(),
  };
}

function deletePhotoFile(relativePath: string | null | undefined): void {
  const trimmed = relativePath?.trim();
  if (!trimmed) return;
  const full = path.join(accountDir(), trimmed);
  if (fs.existsSync(full)) fs.unlinkSync(full);
}

export function listNameBadges(): NameBadge[] {
  const rows = getDatabase()
    .prepare(`SELECT * FROM name_badges ORDER BY sort_order ASC, created_at ASC`)
    .all() as NameBadgeRow[];
  return rows.map(toNameBadge);
}

export function createNameBadge(input: NameBadgeInput = { name: '', title: '' }): NameBadge {
  const normalized = normalizeInput(input);
  const db = getDatabase();
  const id = randomUUID();
  const createdAt = nowIso();
  const maxOrder =
    (db.prepare(`SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM name_badges`).get() as {
      max_order: number;
    }).max_order + 1;

  db.prepare(
    `INSERT INTO name_badges (id, name, title, photo_path, sort_order, created_at, updated_at)
     VALUES (@id, @name, @title, '', @sortOrder, @createdAt, @updatedAt)`,
  ).run({
    id,
    name: normalized.name,
    title: normalized.title,
    sortOrder: maxOrder,
    createdAt,
    updatedAt: createdAt,
  });

  return toNameBadge(getRow(id));
}

export function updateNameBadge(id: string, input: NameBadgeInput): NameBadge {
  const existing = getDatabase().prepare(`SELECT id FROM name_badges WHERE id = ?`).get(id);
  if (!existing) throw new Error('Name badge not found.');

  const normalized = normalizeInput(input);
  const updatedAt = nowIso();
  getDatabase()
    .prepare(
      `UPDATE name_badges
          SET name = @name, title = @title, updated_at = @updatedAt
        WHERE id = @id`,
    )
    .run({
      id,
      name: normalized.name,
      title: normalized.title,
      updatedAt,
    });

  return toNameBadge(getRow(id));
}

export function deleteNameBadge(id: string): void {
  const row = getDatabase()
    .prepare(`SELECT photo_path FROM name_badges WHERE id = ?`)
    .get(id) as { photo_path: string } | undefined;
  if (!row) throw new Error('Name badge not found.');

  deletePhotoFile(row.photo_path);
  const result = getDatabase().prepare(`DELETE FROM name_badges WHERE id = ?`).run(id);
  if (result.changes === 0) throw new Error('Name badge not found.');
}

export function getNameBadgePhotoDataUrl(id: string): string | null {
  const row = getRow(id);
  const relative = row.photo_path?.trim();
  if (!relative) return null;
  const full = path.join(accountDir(), relative);
  if (!fs.existsSync(full)) return null;
  const data = fs.readFileSync(full);
  return `data:${mimeForPhoto(full)};base64,${data.toString('base64')}`;
}

export async function pickNameBadgePhoto(id: string): Promise<NameBadge> {
  const row = getRow(id);
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return toNameBadge(row);

  const src = result.filePaths[0];
  const ext = path.extname(src).toLowerCase() || '.png';
  fs.mkdirSync(badgePhotosDir(), { recursive: true });

  deletePhotoFile(row.photo_path);

  const relative = path.join('assets', 'badge-photos', `${id}${ext}`);
  const dest = path.join(accountDir(), relative);
  fs.copyFileSync(src, dest);

  const updatedAt = nowIso();
  getDatabase()
    .prepare(`UPDATE name_badges SET photo_path = @photoPath, updated_at = @updatedAt WHERE id = @id`)
    .run({ id, photoPath: relative, updatedAt });

  return toNameBadge(getRow(id));
}

export function removeNameBadgePhoto(id: string): NameBadge {
  const row = getRow(id);
  deletePhotoFile(row.photo_path);
  const updatedAt = nowIso();
  getDatabase()
    .prepare(`UPDATE name_badges SET photo_path = '', updated_at = @updatedAt WHERE id = @id`)
    .run({ id, updatedAt });
  return toNameBadge(getRow(id));
}
