import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  nextInspectionListSort,
  type InspectionListSort,
  type InspectionListSortKey,
} from '../../shared/inspection';
import { cn } from '../lib/cn';

/** Shared track sizes for header + rows (must match exactly). */
export const docRowGrid =
  'grid-cols-[minmax(0,1fr)_5.5rem_5.5rem_3.75rem_auto] gap-x-3';

export const docMetaTailCls = 'flex items-center justify-end gap-1.5';
export const docModifiedColCls = 'w-[4.75rem] shrink-0 text-center';
export const docDeleteColCls = 'grid w-7 shrink-0 place-items-center';

function SortableColumnHeader({
  label,
  sortKey,
  sort,
  onSortChange,
  className,
}: {
  label: string;
  sortKey: InspectionListSortKey;
  sort: InspectionListSort;
  onSortChange: (sort: InspectionListSort) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSortChange(nextInspectionListSort(sort, sortKey))}
      className={cn(
        'inline-flex min-w-0 items-center gap-0.5 transition-colors hover:text-neutral-400',
        active && 'text-neutral-400',
        className,
      )}
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      title={
        active
          ? sort.direction === 'desc'
            ? 'Sorted descending — click for ascending'
            : 'Sorted ascending — click for descending'
          : `Sort by ${label.toLowerCase()}`
      }
    >
      <span>{label}</span>
      {active ? (
        sort.direction === 'asc' ? (
          <ChevronUp className="size-3 shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="size-3 shrink-0" aria-hidden />
        )
      ) : null}
    </button>
  );
}

export function InspectionListColumnHeaders({
  sort,
  onSortChange,
  className,
}: {
  sort: InspectionListSort;
  onSortChange: (sort: InspectionListSort) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid shrink-0 px-4 text-[10px] font-medium uppercase tracking-wide text-neutral-600',
        docRowGrid,
        className,
      )}
    >
      <SortableColumnHeader label="Name" sortKey="name" sort={sort} onSortChange={onSortChange} />
      <span className="text-center">Project #</span>
      <SortableColumnHeader
        label="Date"
        sortKey="inspectedAt"
        sort={sort}
        onSortChange={onSortChange}
        className="w-full justify-center"
      />
      <span className="text-center">Status</span>
      <div className={docMetaTailCls}>
        <SortableColumnHeader
          label="Modified"
          sortKey="modified"
          sort={sort}
          onSortChange={onSortChange}
          className={cn(docModifiedColCls, 'justify-center')}
        />
        <span className={docDeleteColCls} aria-hidden="true" />
      </div>
    </div>
  );
}
