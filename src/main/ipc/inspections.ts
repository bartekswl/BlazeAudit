import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/ipc';
import type { CreateInspectionInput, InspectionInput } from '../../shared/inspection';
import { inspections, resolveDocumentContext } from '../db';
import { exportInspectionPdf } from '../pdf/exportInspectionPdf';
import { importInspectionPdf } from '../pdf/importInspectionPdf';

export function registerInspectionsIpc(): void {
  ipcMain.handle(IpcChannels.inspectionsList, (_event, options?: { clientId?: string }) =>
    inspections.listInspections(options),
  );

  ipcMain.handle(IpcChannels.inspectionsGet, (_event, id: string) => inspections.getInspection(id));

  ipcMain.handle(IpcChannels.inspectionsCreate, (_event, input: CreateInspectionInput) =>
    inspections.createInspectionFromTemplate(input),
  );

  ipcMain.handle(IpcChannels.inspectionsUpdate, (_event, id: string, input: InspectionInput) =>
    inspections.updateInspection(id, input),
  );

  ipcMain.handle(IpcChannels.inspectionsDelete, (_event, id: string) =>
    inspections.deleteInspection(id),
  );

  ipcMain.handle(IpcChannels.inspectionsDashboard, () => inspections.getDashboardStats());

  ipcMain.handle(IpcChannels.inspectionsClientStats, (_event, clientId: string) =>
    inspections.getClientInspectionStats(clientId),
  );

  ipcMain.handle(IpcChannels.inspectionsExportPdf, (_event, id: string) =>
    exportInspectionPdf(id),
  );

  ipcMain.handle(IpcChannels.inspectionsImportPdf, () => importInspectionPdf());

  ipcMain.handle(IpcChannels.inspectionsResolveContext, (_event, id: string) => {
    const inspection = inspections.getInspection(id);
    if (!inspection) throw new Error(`Inspection not found: ${id}`);
    return resolveDocumentContext(inspection);
  });
}
