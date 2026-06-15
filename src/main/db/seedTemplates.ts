import { DEFAULT_TEMPLATE_SEEDS } from '../../shared/document';
import { getDatabase } from './connection';
import * as templates from './templates';

const SEED_META_KEY = 'templates_seeded_v1';

export function seedDefaultTemplates(): void {
  const db = getDatabase();
  let inserted = 0;

  const seed = db.transaction(() => {
    for (const item of DEFAULT_TEMPLATE_SEEDS) {
      if (templates.getTemplateBySeedId(item.seedId)) continue;
      templates.createTemplate(
        {
          name: item.name,
          description: item.description,
          document: structuredClone(item.document),
        },
        { seedId: item.seedId },
      );
      inserted += 1;
    }

    db.prepare(
      `INSERT INTO app_meta (key, value) VALUES (@key, @value)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ).run({ key: SEED_META_KEY, value: 'true' });
  });

  seed();
  if (inserted > 0) {
    console.log(`[templates] seeded ${inserted} default template(s)`);
  }
}
