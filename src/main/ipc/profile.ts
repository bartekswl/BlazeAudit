import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/ipc';
import type { BusinessProfileInput, InspectorInput } from '../../shared/profile';
import { profile } from '../db';

export function registerProfileIpc(): void {
  ipcMain.handle(IpcChannels.profileGetBusiness, () => profile.getBusinessProfile());

  ipcMain.handle(IpcChannels.profileUpdateBusiness, (_event, input: BusinessProfileInput) =>
    profile.updateBusinessProfile(input),
  );

  ipcMain.handle(IpcChannels.profileGetLogo, () => profile.getBusinessLogoDataUrl());

  ipcMain.handle(IpcChannels.profilePickLogo, () => profile.pickBusinessLogo());

  ipcMain.handle(IpcChannels.profileRemoveLogo, () => profile.removeBusinessLogo());

  ipcMain.handle(IpcChannels.profileListInspectors, () => profile.listInspectors());

  ipcMain.handle(IpcChannels.profileCreateInspector, (_event, input: InspectorInput) =>
    profile.createInspector(input),
  );

  ipcMain.handle(IpcChannels.profileUpdateInspector, (_event, id: string, input: InspectorInput) =>
    profile.updateInspector(id, input),
  );

  ipcMain.handle(IpcChannels.profileDeleteInspector, (_event, id: string) =>
    profile.deleteInspector(id),
  );
}
