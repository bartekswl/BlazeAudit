import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/ipc';
import type { CreateInspectionInput, InspectionInput } from '../../shared/inspection';
import { inspections, resolveDocumentContext } from '../db';

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

  ipcMain.handle(
    IpcChannels.inspectionsPickPdfPath,
    async (_event, id: string) => {
      const { pickInspectionPdfPath } = await import('../pdf/exportInspectionPdf');
      return pickInspectionPdfPath(id);
    },
  );

  ipcMain.handle(
    IpcChannels.inspectionsExportPdf,
    async (_event, id: string, html?: string, targetPath?: string) => {
      const { exportInspectionPdf } = await import('../pdf/exportInspectionPdf');
      return exportInspectionPdf(id, html, targetPath);
    },
  );

  ipcMain.handle(IpcChannels.inspectionsImportPdf, async () => {
    const { importInspectionPdf } = await import('../pdf/importInspectionPdf');
    return importInspectionPdf();
  });

  ipcMain.handle(IpcChannels.inspectionsInspectPdfImport, async () => {
    const { inspectInspectionPdfImport } = await import('../pdf/importInspectionPdf');
    return inspectInspectionPdfImport();
  });

  ipcMain.handle(IpcChannels.inspectionsConfirmPdfImport, async (_event, filePath: string) => {
    const { confirmInspectionPdfImport } = await import('../pdf/importInspectionPdf');
    return confirmInspectionPdfImport(filePath);
  });

  ipcMain.handle(IpcChannels.inspectionsResolveContext, (_event, id: string) => {
    const inspection = inspections.getInspection(id);
    if (!inspection) throw new Error(`Inspection not found: ${id}`);
    return resolveDocumentContext(inspection);
  });
}
