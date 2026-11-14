import { inferBuiltinSeedIdFromForm } from '../document';
import type { FormDefinition, FormInspectionDocument } from './types';
import { walkFormElements } from './layout';
import { createEmptyFormValues } from './values';

/**
 * Replace stored form layout with the canonical built-in template while carrying
 * over values for element ids that exist on both forms (e.g. client / date fields).
 */
export function remountFormInspectionDocument(
  document: FormInspectionDocument,
  templateForm: FormDefinition,
): FormInspectionDocument {
  const form = structuredClone(templateForm);
  const defaults = createEmptyFormValues(form);
  const values: Record<string, unknown> = { ...defaults };
  walkFormElements(form, (element) => {
    if (element.id in document.values) {
      values[element.id] = document.values[element.id];
    }
  });
  return { ...document, form, values };
}

/** When `template_id` and stored `document.form` disagree, trust the linked built-in template. */
export function reconcileBuiltinFormInspectionDocument(
  document: FormInspectionDocument,
  templateSeedId: string | null,
  templateForm: FormDefinition | null,
): FormInspectionDocument {
  if (!templateSeedId || !templateForm) return document;
  const formSeedId = inferBuiltinSeedIdFromForm(document.form);
  if (formSeedId === templateSeedId) return document;
  return remountFormInspectionDocument(document, templateForm);
}
