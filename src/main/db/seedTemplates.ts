import { DEFAULT_TEMPLATE_SEEDS } from '../../shared/document';
import { getDatabase } from './connection';
import * as builtin from './builtinTemplates';

const SEED_META_KEY = 'templates_seeded_v1';
/** Bump when built-in template seeds change so sync runs once after an app update. */
const TEMPLATE_SEED_REVISION = '2026-07-23-ext-el-polish';

export function seedDefaultTemplates(): void {
  const db = getDatabase();
  const revision = db
    .prepare(`SELECT value FROM app_meta WHERE key = ?`)
    .get(SEED_META_KEY) as { value: string } | undefined;
  if (revision?.value === TEMPLATE_SEED_REVISION) return;

  let inserted = 0;
  let synced = 0;
  let removed = 0;

  const activeSeedIds = DEFAULT_TEMPLATE_SEEDS.map((item) => item.seedId);

  const seed = db.transaction(() => {
    for (const item of DEFAULT_TEMPLATE_SEEDS) {
      const input = {
        name: item.name,
        description: item.description,
        form: structuredClone(item.form),
      };
      const meta = { code: item.code, title: item.title };
      const existing = builtin.getBuiltinTemplateBySeedId(item.seedId);
      if (existing) {
        builtin.syncBuiltinTemplateFromSeed(item.seedId, input, meta);
        synced += 1;
        continue;
      }
      builtin.createBuiltinTemplate(input, item.seedId, meta);
      inserted += 1;
    }

    const before = db.prepare('SELECT COUNT(*) AS n FROM builtin_templates').get() as { n: number };
    builtin.deleteBuiltinTemplatesExcept(activeSeedIds);
    const after = db.prepare('SELECT COUNT(*) AS n FROM builtin_templates').get() as { n: number };
    removed = before.n - after.n;

    db.prepare(
      `INSERT INTO app_meta (key, value) VALUES (@key, @value)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ).run({ key: SEED_META_KEY, value: TEMPLATE_SEED_REVISION });
  });

  seed();
  if (inserted > 0 || synced > 0 || removed > 0) {
    console.log(
      `[templates] seeded ${inserted} new, synced ${synced} built-in, removed ${removed} retired built-in template(s)`,
    );
  }
}
