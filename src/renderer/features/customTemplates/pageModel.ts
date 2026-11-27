import { createBlock, newBlockId, readTableValue } from '../../../shared/document';
import type { Block, ChecklistItem, Document } from '../../../shared/document';
import { blockSpanRules, TEMPLATE_ELEMENT_PRESETS, type TemplatePresetId } from './blockCatalog';

export type PageOrientation = 'portrait' | 'landscape';
export type CoverHeaderMode = 'full' | 'compact';

export interface GridBox {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  locked?: boolean;
}

export interface PageGeometry {
  orientation: PageOrientation;
  sheetWidthPx: number;
  sheetHeightPx: number;
  marginLeftPx: number;
  marginRightPx: number;
  marginTopPx: number;
  marginBottomPx: number;
  footerHeightPx: number;
  headerHeightPx: number;
  gridCols: number;
  gridRows: number;
  gridWidthPx: number;
  gridHeightPx: number;
  physicalMm: { width: number; height: number };
}

/** 1 grid dot unit = 14px (~3.704mm at 96 DPI). */
export const GRID_CELL_PX = 14;
export const PX_TO_MM = 25.4 / 96;

const PORTRAIT_TOTAL_BODY_ROWS = 70; // 70 * 14 = 980px
const LANDSCAPE_TOTAL_BODY_ROWS = 48; // 48 * 14 = 672px

export function computePageGeometry(
  orientation: PageOrientation,
  pageIndex: number,
  coverHeaderMode: CoverHeaderMode,
): PageGeometry {
  if (orientation === 'landscape') {
    const headerRows =
      pageIndex === 0 ? (coverHeaderMode === 'full' ? 12 : 4) : 3;
    const gridCols = 72; // 72 * 14 = 1008px
    const gridRows = LANDSCAPE_TOTAL_BODY_ROWS - headerRows;
    return {
      orientation: 'landscape',
      sheetWidthPx: 1123,
      sheetHeightPx: 794,
      marginLeftPx: 57,
      marginRightPx: 58,
      marginTopPx: 42,
      marginBottomPx: 42,
      footerHeightPx: 38,
      headerHeightPx: headerRows * GRID_CELL_PX,
      gridCols,
      gridRows,
      gridWidthPx: gridCols * GRID_CELL_PX,
      gridHeightPx: gridRows * GRID_CELL_PX,
      physicalMm: { width: 297, height: 210 },
    };
  }

  const headerRows =
    pageIndex === 0 ? (coverHeaderMode === 'full' ? 14 : 5) : 3;
  const gridCols = 48; // 48 * 14 = 672px
  const gridRows = PORTRAIT_TOTAL_BODY_ROWS - headerRows;
  return {
    orientation: 'portrait',
    sheetWidthPx: 794,
    sheetHeightPx: 1123,
    marginLeftPx: 61,
    marginRightPx: 61,
    marginTopPx: 48,
    marginBottomPx: 48,
    footerHeightPx: 47,
    headerHeightPx: headerRows * GRID_CELL_PX,
    gridCols,
    gridRows,
    gridWidthPx: gridCols * GRID_CELL_PX,
    gridHeightPx: gridRows * GRID_CELL_PX,
    physicalMm: { width: 210, height: 297 },
  };
}

export function gridSpanToMm(cells: number): number {
  return Math.round(cells * GRID_CELL_PX * PX_TO_MM);
}

export function getPageOrientation(pageBlock: Block): PageOrientation {
  return pageBlock.config.pageOrientation === 'landscape' ? 'landscape' : 'portrait';
}

export function getCoverHeaderMode(pageOneBlock: Block | undefined): CoverHeaderMode {
  return pageOneBlock?.config.coverHeaderMode === 'compact' ? 'compact' : 'full';
}

export function isPageSectionBlock(block: Block): boolean {
  return block.type === 'section' && Boolean(block.config.isPage);
}

export function readGridBox(block: Block, geometry: PageGeometry): GridBox {
  const rules = blockSpanRules(block.type, block);
  const raw = block.config.gridLayout as Partial<GridBox> | undefined;

  const defaultColSpan = Math.min(geometry.gridCols, rules.defaultColSpan);
  const defaultRowSpan = Math.min(geometry.gridRows, rules.defaultRowSpan);

  if (!raw || typeof raw !== 'object') {
    return clampGridBox(
      {
        col: 0,
        row: 0,
        colSpan: defaultColSpan,
        rowSpan: defaultRowSpan,
        locked: false,
      },
      block,
      geometry,
    );
  }

  return clampGridBox(
    {
      col: typeof raw.col === 'number' ? raw.col : 0,
      row: typeof raw.row === 'number' ? raw.row : 0,
      colSpan: typeof raw.colSpan === 'number' ? raw.colSpan : defaultColSpan,
      rowSpan: typeof raw.rowSpan === 'number' ? raw.rowSpan : defaultRowSpan,
      locked: Boolean(raw.locked),
    },
    block,
    geometry,
  );
}

export function writeGridBox(block: Block, box: GridBox): Block {
  return {
    ...block,
    config: {
      ...block.config,
      gridLayout: {
        col: Math.round(box.col),
        row: Math.round(box.row),
        colSpan: Math.round(box.colSpan),
        rowSpan: Math.round(box.rowSpan),
        locked: Boolean(box.locked),
      },
    },
  };
}

export function clampGridBox(box: GridBox, block: Block, geometry: PageGeometry): GridBox {
  const rules = blockSpanRules(block.type, block);
  const minCols = Math.min(rules.minColSpan, geometry.gridCols);
  const minRows = Math.min(rules.minRowSpan, geometry.gridRows);

  const colSpan = Math.max(minCols, Math.min(geometry.gridCols, Math.round(box.colSpan)));
  const rowSpan = Math.max(minRows, Math.min(geometry.gridRows, Math.round(box.rowSpan)));
  const col = Math.max(0, Math.min(geometry.gridCols - colSpan, Math.round(box.col)));
  const row = Math.max(0, Math.min(geometry.gridRows - rowSpan, Math.round(box.row)));

  return {
    col,
    row,
    colSpan,
    rowSpan,
    locked: Boolean(box.locked),
  };
}

export function boxesOverlap(a: GridBox, b: GridBox): boolean {
  return (
    a.col < b.col + b.colSpan &&
    a.col + a.colSpan > b.col &&
    a.row < b.row + b.rowSpan &&
    a.row + a.rowSpan > b.row
  );
}

/** First-fit 2D grid scan for an open rectangle of `colSpan x rowSpan`. */
export function findOpenGridSpot(
  occupied: GridBox[],
  colSpan: number,
  rowSpan: number,
  geometry: PageGeometry,
): { col: number; row: number } | null {
  const w = Math.min(colSpan, geometry.gridCols);
  const h = Math.min(rowSpan, geometry.gridRows);
  if (h > geometry.gridRows || w > geometry.gridCols) return null;

  for (let row = 0; row <= geometry.gridRows - h; row++) {
    for (let col = 0; col <= geometry.gridCols - w; col++) {
      const candidate: GridBox = { col, row, colSpan: w, rowSpan: h };
      const collides = occupied.some((existing) => boxesOverlap(candidate, existing));
      if (!collides) {
        return { col, row };
      }
    }
  }
  return null;
}

export function idealRowSpanForBlock(block: Block, geometry: PageGeometry): number {
  const rules = blockSpanRules(block.type, block);
  let target = rules.defaultRowSpan;

  switch (block.type) {
    case 'checklist': {
      const items = (block.config.items as ChecklistItem[] | undefined) ?? [];
      // Title + table header (~4 rows) + ~2 rows per item + 1 footer padding
      target = Math.max(rules.minRowSpan, 4 + Math.ceil(items.length * 1.9));
      break;
    }
    case 'table': {
      const tableVal = readTableValue(block.value);
      const rowCount = Math.max(1, tableVal.rows.length);
      target = Math.max(rules.minRowSpan, 5 + Math.ceil(rowCount * 2.1));
      break;
    }
    case 'lines': {
      const count = Math.max(1, (block.config.count as number) ?? 4);
      target = Math.max(rules.minRowSpan, 3 + Math.ceil(count * 1.6));
      break;
    }
    default:
      break;
  }

  return Math.min(geometry.gridRows, Math.max(rules.minRowSpan, target));
}

export function sortChildrenReadingOrder(children: Block[], geometry: PageGeometry): Block[] {
  return [...children].sort((a, b) => {
    const boxA = readGridBox(a, geometry);
    const boxB = readGridBox(b, geometry);
    if (boxA.row !== boxB.row) return boxA.row - boxB.row;
    if (boxA.col !== boxB.col) return boxA.col - boxB.col;
    return 0;
  });
}

export function createPageSectionBlock(
  pageNumber: number,
  orientation: PageOrientation = 'portrait',
  children: Block[] = [],
  extraConfig?: Record<string, unknown>,
): Block {
  return createBlock('section', {
    id: newBlockId(),
    label: `Page ${pageNumber}`,
    config: {
      collapsible: false,
      optional: false,
      isPage: true,
      pageOrientation: orientation,
      ...(pageNumber === 1 ? { coverHeaderMode: 'full' } : {}),
      ...extraConfig,
    },
    children,
  });
}

function flattenLegacyBlock(block: Block): Block[] {
  if (block.type === 'section') {
    const out: Block[] = [];
    if (block.label && block.label.trim() && !/^page\s+\d+$/i.test(block.label.trim())) {
      out.push(
        createBlock('heading', {
          config: { level: 2, text: block.label.trim() },
        }),
      );
    }
    for (const child of block.children ?? []) {
      out.push(...flattenLegacyBlock(child));
    }
    return out;
  }
  return [structuredClone(block)];
}

/**
 * Ensures `doc.blocks` is an array of valid A4 Page `section` containers,
 * with every child block clamped inside its page's printable A4 dot grid.
 * Seamlessly upgrades empty or legacy flat-block templates without data loss.
 */
export function ensurePagedDocument(doc: Document): Document {
  if (doc.blocks.length === 0) {
    return {
      ...doc,
      blocks: [createPageSectionBlock(1, 'portrait', [])],
    };
  }

  const allAlreadyPages = doc.blocks.every(
    (b) => b.type === 'section' && Array.isArray(b.children) && Boolean(b.config.isPage),
  );

  if (allAlreadyPages) {
    const coverMode = getCoverHeaderMode(doc.blocks[0]);
    const normalizedPages = doc.blocks.map((page, pageIdx) => {
      const orientation = getPageOrientation(page);
      const geometry = computePageGeometry(orientation, pageIdx, coverMode);
      const children = (page.children ?? []).map((child) => {
        const clamped = readGridBox(child, geometry);
        return writeGridBox(child, clamped);
      });
      return {
        ...page,
        label: page.label?.trim() || `Page ${pageIdx + 1}`,
        children: sortChildrenReadingOrder(children, geometry),
      };
    });
    return { ...doc, blocks: normalizedPages };
  }

  // Upgrade legacy root blocks / non-page sections into packed A4 page(s).
  const pages: Block[] = [];
  const flatQueue: Block[] = [];

  for (const rootBlock of doc.blocks) {
    if (rootBlock.type === 'section' && (rootBlock.children?.length ?? 0) > 0) {
      // Preserve explicit root sections as individual A4 pages when possible
      const orientation = getPageOrientation(rootBlock);
      const pageIdx = pages.length;
      const leafBlocks = (rootBlock.children ?? []).flatMap(flattenLegacyBlock);
      const packed = packBlocksIntoPages(
        leafBlocks,
        orientation,
        pageIdx,
        'full',
        rootBlock.label || `Page ${pageIdx + 1}`,
      );
      pages.push(...packed);
    } else {
      flatQueue.push(...flattenLegacyBlock(rootBlock));
    }
  }

  if (flatQueue.length > 0) {
    const startIdx = pages.length;
    pages.push(...packBlocksIntoPages(flatQueue, 'portrait', startIdx, 'full'));
  }

  if (pages.length === 0) {
    pages.push(createPageSectionBlock(1, 'portrait', []));
  }

  return {
    ...doc,
    blocks: relabelDefaultPages(pages),
  };
}

function packBlocksIntoPages(
  items: Block[],
  orientation: PageOrientation,
  startPageIndex: number,
  coverMode: CoverHeaderMode,
  firstPageTitle?: string,
): Block[] {
  const result: Block[] = [];
  let currentIndex = startPageIndex;
  let geometry = computePageGeometry(orientation, currentIndex, coverMode);
  let currentChildren: Block[] = [];
  let occupied: GridBox[] = [];

  for (const rawItem of items) {
    const rules = blockSpanRules(rawItem.type, rawItem);
    const colSpan =
      rawItem.config.gridLayout &&
      typeof (rawItem.config.gridLayout as Partial<GridBox>).colSpan === 'number'
        ? Math.min(geometry.gridCols, (rawItem.config.gridLayout as GridBox).colSpan)
        : rules.defaultColSpan === 48
          ? geometry.gridCols
          : Math.min(geometry.gridCols, rules.defaultColSpan);
    const rowSpan = Math.min(geometry.gridRows, idealRowSpanForBlock(rawItem, geometry));

    let spot = findOpenGridSpot(occupied, colSpan, rowSpan, geometry);
    if (!spot && currentChildren.length > 0) {
      result.push(
        createPageSectionBlock(
          currentIndex + 1,
          orientation,
          sortChildrenReadingOrder(currentChildren, geometry),
          currentIndex === 0 ? { coverHeaderMode: coverMode } : undefined,
        ),
      );
      if (result.length === 1 && firstPageTitle) {
        result[0] = { ...result[0], label: firstPageTitle };
      }
      currentIndex += 1;
      geometry = computePageGeometry(orientation, currentIndex, coverMode);
      currentChildren = [];
      occupied = [];
      spot = findOpenGridSpot(occupied, Math.min(colSpan, geometry.gridCols), Math.min(rowSpan, geometry.gridRows), geometry);
    }

    const box = clampGridBox(
      {
        col: spot?.col ?? 0,
        row: spot?.row ?? 0,
        colSpan,
        rowSpan,
        locked: false,
      },
      rawItem,
      geometry,
    );
    occupied.push(box);
    currentChildren.push(writeGridBox(rawItem, box));
  }

  if (currentChildren.length > 0 || result.length === 0) {
    const page = createPageSectionBlock(
      currentIndex + 1,
      orientation,
      sortChildrenReadingOrder(currentChildren, geometry),
      currentIndex === 0 ? { coverHeaderMode: coverMode } : undefined,
    );
    result.push(result.length === 0 && firstPageTitle ? { ...page, label: firstPageTitle } : page);
  }

  return result;
}

export function relabelDefaultPages(pages: Block[]): Block[] {
  return pages.map((page, idx) => {
    const trimmed = page.label?.trim() ?? '';
    if (!trimmed || /^page\s+\d+$/i.test(trimmed)) {
      return { ...page, label: `Page ${idx + 1}` };
    }
    return page;
  });
}

/** Re-pack unlocked blocks neatly from top to bottom on a single page without exceeding A4 bounds. */
export function autoPackPageBlocks(pageBlock: Block, pageIndex: number, coverMode: CoverHeaderMode): Block {
  const orientation = getPageOrientation(pageBlock);
  const geometry = computePageGeometry(orientation, pageIndex, coverMode);
  const ordered = sortChildrenReadingOrder(pageBlock.children ?? [], geometry);

  const lockedItems = ordered.filter((b) => readGridBox(b, geometry).locked);
  const unlockedItems = ordered.filter((b) => !readGridBox(b, geometry).locked);

  const occupied: GridBox[] = lockedItems.map((b) => readGridBox(b, geometry));
  const placedUnlocked: Block[] = [];

  for (const item of unlockedItems) {
    const current = readGridBox(item, geometry);
    const spot = findOpenGridSpot(occupied, current.colSpan, current.rowSpan, geometry);
    const nextBox = clampGridBox(
      {
        ...current,
        col: spot ? spot.col : current.col,
        row: spot ? spot.row : current.row,
      },
      item,
      geometry,
    );
    occupied.push(nextBox);
    placedUnlocked.push(writeGridBox(item, nextBox));
  }

  return {
    ...pageBlock,
    children: sortChildrenReadingOrder([...lockedItems, ...placedUnlocked], geometry),
  };
}

export interface InsertElementResult {
  pages: Block[];
  targetPageIndex: number;
  insertedBlockId: string;
  createdNewPage: boolean;
}

/**
 * Inserts a new block from a preset onto `targetPageIndex` (at `preferredSpot` if given,
 * otherwise first open dot-grid slot). If the current A4 page has no printable room left,
 * automatically appends a new A4 page so 1 A4 page can never overflow.
 */
export function insertPresetIntoPages(
  pages: Block[],
  presetId: TemplatePresetId,
  targetPageIndex: number,
  preferredSpot?: { col: number; row: number },
): InsertElementResult {
  const preset = TEMPLATE_ELEMENT_PRESETS.find((p) => p.id === presetId);
  if (!preset) {
    throw new Error(`Unknown preset: ${presetId}`);
  }

  const safeIndex = Math.max(0, Math.min(pages.length - 1, targetPageIndex));
  const coverMode = getCoverHeaderMode(pages[0]);
  const targetPage = pages[safeIndex];
  const orientation = getPageOrientation(targetPage);
  const geometry = computePageGeometry(orientation, safeIndex, coverMode);

  const rawBlock = preset.build();
  // Scale full-width portrait defaults (48) to full-width landscape (72) automatically
  const desiredColSpan =
    preset.defaultColSpan >= 48 ? geometry.gridCols : Math.min(geometry.gridCols, preset.defaultColSpan);
  const desiredRowSpan = Math.min(geometry.gridRows, preset.defaultRowSpan);

  const existingBoxes = (targetPage.children ?? []).map((child) => readGridBox(child, geometry));

  if (preferredSpot) {
    const clamped = clampGridBox(
      {
        col: preferredSpot.col,
        row: preferredSpot.row,
        colSpan: desiredColSpan,
        rowSpan: desiredRowSpan,
        locked: false,
      },
      rawBlock,
      geometry,
    );
    const nextBlock = writeGridBox(rawBlock, clamped);
    const nextPages = pages.map((page, idx) =>
      idx === safeIndex
        ? {
            ...page,
            children: sortChildrenReadingOrder([...(page.children ?? []), nextBlock], geometry),
          }
        : page,
    );
    return {
      pages: nextPages,
      targetPageIndex: safeIndex,
      insertedBlockId: nextBlock.id,
      createdNewPage: false,
    };
  }

  const openSpot = findOpenGridSpot(existingBoxes, desiredColSpan, desiredRowSpan, geometry);
  if (openSpot) {
    const box = clampGridBox(
      {
        col: openSpot.col,
        row: openSpot.row,
        colSpan: desiredColSpan,
        rowSpan: desiredRowSpan,
        locked: false,
      },
      rawBlock,
      geometry,
    );
    const nextBlock = writeGridBox(rawBlock, box);
    const nextPages = pages.map((page, idx) =>
      idx === safeIndex
        ? {
            ...page,
            children: sortChildrenReadingOrder([...(page.children ?? []), nextBlock], geometry),
          }
        : page,
    );
    return {
      pages: nextPages,
      targetPageIndex: safeIndex,
      insertedBlockId: nextBlock.id,
      createdNewPage: false,
    };
  }

  // Current A4 page is full — place onto a new A4 page right after `safeIndex`
  const newPageIndex = safeIndex + 1;
  const newGeometry = computePageGeometry(orientation, newPageIndex, coverMode);
  const newColSpan =
    preset.defaultColSpan >= 48
      ? newGeometry.gridCols
      : Math.min(newGeometry.gridCols, preset.defaultColSpan);
  const newBox = clampGridBox(
    {
      col: 0,
      row: 0,
      colSpan: newColSpan,
      rowSpan: Math.min(newGeometry.gridRows, preset.defaultRowSpan),
      locked: false,
    },
    rawBlock,
    newGeometry,
  );
  const nextBlock = writeGridBox(rawBlock, newBox);
  const newPage = createPageSectionBlock(newPageIndex + 1, orientation, [nextBlock]);
  const nextPages = [...pages];
  nextPages.splice(newPageIndex, 0, newPage);

  return {
    pages: relabelDefaultPages(nextPages),
    targetPageIndex: newPageIndex,
    insertedBlockId: nextBlock.id,
    createdNewPage: true,
  };
}

export type StarterLayoutId = 'inspection-standard' | 'equipment-sheet';

export function buildStarterPageChildren(
  starterId: StarterLayoutId,
  geometry: PageGeometry,
): Block[] {
  const byId = (id: TemplatePresetId) =>
    TEMPLATE_ELEMENT_PRESETS.find((p) => p.id === id)!.build();

  const cols = geometry.gridCols;
  const half = Math.floor(cols / 2);

  if (starterId === 'equipment-sheet') {
    const banner = writeGridBox(byId('heading-banner'), {
      col: 0,
      row: 0,
      colSpan: cols,
      rowSpan: 3,
    });
    banner.config = { ...banner.config, text: '1. EQUIPMENT & DEVICE TEST RECORD' };

    const table = writeGridBox(byId('table-equipment'), {
      col: 0,
      row: 4,
      colSpan: cols,
      rowSpan: 22,
    });

    const notes = writeGridBox(byId('notes-ruled'), {
      col: 0,
      row: 27,
      colSpan: half,
      rowSpan: 11,
    });

    const signoff = writeGridBox(byId('signature-tech'), {
      col: half,
      row: 27,
      colSpan: cols - half,
      rowSpan: 11,
    });

    return [banner, table, notes, signoff].map((b) =>
      writeGridBox(b, clampGridBox(readGridBox(b, geometry), b, geometry)),
    );
  }

  // 'inspection-standard'
  const banner = writeGridBox(byId('heading-banner'), {
    col: 0,
    row: 0,
    colSpan: cols,
    rowSpan: 3,
  });
  const fieldLeft = writeGridBox(byId('field-single'), {
    col: 0,
    row: 4,
    colSpan: half,
    rowSpan: 4,
  });
  const fieldRight = writeGridBox(
    {
      ...byId('field-single'),
      label: 'Monitoring Station / Account #',
    },
    {
      col: half,
      row: 4,
      colSpan: cols - half,
      rowSpan: 4,
    },
  );
  const checklist = writeGridBox(byId('checklist-pass-fail'), {
    col: 0,
    row: 9,
    colSpan: cols,
    rowSpan: 14,
  });
  const notes = writeGridBox(byId('notes-ruled'), {
    col: 0,
    row: 24,
    colSpan: half,
    rowSpan: 10,
  });
  const signoff = writeGridBox(byId('signature-tech'), {
    col: half,
    row: 24,
    colSpan: cols - half,
    rowSpan: 10,
  });

  return [banner, fieldLeft, fieldRight, checklist, notes, signoff].map((b) =>
    writeGridBox(b, clampGridBox(readGridBox(b, geometry), b, geometry)),
  );
}
