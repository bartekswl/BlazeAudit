import type { BuiltinTemplateMeta } from './context';
import type { FormDefinition } from '../form';
import { formPrototypeDefinition, FORM_PROTOTYPE_SEED_ID } from '../form/seeds/form-prototype';

export { FORM_PROTOTYPE_SEED_ID, formPrototypeDefinition } from '../form/seeds/form-prototype';

export interface DefaultTemplateSeed extends BuiltinTemplateMeta {
  seedId: string;
  name: string;
  description: string;
  form: FormDefinition;
}

export const DEFAULT_TEMPLATE_SEEDS: DefaultTemplateSeed[] = [
  {
    seedId: FORM_PROTOTYPE_SEED_ID,
    name: 'Annual Fire Alarm Test',
    code: 'ULC 536:2019 (2024)',
    title: '20 ANNUAL FIRE ALARM SYSTEM TEST AND INSPECTION RECORD',
    description: 'Page-based form shell with header variables, footer, and demo section.',
    form: formPrototypeDefinition(),
  },
];
