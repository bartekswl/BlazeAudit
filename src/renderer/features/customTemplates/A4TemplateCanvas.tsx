import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  FilePlus2,
  LayoutGrid,
  Lock,
  Minus,
  Plus,
  RectangleHorizontal,
  RectangleVertical,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { Block } from '../../../shared/document';
import { docAnchorId } from '../../../shared/document/outline';
import { cn } from '../../lib/cn';
import { A4PageHeader } from './A4PageHeader';
import { findPresetById, type TemplatePresetId } from './blockCatalog';
import { PRESET_DRAG_MIME } from './BlockPalette';
import { GridBlockItem } from './GridBlockItem';
import {
  boxesOverlap,
  clampGridBox,
  computePageGeometry,
  getCoverHeaderMode,
  getPageOrientation,
  GRID_CELL_PX,
  readGridBox,
  type GridBox,
  type PageGeometry,
  type PageOrientation,
  type StarterLayoutId,
} from './pageModel';

const ZOOM_MIN = 55;
const ZOOM_MAX = 150;
const ZOOM_STEP = 10;

export function A4TemplateCanvas({
  pages,
  templateName,
  inspectionType,
  activePageIndex,
  selectedBlockId,
  editable,
  showDots,
  snapToGrid,
  forceWhitePaper,
  draggingPresetId,
  onSelectPage,
  onSelectBlock,
  onNameChange,
  onInspectionTypeChange,
  onToggleCoverHeaderMode,
  onChangePageLabel,
  onChangePageOrientation,
  onAutoPackPage,
  onSetAllPageLocks,
  onMovePage,
  onDuplicatePage,
  onDeletePage,
  onAddPage,
  onApplyStarterLayout,
  onDropPresetOnPage,
  onChangeElementBox,
  onPatchElement,
  onDuplicateElement,
  onDeleteElement,
}: {
  pages: Block[];
  templateName: string;
  inspectionType: string;
  activePageIndex: number;
  selectedBlockId: string | null;
  editable: boolean;
  showDots: boolean;
  snapToGrid: boolean;
  forceWhitePaper: boolean;
  draggingPresetId: TemplatePresetId | null;
  onSelectPage: (pageIndex: number) => void;
  onSelectBlock: (pageIndex: number, blockId: string | null) => void;
  onNameChange: (next: string) => void;
  onInspectionTypeChange: (next: string) => void;
  onToggleCoverHeaderMode: () => void;
  onChangePageLabel: (pageIndex: number, label: string) => void;
  onChangePageOrientation: (pageIndex: number, orientation: PageOrientation) => void;
  onAutoPackPage: (pageIndex: number) => void;
  onSetAllPageLocks: (pageIndex: number, locked: boolean) => void;
  onMovePage: (pageIndex: number, dir: -1 | 1) => void;
  onDuplicatePage: (pageIndex: number) => void;
  onDeletePage: (pageIndex: number) => void;
  onAddPage: (orientation: PageOrientation) => void;
  onApplyStarterLayout: (pageIndex: number, starterId: StarterLayoutId) => void;
  onDropPresetOnPage: (
    pageIndex: number,
    presetId: TemplatePresetId,
    spot: { col: number; row: number },
  ) => void;
  onChangeElementBox: (pageIndex: number, blockId: string, nextBox: GridBox) => void;
  onPatchElement: (
    pageIndex: number,
    blockId: string,
    updater: (current: Block) => Block,
  ) => void;
  onDuplicateElement: (pageIndex: number, blockId: string) => void;
  onDeleteElement: (pageIndex: number, blockId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(900);
  const [zoomPercent, setZoomPercent] = useState(100);

  const zoomIn = useCallback(
    () => setZoomPercent((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP)),
    [],
  );
  const zoomOut = useCallback(
    () => setZoomPercent((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP)),
    [],
  );
  const resetZoom = useCallback(() => setZoomPercent(100), []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      if (el.clientWidth > 0) setViewportWidth(el.clientWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [zoomIn, zoomOut, resetZoom]);

  const coverHeaderMode = getCoverHeaderMode(pages[0]);

  return (
    <div className="ct-studio-viewport relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--ba-panel-border)]">
      <div
        ref={scrollRef}
        onPointerDown={() => {
          if (selectedBlockId) onSelectBlock(activePageIndex, null);
        }}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-auto px-5 pt-4 pb-16"
      >
        <div className="mx-auto flex flex-col items-center gap-7">
          {pages.map((page, pageIndex) => {
            const orientation = getPageOrientation(page);
            const geometry = computePageGeometry(orientation, pageIndex, coverHeaderMode);
            const availableWidth = Math.max(300, viewportWidth - 44);
            const autoFitScale = Math.min(1, availableWidth / geometry.sheetWidthPx);
            const effectiveScale = autoFitScale * (zoomPercent / 100);

            return (
              <A4SinglePageView
                key={page.id}
                page={page}
                pageIndex={pageIndex}
                totalPages={pages.length}
                geometry={geometry}
                effectiveScale={effectiveScale}
                templateName={templateName}
                inspectionType={inspectionType}
                coverHeaderMode={coverHeaderMode}
                isActivePage={activePageIndex === pageIndex}
                selectedBlockId={selectedBlockId}
                editable={editable}
                showDots={showDots}
                snapToGrid={snapToGrid}
                forceWhitePaper={forceWhitePaper}
                draggingPresetId={draggingPresetId}
                onSelectPage={() => onSelectPage(pageIndex)}
                onSelectBlock={(blockId) => onSelectBlock(pageIndex, blockId)}
                onNameChange={onNameChange}
                onInspectionTypeChange={onInspectionTypeChange}
                onToggleCoverHeaderMode={onToggleCoverHeaderMode}
                onChangePageLabel={(label) => onChangePageLabel(pageIndex, label)}
                onChangeOrientation={(next) => onChangePageOrientation(pageIndex, next)}
                onAutoPack={() => onAutoPackPage(pageIndex)}
                onSetAllLocks={(locked) => onSetAllPageLocks(pageIndex, locked)}
                onMovePage={(dir) => onMovePage(pageIndex, dir)}
                onDuplicatePage={() => onDuplicatePage(pageIndex)}
                onDeletePage={() => onDeletePage(pageIndex)}
                onApplyStarterLayout={(starterId) =>
                  onApplyStarterLayout(pageIndex, starterId)
                }
                onDropPreset={(presetId, spot) =>
                  onDropPresetOnPage(pageIndex, presetId, spot)
                }
                onChangeElementBox={(blockId, box) =>
                  onChangeElementBox(pageIndex, blockId, box)
                }
                onPatchElement={(blockId, updater) =>
                  onPatchElement(pageIndex, blockId, updater)
                }
                onDuplicateElement={(blockId) =>
                  onDuplicateElement(pageIndex, blockId)
                }
                onDeleteElement={(blockId) => onDeleteElement(pageIndex, blockId)}
              />
            );
          })}

          {editable && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 pb-4">
              <button
                type="button"
                onClick={() => onAddPage('portrait')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--ba-panel-border)] bg-[var(--ba-panel-bg)] px-3.5 py-2 text-xs font-semibold text-[var(--ba-text-secondary)] transition-colors hover:border-flame-500/50 hover:text-flame-400"
              >
                <FilePlus2 className="size-3.5 text-flame-400" />
                Add A4 Portrait Page
              </button>
              <button
                type="button"
                onClick={() => onAddPage('landscape')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--ba-panel-border)] bg-[var(--ba-panel-bg)] px-3.5 py-2 text-xs font-semibold text-[var(--ba-text-secondary)] transition-colors hover:border-flame-500/50 hover:text-flame-400"
              >
                <RectangleHorizontal className="size-3.5 text-flame-400" />
                Add A4 Landscape Page
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Zoom & Page Pill (matches Built-in FormPageViewport) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex items-center justify-center gap-2 px-3">
        <div
          className="form-page-indicator pointer-events-auto"
          role="group"
          aria-label="Canvas zoom"
        >
          <button
            type="button"
            disabled={zoomPercent <= ZOOM_MIN}
            onClick={zoomOut}
            className="form-page-indicator-nav"
            title="Zoom out (Ctrl+-)"
            aria-label="Zoom out"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="form-page-indicator-zoom-label"
            title="Reset zoom to 100% (Ctrl+0)"
          >
            {zoomPercent}%
          </button>
          <button
            type="button"
            disabled={zoomPercent >= ZOOM_MAX}
            onClick={zoomIn}
            className="form-page-indicator-nav"
            title="Zoom in (Ctrl++)"
            aria-label="Zoom in"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        <div className="form-page-indicator pointer-events-auto" role="status">
          <span className="form-page-indicator-label">
            Page {Math.min(pages.length, activePageIndex + 1)} of {pages.length} · A4 Locked
          </span>
        </div>
      </div>
    </div>
  );
}

function A4SinglePageView({
  page,
  pageIndex,
  totalPages,
  geometry,
  effectiveScale,
  templateName,
  inspectionType,
  coverHeaderMode,
  isActivePage,
  selectedBlockId,
  editable,
  showDots,
  snapToGrid,
  forceWhitePaper,
  draggingPresetId,
  onSelectPage,
  onSelectBlock,
  onNameChange,
  onInspectionTypeChange,
  onToggleCoverHeaderMode,
  onChangePageLabel,
  onChangeOrientation,
  onAutoPack,
  onSetAllLocks,
  onMovePage,
  onDuplicatePage,
  onDeletePage,
  onApplyStarterLayout,
  onDropPreset,
  onChangeElementBox,
  onPatchElement,
  onDuplicateElement,
  onDeleteElement,
}: {
  page: Block;
  pageIndex: number;
  totalPages: number;
  geometry: PageGeometry;
  effectiveScale: number;
  templateName: string;
  inspectionType: string;
  coverHeaderMode: ReturnType<typeof getCoverHeaderMode>;
  isActivePage: boolean;
  selectedBlockId: string | null;
  editable: boolean;
  showDots: boolean;
  snapToGrid: boolean;
  forceWhitePaper: boolean;
  draggingPresetId: TemplatePresetId | null;
  onSelectPage: () => void;
  onSelectBlock: (blockId: string | null) => void;
  onNameChange: (next: string) => void;
  onInspectionTypeChange: (next: string) => void;
  onToggleCoverHeaderMode: () => void;
  onChangePageLabel: (label: string) => void;
  onChangeOrientation: (orientation: PageOrientation) => void;
  onAutoPack: () => void;
  onSetAllLocks: (locked: boolean) => void;
  onMovePage: (dir: -1 | 1) => void;
  onDuplicatePage: () => void;
  onDeletePage: () => void;
  onApplyStarterLayout: (starterId: StarterLayoutId) => void;
  onDropPreset: (presetId: TemplatePresetId, spot: { col: number; row: number }) => void;
  onChangeElementBox: (blockId: string, nextBox: GridBox) => void;
  onPatchElement: (blockId: string, updater: (current: Block) => Block) => void;
  onDuplicateElement: (blockId: string) => void;
  onDeleteElement: (blockId: string) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [dropGhost, setDropGhost] = useState<GridBox | null>(null);

  const children = page.children ?? [];
  const boxes = children.map((child) => readGridBox(child, geometry));
  const allLocked = children.length > 0 && boxes.every((b) => Boolean(b.locked));

  const scaledWidth = Math.round(geometry.sheetWidthPx * effectiveScale);
  const scaledHeight = Math.round(geometry.sheetHeightPx * effectiveScale);

  const computeDropBox = (
    clientX: number,
    clientY: number,
    presetId: TemplatePresetId,
  ): GridBox | null => {
    const gridEl = gridRef.current;
    const preset = findPresetById(presetId);
    if (!gridEl || !preset) return null;
    const rect = gridEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const colSpan =
      preset.defaultColSpan >= 48
        ? geometry.gridCols
        : Math.min(geometry.gridCols, preset.defaultColSpan);
    const rowSpan = Math.min(geometry.gridRows, preset.defaultRowSpan);

    const rawCol = Math.floor(((clientX - rect.left) / rect.width) * geometry.gridCols - colSpan / 4);
    const rawRow = Math.floor(((clientY - rect.top) / rect.height) * geometry.gridRows - 1);

    const dummy = preset.build();
    return clampGridBox(
      { col: rawCol, row: rawRow, colSpan, rowSpan, locked: false },
      dummy,
      geometry,
    );
  };

  return (
    <div
      id={docAnchorId(page.id)}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelectPage();
        onSelectBlock(null);
      }}
      className="flex flex-col items-center gap-2 scroll-mt-4"
    >
      {/* Per-page Studio Control Strip */}
      {editable && (
        <div
          style={{ width: scaledWidth }}
          className={cn(
            'flex flex-wrap items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors',
            isActivePage
              ? 'border-flame-500/35 bg-[var(--ba-panel-bg)] text-[var(--ba-text-primary)]'
              : 'border-[var(--ba-panel-border)] bg-[var(--ba-panel-bg)]/70 text-[var(--ba-text-muted)]',
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'inline-flex size-5 shrink-0 items-center justify-center rounded text-[10.5px] font-bold',
                isActivePage
                  ? 'bg-flame-500 text-white'
                  : 'bg-white/10 text-[var(--ba-text-muted)]',
              )}
            >
              {pageIndex + 1}
            </span>
            <input
              type="text"
              value={page.label ?? `Page ${pageIndex + 1}`}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => onChangePageLabel(e.target.value)}
              aria-label={`Page ${pageIndex + 1} label`}
              className="w-32 min-w-0 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs font-semibold text-[var(--ba-text-primary)] outline-none hover:border-[var(--ba-panel-border)] focus:border-flame-500"
            />
            <span className="hidden text-[10.5px] text-[var(--ba-text-faint)] sm:inline">
              A4 {geometry.physicalMm.width}×{geometry.physicalMm.height} mm · {geometry.gridCols}×
              {geometry.gridRows} dots
            </span>
          </div>

          <div
            className="flex flex-wrap items-center gap-1"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Orientation Switch */}
            <div className="inline-flex rounded-md border border-[var(--ba-panel-border)] p-0.5">
              <button
                type="button"
                onClick={() => onChangeOrientation('portrait')}
                title="A4 Portrait (210 × 297 mm)"
                className={cn(
                  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-medium transition-colors',
                  geometry.orientation === 'portrait'
                    ? 'bg-flame-500/20 text-flame-400'
                    : 'text-[var(--ba-text-muted)] hover:text-[var(--ba-text-primary)]',
                )}
              >
                <RectangleVertical className="size-3" />
                Portrait
              </button>
              <button
                type="button"
                onClick={() => onChangeOrientation('landscape')}
                title="A4 Landscape (297 × 210 mm)"
                className={cn(
                  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-medium transition-colors',
                  geometry.orientation === 'landscape'
                    ? 'bg-flame-500/20 text-flame-400'
                    : 'text-[var(--ba-text-muted)] hover:text-[var(--ba-text-primary)]',
                )}
              >
                <RectangleHorizontal className="size-3" />
                Landscape
              </button>
            </div>

            {children.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={onAutoPack}
                  title="Tidy & pack unlocked blocks cleanly onto grid"
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--ba-panel-border)] px-2 py-1 text-[10.5px] text-[var(--ba-text-secondary)] hover:bg-[var(--ba-hover-bg)]"
                >
                  <LayoutGrid className="size-3" />
                  Pack
                </button>
                <button
                  type="button"
                  onClick={() => onSetAllLocks(!allLocked)}
                  title={allLocked ? 'Unlock all blocks on this page' : 'Lock all blocks on this page to grid'}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10.5px] transition-colors',
                    allLocked
                      ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                      : 'border-[var(--ba-panel-border)] text-[var(--ba-text-secondary)] hover:bg-[var(--ba-hover-bg)]',
                  )}
                >
                  <Lock className="size-3" />
                  {allLocked ? 'All Locked' : 'Lock All'}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={pageIndex === 0}
              onClick={() => onMovePage(-1)}
              title="Move page up"
              className="rounded-md p-1 text-[var(--ba-text-muted)] hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)] disabled:opacity-30"
            >
              <ArrowUp className="size-3.5" />
            </button>
            <button
              type="button"
              disabled={pageIndex === totalPages - 1}
              onClick={() => onMovePage(1)}
              title="Move page down"
              className="rounded-md p-1 text-[var(--ba-text-muted)] hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)] disabled:opacity-30"
            >
              <ArrowDown className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={onDuplicatePage}
              title="Duplicate page"
              className="rounded-md p-1 text-[var(--ba-text-muted)] hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)]"
            >
              <Copy className="size-3.5" />
            </button>
            {totalPages > 1 && (
              <button
                type="button"
                onClick={onDeletePage}
                title="Delete page"
                className="rounded-md p-1 text-[var(--ba-text-muted)] hover:bg-red-500/15 hover:text-red-400"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Outer Scaled Layout Box — Exact A4 Footprint */}
      <div
        style={{ width: scaledWidth, height: scaledHeight }}
        className="relative shrink-0"
      >
        <div
          style={{
            width: geometry.sheetWidthPx,
            height: geometry.sheetHeightPx,
            transform: `scale(${effectiveScale})`,
            transformOrigin: 'top left',
            paddingLeft: geometry.marginLeftPx,
            paddingRight: geometry.marginRightPx,
            paddingTop: geometry.marginTopPx,
            paddingBottom: geometry.marginBottomPx,
          }}
          className={cn(
            'ct-a4-sheet flex flex-col',
            forceWhitePaper && 'ct-a4-sheet--paper-white',
            isActivePage && editable && 'ring-2 ring-flame-500/35',
          )}
        >
          {/* Corner Crop Marks showing locked A4 printable margin boundary */}
          {editable && (
            <>
              <span
                className="ct-crop-corner ct-crop-corner--tl"
                style={{ left: geometry.marginLeftPx - 10, top: geometry.marginTopPx - 10 }}
              />
              <span
                className="ct-crop-corner ct-crop-corner--tr"
                style={{ right: geometry.marginRightPx - 10, top: geometry.marginTopPx - 10 }}
              />
              <span
                className="ct-crop-corner ct-crop-corner--bl"
                style={{
                  left: geometry.marginLeftPx - 10,
                  bottom: geometry.marginBottomPx - 10,
                }}
              />
              <span
                className="ct-crop-corner ct-crop-corner--br"
                style={{
                  right: geometry.marginRightPx - 10,
                  bottom: geometry.marginBottomPx - 10,
                }}
              />
            </>
          )}

          {/* Fixed-height Report Header */}
          <A4PageHeader
            pageIndex={pageIndex}
            totalPages={totalPages}
            templateName={templateName}
            inspectionType={inspectionType}
            coverHeaderMode={coverHeaderMode}
            headerHeightPx={geometry.headerHeightPx}
            readOnly={!editable}
            onNameChange={onNameChange}
            onInspectionTypeChange={onInspectionTypeChange}
            onToggleCoverHeaderMode={onToggleCoverHeaderMode}
          />

          {/* Fixed-size Printable Dot-Grid Area (Strictly Clamped to A4 Printable Space) */}
          <div
            ref={gridRef}
            style={{
              width: geometry.gridWidthPx,
              height: geometry.gridHeightPx,
            }}
            onDragOver={(e) => {
              if (!editable) return;
              const presetId =
                draggingPresetId ??
                (e.dataTransfer.getData(PRESET_DRAG_MIME) as TemplatePresetId);
              if (!presetId) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
              const nextGhost = computeDropBox(e.clientX, e.clientY, presetId);
              if (nextGhost) setDropGhost(nextGhost);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setDropGhost(null);
              }
            }}
            onDrop={(e) => {
              if (!editable) return;
              e.preventDefault();
              const rawId =
                (e.dataTransfer.getData(PRESET_DRAG_MIME) as TemplatePresetId) ||
                draggingPresetId;
              setDropGhost(null);
              if (!rawId) return;
              const box = computeDropBox(e.clientX, e.clientY, rawId);
              onSelectPage();
              onDropPreset(rawId, { col: box?.col ?? 0, row: box?.row ?? 0 });
            }}
            className={cn(
              'ct-dot-grid shrink-0',
              editable && showDots && 'ct-dot-grid--visible',
            )}
          >
            {/* Palette Drag-and-Drop Ghost Preview */}
            {dropGhost && (
              <div
                className="ct-grid-ghost"
                style={{
                  left: dropGhost.col * GRID_CELL_PX,
                  top: dropGhost.row * GRID_CELL_PX,
                  width: dropGhost.colSpan * GRID_CELL_PX,
                  height: dropGhost.rowSpan * GRID_CELL_PX,
                }}
              />
            )}

            {/* Empty A4 Page Invitation */}
            {children.length === 0 && editable && !dropGhost && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="pointer-events-auto max-w-sm rounded-xl border border-dashed border-[var(--ct-line-strong)] bg-[var(--ct-surface-card)]/90 px-5 py-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--ct-ink-primary)]">
                    Empty A4 Printable Canvas
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--ct-ink-muted)]">
                    Click or drag building blocks from the left palette onto the dot grid. Elements
                    snap and stay strictly inside this printable A4 boundary.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => onApplyStarterLayout('inspection-standard')}
                      className="inline-flex items-center gap-1 rounded-md border border-[#f97316]/40 bg-[#f97316]/15 px-2.5 py-1 text-[10.5px] font-semibold text-[#f97316] transition-colors hover:bg-[#f97316]/25"
                    >
                      <Sparkles className="size-3" />
                      Starter: Checklist + Sign-Off
                    </button>
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => onApplyStarterLayout('equipment-sheet')}
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--ct-line-strong)] bg-[var(--ct-surface-subtle)] px-2.5 py-1 text-[10.5px] font-semibold text-[var(--ct-ink-secondary)] transition-colors hover:border-[#f97316]/40 hover:text-[var(--ct-ink-primary)]"
                    >
                      <Sparkles className="size-3" />
                      Starter: Equipment Log
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Placed Building Blocks on the Dot Grid */}
            {children.map((block, idx) => {
              const box = boxes[idx];
              const overlapping = boxes.some(
                (other, otherIdx) => otherIdx !== idx && boxesOverlap(box, other),
              );
              return (
                <GridBlockItem
                  key={block.id}
                  block={block}
                  box={box}
                  geometry={geometry}
                  gridElementRef={gridRef}
                  editable={editable}
                  selected={isActivePage && selectedBlockId === block.id}
                  overlapping={overlapping}
                  snapToGrid={snapToGrid}
                  onSelect={() => {
                    onSelectPage();
                    onSelectBlock(block.id);
                  }}
                  onChangeBox={(nextBox) => onChangeElementBox(block.id, nextBox)}
                  onPatchBlock={(updater) => onPatchElement(block.id, updater)}
                  onDuplicate={() => onDuplicateElement(block.id)}
                  onDelete={() => onDeleteElement(block.id)}
                />
              );
            })}
          </div>

          {/* Locked A4 Page Footer */}
          <footer
            style={{ height: geometry.footerHeightPx }}
            className="flex shrink-0 flex-col justify-end border-t border-[var(--ct-line-soft)] pt-1 text-center"
          >
            <div className="flex items-center justify-between text-[9px] font-semibold text-[var(--ct-ink-secondary)]">
              <span>{templateName || 'Custom Inspection Template'}</span>
              <span>
                Page {pageIndex + 1} of {totalPages}
              </span>
            </div>
            <p className="truncate text-[8px] text-[var(--ct-ink-faint)]">
              Generated with BlazeAudit by SubraLab · Printable A4 Format ({geometry.physicalMm.width}×
              {geometry.physicalMm.height} mm)
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
