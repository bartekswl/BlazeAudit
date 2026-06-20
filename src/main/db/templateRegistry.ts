import type { Template, TemplateKind, TemplatePickerItem, TemplateRef } from '../../shared/document';
import { emptyDocument } from '../../shared/document';
import * as builtin from './builtinTemplates';
import * as custom from './customTemplates';

/** Resolve a custom block template from ref — built-ins use getBuiltinTemplate directly. */
export function resolveTemplate(ref: TemplateRef): Template | null {
  if (ref.kind === 'builtin') return null;
  return custom.getCustomTemplate(ref.id);
}

/** Copy a built-in template into custom_templates (future UI hook). */
export function duplicateBuiltinToCustom(builtinId: string): Template | null {
  const source = builtin.getBuiltinTemplate(builtinId);
  if (!source) return null;
  return custom.createCustomTemplate({
    name: `${source.name} (copy)`,
    description: source.description,
    document: emptyDocument({ title: source.name }),
  });
}

export function getTemplate(id: string, kind: TemplateKind): Template | null {
  return kind === 'builtin' ? null : custom.getCustomTemplate(id);
}

export function listTemplatesForPicker(): TemplatePickerItem[] {
  const items: TemplatePickerItem[] = [
    ...builtin.listBuiltinTemplates().map((row) => ({
      kind: 'builtin' as const,
      id: row.id,
      name: row.name,
      description: row.description,
      version: row.version,
      blockCount: row.blockCount,
    })),
    ...custom.listCustomTemplates().map((row) => ({
      kind: 'custom' as const,
      id: row.id,
      name: row.name,
      description: row.description,
      version: row.version,
      blockCount: row.blockCount,
    })),
  ];

  return items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}
