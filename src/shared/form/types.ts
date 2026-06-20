import type { BindingPath } from '../document/context';

export const FORM_SCHEMA_VERSION = 2 as const;

export type ChecklistColumnMode = 'yesNo' | 'passFail';

export interface FormTableColumn {
  key: string;
  title: string;
  widthPercent?: number;
}

export type RegionContent =
  | { kind: 'variable'; binding: BindingPath; align?: 'left' | 'center' | 'right' }
  | { kind: 'spacer' };

export interface FormRegion {
  id: string;
  heightPercent: number;
  content: RegionContent;
}

export type FormElement =
  | {
      kind: 'table';
      id: string;
      label?: string;
      columns: FormTableColumn[];
      rowLabels?: string[];
      minRows?: number;
    }
  | {
      kind: 'checklist';
      id: string;
      label?: string;
      items: { id: string; label: string }[];
      columns: ChecklistColumnMode;
    }
  | {
      kind: 'text';
      id: string;
      label?: string;
      binding?: BindingPath;
      multiline?: boolean;
      placeholder?: string;
    }
  | {
      kind: 'signature';
      id: string;
      label?: string;
      role?: string;
    };

export interface FormSection {
  id: string;
  number: number;
  title?: string;
  heightPercent?: number;
  elements: FormElement[];
}

export interface FormPage {
  id: string;
  label?: string;
  regions: FormRegion[];
  sections: FormSection[];
}

/** Built-in template body — stored in builtin_templates.document */
export interface FormDefinition {
  schemaVersion: typeof FORM_SCHEMA_VERSION;
  kind: 'form-definition';
  disclaimer: string;
  pages: FormPage[];
}

/** Inspection snapshot when created from a built-in form template */
export interface FormInspectionDocument {
  schemaVersion: typeof FORM_SCHEMA_VERSION;
  kind: 'form-inspection';
  clientId: string;
  form: FormDefinition;
  values: Record<string, unknown>;
}

export interface BuiltinTemplate {
  id: string;
  seedId: string;
  name: string;
  description: string;
  code: string;
  title: string;
  form: FormDefinition;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface TableElementValue {
  rows: Record<string, string>[];
}

export interface ChecklistElementValue {
  [itemId: string]: string | null;
}

export interface SignatureElementValue {
  name: string;
  date: string | null;
}
