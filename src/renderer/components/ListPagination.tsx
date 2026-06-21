import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';

export function ListPagination({
  page,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (totalItems <= 0) return null;

  const showControls = totalPages > 1;
  const from = totalItems === 0 ? 0 : startIndex + 1;
  const to = endIndex;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 border-t border-[var(--ba-panel-border)] px-1 pt-3',
        className,
      )}
    >
      <p className="text-xs text-[var(--ba-text-muted)]">
        {showControls ? (
          <>
            Showing {from}–{to} of {totalItems}
          </>
        ) : (
          <>
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </>
        )}
      </p>
      {showControls ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--ba-panel-border)] px-2 py-1 text-xs text-[var(--ba-text-secondary)] hover:bg-[var(--ba-hover-bg)] disabled:cursor-default disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-3.5" />
            Prev
          </button>
          <span className="min-w-[5.5rem] text-center text-xs text-[var(--ba-text-muted)]">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--ba-panel-border)] px-2 py-1 text-xs text-[var(--ba-text-secondary)] hover:bg-[var(--ba-hover-bg)] disabled:cursor-default disabled:opacity-40"
            aria-label="Next page"
          >
            Next
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
