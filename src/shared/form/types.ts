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
    }
  | {
      kind: 'ulcSection1';
      id: string;
    }
  | {
      kind: 'yesNoSummary';
      id: string;
      items: YesNoSummaryItem[];
    }
  | {
      kind: 'affirmation';
      id: string;
    }
  | {
      kind: 'deficiencies';
      id: string;
    }
  | {
      kind: 'recommendations';
      id: string;
    }
  | {
      kind: 'testingNotes';
      id: string;
    }
  | {
      kind: 'attendanceLog';
      id: string;
    };

export type FormPageOrientation = 'portrait' | 'landscape';

/** Page 2+ header: Code – Name line and building meta table. Page 1 uses template regions. */
export type FormPageHeaderKind = 'templateRegions' | 'codeNameMeta';

export interface FormSection {
  id: string;
  /** Section number for numbered headings; omit when the Contents outline uses a plain label. */
  number?: number;
  title?: string;
  /** Full section heading when set (e.g. "20.1 Fire Alarm System…"). Overrides number + title display. */
  heading?: string;
  heightPercent?: number;
  elements: FormElement[];
}

export interface FormPage {
  id: string;
  label?: string;
  /** Default portrait (A4 210×297 mm). Landscape pages use 297×210 mm. */
  orientation?: FormPageOrientation;
  /** When set to `codeNameMeta`, renders standard Code–Name + building table header. Otherwise uses `regions`. */
  header?: FormPageHeaderKind;
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

export interface YesNoSummaryItem {
  id: string;
  text: string;
  /** Inline underline field after `text`. */
  fillIn?: boolean;
  /** Copy after the fill-in field (same summary cell). */
  textAfterFill?: string;
}

export interface YesNoSummaryItemValue {
  choice: 'yes' | 'no' | null;
  fillIn?: string;
}

export type YesNoSummaryValue = Record<string, YesNoSummaryItemValue>;

export type { UlcSection1Value } from './ulcSection1';
export type { AffirmationValue } from './affirmation';
export type { LinedNotesValue } from './linedNotes';
export type { AttendanceLogValue } from './attendanceLog';
export type {
  DeficienciesValue,
  DeficiencyControlRow,
  DeficiencyDeviceRow,
  DeficiencyRepairFields,
} from './deficiencies';
