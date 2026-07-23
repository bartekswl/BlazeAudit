import type { BuiltinTemplateMeta } from './context';
import type { FormDefinition } from '../form';
import { formPrototypeDefinition, FORM_PROTOTYPE_SEED_ID } from '../form/seeds/form-prototype';
import {
  emergencyLightingDefinition,
  EMERGENCY_LIGHTING_SEED_ID,
} from '../form/seeds/emergency-lighting';
import {
  portableExtinguishersDefinition,
  PORTABLE_EXTINGUISHERS_SEED_ID,
} from '../form/seeds/portable-extinguishers';

export { FORM_PROTOTYPE_SEED_ID, formPrototypeDefinition } from '../form/seeds/form-prototype';
export {
  EMERGENCY_LIGHTING_SEED_ID,
  emergencyLightingDefinition,
} from '../form/seeds/emergency-lighting';
export {
  PORTABLE_EXTINGUISHERS_SEED_ID,
  portableExtinguishersDefinition,
} from '../form/seeds/portable-extinguishers';

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
  {
    seedId: PORTABLE_EXTINGUISHERS_SEED_ID,
    name: 'Portable Extinguishers',
    code: '',
    title: 'Annual Portable Extinguishers Inspection Report',
    description: 'Cover page plus Fire Extinguisher Test Record working table.',
    form: portableExtinguishersDefinition(),
  },
  {
    seedId: EMERGENCY_LIGHTING_SEED_ID,
    name: 'Emergency Lighting',
    code: '',
    title: 'Emergency Lighting Inspection Report',
    description: 'Cover, comments/recommendations/device legend, and Inspection Record.',
    form: emergencyLightingDefinition(),
  },
];
