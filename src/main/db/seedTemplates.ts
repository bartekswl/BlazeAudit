import { DEFAULT_TEMPLATE_SEEDS, type Template } from '../../shared/document';
import { getDatabase } from './connection';
import * as templates from './templates';

const SEED_META_KEY = 'templates_seeded_v1';
const SEED_REVISION_PREFIX = 'template_seed_revision:';

function seedRevisionMetaKey(seedId: string): string {
  return `${SEED_REVISION_PREFIX}${seedId}`;
}

function readAppliedRevision(seedId: string): number {
  const row = getDatabase()
    .prepare('SELECT value FROM app_meta WHERE key = ?')
    .get(seedRevisionMetaKey(seedId)) as { value: string } | undefined;
  if (!row) return 0;
  const parsed = Number.parseInt(row.value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function writeAppliedSeedRevision(seedId: string, revision: number): void {
  getDatabase()
    .prepare(
      `INSERT INTO app_meta (key, value) VALUES (@key, @value)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run({ key: seedRevisionMetaKey(seedId), value: String(revision) });
}

export function rebuildBundledTemplate(seedId: string): Template {
  const item = DEFAULT_TEMPLATE_SEEDS.find((seed) => seed.seedId === seedId);
  if (!item) throw new Error(`Unknown bundled template seed: ${seedId}`);

  const { template } = templates.upsertTemplateBySeedId(seedId, {
    name: item.name,
    description: item.description,
    document: structuredClone(item.document),
  });

  writeAppliedSeedRevision(seedId, item.seedRevision ?? 1);
  return template;
}

export function seedDefaultTemplates(): void {
  const db = getDatabase();
  let inserted = 0;
  let updated = 0;

  const seed = db.transaction(() => {
    for (const item of DEFAULT_TEMPLATE_SEEDS) {
      const bundledRevision = item.seedRevision ?? 1;
      const appliedRevision = readAppliedRevision(item.seedId);
      const existing = templates.getTemplateBySeedId(item.seedId);

      if (existing && appliedRevision >= bundledRevision) continue;

      const { created } = templates.upsertTemplateBySeedId(item.seedId, {
        name: item.name,
        description: item.description,
        document: structuredClone(item.document),
      });

      writeAppliedSeedRevision(item.seedId, bundledRevision);
      if (created) inserted += 1;
      else updated += 1;
    }

    db.prepare(
      `INSERT INTO app_meta (key, value) VALUES (@key, @value)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ).run({ key: SEED_META_KEY, value: 'true' });
  });

  seed();
  if (inserted > 0 || updated > 0) {
    console.log(`[templates] seeded ${inserted} new, rebuilt ${updated} bundled template(s)`);
  }
}
