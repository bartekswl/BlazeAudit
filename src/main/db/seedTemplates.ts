import { DEFAULT_TEMPLATE_SEEDS } from '../../shared/document';
import { getDatabase } from './connection';
import * as templates from './templates';

const SEED_META_KEY = 'templates_seeded_v1';

export function seedDefaultTemplates(): void {
  const db = getDatabase();
  const row = db.prepare('SELECT value FROM app_meta WHERE key = ?').get(SEED_META_KEY) as
    | { value: string }
    | undefined;

  if (row?.value === 'true') return;

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
    }

    db.prepare(
      `INSERT INTO app_meta (key, value) VALUES (@key, @value)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ).run({ key: SEED_META_KEY, value: 'true' });
  });

  seed();
  console.log('[templates] default templates seeded');
}
