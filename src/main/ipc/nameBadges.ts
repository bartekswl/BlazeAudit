import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/ipc';
import type { NameBadgeInput } from '../../shared/nameBadges';
import * as nameBadges from '../db/nameBadges';
import { exportNameBadgesPdf } from '../pdf/exportNameBadgesPdf';

export function registerNameBadgesIpc(): void {
  ipcMain.handle(IpcChannels.nameBadgesList, () => nameBadges.listNameBadges());

  ipcMain.handle(IpcChannels.nameBadgesCreate, (_event, input?: NameBadgeInput) =>
    nameBadges.createNameBadge(input),
  );

  ipcMain.handle(IpcChannels.nameBadgesUpdate, (_event, id: string, input: NameBadgeInput) =>
    nameBadges.updateNameBadge(id, input),
  );

  ipcMain.handle(IpcChannels.nameBadgesDelete, (_event, id: string) =>
    nameBadges.deleteNameBadge(id),
  );

  ipcMain.handle(IpcChannels.nameBadgesGetPhoto, (_event, id: string) =>
    nameBadges.getNameBadgePhotoDataUrl(id),
  );

  ipcMain.handle(IpcChannels.nameBadgesPickPhoto, (_event, id: string) =>
    nameBadges.pickNameBadgePhoto(id),
  );

  ipcMain.handle(IpcChannels.nameBadgesRemovePhoto, (_event, id: string) =>
    nameBadges.removeNameBadgePhoto(id),
  );

  ipcMain.handle(
    IpcChannels.nameBadgesExportPdf,
    (_event, html: string, defaultFilename?: string) => exportNameBadgesPdf(html, defaultFilename),
  );
}
