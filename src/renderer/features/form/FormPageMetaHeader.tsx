import type { DocumentContext } from '../../../shared/document';
import { resolveFormPageMetaHeader, type BuiltinTemplate } from '../../../shared/form';
import { cn } from '../../lib/cn';

const LONG_VALUE_CHARS = 22;

function metaValueClass(value: string): string {
  return cn(
    'form-page-meta-value',
    value.trim().length > LONG_VALUE_CHARS && 'form-page-meta-value--expand',
  );
}

export function FormPageMetaHeader({
  context,
  template,
}: {
  context?: DocumentContext | null;
  template?: Pick<BuiltinTemplate, 'code' | 'title' | 'name'>;
}) {
  const meta = resolveFormPageMetaHeader(context ?? null);
  const codeName =
    meta.codeName ||
    [template?.code, template?.title].filter(Boolean).join(' - ') ||
    '';

  return (
    <div className="form-page-header form-page-header--meta">
      <div className="form-page-meta-code">{codeName || '\u00a0'}</div>
      <table className="form-page-meta-table">
        <tbody>
          <tr>
            <td className="form-page-meta-label">Building Name:</td>
            <td className={metaValueClass(meta.buildingName)}>{meta.buildingName || '\u00a0'}</td>
            <td className="form-page-meta-label">Date:</td>
            <td className={metaValueClass(meta.date)}>{meta.date || '\u00a0'}</td>
          </tr>
          <tr>
            <td className="form-page-meta-label">Address:</td>
            <td className={metaValueClass(meta.address)}>{meta.address || '\u00a0'}</td>
            <td className="form-page-meta-label">City:</td>
            <td className={metaValueClass(meta.city)}>{meta.city || '\u00a0'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
