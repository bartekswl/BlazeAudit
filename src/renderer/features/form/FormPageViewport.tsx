import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { useDocumentOutlineRail } from '../documents/DocumentOutlineContext';

const SCALE_EPSILON = 0.001;
const USER_ZOOM_MIN = 0.75;
const USER_ZOOM_MAX = 1.5;
const USER_ZOOM_STEP = 0.1;

function clampUserZoom(value: number): number {
  return Math.min(USER_ZOOM_MAX, Math.max(USER_ZOOM_MIN, Math.round(value * 100) / 100));
}

export function FormPageViewport({
  pageIndex,
  totalPages,
  onPageChange,
  showZoomControls = false,
  children,
}: {
  pageIndex: number;
  totalPages: number;
  onPageChange?: (pageIndex: number) => void;
  /** Manual zoom in/out — document editor only. */
  showZoomControls?: boolean;
  children: ReactNode;
}) {
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < totalPages - 1;
  const multiPage = totalPages > 1 && onPageChange;
  const { expanded: contentsExpanded } = useDocumentOutlineRail();

  const hostRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const referenceWidthRef = useRef(0);
  const [userZoom, setUserZoom] = useState(1);
  const [innerStyle, setInnerStyle] = useState<CSSProperties>({ width: '100%' });

  const zoomIn = useCallback(() => {
    setUserZoom((prev) => clampUserZoom(prev + USER_ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setUserZoom((prev) => clampUserZoom(prev - USER_ZOOM_STEP));
  }, []);

  const resetZoom = useCallback(() => {
    setUserZoom(1);
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

  useEffect(() => {
    if (!contentsExpanded && hostRef.current) {
      referenceWidthRef.current = hostRef.current.clientWidth;
    }
    updateScale();
  }, [contentsExpanded, updateScale]);

  useEffect(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) return;

    const ro = new ResizeObserver(() => updateScale());
    ro.observe(host);
    ro.observe(inner);
    updateScale();
    return () => ro.disconnect();
  }, [updateScale, pageIndex]);

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

  const zoomLabel = `${Math.round(userZoom * 100)}%`;
  const atMinZoom = userZoom <= USER_ZOOM_MIN + SCALE_EPSILON;
  const atMaxZoom = userZoom >= USER_ZOOM_MAX - SCALE_EPSILON;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="form-page-viewport-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
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

        <div
          className="form-page-indicator pointer-events-auto"
          role="status"
          aria-label={`Page ${pageIndex + 1} of ${totalPages}`}
        >
          {multiPage ? (
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => onPageChange(pageIndex - 1)}
              className="form-page-indicator-nav"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-3.5" />
            </button>
          ) : null}
          <span className="form-page-indicator-label">
            Page {pageIndex + 1} of {totalPages}
          </span>
          {multiPage ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => onPageChange(pageIndex + 1)}
              className="form-page-indicator-nav"
              aria-label="Next page"
            >
              <ChevronRight className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
