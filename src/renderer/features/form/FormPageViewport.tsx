import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function FormPageViewport({
  pageIndex,
  totalPages,
  onPageChange,
  children,
}: {
  pageIndex: number;
  totalPages: number;
  onPageChange?: (pageIndex: number) => void;
  children: ReactNode;
}) {
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < totalPages - 1;
  const multiPage = totalPages > 1 && onPageChange;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="form-page-viewport-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="form-page-viewport-pad">{children}</div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center"
        aria-hidden={false}
      >
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
