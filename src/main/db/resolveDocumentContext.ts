import {
  addressContextExtras,
  inspectorSliceFromName,
  inspectorSliceFromRecord,
  type DocumentContext,
} from '../../shared/document';
import type { Inspection } from '../../shared/inspection';
import { isFormInspectionDocument } from '../../shared/form';
import * as builtinTemplates from './builtinTemplates';
import * as clients from './clients';
import * as profile from './profile';
import * as templateRegistry from './templateRegistry';

export function resolveDocumentContext(inspection: Inspection): DocumentContext {
  const clientRow = clients.getClient(inspection.clientId);
  if (!clientRow) {
    throw new Error(`Client not found: ${inspection.clientId}`);
  }

  const businessRow = profile.getBusinessProfile();
  const logoDataUrl = profile.getBusinessLogoDataUrl();
  const businessExtras = addressContextExtras(businessRow);

  let template: DocumentContext['template'] = null;
  if (inspection.templateKind && inspection.templateId) {
    if (inspection.templateKind === 'builtin') {
      const builtin = builtinTemplates.getBuiltinTemplateMeta(inspection.templateId);
      if (builtin) {
        template = {
          kind: 'builtin',
          name: builtin.name,
          description: builtin.description,
          code: builtin.code,
          title: builtin.title,
          inspectionType: isFormInspectionDocument(inspection.document)
            ? inspection.document.form.pages[0]?.label ?? builtin.name
            : '',
        };
      }
    } else {
      const row = templateRegistry.getTemplate(inspection.templateId, inspection.templateKind);
      if (row) {
        template = {
          kind: inspection.templateKind,
          name: row.name,
          description: row.description,
          code: '',
          title: '',
          inspectionType: isFormInspectionDocument(inspection.document)
            ? inspection.document.form.pages[0]?.label ?? row.name
            : inspection.document.meta.inspectionType,
        };
      }
    }
  }

  const inspectorRows = profile.listInspectors();
  const matchedInspector = inspectorRows.find(
    (row) => row.name.trim().toLowerCase() === inspection.inspector.trim().toLowerCase(),
  );
  const inspector = matchedInspector
    ? inspectorSliceFromRecord(matchedInspector)
    : inspection.inspector.trim()
      ? inspectorSliceFromName(inspection.inspector)
      : null;

  return {
    template,
    client: {
      ...clientRow,
      ...addressContextExtras(clientRow),
    },
    inspection: {
      title: inspection.title,
      status: inspection.status,
      inspector: inspection.inspector,
      inspectedAt: inspection.inspectedAt,
      cadence: inspection.cadence,
      nextDueAt: inspection.nextDueAt,
    },
    business: {
      ...businessRow,
      ...businessExtras,
      logoDataUrl,
    },
    inspector,
  };
}

export function resolveBuiltinSeedId(inspection: Inspection): string | null {
  if (inspection.templateKind !== 'builtin' || !inspection.templateId) return null;
  return builtinTemplates.getBuiltinSeedId(inspection.templateId);
}
