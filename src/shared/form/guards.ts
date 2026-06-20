import type { Document } from '../document';
import type { FormDefinition, FormInspectionDocument } from './types';

export function isFormDefinition(value: unknown): value is FormDefinition {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as FormDefinition).schemaVersion === 2 &&
    (value as FormDefinition).kind === 'form-definition'
  );
}

export function isFormInspectionDocument(value: unknown): value is FormInspectionDocument {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as FormInspectionDocument).schemaVersion === 2 &&
    (value as FormInspectionDocument).kind === 'form-inspection'
  );
}

export type InspectionDocument = Document | FormInspectionDocument;

export function isBlockDocument(doc: InspectionDocument): doc is Document {
  return !isFormInspectionDocument(doc);
}
