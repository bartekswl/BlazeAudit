import type {
  ChecklistElementValue,
  FormDefinition,
  FormElement,
  FormInspectionDocument,
  SignatureElementValue,
  TableElementValue,
} from './types';
import { walkFormElements } from './layout';
import { emptyAffirmationValue } from './affirmation';
import { emptyDeficienciesValue } from './deficiencies';
import { emptyUlcSection1Value, normalizeUlcSection1Value } from './ulcSection1';
import { emptyYesNoSummaryValue } from './yesNoSummary';

function emptyTableValue(element: Extract<FormElement, { kind: 'table' }>): TableElementValue {
  const rowCount = Math.max(1, element.minRows ?? element.rowLabels?.length ?? 1);
  const rows: Record<string, string>[] = [];
  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, string> = {};
    for (const col of element.columns) {
      row[col.key] = element.rowLabels?.[i] ?? '';
    }
    rows.push(row);
  }
  return { rows };
}

function emptyChecklistValue(element: Extract<FormElement, { kind: 'checklist' }>): ChecklistElementValue {
  return Object.fromEntries(element.items.map((item) => [item.id, null]));
}

function emptySignatureValue(): SignatureElementValue {
  return { name: '', date: null };
}

export function initialValueForElement(element: FormElement): unknown {
  switch (element.kind) {
    case 'table':
      return emptyTableValue(element);
    case 'checklist':
      return emptyChecklistValue(element);
    case 'text':
      return '';
    case 'signature':
      return emptySignatureValue();
    case 'ulcSection1':
      return emptyUlcSection1Value();
    case 'yesNoSummary':
      return emptyYesNoSummaryValue(element.items);
    case 'affirmation':
      return emptyAffirmationValue();
    case 'deficiencies':
      return emptyDeficienciesValue();
    default: {
      const _exhaustive: never = element;
      return _exhaustive;
    }
  }
}

export function createEmptyFormValues(form: FormDefinition): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  walkFormElements(form, (element) => {
    values[element.id] = initialValueForElement(element);
  });
  return values;
}

export function createFormInspectionDocument(
  form: FormDefinition,
  clientId: string,
): FormInspectionDocument {
  return {
    schemaVersion: 2,
    kind: 'form-inspection',
    clientId,
    form: structuredClone(form),
    values: createEmptyFormValues(form),
  };
}

export function getElementValue<T>(values: Record<string, unknown>, elementId: string, fallback: T): T {
  const value = values[elementId];
  return (value as T) ?? fallback;
}

export function setElementValue(
  values: Record<string, unknown>,
  elementId: string,
  value: unknown,
): Record<string, unknown> {
  return { ...values, [elementId]: value };
}

/** Push inspection date into ULC Date of Service (and any other date-bound fields). */
export function syncFormDocumentInspectionDate(
  document: FormInspectionDocument,
  inspectedAt: string | null,
): FormInspectionDocument {
  if (!inspectedAt) return document;

  let nextValues = document.values;
  walkFormElements(document.form, (element) => {
    if (element.kind !== 'ulcSection1') return;
    const current = normalizeUlcSection1Value(nextValues[element.id]);
    nextValues = setElementValue(nextValues, element.id, {
      ...current,
      dateOfService: inspectedAt,
    });
  });

  if (nextValues === document.values) return document;
  return { ...document, values: nextValues };
}
