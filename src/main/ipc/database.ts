import { dialog, ipcMain } from 'electron';
import fs from 'node:fs';
import { CLIENT_SPREADSHEET_COLUMNS, clientToSpreadsheetRow } from '../../shared/clientColumns';
import { buildCsv } from '../../shared/csv';
import { IpcChannels } from '../../shared/ipc';
import { clients } from '../db';

export function registerDatabaseIpc(): void {
  ipcMain.handle(IpcChannels.databaseExportClientsCsv, async () => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export customer list',
      defaultPath: 'blazeaudit-customers.csv',
      filters: [
        { name: 'CSV (Excel compatible)', extensions: ['csv'] },
        { name: 'All files', extensions: ['*'] },
      ],
    });

    if (canceled || !filePath) return { saved: false as const };

    const rows = clients.listClients().map(clientToSpreadsheetRow);
    const csv = buildCsv(CLIENT_SPREADSHEET_COLUMNS, rows);
    fs.writeFileSync(filePath, `\uFEFF${csv}`, 'utf8');

    return { saved: true as const, filePath };
  });
}
