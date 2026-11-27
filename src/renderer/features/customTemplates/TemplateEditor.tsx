import './customTemplateStudio.css';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Eye,
  Grid3x3,
  Info,
  PencilRuler,
  Redo2,
  Save,
  Sun,
  Undo2,
} from 'lucide-react';
import {
  emptyDocument,
  newBlockId,
  scrollToDocumentBlock,
} from '../../../shared/document';
import type { Block, ChecklistItem, Document, Template } from '../../../shared/document';
import { cn } from '../../lib/cn';
import { useRegisterDocumentOutline } from '../documents/DocumentOutlineContext';
import { A4TemplateCanvas } from './A4TemplateCanvas';
import type { TemplatePresetId } from './blockCatalog';
import { BlockPalette } from './BlockPalette';
import {
  autoPackPageBlocks,
  boxesOverlap,
  buildStarterPageChildren,
  clampGridBox,
  computePageGeometry,
  createPageSectionBlock,
  ensurePagedDocument,
  findOpenGridSpot,
  getCoverHeaderMode,
  getPageOrientation,
  idealRowSpanForBlock,
  insertPresetIntoPages,
  readGridBox,
  relabelDefaultPages,
  sortChildrenReadingOrder,
  writeGridBox,
  type GridBox,
  type PageOrientation,
  type StarterLayoutId,
} from './pageModel';

type EditorSnapshot = {
  name: string;
  description: string;
  document: Document;
};

const MAX_HISTORY = 45;

function cloneBlockWithFreshIds(block: Block): Block {
  const nextConfig = structuredClone(block.config);
  if (block.type === 'checklist' && Array.isArray(nextConfig.items)) {
    nextConfig.items = (nextConfig.items as ChecklistItem[]).map((it) => ({
      ...it,
      id: newBlockId(),
    }));
  }
  return {
    ...block,
    id: newBlockId(),
    config: nextConfig,
    value:
      block.value === null || block.value === undefined
        ? null
        : structuredClone(block.value),
    children: block.children?.map(cloneBlockWithFreshIds),
  };
}

function isEditableElementTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

export function TemplateEditor({
  templateId,
  initial,
  onSaved,
  onDirtyChange,
}: {
  templateId: string | null;
  initial?: Template;
  onSaved: (template: Template) => void;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [name, setName] = useState(() => initial?.name ?? 'New Custom Template');
  const [description, setDescription] = useState(() => initial?.description ?? '');
  const [documentState, setDocumentState] = useState<Document>(() =>
    ensurePagedDocument(
      initial?.document ??
        emptyDocument({
          title: initial?.name ?? 'New Custom Template',
          inspectionType: 'Fire Safety Inspection',
        }),
    ),
  );

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [showDots, setShowDots] = useState(true);
  const [snapToGrid] = useState(true);
  const [forceWhitePaper, setForceWhitePaper] = useState(false);
  const [showMetaPopover, setShowMetaPopover] = useState(false);
  const [draggingPresetId, setDraggingPresetId] = useState<TemplatePresetId | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const metaPopoverRef = useRef<HTMLDivElement>(null);

  // Undo / Redo ring stack
  const [undoStack, setUndoStack] = useState<EditorSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<EditorSnapshot[]>([]);
  const lastCoalesceRef = useRef<{ key: string; at: number } | null>(null);

  const currentSnapshotRef = useRef<EditorSnapshot>({
    name,
    description,
    document: documentState,
  });
  currentSnapshotRef.current = { name, description, document: documentState };

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!showMetaPopover) return;
    const onDocDown = (e: MouseEvent) => {
      if (!metaPopoverRef.current?.contains(e.target as Node)) {
        setShowMetaPopover(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMetaPopover(false);
    };
    document.addEventListener('mousedown', onDocDown);
    window.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      window.removeEventListener('keydown', onEsc);
    };
  }, [showMetaPopover]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(t);
  }, [notice]);

  const recordHistory = useCallback((coalesceKey?: string) => {
    const now = Date.now();
    if (
      coalesceKey &&
      lastCoalesceRef.current &&
      lastCoalesceRef.current.key === coalesceKey &&
      now - lastCoalesceRef.current.at < 700
    ) {
      lastCoalesceRef.current.at = now;
      return;
    }
    lastCoalesceRef.current = coalesceKey ? { key: coalesceKey, at: now } : null;
    const snap = structuredClone(currentSnapshotRef.current);
    setUndoStack((prev) => [...prev.slice(-(MAX_HISTORY - 1)), snap]);
    setRedoStack([]);
  }, []);

  const markEdited = useCallback(
    (coalesceKey?: string) => {
      recordHistory(coalesceKey);
      setIsDirty(true);
    },
    [recordHistory],
  );

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const target = prev[prev.length - 1];
      const current = structuredClone(currentSnapshotRef.current);
      setRedoStack((r) => [...r.slice(-(MAX_HISTORY - 1)), current]);
      setName(target.name);
      setDescription(target.description);
      setDocumentState(target.document);
      setIsDirty(true);
      lastCoalesceRef.current = null;
      return prev.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const target = prev[prev.length - 1];
      const current = structuredClone(currentSnapshotRef.current);
      setUndoStack((u) => [...u.slice(-(MAX_HISTORY - 1)), current]);
      setName(target.name);
      setDescription(target.description);
      setDocumentState(target.document);
      setIsDirty(true);
      lastCoalesceRef.current = null;
      return prev.slice(0, -1);
    });
  }, []);

  const pages = documentState.blocks;
  const safePageIndex = Math.max(0, Math.min(pages.length - 1, activePageIndex));

  const syncMeta = (nextName: string, doc: Document): Document => ({
    ...doc,
    meta: {
      ...doc.meta,
      title: nextName.trim() || 'Untitled template',
      clientId: null,
      inspectionDate: null,
    },
  });

  const handleNameChange = (value: string) => {
    markEdited('meta-name');
    setName(value);
    setDocumentState((prev) => syncMeta(value, prev));
  };

  const handleInspectionTypeChange = (value: string) => {
    markEdited('meta-type');
    setDocumentState((prev) => ({
      ...prev,
      meta: { ...prev.meta, inspectionType: value },
    }));
  };

  const handleDescriptionChange = (value: string) => {
    markEdited('meta-desc');
    setDescription(value);
  };

  const updatePages = useCallback(
    (updater: (currentPages: Block[]) => Block[], coalesceKey?: string) => {
      markEdited(coalesceKey);
      setDocumentState((prev) => ({
        ...prev,
        blocks: updater(prev.blocks),
      }));
    },
    [markEdited],
  );

  // Outline navigation from right-hand Contents rail
  const handleOutlineNavigate = useCallback(
    (blockId: string) => {
      const pageIdx = pages.findIndex((p) => p.id === blockId);
      if (pageIdx >= 0) {
        setActivePageIndex(pageIdx);
        setSelectedBlockId(null);
        scrollToDocumentBlock(blockId);
        return;
      }
      for (let i = 0; i < pages.length; i++) {
        const found = (pages[i].children ?? []).find((c) => c.id === blockId);
        if (found) {
          setActivePageIndex(i);
          setSelectedBlockId(found.id);
          scrollToDocumentBlock(blockId);
          return;
        }
      }
    },
    [pages],
  );

  useRegisterDocumentOutline(documentState.blocks, handleOutlineNavigate);

  // Insert from left palette (click or drop)
  const handleInsertPreset = useCallback(
    (
      presetId: TemplatePresetId,
      targetIdx = safePageIndex,
      spot?: { col: number; row: number },
    ) => {
      markEdited();
      setDocumentState((prev) => {
        const result = insertPresetIntoPages(prev.blocks, presetId, targetIdx, spot);
        setActivePageIndex(result.targetPageIndex);
        setSelectedBlockId(result.insertedBlockId);
        if (result.createdNewPage) {
          setNotice(
            `Page ${targetIdx + 1} printable area was full — placed onto Page ${result.targetPageIndex + 1}.`,
          );
          window.requestAnimationFrame(() => {
            const newPage = result.pages[result.targetPageIndex];
            if (newPage) scrollToDocumentBlock(newPage.id);
          });
        }
        return { ...prev, blocks: result.pages };
      });
    },
    [markEdited, safePageIndex],
  );

  const handleToggleCoverHeaderMode = useCallback(() => {
    updatePages((curPages) => {
      const first = curPages[0];
      if (!first) return curPages;
      const nextMode = getCoverHeaderMode(first) === 'full' ? 'compact' : 'full';
      const orientation = getPageOrientation(first);
      const nextGeo = computePageGeometry(orientation, 0, nextMode);
      const clampedChildren = (first.children ?? []).map((child) => {
        const box = readGridBox(child, nextGeo);
        return writeGridBox(child, clampGridBox(box, child, nextGeo));
      });
      const updatedFirst: Block = {
        ...first,
        config: { ...first.config, coverHeaderMode: nextMode },
        children: sortChildrenReadingOrder(clampedChildren, nextGeo),
      };
      return [updatedFirst, ...curPages.slice(1)];
    });
  }, [updatePages]);

  const handleChangePageLabel = useCallback(
    (pageIndex: number, label: string) => {
      updatePages(
        (cur) =>
          cur.map((p, idx) => (idx === pageIndex ? { ...p, label } : p)),
        `page-label-${pageIndex}`,
      );
    },
    [updatePages],
  );

  const handleChangePageOrientation = useCallback(
    (pageIndex: number, orientation: PageOrientation) => {
      updatePages((cur) => {
        const coverMode = getCoverHeaderMode(cur[0]);
        return cur.map((p, idx) => {
          if (idx !== pageIndex) return p;
          const nextGeo = computePageGeometry(orientation, idx, coverMode);
          const nextChildren = (p.children ?? []).map((child) => {
            const prevBox = readGridBox(child, nextGeo);
            return writeGridBox(child, clampGridBox(prevBox, child, nextGeo));
          });
          return {
            ...p,
            config: { ...p.config, pageOrientation: orientation },
            children: sortChildrenReadingOrder(nextChildren, nextGeo),
          };
        });
      });
    },
    [updatePages],
  );

  const handleAutoPackPage = useCallback(
    (pageIndex: number) => {
      updatePages((cur) => {
        const coverMode = getCoverHeaderMode(cur[0]);
        return cur.map((p, idx) =>
          idx === pageIndex ? autoPackPageBlocks(p, idx, coverMode) : p,
        );
      });
    },
    [updatePages],
  );

  const handleSetAllPageLocks = useCallback(
    (pageIndex: number, locked: boolean) => {
      updatePages((cur) => {
        const coverMode = getCoverHeaderMode(cur[0]);
        return cur.map((p, idx) => {
          if (idx !== pageIndex) return p;
          const geo = computePageGeometry(getPageOrientation(p), idx, coverMode);
          return {
            ...p,
            children: (p.children ?? []).map((child) => {
              const box = readGridBox(child, geo);
              return writeGridBox(child, { ...box, locked });
            }),
          };
        });
      });
    },
    [updatePages],
  );

  const handleAddPage = useCallback(
    (orientation: PageOrientation) => {
      markEdited();
      setDocumentState((prev) => {
        const nextIdx = prev.blocks.length;
        const newPage = createPageSectionBlock(nextIdx + 1, orientation, []);
        const nextPages = relabelDefaultPages([...prev.blocks, newPage]);
        setActivePageIndex(nextIdx);
        setSelectedBlockId(null);
        window.requestAnimationFrame(() => scrollToDocumentBlock(newPage.id));
        return { ...prev, blocks: nextPages };
      });
    },
    [markEdited],
  );

  const handleMovePage = useCallback(
    (pageIndex: number, dir: -1 | 1) => {
      const target = pageIndex + dir;
      if (target < 0 || target >= pages.length) return;
      updatePages((cur) => {
        const copy = [...cur];
        const [moved] = copy.splice(pageIndex, 1);
        copy.splice(target, 0, moved);
        // Ensure new Page 1 has coverHeaderMode and re-clamp all pages to their index geometry
        const coverMode = getCoverHeaderMode(copy[0]);
        const reclamped = copy.map((page, idx) => {
          const orientation = getPageOrientation(page);
          const geo = computePageGeometry(orientation, idx, coverMode);
          const nextChildren = (page.children ?? []).map((c) =>
            writeGridBox(c, clampGridBox(readGridBox(c, geo), c, geo)),
          );
          return {
            ...page,
            config: {
              ...page.config,
              ...(idx === 0 ? { coverHeaderMode: coverMode } : {}),
            },
            children: sortChildrenReadingOrder(nextChildren, geo),
          };
        });
        return relabelDefaultPages(reclamped);
      });
      setActivePageIndex(target);
    },
    [pages.length, updatePages],
  );

  const handleDuplicatePage = useCallback(
    (pageIndex: number) => {
      markEdited();
      setDocumentState((prev) => {
        const src = prev.blocks[pageIndex];
        if (!src) return prev;
        const cloned = cloneBlockWithFreshIds(src);
        cloned.label = /^page\s+\d+$/i.test(src.label ?? '')
          ? ''
          : `${src.label} (copy)`;
        const copy = [...prev.blocks];
        copy.splice(pageIndex + 1, 0, cloned);
        const nextPages = relabelDefaultPages(copy);
        setActivePageIndex(pageIndex + 1);
        setSelectedBlockId(null);
        window.requestAnimationFrame(() => scrollToDocumentBlock(cloned.id));
        return { ...prev, blocks: nextPages };
      });
    },
    [markEdited],
  );

  const handleDeletePage = useCallback(
    (pageIndex: number) => {
      if (pages.length <= 1) return;
      updatePages((cur) => {
        const filtered = cur.filter((_, idx) => idx !== pageIndex);
        return relabelDefaultPages(filtered);
      });
      setActivePageIndex((prev) => Math.max(0, Math.min(pages.length - 2, prev)));
      setSelectedBlockId(null);
    },
    [pages.length, updatePages],
  );

  const handleApplyStarterLayout = useCallback(
    (pageIndex: number, starterId: StarterLayoutId) => {
      updatePages((cur) => {
        const coverMode = getCoverHeaderMode(cur[0]);
        return cur.map((p, idx) => {
          if (idx !== pageIndex) return p;
          const geo = computePageGeometry(getPageOrientation(p), idx, coverMode);
          return {
            ...p,
            children: buildStarterPageChildren(starterId, geo),
          };
        });
      });
    },
    [updatePages],
  );

  const handleChangeElementBox = useCallback(
    (pageIndex: number, blockId: string, nextBox: GridBox, coalesceKey?: string) => {
      updatePages((cur) => {
        const coverMode = getCoverHeaderMode(cur[0]);
        return cur.map((p, idx) => {
          if (idx !== pageIndex) return p;
          const geo = computePageGeometry(getPageOrientation(p), idx, coverMode);
          const nextChildren = (p.children ?? []).map((child) => {
            if (child.id !== blockId) return child;
            return writeGridBox(child, clampGridBox(nextBox, child, geo));
          });
          return {
            ...p,
            children: sortChildrenReadingOrder(nextChildren, geo),
          };
        });
      }, coalesceKey);
    },
    [updatePages],
  );

  const handlePatchElement = useCallback(
    (pageIndex: number, blockId: string, updater: (current: Block) => Block) => {
      updatePages((cur) => {
        const coverMode = getCoverHeaderMode(cur[0]);
        return cur.map((p, idx) => {
          if (idx !== pageIndex) return p;
          const geo = computePageGeometry(getPageOrientation(p), idx, coverMode);
          const currentChildren = p.children ?? [];
          const nextChildren = currentChildren.map((child) => {
            if (child.id !== blockId) return child;
            const patched = updater(child);
            const curBox = readGridBox(patched, geo);

            // Auto-expand unlocked checklist/table/lines height if open space exists below
            if (
              !curBox.locked &&
              (patched.type === 'checklist' ||
                patched.type === 'table' ||
                patched.type === 'lines')
            ) {
              const idealH = idealRowSpanForBlock(patched, geo);
              if (idealH > curBox.rowSpan) {
                const maxAvailH = geo.gridRows - curBox.row;
                const candidateBox: GridBox = {
                  ...curBox,
                  rowSpan: Math.min(maxAvailH, idealH),
                };
                const collidesBelow = currentChildren.some((other) => {
                  if (other.id === blockId) return false;
                  return boxesOverlap(candidateBox, readGridBox(other, geo));
                });
                if (!collidesBelow) {
                  return writeGridBox(patched, clampGridBox(candidateBox, patched, geo));
                }
              }
            }

            return writeGridBox(patched, clampGridBox(curBox, patched, geo));
          });
          return { ...p, children: nextChildren };
        });
      }, `patch-${blockId}`);
    },
    [updatePages],
  );

  const handleDuplicateElement = useCallback(
    (pageIndex: number, blockId: string) => {
      markEdited();
      setDocumentState((prev) => {
        const page = prev.blocks[pageIndex];
        if (!page) return prev;
        const coverMode = getCoverHeaderMode(prev.blocks[0]);
        const geo = computePageGeometry(getPageOrientation(page), pageIndex, coverMode);
        const source = (page.children ?? []).find((c) => c.id === blockId);
        if (!source) return prev;

        const srcBox = readGridBox(source, geo);
        const cloned = cloneBlockWithFreshIds(source);
        const occupied = (page.children ?? []).map((c) => readGridBox(c, geo));
        const openSpot = findOpenGridSpot(
          occupied,
          srcBox.colSpan,
          srcBox.rowSpan,
          geo,
        );

        if (openSpot) {
          const placed = writeGridBox(
            cloned,
            clampGridBox(
              { ...srcBox, col: openSpot.col, row: openSpot.row, locked: false },
              cloned,
              geo,
            ),
          );
          setSelectedBlockId(placed.id);
          return {
            ...prev,
            blocks: prev.blocks.map((p, idx) =>
              idx === pageIndex
                ? {
                    ...p,
                    children: sortChildrenReadingOrder([...(p.children ?? []), placed], geo),
                  }
                : p,
            ),
          };
        }

        // Current page full — place duplicate on next A4 page
        const nextIdx = pageIndex + 1;
        const nextGeo = computePageGeometry(getPageOrientation(page), nextIdx, coverMode);
        const placed = writeGridBox(
          cloned,
          clampGridBox(
            {
              col: 0,
              row: 0,
              colSpan: Math.min(nextGeo.gridCols, srcBox.colSpan),
              rowSpan: Math.min(nextGeo.gridRows, srcBox.rowSpan),
              locked: false,
            },
            cloned,
            nextGeo,
          ),
        );
        const newPage = createPageSectionBlock(
          nextIdx + 1,
          getPageOrientation(page),
          [placed],
        );
        const nextPages = [...prev.blocks];
        nextPages.splice(nextIdx, 0, newPage);
        setActivePageIndex(nextIdx);
        setSelectedBlockId(placed.id);
        setNotice(`Page ${pageIndex + 1} was full — duplicated onto Page ${nextIdx + 1}.`);
        return { ...prev, blocks: relabelDefaultPages(nextPages) };
      });
    },
    [markEdited],
  );

  const handleDeleteElement = useCallback(
    (pageIndex: number, blockId: string) => {
      updatePages((cur) =>
        cur.map((p, idx) =>
          idx === pageIndex
            ? {
                ...p,
                children: (p.children ?? []).filter((c) => c.id !== blockId),
              }
            : p,
        ),
      );
      setSelectedBlockId((prev) => (prev === blockId ? null : prev));
    },
    [updatePages],
  );

  const save = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Template name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: trimmedName,
        description: description.trim(),
        document: syncMeta(trimmedName, documentState),
      };
      const saved = templateId
        ? await window.blazeaudit.templates.custom.update(templateId, payload)
        : await window.blazeaudit.templates.custom.create(payload);
      setIsDirty(false);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }, [name, description, documentState, templateId, onSaved]);

  // Studio keyboard shortcuts: Ctrl+S, Ctrl+Z/Y, Delete, Arrow-key dot-grid nudging
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void save();
        return;
      }

      if (isEditableElementTarget(e.target)) return;

      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (
        (mod && e.key.toLowerCase() === 'y') ||
        (mod && e.key.toLowerCase() === 'z' && e.shiftKey)
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (mode !== 'edit' || !selectedBlockId) return;

      const page = pages[safePageIndex];
      const block = (page?.children ?? []).find((c) => c.id === selectedBlockId);
      if (!page || !block) return;

      const coverMode = getCoverHeaderMode(pages[0]);
      const geo = computePageGeometry(getPageOrientation(page), safePageIndex, coverMode);
      const box = readGridBox(block, geo);

      if (e.key === 'Escape') {
        setSelectedBlockId(null);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (box.locked) return;
        e.preventDefault();
        handleDeleteElement(safePageIndex, block.id);
        return;
      }

      if (
        !box.locked &&
        (e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight')
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 6 : 1;
        const nextBox: GridBox = { ...box };
        if (e.key === 'ArrowLeft') nextBox.col -= step;
        if (e.key === 'ArrowRight') nextBox.col += step;
        if (e.key === 'ArrowUp') nextBox.row -= step;
        if (e.key === 'ArrowDown') nextBox.row += step;
        handleChangeElementBox(
          safePageIndex,
          block.id,
          clampGridBox(nextBox, block, geo),
          `nudge-${block.id}`,
        );
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    save,
    handleUndo,
    handleRedo,
    mode,
    selectedBlockId,
    pages,
    safePageIndex,
    handleDeleteElement,
    handleChangeElementBox,
  ]);

  const totalElementCount = useMemo(
    () => pages.reduce((sum, p) => sum + (p.children?.length ?? 0), 0),
    [pages],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2.5">
      {/* Slim Top Studio Toolbar */}
      <div className="relative flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--ba-panel-border)] bg-[var(--ba-panel-bg)] px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Template name…"
            aria-label="Template name"
            className="ba-input !w-auto min-w-44 max-w-72 flex-1 !py-1.5 text-sm font-semibold"
          />

          <div ref={metaPopoverRef} className="relative">
            <button
              type="button"
              onClick={() => setShowMetaPopover((v) => !v)}
              title="Template description & settings"
              className={cn(
                'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-colors',
                showMetaPopover || description.trim()
                  ? 'border-flame-500/35 bg-flame-500/10 text-flame-300'
                  : 'border-[var(--ba-panel-border)] text-[var(--ba-text-muted)] hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)]',
              )}
            >
              <Info className="size-3.5" />
              <span className="hidden md:inline">Details</span>
            </button>

            {showMetaPopover && (
              <div className="absolute top-full left-0 z-50 mt-1.5 w-80 rounded-xl border border-[var(--ba-panel-border)] bg-[var(--ba-drawer-bg)] p-3.5 shadow-2xl">
                <div className="space-y-2.5">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold text-[var(--ba-text-muted)]">
                      Inspection Type
                    </span>
                    <input
                      type="text"
                      value={documentState.meta.inspectionType}
                      onChange={(e) => handleInspectionTypeChange(e.target.value)}
                      placeholder="e.g. Annual Fire Safety Inspection"
                      className="ba-input !py-1.5 text-xs"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold text-[var(--ba-text-muted)]">
                      Template Description
                    </span>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => handleDescriptionChange(e.target.value)}
                      placeholder="Short note shown in your Custom Templates list…"
                      className="ba-input resize-none !py-1.5 text-xs"
                    />
                  </label>
                  <p className="text-[10.5px] text-[var(--ba-text-faint)]">
                    {pages.length} A4 {pages.length === 1 ? 'page' : 'pages'} ·{' '}
                    {totalElementCount} {totalElementCount === 1 ? 'element' : 'elements'} ·{' '}
                    {templateId ? `v${initial?.version ?? 1}` : 'Draft'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <span className="hidden text-xs text-[var(--ba-text-faint)] lg:inline">
            {pages.length}p · {totalElementCount} {totalElementCount === 1 ? 'block' : 'blocks'}
          </span>
        </div>

        {/* Center/Right Studio Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Undo / Redo */}
          <div className="inline-flex rounded-lg border border-[var(--ba-panel-border)] p-0.5">
            <button
              type="button"
              disabled={undoStack.length === 0}
              onClick={handleUndo}
              title="Undo (Ctrl+Z)"
              className="rounded-md p-1.5 text-[var(--ba-text-muted)] transition-colors hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)] disabled:opacity-30"
            >
              <Undo2 className="size-3.5" />
            </button>
            <button
              type="button"
              disabled={redoStack.length === 0}
              onClick={handleRedo}
              title="Redo (Ctrl+Y)"
              className="rounded-md p-1.5 text-[var(--ba-text-muted)] transition-colors hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)] disabled:opacity-30"
            >
              <Redo2 className="size-3.5" />
            </button>
          </div>

          {/* Dot Grid & White Paper Toggles */}
          {mode === 'edit' && (
            <button
              type="button"
              onClick={() => setShowDots((v) => !v)}
              title={showDots ? 'Hide dot grid' : 'Show dot grid'}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                showDots
                  ? 'border-flame-500/35 bg-flame-500/12 text-flame-400'
                  : 'border-[var(--ba-panel-border)] text-[var(--ba-text-muted)] hover:bg-[var(--ba-hover-bg)]',
              )}
            >
              <Grid3x3 className="size-3.5" />
              Dots
            </button>
          )}

          <button
            type="button"
            onClick={() => setForceWhitePaper((v) => !v)}
            title="Preview on crisp white A4 paper"
            className={cn(
              'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
              forceWhitePaper
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                : 'border-[var(--ba-panel-border)] text-[var(--ba-text-muted)] hover:bg-[var(--ba-hover-bg)]',
            )}
          >
            <Sun className="size-3.5" />
            Paper
          </button>

          {/* Edit / Preview Mode Switch */}
          <div className="inline-flex rounded-lg border border-[var(--ba-panel-border)] p-0.5">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                mode === 'edit'
                  ? 'bg-flame-500 text-white'
                  : 'text-[var(--ba-text-muted)] hover:text-[var(--ba-text-primary)]',
              )}
            >
              <PencilRuler className="size-3.5" />
              Design
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('preview');
                setSelectedBlockId(null);
              }}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                mode === 'preview'
                  ? 'bg-flame-500 text-white'
                  : 'text-[var(--ba-text-muted)] hover:text-[var(--ba-text-primary)]',
              )}
            >
              <Eye className="size-3.5" />
              Preview
            </button>
          </div>

          {/* Save Button */}
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            title="Save template (Ctrl+S)"
            className="inline-flex items-center gap-1.5 rounded-lg bg-flame-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-flame-600 disabled:opacity-50"
          >
            {templateId && !isDirty ? (
              <Check className="size-3.5" />
            ) : (
              <Save className="size-3.5" />
            )}
            {saving ? 'Saving…' : templateId && !isDirty ? 'Saved' : 'Save template'}
          </button>
        </div>
      </div>

      {/* Transient Notices / Errors */}
      {error && (
        <div className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div className="shrink-0 rounded-lg border border-flame-500/30 bg-flame-500/10 px-3 py-1.5 text-xs text-flame-300">
          {notice}
        </div>
      )}

      {/* Main Studio Workspace: Left Building-Block Palette + Centered A4 Canvas */}
      <div className="flex min-h-0 flex-1 gap-2.5 overflow-hidden">
        {mode === 'edit' && (
          <BlockPalette
            collapsed={paletteCollapsed}
            activePageNumber={safePageIndex + 1}
            onToggleCollapsed={() => setPaletteCollapsed((v) => !v)}
            onInsertPreset={(presetId) => handleInsertPreset(presetId, safePageIndex)}
            onStartDragPreset={setDraggingPresetId}
            onEndDragPreset={() => setDraggingPresetId(null)}
            onAddPage={handleAddPage}
          />
        )}

        <A4TemplateCanvas
          pages={pages}
          templateName={name}
          inspectionType={documentState.meta.inspectionType}
          activePageIndex={safePageIndex}
          selectedBlockId={selectedBlockId}
          editable={mode === 'edit'}
          showDots={showDots}
          snapToGrid={snapToGrid}
          forceWhitePaper={forceWhitePaper}
          draggingPresetId={draggingPresetId}
          onSelectPage={setActivePageIndex}
          onSelectBlock={(pageIdx, blockId) => {
            setActivePageIndex(pageIdx);
            setSelectedBlockId(blockId);
          }}
          onNameChange={handleNameChange}
          onInspectionTypeChange={handleInspectionTypeChange}
          onToggleCoverHeaderMode={handleToggleCoverHeaderMode}
          onChangePageLabel={handleChangePageLabel}
          onChangePageOrientation={handleChangePageOrientation}
          onAutoPackPage={handleAutoPackPage}
          onSetAllPageLocks={handleSetAllPageLocks}
          onMovePage={handleMovePage}
          onDuplicatePage={handleDuplicatePage}
          onDeletePage={handleDeletePage}
          onAddPage={handleAddPage}
          onApplyStarterLayout={handleApplyStarterLayout}
          onDropPresetOnPage={(pageIdx, presetId, spot) =>
            handleInsertPreset(presetId, pageIdx, spot)
          }
          onChangeElementBox={(pageIdx, blockId, nextBox) =>
            handleChangeElementBox(pageIdx, blockId, nextBox)
          }
          onPatchElement={handlePatchElement}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
        />
      </div>
    </div>
  );
}
