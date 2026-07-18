import { dialog } from 'electron';

export async function pickPdfSavePath(options: {
  title: string;
  defaultFilename: string;
}): Promise<string | null> {
  const safeName = options.defaultFilename.replace(/[^\w\-]+/g, '-').replace(/-+/g, '-');
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: options.title,
    defaultPath: `${safeName || 'document'}.pdf`,
    filters: [
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'All files', extensions: ['*'] },
    ],
  });
  if (canceled || !filePath) return null;
  return filePath;
}
