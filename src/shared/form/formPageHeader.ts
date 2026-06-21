import type { DocumentContext } from '../document/context';
import { resolveBinding } from '../document/context';
import { formatDeficiencyMetaDate } from './deficiencies';

export interface FormPageMetaHeader {
  codeName: string;
  buildingName: string;
  date: string;
  address: string;
  city: string;
}

export function resolveFormPageMetaHeader(context: DocumentContext | null): FormPageMetaHeader {
  if (!context) {
    return { codeName: '', buildingName: '', date: '', address: '', city: '' };
  }
  const code = resolveBinding(context, 'template.code').trim();
  const title = resolveBinding(context, 'template.title').trim();
  const codeName = [code, title].filter(Boolean).join(' - ');
  const buildingName = resolveBinding(context, 'client.name').trim();
  const inspectedAt = resolveBinding(context, 'inspection.inspectedAt').trim();
  const date = inspectedAt ? formatDeficiencyMetaDate(inspectedAt) : '';
  const address =
    resolveBinding(context, 'client.addressLine1').trim() ||
    resolveBinding(context, 'client.street').trim();
  const city = resolveBinding(context, 'client.city').trim();
  return { codeName, buildingName, date, address, city };
}
