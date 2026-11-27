import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Copy,
  GripVertical,
  Lock,
  LockOpen,
  Maximize2,
  Minus,
  Plus,
  Trash2,
} from 'lucide-react';
import type { Block } from '../../../shared/document';
import { docAnchorId } from '../../../shared/document/outline';
import { cn } from '../../lib/cn';
import { blockSpanRules, blockTypeLabel } from './blockCatalog';
import { CanvasBlockView } from './CanvasBlockView';
import {
  GRID_CELL_PX,
  gridSpanToMm,
  idealRowSpanForBlock,
  type GridBox,
  type PageGeometry,
} from './pageModel';

type ResizeHandleDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
type InteractionMode = 'move' | ResizeHandleDir;

const RESIZE_HANDLES: ResizeHandleDir[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

function clampInt(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function GridBlockItem({
  block,
  box,
  geometry,
  gridElementRef,
  editable,
  selected,
  overlapping,
  snapToGrid,
  onSelect,
  onChangeBox,
  onPatchBlock,
  onDuplicate,
  onDelete,
}: {
  block: Block;
  box: GridBox;
  geometry: PageGeometry;
  gridElementRef: React.RefObject<HTMLDivElement | null>;
  editable: boolean;
  selected: boolean;
  overlapping: boolean;
  snapToGrid: boolean;
  onSelect: () => void;
  onChangeBox: (nextBox: GridBox) => void;
  onPatchBlock: (updater: (current: Block) => Block) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [liveBox, setLiveBox] = useState<GridBox | null>(null);
  const activeBox = liveBox ?? box;
  const isLocked = Boolean(box.locked);

  useEffect(() => {
    setLiveBox(null);
  }, [box.col, box.row, box.colSpan, box.rowSpan, box.locked]);

  const startPointerInteraction = (
    e: React.PointerEvent,
    mode: InteractionMode,
  ) => {
    if (!editable) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect();

    if (isLocked) return;

    const gridEl = gridElementRef.current;
    if (!gridEl) return;
    const rect = gridEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    e.preventDefault();

    const pxPerCol = rect.width / geometry.gridCols;
    const pxPerRow = rect.height / geometry.gridRows;
    const startX = e.clientX;
    const startY = e.clientY;
    const initial = { ...box };
    const right0 = initial.col + initial.colSpan;
    const bottom0 = initial.row + initial.rowSpan;

    const rules = blockSpanRules(block.type, block);
    const minCols = Math.min(rules.minColSpan, geometry.gridCols);
    const minRows = Math.min(rules.minRowSpan, geometry.gridRows);

    const quantize = (raw: number) => (snapToGrid ? Math.round(raw) : Math.round(raw));

    let latest: GridBox = initial;

    const handleMove = (ev: PointerEvent) => {
      const dCols = (ev.clientX - startX) / pxPerCol;
      const dRows = (ev.clientY - startY) / pxPerRow;

      if (mode === 'move') {
        const nextCol = clampInt(
          quantize(initial.col + dCols),
          0,
          geometry.gridCols - initial.colSpan,
        );
        const nextRow = clampInt(
          quantize(initial.row + dRows),
          0,
          geometry.gridRows - initial.rowSpan,
        );
        latest = { ...initial, col: nextCol, row: nextRow };
        setLiveBox(latest);
        return;
      }

      let col = initial.col;
      let row = initial.row;
      let colSpan = initial.colSpan;
      let rowSpan = initial.rowSpan;

      if (mode.includes('e')) {
        const nextRight = clampInt(
          quantize(right0 + dCols),
          initial.col + minCols,
          geometry.gridCols,
        );
        colSpan = nextRight - initial.col;
      }
      if (mode.includes('w')) {
        const nextCol = clampInt(
          quantize(initial.col + dCols),
          0,
          right0 - minCols,
        );
        col = nextCol;
        colSpan = right0 - nextCol;
      }
      if (mode.includes('s')) {
        const nextBottom = clampInt(
          quantize(bottom0 + dRows),
          initial.row + minRows,
          geometry.gridRows,
        );
        rowSpan = nextBottom - initial.row;
      }
      if (mode.includes('n')) {
        const nextRow = clampInt(
          quantize(initial.row + dRows),
          0,
          bottom0 - minRows,
        );
        row = nextRow;
        rowSpan = bottom0 - nextRow;
      }

      latest = { ...initial, col, row, colSpan, rowSpan };
      setLiveBox(latest);
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      setLiveBox(null);
      if (
        latest.col !== initial.col ||
        latest.row !== initial.row ||
        latest.colSpan !== initial.colSpan ||
        latest.rowSpan !== initial.rowSpan
      ) {
        onChangeBox(latest);
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  };

  const applyWidthFraction = (fraction: 1 | 0.5 | 0.333) => {
    if (isLocked) return;
    const rules = blockSpanRules(block.type, block);
    const rawCols =
      fraction === 1
        ? geometry.gridCols
        : fraction === 0.5
          ? Math.floor(geometry.gridCols / 2)
          : Math.floor(geometry.gridCols / 3);
    const colSpan = Math.max(rules.minColSpan, Math.min(geometry.gridCols, rawCols));
    const col = Math.min(box.col, geometry.gridCols - colSpan);
    onChangeBox({ ...box, col, colSpan });
  };

  const fitBlockHeight = () => {
    if (isLocked) return;
    const ideal = idealRowSpanForBlock(block, geometry);
    const maxAllowed = geometry.gridRows - box.row;
    const nextRowSpan = Math.max(
      blockSpanRules(block.type, block).minRowSpan,
      Math.min(maxAllowed, ideal),
    );
    onChangeBox({ ...box, rowSpan: nextRowSpan });
  };

  const widthPct = Math.round((activeBox.colSpan / geometry.gridCols) * 100);
  const toolbarBelow = activeBox.row < 3;

  return (
    <>
      {/* Live snap shadow on dot grid while moving or resizing */}
      {liveBox && (
        <div
          className="ct-grid-ghost"
          style={{
            left: liveBox.col * GRID_CELL_PX,
            top: liveBox.row * GRID_CELL_PX,
            width: liveBox.colSpan * GRID_CELL_PX,
            height: liveBox.rowSpan * GRID_CELL_PX,
          }}
        />
      )}

      <div
        id={docAnchorId(block.id)}
        onPointerDown={(e) => {
          if (!editable) return;
          e.stopPropagation();
          onSelect();
          if (!isLocked) {
            startPointerInteraction(e, 'move');
          }
        }}
        style={{
          left: activeBox.col * GRID_CELL_PX,
          top: activeBox.row * GRID_CELL_PX,
          width: activeBox.colSpan * GRID_CELL_PX,
          height: activeBox.rowSpan * GRID_CELL_PX,
        }}
        className={cn(
          'ct-grid-item scroll-mt-6',
          editable && 'ct-grid-item--editable',
          editable && !isLocked && 'cursor-grab active:cursor-grabbing',
          selected && editable && 'ct-grid-item--selected',
          isLocked && 'ct-grid-item--locked',
          overlapping && editable && 'ct-grid-item--overlap',
        )}
      >
        {/* Subtle lock badge in corner when locked and not selected */}
        {editable && isLocked && !selected && (
          <span
            title="Locked to grid"
            className="pointer-events-none absolute top-1 right-1 z-10 inline-flex items-center gap-0.5 rounded bg-sky-500/90 px-1 py-0.5 text-[8px] font-bold text-white shadow"
          >
            <Lock className="size-2.5" />
          </span>
        )}

        {/* Overlap warning badge */}
        {editable && overlapping && (
          <span
            title="Overlaps another element on this page"
            className="pointer-events-none absolute bottom-1 right-1 z-10 inline-flex items-center gap-0.5 rounded bg-amber-500/95 px-1.5 py-0.5 text-[8px] font-bold text-neutral-950 shadow"
          >
            <AlertTriangle className="size-2.5" />
            Overlap
          </span>
        )}

        {/* Live dimension readout while actively dragging/resizing */}
        {liveBox && (
          <div className="pointer-events-none absolute -bottom-6 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-950/95 px-2 py-0.5 text-[9.5px] font-semibold text-flame-300 shadow-lg ring-1 ring-flame-500/40">
            {liveBox.colSpan}×{liveBox.rowSpan} dots · {gridSpanToMm(liveBox.colSpan)}×
            {gridSpanToMm(liveBox.rowSpan)} mm ({widthPct}% W)
          </div>
        )}

        {/* Floating Quick Toolbar when selected */}
        {editable && selected && !liveBox && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
              'absolute left-0 z-40 flex max-w-[660px] flex-wrap items-center gap-1 rounded-md border border-white/15 bg-neutral-950/95 px-1.5 py-1 text-[10px] text-neutral-200 shadow-xl backdrop-blur-sm',
              toolbarBelow ? 'top-full mt-1.5' : 'bottom-full mb-1.5',
            )}
          >
            <span
              onPointerDown={(e) => startPointerInteraction(e, 'move')}
              title={isLocked ? 'Element is locked to grid' : 'Drag to move on dot grid'}
              className={cn(
                'inline-flex items-center gap-1 rounded px-1 py-0.5 font-semibold text-neutral-300',
                !isLocked && 'cursor-grab hover:bg-white/10 active:cursor-grabbing',
              )}
            >
              <GripVertical className="size-3 text-neutral-500" />
              {blockTypeLabel(block.type)}
              <span className="font-normal text-neutral-500">
                {activeBox.colSpan}×{activeBox.rowSpan}
              </span>
            </span>

            <span className="h-3.5 w-px bg-white/10" />

            {/* Quick Width Fractions */}
            <div className="flex items-center gap-0.5" title="Quick column width">
              <button
                type="button"
                disabled={isLocked}
                onClick={() => applyWidthFraction(0.333)}
                className="rounded px-1.5 py-0.5 text-[9.5px] font-medium text-neutral-300 hover:bg-white/10 disabled:opacity-35"
              >
                1/3
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => applyWidthFraction(0.5)}
                className="rounded px-1.5 py-0.5 text-[9.5px] font-medium text-neutral-300 hover:bg-white/10 disabled:opacity-35"
              >
                1/2
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => applyWidthFraction(1)}
                className="rounded px-1.5 py-0.5 text-[9.5px] font-medium text-neutral-300 hover:bg-white/10 disabled:opacity-35"
              >
                Full
              </button>
            </div>

            {(block.type === 'checklist' ||
              block.type === 'table' ||
              block.type === 'lines') && (
              <button
                type="button"
                disabled={isLocked}
                onClick={fitBlockHeight}
                title="Auto-fit height to rows (clamped to A4 page)"
                className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9.5px] font-medium text-neutral-300 hover:bg-white/10 disabled:opacity-35"
              >
                <Maximize2 className="size-2.5" />
                Fit H
              </button>
            )}

            {/* Block-specific quick toggles */}
            {block.type === 'heading' && (
              <>
                <span className="h-3.5 w-px bg-white/10" />
                {([1, 2, 3] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() =>
                      onPatchBlock((cur) => ({
                        ...cur,
                        config: { ...cur.config, level: lvl },
                      }))
                    }
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[9.5px] font-semibold',
                      Number(block.config.level ?? 2) === lvl
                        ? 'bg-flame-500/25 text-flame-300'
                        : 'text-neutral-400 hover:bg-white/10',
                    )}
                  >
                    H{lvl}
                  </button>
                ))}
              </>
            )}

            {block.type === 'textField' && (
              <>
                <span className="h-3.5 w-px bg-white/10" />
                <button
                  type="button"
                  onClick={() =>
                    onPatchBlock((cur) => ({
                      ...cur,
                      config: { ...cur.config, multiline: !cur.config.multiline },
                    }))
                  }
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[9.5px] font-medium',
                    block.config.multiline
                      ? 'bg-flame-500/25 text-flame-300'
                      : 'text-neutral-400 hover:bg-white/10',
                  )}
                >
                  {block.config.multiline ? 'Multiline' : 'Single-line'}
                </button>
              </>
            )}

            {block.type === 'lines' && (
              <>
                <span className="h-3.5 w-px bg-white/10" />
                <div className="inline-flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      onPatchBlock((cur) => ({
                        ...cur,
                        config: {
                          ...cur.config,
                          count: Math.max(1, Number(cur.config.count ?? 4) - 1),
                        },
                      }))
                    }
                    title="Fewer lines"
                    className="rounded p-0.5 text-neutral-300 hover:bg-white/10"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="px-1 text-[9.5px] text-neutral-300">
                    {Number(block.config.count ?? 4)}L
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onPatchBlock((cur) => ({
                        ...cur,
                        config: {
                          ...cur.config,
                          count: Math.min(40, Number(cur.config.count ?? 4) + 1),
                        },
                      }))
                    }
                    title="More lines"
                    className="rounded p-0.5 text-neutral-300 hover:bg-white/10"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              </>
            )}

            {block.type === 'checklist' && (
              <>
                <span className="h-3.5 w-px bg-white/10" />
                <button
                  type="button"
                  onClick={() =>
                    onPatchBlock((cur) => ({
                      ...cur,
                      config: {
                        ...cur.config,
                        choiceStyle:
                          cur.config.choiceStyle === 'yesNo' ? 'passFail' : 'yesNo',
                      },
                    }))
                  }
                  className="rounded px-1.5 py-0.5 text-[9.5px] font-medium text-neutral-300 hover:bg-white/10"
                >
                  {block.config.choiceStyle === 'yesNo' ? 'Yes/No' : 'Pass/Fail'}
                </button>
              </>
            )}

            {block.type === 'table' && (
              <>
                <span className="h-3.5 w-px bg-white/10" />
                <button
                  type="button"
                  onClick={() =>
                    onPatchBlock((cur) => ({
                      ...cur,
                      config: {
                        ...cur.config,
                        accent: cur.config.accent === 'danger' ? 'default' : 'danger',
                      },
                    }))
                  }
                  className="rounded px-1.5 py-0.5 text-[9.5px] font-medium text-neutral-300 hover:bg-white/10"
                >
                  {block.config.accent === 'danger' ? 'Red bar' : 'Orange bar'}
                </button>
              </>
            )}

            {block.type === 'spacer' && (
              <>
                <span className="h-3.5 w-px bg-white/10" />
                <button
                  type="button"
                  onClick={() =>
                    onPatchBlock((cur) => ({
                      ...cur,
                      config: {
                        ...cur.config,
                        showRule: cur.config.showRule === false,
                      },
                    }))
                  }
                  className="rounded px-1.5 py-0.5 text-[9.5px] font-medium text-neutral-300 hover:bg-white/10"
                >
                  {block.config.showRule === false ? 'Blank gap' : 'Line rule'}
                </button>
              </>
            )}

            <span className="h-3.5 w-px bg-white/10" />

            {/* Lock / Unlock Element to Dot Grid */}
            <button
              type="button"
              onClick={() => onChangeBox({ ...box, locked: !isLocked })}
              title={
                isLocked
                  ? 'Locked to grid — click to unlock position & size'
                  : 'Lock element position & size to dot grid'
              }
              className={cn(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.5px] font-semibold transition-colors',
                isLocked
                  ? 'bg-sky-500/25 text-sky-300 ring-1 ring-sky-400/40'
                  : 'text-neutral-300 hover:bg-white/10',
              )}
            >
              {isLocked ? (
                <>
                  <Lock className="size-2.5" />
                  Locked
                </>
              ) : (
                <>
                  <LockOpen className="size-2.5" />
                  Lock
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onDuplicate}
              title="Duplicate block"
              className="rounded p-1 text-neutral-300 hover:bg-white/10 hover:text-white"
            >
              <Copy className="size-3" />
            </button>

            <button
              type="button"
              onClick={onDelete}
              title="Delete block (Del)"
              className="rounded p-1 text-neutral-400 hover:bg-red-500/20 hover:text-red-300"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        )}

        {/* Actual Report-Styled Block Content */}
        <div className="h-full w-full overflow-hidden">
          <CanvasBlockView
            block={block}
            box={activeBox}
            editable={editable}
            selected={selected}
            onPatchBlock={onPatchBlock}
          />
        </div>

        {/* 8-Direction Resize Handles (only when selected, editable, and unlocked) */}
        {editable &&
          selected &&
          !isLocked &&
          RESIZE_HANDLES.map((dir) => (
            <div
              key={dir}
              onPointerDown={(e) => startPointerInteraction(e, dir)}
              title="Drag to resize on dot grid"
              className={cn('ct-resize-handle', `ct-resize-handle--${dir}`)}
            />
          ))}
      </div>
    </>
  );
}
