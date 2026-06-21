import type { BuiltinTemplate } from '../../../shared/form';
import { BuiltinFormViewer } from '../form/BuiltinFormViewer';

/** @deprecated Use BuiltinFormViewer — kept as thin wrapper for existing imports. */
export function BuiltinTemplateViewer({ template }: { template: BuiltinTemplate }) {
  return <BuiltinFormViewer template={template} />;
}
