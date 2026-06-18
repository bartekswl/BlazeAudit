import { DEFAULT_TEMPLATE_SEEDS } from '../../shared/document';
import { getDatabase } from './connection';
import * as templates from './templates';

const SEED_META_KEY = 'templates_seeded_v1';

export function seedDefaultTemplates(): void {
  const db = getDatabase();
  let inserted = 0;
  let synced = 0;
  let removed = 0;

  const activeSeedIds = DEFAULT_TEMPLATE_SEEDS.map((item) => item.seedId);

  const seed = db.transaction(() => {
    for (const item of DEFAULT_TEMPLATE_SEEDS) {
      const input = {
        name: item.name,
        description: item.description,
        document: structuredClone(item.document),
      };
      const existing = templates.getTemplateBySeedId(item.seedId);
      if (existing) {
        templates.syncBundledTemplateFromSeed(item.seedId, input);
        synced += 1;
        continue;
      }
      templates.createTemplate(input, { seedId: item.seedId });
      inserted += 1;
    }

    const before = db.prepare('SELECT COUNT(*) AS n FROM templates WHERE seed_id IS NOT NULL').get() as {
      n: number;
    };
    templates.deleteBundledTemplatesExcept(activeSeedIds);
    const after = db.prepare('SELECT COUNT(*) AS n FROM templates WHERE seed_id IS NOT NULL').get() as {
      n: number;
    };
    removed = before.n - after.n;

    db.prepare(
      `INSERT INTO app_meta (key, value) VALUES (@key, @value)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ).run({ key: SEED_META_KEY, value: 'true' });
  });

  seed();
  if (inserted > 0 || synced > 0 || removed > 0) {
    console.log(
      `[templates] seeded ${inserted} new, synced ${synced} bundled, removed ${removed} retired bundled template(s)`,
    );
  }
}
