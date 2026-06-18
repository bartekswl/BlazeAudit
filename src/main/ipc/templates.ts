import { app, dialog, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildTemplateExportPayload,
  DEFAULT_TEMPLATE_SEEDS,
  documentSchema,
  parseTemplateExportPayload,
  SCHEMA_KIT_README,
  type TemplateInput,
} from '../../shared/document';
import { IpcChannels } from '../../shared/ipc';
import { templates } from '../db';

export function registerTemplatesIpc(): void {
  ipcMain.handle(IpcChannels.templatesList, () => templates.listTemplates());

  ipcMain.handle(IpcChannels.templatesGet, (_event, id: string) => templates.getTemplate(id));

  ipcMain.handle(IpcChannels.templatesCreate, (_event, input: TemplateInput) =>
    templates.createTemplate(input),
  );

  ipcMain.handle(IpcChannels.templatesUpdate, (_event, id: string, input: TemplateInput) =>
    templates.updateTemplate(id, input),
  );

  ipcMain.handle(IpcChannels.templatesDelete, (_event, id: string) => templates.deleteTemplate(id));

  ipcMain.handle(IpcChannels.templatesDuplicate, (_event, id: string) =>
    templates.duplicateTemplate(id),
  );

  ipcMain.handle(IpcChannels.templatesExportJson, async (_event, id: string) => {
    const template = templates.getTemplate(id);
    if (!template) throw new Error(`Template not found: ${id}`);

    const safeName = template.name.replace(/[^\w\-]+/g, '-').replace(/-+/g, '-');
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export template',
      defaultPath: `${safeName || 'template'}.json`,
      filters: [
        { name: 'BlazeAudit template', extensions: ['json'] },
        { name: 'All files', extensions: ['*'] },
      ],
    });

    if (canceled || !filePath) return { saved: false as const };

    const payload = buildTemplateExportPayload(
      template.name,
      template.description,
      template.document,
      app.getVersion(),
    );
    fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    return { saved: true as const, filePath };
  });

  ipcMain.handle(IpcChannels.templatesImportJson, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import template JSON',
      properties: ['openFile'],
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'All files', extensions: ['*'] },
      ],
    });

    if (canceled || filePaths.length === 0) return { imported: false as const };

    const raw = fs.readFileSync(filePaths[0], 'utf8');
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('File is not valid JSON.');
    }

    const result = parseTemplateExportPayload(parsed);
    if (!result.ok) throw new Error(result.errors.join(' '));

    const created = templates.createTemplate({
      name: result.name ?? result.document.meta.title,
      description: result.description ?? '',
      document: result.document,
    });

    return { imported: true as const, templateId: created.id, filePath: filePaths[0] };
  });

  ipcMain.handle(IpcChannels.templatesExportSchemaKit, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Choose folder for schema kit',
      properties: ['openDirectory', 'createDirectory'],
    });

    if (canceled || filePaths.length === 0) return { saved: false as const };

    const dir = filePaths[0];
    const example = DEFAULT_TEMPLATE_SEEDS[0].document;

    fs.writeFileSync(path.join(dir, 'schema.json'), `${JSON.stringify(documentSchema, null, 2)}\n`, 'utf8');
    fs.writeFileSync(path.join(dir, 'example.json'), `${JSON.stringify(example, null, 2)}\n`, 'utf8');
    fs.writeFileSync(path.join(dir, 'README.md'), SCHEMA_KIT_README, 'utf8');

    return { saved: true as const, directory: dir };
  });
}
