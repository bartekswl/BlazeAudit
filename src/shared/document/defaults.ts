import type { Document } from './types';

export interface DefaultTemplateSeed {
  seedId: string;
  name: string;
  description: string;
  document: Document;
}

/** Bundled built-in templates synced on unlock. Empty until new seeds are added. */
export const DEFAULT_TEMPLATE_SEEDS: DefaultTemplateSeed[] = [];
