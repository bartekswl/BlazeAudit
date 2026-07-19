import { dialog, ipcMain, shell } from 'electron';
import fs from 'node:fs';
import {
  CLIENT_SPREADSHEET_COLUMNS,
  clientInputsFromSpreadsheetCsv,
  clientToSpreadsheetRow,
} from '../../shared/clientColumns';
import { buildCsv, parseCsv } from '../../shared/csv';
import { IpcChannels } from '../../shared/ipc';
import { clients } from '../db';
import { dataDir, describeDataDir } from '../db/paths';

function normalizeClientName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function registerDatabaseIpc(): void {
  ipcMain.handle(IpcChannels.databaseGetDataDir, () => describeDataDir());

  ipcMain.handle(IpcChannels.databaseOpenDataFolder, async () => {
    const dir = dataDir();
    const err = await shell.openPath(dir);
    if (err) throw new Error(err);
    return { opened: true as const, path: dir };
  });

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

  ipcMain.handle(IpcChannels.databaseImportClientsCsv, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import customers',
      properties: ['openFile'],
      filters: [
        { name: 'CSV (Excel compatible)', extensions: ['csv'] },
        { name: 'All files', extensions: ['*'] },
      ],
    });

    if (canceled || filePaths.length === 0) return { imported: false as const };

    const filePath = filePaths[0];
    const text = fs.readFileSync(filePath, 'utf8');
    const { headers, rows } = parseCsv(text);
    const inputs = clientInputsFromSpreadsheetCsv(headers, rows);

    const existingNames = new Set(
      clients.listClients().map((c) => normalizeClientName(c.name)).filter(Boolean),
    );

    let created = 0;
    let skippedExisting = 0;
    let skippedEmpty = 0;

    for (const input of inputs) {
      const key = normalizeClientName(input.name);
      if (!key) {
        skippedEmpty += 1;
        continue;
      }
      if (existingNames.has(key)) {
        skippedExisting += 1;
        continue;
      }
      clients.createClient(input);
      existingNames.add(key);
      created += 1;
    }

    return {
      imported: true as const,
      filePath,
      created,
      skippedExisting,
      skippedEmpty,
      totalRows: inputs.length,
    };
  });
}
