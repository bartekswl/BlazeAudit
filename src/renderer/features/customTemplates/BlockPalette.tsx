import {
  AlignLeft,
  CheckSquare,
  FilePlus2,
  FileSpreadsheet,
  Heading,
  ImagePlus,
  ListChecks,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  PenTool,
  RectangleHorizontal,
  SquarePen,
  Table2,
  TextQuote,
  type LucideIcon,
} from 'lucide-react';
import {
  TEMPLATE_ELEMENT_PRESETS,
  TEMPLATE_PRESET_CATEGORIES,
  type TemplatePresetId,
} from './blockCatalog';
import type { PageOrientation } from './pageModel';

export const PRESET_DRAG_MIME = 'application/x-blazeaudit-preset';

const PRESET_ICONS: Record<TemplatePresetId, LucideIcon> = {
  'checklist-pass-fail': CheckSquare,
  'checklist-yes-no': ListChecks,
  'table-equipment': FileSpreadsheet,
  'table-deficiencies': Table2,
  'table-blank': Table2,
  'heading-banner': Heading,
  'field-single': SquarePen,
  'field-multiline': AlignLeft,
  'notes-ruled': AlignLeft,
  'note-clause': TextQuote,
  'signature-tech': PenTool,
  'image-slot': ImagePlus,
  'spacer-rule': Minus,
};

export function BlockPalette({
  collapsed,
  activePageNumber,
  onToggleCollapsed,
  onInsertPreset,
  onStartDragPreset,
  onEndDragPreset,
  onAddPage,
}: {
  collapsed: boolean;
  activePageNumber: number;
  onToggleCollapsed: () => void;
  onInsertPreset: (presetId: TemplatePresetId) => void;
  onStartDragPreset: (presetId: TemplatePresetId) => void;
  onEndDragPreset: () => void;
  onAddPage: (orientation: PageOrientation) => void;
}) {
  if (collapsed) {
    return (
      <aside className="flex h-full w-11 shrink-0 flex-col items-center gap-1.5 rounded-xl border border-[var(--ba-panel-border)] bg-[var(--ba-panel-bg)] py-2.5">
        <button
          type="button"
          onClick={onToggleCollapsed}
          title="Expand building blocks palette"
          className="rounded-lg p-1.5 text-[var(--ba-text-muted)] transition-colors hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)]"
        >
          <PanelLeftOpen className="size-4" />
        </button>
        <div className="my-0.5 h-px w-6 bg-[var(--ba-panel-border)]" />
        <div className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto px-1">
          {TEMPLATE_ELEMENT_PRESETS.map((preset) => {
            const Icon = PRESET_ICONS[preset.id];
            return (
              <button
                key={preset.id}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(PRESET_DRAG_MIME, preset.id);
                  e.dataTransfer.effectAllowed = 'copy';
                  onStartDragPreset(preset.id);
                }}
                onDragEnd={onEndDragPreset}
                onClick={() => onInsertPreset(preset.id)}
                title={`${preset.label} — click or drag onto Page ${activePageNumber}`}
                className="rounded-lg p-1.5 text-[var(--ba-text-muted)] transition-colors hover:bg-flame-500/15 hover:text-flame-400"
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col overflow-hidden rounded-xl border border-[var(--ba-panel-border)] bg-[var(--ba-panel-bg)]">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--ba-panel-border)] px-3 py-2.5">
        <div className="min-w-0">
          <h2 className="truncate text-xs font-bold uppercase tracking-wider text-[var(--ba-text-primary)]">
            Building Blocks
          </h2>
          <p className="truncate text-[10.5px] text-[var(--ba-text-muted)]">
            Click or drag onto Page {activePageNumber}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          title="Collapse palette"
          className="rounded-md p-1 text-[var(--ba-text-muted)] transition-colors hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)]"
        >
          <PanelLeftClose className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto p-2.5">
        {TEMPLATE_PRESET_CATEGORIES.map((cat) => {
          const items = TEMPLATE_ELEMENT_PRESETS.filter((p) => p.category === cat.id);
          return (
            <div key={cat.id} className="space-y-1">
              <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ba-text-faint)]">
                {cat.title}
              </p>
              <div className="space-y-1">
                {items.map((preset) => {
                  const Icon = PRESET_ICONS[preset.id];
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(PRESET_DRAG_MIME, preset.id);
                        e.dataTransfer.effectAllowed = 'copy';
                        onStartDragPreset(preset.id);
                      }}
                      onDragEnd={onEndDragPreset}
                      onClick={() => onInsertPreset(preset.id)}
                      className="group flex w-full cursor-grab items-start gap-2 rounded-lg border border-[var(--ba-panel-border)] bg-[var(--ba-row-hover-bg)] px-2.5 py-1.5 text-left transition-colors hover:border-flame-500/40 hover:bg-flame-500/10 active:cursor-grabbing"
                    >
                      <span className="mt-0.5 rounded-md bg-flame-500/15 p-1 text-flame-400 transition-colors group-hover:bg-flame-500 group-hover:text-white">
                        <Icon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-[var(--ba-text-primary)]">
                          {preset.label}
                        </span>
                        <span className="block truncate text-[10px] text-[var(--ba-text-muted)]">
                          {preset.shortHint}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 space-y-1.5 border-t border-[var(--ba-panel-border)] p-2.5">
        <p className="px-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ba-text-faint)]">
          Add A4 Sheet
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onAddPage('portrait')}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--ba-panel-border)] px-2 py-1.5 text-[11px] font-medium text-[var(--ba-text-secondary)] transition-colors hover:border-flame-500/40 hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)]"
          >
            <FilePlus2 className="size-3.5 text-flame-400" />
            Portrait
          </button>
          <button
            type="button"
            onClick={() => onAddPage('landscape')}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--ba-panel-border)] px-2 py-1.5 text-[11px] font-medium text-[var(--ba-text-secondary)] transition-colors hover:border-flame-500/40 hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)]"
          >
            <RectangleHorizontal className="size-3.5 text-flame-400" />
            Landscape
          </button>
        </div>
      </div>
    </aside>
  );
}
