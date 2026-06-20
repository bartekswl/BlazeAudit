import { validatePagePercentBudget } from './layout';
import type { FormDefinition, FormInspectionDocument, FormPage } from './types';
import { FORM_SCHEMA_VERSION } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateFormDefinition(input: unknown): { ok: true; form: FormDefinition } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(input)) return { ok: false, errors: ['Form definition must be an object.'] };
  if (input.schemaVersion !== FORM_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${FORM_SCHEMA_VERSION}.`);
  }
  if (input.kind !== 'form-definition') {
    errors.push('kind must be "form-definition".');
  }
  if (typeof input.disclaimer !== 'string') {
    errors.push('disclaimer must be a string.');
  }
  if (!Array.isArray(input.pages) || input.pages.length === 0) {
    errors.push('pages must be a non-empty array.');
  }

  const pages = Array.isArray(input.pages) ? input.pages : [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (!isRecord(page)) {
      errors.push(`pages[${i}] must be an object.`);
      continue;
    }
    if (typeof page.id !== 'string' || !page.id.trim()) {
      errors.push(`pages[${i}].id is required.`);
    }
    const budgetError = validatePagePercentBudget(page as unknown as FormPage);
    if (budgetError) errors.push(budgetError);
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    form: input as unknown as FormDefinition,
  };
}

export function validateFormInspectionDocument(
  input: unknown,
): { ok: true; document: FormInspectionDocument } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(input)) return { ok: false, errors: ['Inspection document must be an object.'] };
  if (input.schemaVersion !== FORM_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${FORM_SCHEMA_VERSION}.`);
  }
  if (input.kind !== 'form-inspection') {
    errors.push('kind must be "form-inspection".');
  }
  if (typeof input.clientId !== 'string' || !input.clientId.trim()) {
    errors.push('clientId is required.');
  }
  if (!isRecord(input.values)) {
    errors.push('values must be an object.');
  }

  const formResult = validateFormDefinition(input.form);
  if (!formResult.ok) {
    errors.push(...formResult.errors.map((e) => `form.${e}`));
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    document: input as unknown as FormInspectionDocument,
  };
}

export function parseStoredFormDefinition(json: string): FormDefinition {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Built-in form is not valid JSON.');
  }
  const result = validateFormDefinition(parsed);
  if (!result.ok) throw new Error(result.errors.join(' '));
  return result.form;
}

export function parseStoredFormInspectionDocument(json: string, requireClient = true): FormInspectionDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Inspection document is not valid JSON.');
  }
  const result = validateFormInspectionDocument(parsed);
  if (!result.ok) throw new Error(result.errors.join(' '));
  if (requireClient && !result.document.clientId) {
    throw new Error('Inspection document must reference a client.');
  }
  return result.document;
}
