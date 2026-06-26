import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { useDocumentOutlineRail } from '../documents/DocumentOutlineContext';

const SCALE_EPSILON = 0.001;
const ZOOM_PERCENT_MIN = 75;
const ZOOM_PERCENT_MAX = 150;
const ZOOM_PERCENT_STEP = 5;
/** Matches DocumentOutlineRail width transition (ms). */
const CONTENTS_PANEL_TRANSITION_MS = 400;

type ScrollAnchor = {
  el: HTMLElement;
  offsetFromViewportTop: number;
};

function captureScrollAnchor(scrollRoot: HTMLElement): ScrollAnchor | null {
  const rootRect = scrollRoot.getBoundingClientRect();
  const probeY = rootRect.top + 64;

  const candidates = [
    ...scrollRoot.querySelectorAll<HTMLElement>('[data-form-page-index]'),
    ...scrollRoot.querySelectorAll<HTMLElement>('[id^="form-section-"]'),
  ];

  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    if (rect.top <= probeY && rect.bottom > rootRect.top) {
      return { el, offsetFromViewportTop: rect.top - rootRect.top };
    }
  }

  return null;
}

function restoreScrollAnchor(scrollRoot: HTMLElement, anchor: ScrollAnchor | null): void {
  if (!anchor?.el.isConnected) return;

  const rootRect = scrollRoot.getBoundingClientRect();
  const anchorRect = anchor.el.getBoundingClientRect();
  const drift = anchorRect.top - rootRect.top - anchor.offsetFromViewportTop;

  if (Math.abs(drift) > 0.5) {
    scrollRoot.scrollTop += drift;
  }
}

function clampZoomPercent(value: number): number {
  return Math.min(ZOOM_PERCENT_MAX, Math.max(ZOOM_PERCENT_MIN, value));
}

export function FormPageViewport({
  pageIndex,
  totalPages,
  onPageChange,
  showZoomControls = false,
  /** Template preview — all pages stacked in one scroll; no page pager. */
  continuous = false,
  children,
}: {
  pageIndex: number;
  totalPages: number;
  onPageChange?: (pageIndex: number) => void;
  /** Manual zoom in/out — document editor and template preview. */
  showZoomControls?: boolean;
  continuous?: boolean;
  children: ReactNode;
}) {
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < totalPages - 1;
  const multiPage = !continuous && totalPages > 1 && onPageChange;
  const { expanded: contentsExpanded } = useDocumentOutlineRail();

  const scrollRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const referenceWidthRef = useRef(0);
  const scrollAnchorRef = useRef<ScrollAnchor | null>(null);
  const preserveScrollUntilRef = useRef(0);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [visiblePageIndex, setVisiblePageIndex] = useState(0);
  const [innerStyle, setInnerStyle] = useState<CSSProperties>({ width: '100%' });

  const userZoom = zoomPercent / 100;
  const displayPageIndex = continuous ? visiblePageIndex : pageIndex;

  const zoomIn = useCallback(() => {
    setZoomPercent((prev) => clampZoomPercent(prev + ZOOM_PERCENT_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomPercent((prev) => clampZoomPercent(prev - ZOOM_PERCENT_STEP));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomPercent(100);
  }, []);

  const updateScale = useCallback(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) return;

    const available = host.clientWidth;
    if (available <= 0) return;

    if (!contentsExpanded || referenceWidthRef.current <= 0) {
      referenceWidthRef.current = available;
    }

    const reference = referenceWidthRef.current;
    const fitScale = Math.min(1, available / reference);
    const atFullScale = fitScale >= 1 - SCALE_EPSILON;
    const effectiveZoom = fitScale * userZoom;

    setInnerStyle(
      atFullScale
        ? { width: '100%', zoom: userZoom }
        : { width: reference, zoom: effectiveZoom },
    );
  }, [contentsExpanded, userZoom]);

  const scheduleScrollRestore = useCallback((anchor: ScrollAnchor | null) => {
    const scroll = scrollRef.current;
    if (!scroll || !anchor) return;

    const run = () => restoreScrollAnchor(scroll, anchor);
    requestAnimationFrame(() => requestAnimationFrame(run));
  }, []);

  const updateScaleAndPreserveScroll = useCallback(() => {
    updateScale();
    if (performance.now() < preserveScrollUntilRef.current) {
      scheduleScrollRestore(scrollAnchorRef.current);
    }
  }, [updateScale, scheduleScrollRestore]);

  useEffect(() => {
    if (!continuous) setZoomPercent(100);
  }, [continuous, pageIndex]);

  useEffect(() => {
    const scroll = scrollRef.current;
    const anchor = scroll ? captureScrollAnchor(scroll) : null;
    scrollAnchorRef.current = anchor;
    preserveScrollUntilRef.current = performance.now() + CONTENTS_PANEL_TRANSITION_MS + 50;

    if (!contentsExpanded && hostRef.current) {
      referenceWidthRef.current = hostRef.current.clientWidth;
    }
    updateScale();
    scheduleScrollRestore(anchor);

    const t = window.setTimeout(() => {
      scheduleScrollRestore(scrollAnchorRef.current);
      preserveScrollUntilRef.current = 0;
    }, CONTENTS_PANEL_TRANSITION_MS + 50);

    return () => window.clearTimeout(t);
  }, [contentsExpanded, updateScale, scheduleScrollRestore]);

  useEffect(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) return;

    const ro = new ResizeObserver(() => updateScaleAndPreserveScroll());
    ro.observe(host);
    ro.observe(inner);
    updateScaleAndPreserveScroll();
    return () => ro.disconnect();
  }, [updateScaleAndPreserveScroll, continuous, pageIndex, children]);

  useLayoutEffect(() => {
    if (performance.now() >= preserveScrollUntilRef.current) return;
    const scroll = scrollRef.current;
    if (!scroll) return;
    restoreScrollAnchor(scroll, scrollAnchorRef.current);
  }, [innerStyle]);

  useEffect(() => {
    if (!showZoomControls) return;

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
  }, [showZoomControls, zoomIn, zoomOut, resetZoom]);

  useEffect(() => {
    if (!continuous) return;
    const root = scrollRef.current;
    if (!root) return;

    const sheets = root.querySelectorAll<HTMLElement>('[data-form-page-index]');
    if (!sheets.length) return;

    const ratios = new Map<number, number>();

    const pickVisible = () => {
      let best = 0;
      let bestRatio = -1;
      ratios.forEach((ratio, idx) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = idx;
        }
      });
      if (bestRatio > 0) setVisiblePageIndex(best);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.formPageIndex);
          if (!Number.isNaN(idx)) ratios.set(idx, entry.intersectionRatio);
        }
        pickVisible();
      },
      { root, threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1] },
    );

    sheets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [continuous, children]);

  const zoomLabel = `${zoomPercent}%`;
  const atMinZoom = zoomPercent <= ZOOM_PERCENT_MIN;
  const atMaxZoom = zoomPercent >= ZOOM_PERCENT_MAX;

  return (
    <div
      className={
        continuous
          ? 'form-page-viewport--continuous relative flex min-h-0 flex-1 flex-col'
          : 'relative flex min-h-0 flex-1 flex-col'
      }
    >
      <div
        ref={scrollRef}
        className="form-page-viewport-scroll min-h-0 flex-1 overflow-y-auto"
      >
        <div className="form-page-viewport-pad">
          <div ref={hostRef} className="form-page-scale-host">
            <div ref={innerRef} className="form-page-scale-inner" style={innerStyle}>
              {children}
            </div>
          </div>
        </div>
      </div>

      <div className="form-page-viewport-footer pointer-events-none absolute inset-x-0 bottom-3 z-10 flex flex-wrap items-center justify-center gap-2 px-2">
        {showZoomControls ? (
          <div className="form-page-indicator pointer-events-auto" role="group" aria-label="Page zoom">
            <button
              type="button"
              disabled={atMinZoom}
              onClick={zoomOut}
              className="form-page-indicator-nav"
              aria-label="Zoom out"
              title="Zoom out (Ctrl+-)"
            >
              <Minus className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              className="form-page-indicator-zoom-label"
              aria-label={`Zoom ${zoomLabel}. Reset to 100%.`}
              title="Reset zoom (Ctrl+0)"
            >
              {zoomLabel}
            </button>
            <button
              type="button"
              disabled={atMaxZoom}
              onClick={zoomIn}
              className="form-page-indicator-nav"
              aria-label="Zoom in"
              title="Zoom in (Ctrl++)"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        ) : null}

        {totalPages > 0 ? (
          <div
            className="form-page-indicator pointer-events-auto"
            role="status"
            aria-label={`Page ${displayPageIndex + 1} of ${totalPages}`}
          >
            {multiPage ? (
              <button
                type="button"
                disabled={!canPrev}
                onClick={() => onPageChange!(pageIndex - 1)}
                className="form-page-indicator-nav"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-3.5" />
              </button>
            ) : null}
            <span className="form-page-indicator-label">
              Page {displayPageIndex + 1} of {totalPages}
            </span>
            {multiPage ? (
              <button
                type="button"
                disabled={!canNext}
                onClick={() => onPageChange!(pageIndex + 1)}
                className="form-page-indicator-nav"
                aria-label="Next page"
              >
                <ChevronRight className="size-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
