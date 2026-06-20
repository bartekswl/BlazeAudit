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
    name: 'Form prototype',
    code: 'PROTOTYPE-001',
    title: 'Built-in form prototype — page shell',
    description: 'Page-based form shell with header variables, footer, and demo section.',
    form: formPrototypeDefinition(),
  },
];
