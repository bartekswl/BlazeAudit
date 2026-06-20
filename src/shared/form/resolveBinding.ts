import { resolveBinding, type BindingPath, type DocumentContext } from '../document/context';
import type { BuiltinTemplate } from './types';

export function resolveFormBinding(
  binding: BindingPath,
  context: DocumentContext | null,
  template?: Pick<BuiltinTemplate, 'code' | 'title' | 'name'>,
): string {
  if (context) {
    const value = resolveBinding(context, binding);
    if (value) return value;
  }
  if (template) {
    if (binding === 'template.code') return template.code;
    if (binding === 'template.title') return template.title;
    if (binding === 'template.name') return template.name;
  }
  return '';
}
