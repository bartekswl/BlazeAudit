import {
  EMERGENCY_LIGHTING_SEED_ID,
  FORM_PROTOTYPE_SEED_ID,
  PORTABLE_EXTINGUISHERS_SEED_ID,
} from './defaults';
import { walkFormElements, type FormDefinition, type FormElement } from '../form';

function formHasKind(form: FormDefinition, kind: FormElement['kind']): boolean {
  let found = false;
  walkFormElements(form, (element) => {
    if (element.kind === kind) found = true;
  });
  return found;
}

/**
 * Infer which built-in template seed produced a form snapshot.
 * Used when an imported inspection's `templateId` UUID is from another machine
 * (or an old local row) and no longer resolves in `builtin_templates`.
 */
export function inferBuiltinSeedIdFromForm(form: FormDefinition): string | null {
  if (formHasKind(form, 'portableExtinguisherCover') || formHasKind(form, 'fireExtinguisherTestRecord')) {
    return PORTABLE_EXTINGUISHERS_SEED_ID;
  }
  if (
    formHasKind(form, 'emergencyLightingCover') ||
    formHasKind(form, 'emergencyLightingInspectionRecord')
  ) {
    return EMERGENCY_LIGHTING_SEED_ID;
  }
  if (formHasKind(form, 'ulcSection1') || formHasKind(form, 'individualDeviceRecord')) {
    return FORM_PROTOTYPE_SEED_ID;
  }
  return null;
}
