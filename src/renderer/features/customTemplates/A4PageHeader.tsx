import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CoverHeaderMode } from './pageModel';

export function A4PageHeader({
  pageIndex,
  totalPages,
  templateName,
  inspectionType,
  coverHeaderMode,
  headerHeightPx,
  readOnly,
  onNameChange,
  onInspectionTypeChange,
  onToggleCoverHeaderMode,
}: {
  pageIndex: number;
  totalPages: number;
  templateName: string;
  inspectionType: string;
  coverHeaderMode: CoverHeaderMode;
  headerHeightPx: number;
  readOnly: boolean;
  onNameChange: (next: string) => void;
  onInspectionTypeChange: (next: string) => void;
  onToggleCoverHeaderMode: () => void;
}) {
  if (pageIndex > 0) {
    return (
      <header
        style={{ height: headerHeightPx }}
        className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-[#f97316]/70 pb-1.5"
      >
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="text-[11px] font-bold tracking-wide text-[var(--ct-ink-primary)] truncate">
            {templateName || 'Untitled Template'}
          </span>
          {inspectionType ? (
            <span className="truncate text-[10px] text-[var(--ct-ink-muted)]">
              · {inspectionType}
            </span>
          ) : null}
        </div>
        <span className="shrink-0 text-[9.5px] font-semibold uppercase tracking-wider text-[var(--ct-ink-muted)]">
          Continuation · Page {pageIndex + 1} of {totalPages}
        </span>
      </header>
    );
  }

  const isCompact = coverHeaderMode === 'compact';

  return (
    <header
      style={{ height: headerHeightPx }}
      className="flex shrink-0 flex-col justify-between overflow-hidden pb-2"
    >
      {/* Top Brand + Title Bar */}
      <div>
        <div className="flex items-center justify-between gap-2 border-b-2 border-[#f97316] pb-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-[var(--ct-ink-primary)]">
              <span className="text-[#f97316]">Blaze</span>Audit
            </span>
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-[var(--ct-ink-muted)]">
              Fire Inspection Report
            </span>
          </div>

          <div className="flex items-center gap-2">
            {readOnly ? (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ct-ink-secondary)]">
                {inspectionType || 'General Inspection'}
              </span>
            ) : (
              <input
                type="text"
                value={inspectionType}
                onChange={(e) => onInspectionTypeChange(e.target.value)}
                placeholder="Inspection type (e.g. Annual Fire Safety)…"
                aria-label="Inspection type"
                className="w-48 rounded border border-transparent bg-transparent px-1.5 py-0.5 text-right text-[10px] font-semibold text-[var(--ct-ink-secondary)] outline-none placeholder:text-[var(--ct-ink-faint)] hover:border-[var(--ct-line-soft)] focus:border-[#f97316] focus:bg-[var(--ct-surface-input)]"
              />
            )}

            {!readOnly && (
              <button
                type="button"
                onClick={onToggleCoverHeaderMode}
                title={
                  isCompact
                    ? 'Show Client & Inspection cover box preview'
                    : 'Collapse cover box to maximize Page 1 grid'
                }
                className="inline-flex items-center gap-0.5 rounded border border-[var(--ct-line-soft)] bg-[var(--ct-surface-subtle)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--ct-ink-muted)] transition-colors hover:border-[#f97316]/50 hover:text-[var(--ct-ink-primary)]"
              >
                {isCompact ? (
                  <>
                    <ChevronDown className="size-2.5" />
                    Cover Info
                  </>
                ) : (
                  <>
                    <ChevronUp className="size-2.5" />
                    Compact
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Editable Report Title */}
        <div className="mt-1.5">
          {readOnly ? (
            <h1 className="truncate text-[16px] font-bold leading-tight text-[var(--ct-ink-primary)]">
              {templateName || 'Untitled Template'}
            </h1>
          ) : (
            <input
              type="text"
              value={templateName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Report / Template Title"
              aria-label="Template title"
              className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-[16px] font-bold leading-tight text-[var(--ct-ink-primary)] outline-none placeholder:text-[var(--ct-ink-faint)] hover:border-[var(--ct-line-soft)] focus:border-[#f97316] focus:bg-[var(--ct-surface-input)]"
            />
          )}
        </div>
      </div>

      {/* Auto-filled Client & Inspection Info Preview (matches PDF export) */}
      {!isCompact && (
        <div className="grid grid-cols-2 gap-2 text-[9.5px] leading-snug">
          <div className="rounded border border-[var(--ct-line-soft)] bg-[var(--ct-surface-card)] px-2.5 py-1.5">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#f97316]">
                Client / Building
              </span>
              <span className="text-[8px] italic text-[var(--ct-ink-faint)]">Auto-filled</span>
            </div>
            <div className="grid grid-cols-[68px_1fr] gap-x-1.5 gap-y-0.5">
              <span className="font-semibold text-[var(--ct-ink-muted)]">Building</span>
              <span className="truncate text-[var(--ct-ink-secondary)]">[Client Building Name]</span>
              <span className="font-semibold text-[var(--ct-ink-muted)]">Address</span>
              <span className="truncate text-[var(--ct-ink-secondary)]">[Street, City, Post Code]</span>
              <span className="font-semibold text-[var(--ct-ink-muted)]">Contact</span>
              <span className="truncate text-[var(--ct-ink-secondary)]">[Site Contact · Phone]</span>
              <span className="font-semibold text-[var(--ct-ink-muted)]">Monitoring</span>
              <span className="truncate text-[var(--ct-ink-secondary)]">[Signal Receiving Centre]</span>
            </div>
          </div>

          <div className="rounded border border-[var(--ct-line-soft)] bg-[var(--ct-surface-card)] px-2.5 py-1.5">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#f97316]">
                Inspection Details
              </span>
              <span className="text-[8px] italic text-[var(--ct-ink-faint)]">Auto-filled</span>
            </div>
            <div className="grid grid-cols-[68px_1fr] gap-x-1.5 gap-y-0.5">
              <span className="font-semibold text-[var(--ct-ink-muted)]">Type</span>
              <span className="truncate text-[var(--ct-ink-secondary)]">
                {inspectionType || '[Inspection Type]'}
              </span>
              <span className="font-semibold text-[var(--ct-ink-muted)]">Inspector</span>
              <span className="truncate text-[var(--ct-ink-secondary)]">[Assigned Technician]</span>
              <span className="font-semibold text-[var(--ct-ink-muted)]">Date</span>
              <span className="truncate text-[var(--ct-ink-secondary)]">[YYYY-MM-DD]</span>
              <span className="font-semibold text-[var(--ct-ink-muted)]">Cadence</span>
              <span className="truncate text-[var(--ct-ink-secondary)]">Annual · Next Due Auto</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
