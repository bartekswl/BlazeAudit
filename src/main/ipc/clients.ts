import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/ipc';
import type { ClientInput } from '../../shared/types';
import { clients } from '../db';

export function registerClientsIpc(): void {
  ipcMain.handle(IpcChannels.clientsList, () => clients.listClients());

  ipcMain.handle(IpcChannels.clientsGet, (_event, id: string) => clients.getClient(id));

  ipcMain.handle(IpcChannels.clientsCreate, (_event, input: ClientInput) =>
    clients.createClient(input),
  );

  ipcMain.handle(IpcChannels.clientsUpdate, (_event, id: string, input: ClientInput) =>
    clients.updateClient(id, input),
  );

  ipcMain.handle(IpcChannels.clientsDelete, (_event, id: string) => clients.deleteClient(id));
}
