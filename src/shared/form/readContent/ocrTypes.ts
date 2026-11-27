/** One word from Windows OCR, with a box in 0–1 page coordinates. */
export type OcrWord = {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type OcrLine = {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  words: OcrWord[];
};

/** One photo, or one page of a scanned PDF. */
export type OcrPage = {
  lines: OcrLine[];
};

export const BLAZE_ONLY_MESSAGE = 'Only BlazeAudit documents can be loaded.';

export const PAGE_UNCLEAR_MESSAGE = 'Could not tell which BlazeAudit page this is.';
