import { dialog, ipcMain } from 'electron';
import { IpcChannels } from '../../shared/ipc';
import type { OcrPage } from '../../shared/form/readContent/ocrTypes';
import type { PenRead } from '../../shared/form/readContent/applyReadPages';
import { readHandwriting, type HandwritingRequest } from '../ocr/handwriting';
import { recognizeDocument } from '../ocr/windowsOcr';

export type ReadContentScan = {
  pages: OcrPage[];
  /** One photo path per page. A PDF repeats the same path. */
  sources: string[];
};

export function registerReadContentIpc(): void {
  ipcMain.handle(IpcChannels.inspectionsReadContent, async (): Promise<ReadContentScan | null> => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Read Content',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Photos and scans',
          extensions: ['png', 'jpg', 'jpeg', 'bmp', 'tif', 'tiff', 'pdf'],
        },
      ],
    });
    if (canceled || filePaths.length === 0) return null;

    const pages: OcrPage[] = [];
    const sources: string[] = [];
    for (const filePath of filePaths) {
      const recognized = await recognizeDocument(filePath);
      pages.push(...recognized);
      for (let index = 0; index < recognized.length; index += 1) sources.push(filePath);
    }
    if (pages.length === 0) {
      throw new Error('Nothing in that file could be read.');
    }
    return { pages, sources };
  });

  ipcMain.handle(
    IpcChannels.inspectionsReadHandwriting,
    async (_event, jobs: HandwritingRequest[]): Promise<PenRead[]> => {
      if (!Array.isArray(jobs)) return [];
      return readHandwriting(jobs);
    },
  );
}
