/** ISO/IEC 7810 ID-1 (CR80) — standard credit-card / badge size. */
export const NAME_BADGE_WIDTH_MM = 85.6;
export const NAME_BADGE_HEIGHT_MM = 53.98;

export const NAME_BADGE_MAX_EMPLOYEES = 8;

export const NAME_BADGE_PER_PAGE_OPTIONS = [1, 2, 4, 6, 8, 10] as const;
export type NameBadgePerPage = (typeof NAME_BADGE_PER_PAGE_OPTIONS)[number];

export interface NameBadge {
  id: string;
  name: string;
  title: string;
  hasPhoto: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface NameBadgeInput {
  name: string;
  title: string;
}

export interface NameBadgePrintSlot {
  id: string;
  name: string;
  title: string;
  photoDataUrl: string | null;
}

export interface NameBadgePrintContext {
  businessName: string;
  logoDataUrl: string | null;
  badgesPerPage: NameBadgePerPage;
  pages: NameBadgePrintSlot[][];
}

export function blankNameBadgePrintSlot(): NameBadgePrintSlot {
  return { id: '__blank__', name: '', title: '', photoDataUrl: null };
}

/**
 * Build PDF page slot grids. Uses every employee once before repeating.
 * When roster fits on one page, cycles to fill all slots on that page.
 */
export function paginateNameBadgeSlots(
  slots: NameBadgePrintSlot[],
  badgesPerPage: number,
): NameBadgePrintSlot[][] {
  const perPage = Math.max(1, Math.min(badgesPerPage, 10));
  const roster = slots.filter(
    (badge) => badge.name.trim() || badge.title.trim() || badge.photoDataUrl,
  );

  if (roster.length === 0) {
    const blank = blankNameBadgePrintSlot();
    return [Array.from({ length: perPage }, () => blank)];
  }

  if (roster.length <= perPage) {
    return [Array.from({ length: perPage }, (_, index) => roster[index % roster.length])];
  }

  const pages: NameBadgePrintSlot[][] = [];
  let index = 0;

  while (index < roster.length) {
    const page: NameBadgePrintSlot[] = [];
    while (page.length < perPage && index < roster.length) {
      page.push(roster[index]);
      index += 1;
    }
    while (page.length < perPage) {
      page.push(roster[page.length % roster.length]);
    }
    pages.push(page);
  }

  return pages;
}

export function nameBadgeGridLayout(count: number): { cols: number; rows: number } {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count <= 2) return { cols: 2, rows: 1 };
  if (count <= 4) return { cols: 2, rows: 2 };
  if (count <= 6) return { cols: 2, rows: 3 };
  if (count <= 8) return { cols: 2, rows: 4 };
  return { cols: 2, rows: 5 };
}
