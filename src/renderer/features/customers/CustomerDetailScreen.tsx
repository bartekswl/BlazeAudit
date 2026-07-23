import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, FileText, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { formatAddress } from '../../../shared/address';
import { cadenceLabel, isOverdue } from '../../../shared/cadence';
import {
  shortInspectionDisplayName,
  sortInspectionsByDate,
  type InspectionSummary,
} from '../../../shared/inspection';
import type { Client } from '../../../shared/types';
import { cn } from '../../lib/cn';
import { InlineLoader } from '../../components/LoadingOverlay';
import { ListPagination } from '../../components/ListPagination';
import { paginateItems } from '../../lib/pagination';

const filterInputCls =
  'rounded-md border border-white/10 bg-neutral-950/60 text-[11px] text-neutral-300 placeholder:text-neutral-600 focus:border-flame-500/40 focus:outline-none';

export function CustomerDetailScreen({
  clientId,
  onEdit,
  onDelete,
  onNewInspection,
  onOpenInspection,
}: {
  clientId: string;
  onEdit: (client: Client) => void;
  onDelete?: (client: Client) => void;
  onNewInspection: (clientId: string) => void;
  onOpenInspection: (inspectionId: string) => void;
}) {
  const [client, setClient] = useState<Client | null>(null);
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [stats, setStats] = useState<{
    documentCount: number;
    lastDocumentDate: string | null;
    nextInspectionDue: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listPage, setListPage] = useState(1);
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
  const [docSearch, setDocSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<'all' | string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [result, rows, clientStats] = await Promise.all([
        window.blazeaudit.clients.get(clientId),
        window.blazeaudit.inspections.list({ clientId }),
        window.blazeaudit.inspections.getClientStats(clientId),
      ]);
      setClient(result);
      setInspections(rows);
      setStats(clientStats);
      setError(result ? null : 'Client not found.');
    } catch (e) {
      setClient(null);
      setError(e instanceof Error ? e.message : 'Failed to load client.');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setDocSearch('');
    setYearFilter('all');
    setDateFrom('');
    setDateTo('');
    setListPage(1);
  }, [clientId]);

  useEffect(() => {
    setListPage(1);
  }, [dateSort, docSearch, yearFilter, dateFrom, dateTo]);

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    const current = new Date().getFullYear();
    years.add(current);
    for (const row of inspections) {
      const y = Number(row.inspectedAt?.slice(0, 4));
      if (!Number.isNaN(y) && y >= 1990 && y <= current + 1) years.add(y);
    }
    return [...years].sort((a, b) => b - a);
  }, [inspections]);

  const filteredInspections = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    return inspections.filter((row) => {
      if (q) {
        const matches =
          row.title.toLowerCase().includes(q) || row.projectNumber.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (yearFilter !== 'all') {
        if (!row.inspectedAt?.startsWith(yearFilter)) return false;
      }
      if (dateFrom && (!row.inspectedAt || row.inspectedAt < dateFrom)) return false;
      if (dateTo && (!row.inspectedAt || row.inspectedAt > dateTo)) return false;
      return true;
    });
  }, [inspections, docSearch, yearFilter, dateFrom, dateTo]);

  const hasActiveFilters = Boolean(docSearch || yearFilter !== 'all' || dateFrom || dateTo);

  const sortedInspections = useMemo(
    () => sortInspectionsByDate(filteredInspections, dateSort),
    [filteredInspections, dateSort],
  );

  const pagedInspections = useMemo(
    () => paginateItems(sortedInspections, listPage),
    [sortedInspections, listPage],
  );

  if (loading) {
    return <InlineLoader />;
  }

  if (error || !client) {
    return <p className="text-sm text-red-300">{error ?? 'Client not found.'}</p>;
  }

  const fullAddress = formatAddress(client);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <section className="shrink-0 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-sm font-semibold text-neutral-100">{client.name}</h2>
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => onNewInspection(clientId)}
              className="inline-flex items-center gap-1 rounded-md border border-flame-500/30 bg-flame-500/10 px-2 py-1 text-xs text-flame-300 transition-colors hover:bg-flame-500/20"
            >
              <Plus className="size-3.5" />
              New inspection
            </button>
            <button
              type="button"
              onClick={() => onEdit(client)}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-neutral-300 transition-colors hover:bg-white/5 hover:text-neutral-100"
            >
              <Pencil className="size-3.5" />
              Edit
            </button>
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(client)}
                className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-300 transition-colors hover:bg-red-500/20"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
            ) : null}
          </div>
        </div>

        <dl className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Contact" value={client.contactName} />
          <DetailField label="Phone" value={client.phone} />
          <DetailField label="Email" value={client.email} />
          <DetailField label="Address" value={fullAddress} lines={2} />
          <DetailField label="Owner / manager" value={client.ownerManagerName} />
          <DetailField label="Owner / manager phone" value={client.ownerManagerPhone} />
        </dl>

        {client.notes.trim() && (
          <p className="mt-1.5 border-t border-white/5 pt-1.5 text-[11px] text-neutral-500">
            <span className="font-medium text-neutral-400">Notes · </span>
            {client.notes.trim()}
          </p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-white/5 pt-1.5 text-[11px] text-neutral-500">
          <Stat label="Documents" value={String(stats?.documentCount ?? 0)} />
          <Stat label="Last document" value={stats?.lastDocumentDate ?? '—'} />
          <Stat
            label="Next due"
            value={
              stats?.nextInspectionDue
                ? `${stats.nextInspectionDue}${isOverdue(stats.nextInspectionDue) ? ' (overdue)' : ''}`
                : '—'
            }
          />
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
        <div className="mb-1.5 flex shrink-0 flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Documents
          </h3>
          {inspections.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="relative w-36">
                <Search className="pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  placeholder="Name or Project #"
                  className={cn(filterInputCls, 'w-full py-1 pl-6 pr-2')}
                />
              </div>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                title="Inspection year"
                aria-label="Filter by year"
                className={cn(filterInputCls, 'px-1.5 py-1')}
              >
                <option value="all">All years</option>
                {yearOptions.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                title="From date"
                className={cn(filterInputCls, 'w-[6.25rem] px-1.5 py-1')}
              />
              <span className="text-[10px] text-neutral-600">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                title="To date"
                className={cn(filterInputCls, 'w-[6.25rem] px-1.5 py-1')}
              />
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setDocSearch('');
                    setYearFilter('all');
                    setDateFrom('');
                    setDateTo('');
                  }}
                  aria-label="Clear document filters"
                  title="Clear filters"
                  className="rounded-md p-1 text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setDateSort((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
                title={
                  dateSort === 'newest'
                    ? 'Showing newest first — click for oldest first'
                    : 'Showing oldest first — click for newest first'
                }
              >
                <ArrowDownUp className="size-3.5" />
                {dateSort === 'newest' ? 'Newest first' : 'Oldest first'}
              </button>
            </div>
          ) : null}
        </div>
        {inspections.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 text-center">
            <div className="grid size-10 place-items-center rounded-lg bg-white/5 text-neutral-500">
              <FileText className="size-5" />
            </div>
            <p className="text-sm text-neutral-400">No documents for this client yet.</p>
            <button
              type="button"
              onClick={() => onNewInspection(clientId)}
              className="text-sm text-flame-400 hover:text-flame-300"
            >
              Create first inspection
            </button>
          </div>
        ) : sortedInspections.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 text-center">
            <div className="grid size-10 place-items-center rounded-lg bg-white/5 text-neutral-500">
              <FileText className="size-5" />
            </div>
            <p className="text-sm text-neutral-400">No documents match your filters.</p>
          </div>
        ) : (
          <>
            <div className="mb-1 grid shrink-0 grid-cols-[minmax(0,1fr)_6.5rem_7rem_auto] gap-2 px-3 text-[10px] font-medium uppercase tracking-wide text-neutral-600">
              <span>Name</span>
              <span>Date</span>
              <span>Project #</span>
              <span className="w-16 text-right">Status</span>
            </div>
            <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
              {pagedInspections.items.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => onOpenInspection(row.id)}
                    className="grid w-full grid-cols-[minmax(0,1fr)_6.5rem_7rem_auto] items-center gap-2 rounded-lg border border-white/5 bg-neutral-950/40 px-3 py-2 text-left transition-colors hover:border-white/10 hover:bg-white/[0.03]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-neutral-100">
                        {shortInspectionDisplayName(row.title, row.clientName)}
                      </span>
                      <span className="block truncate text-[11px] text-neutral-500">
                        {row.cadence ? cadenceLabel(row.cadence) : ''}
                        {row.nextDueAt
                          ? ` · due ${row.nextDueAt}${isOverdue(row.nextDueAt) ? ' (overdue)' : ''}`
                          : ''}
                      </span>
                    </span>
                    <span className="truncate text-xs text-neutral-400">
                      {row.inspectedAt || '—'}
                    </span>
                    <span
                      className={cn(
                        'truncate text-xs',
                        row.projectNumber.trim() ? 'text-neutral-300' : 'text-neutral-600',
                      )}
                      title={row.projectNumber.trim() || undefined}
                    >
                      {row.projectNumber.trim() || '—'}
                    </span>
                    <span
                      className={cn(
                        'w-16 shrink-0 rounded-full px-2 py-0.5 text-center text-[10px]',
                        row.status === 'complete'
                          ? 'border border-emerald-500/30 text-emerald-300'
                          : 'border border-amber-500/30 text-amber-300',
                      )}
                    >
                      {row.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <ListPagination
              page={pagedInspections.page}
              totalPages={pagedInspections.totalPages}
              totalItems={pagedInspections.totalItems}
              startIndex={pagedInspections.startIndex}
              endIndex={pagedInspections.endIndex}
              onPageChange={setListPage}
              className="shrink-0"
            />
          </>
        )}
      </section>
    </div>
  );
}

function DetailField({
  label,
  value,
  lines = 1,
}: {
  label: string;
  value: string;
  /** Max visible rows before ellipsis (address uses 2). */
  lines?: 1 | 2;
}) {
  const trimmed = value.trim();
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd
        className={cn(
          'text-xs text-neutral-200',
          lines === 2 ? 'line-clamp-2 break-words whitespace-normal' : 'truncate',
          !trimmed && 'text-neutral-600',
        )}
        title={trimmed || undefined}
      >
        {trimmed || '—'}
      </dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="text-neutral-600">{label}</span>{' '}
      <span className="font-medium text-neutral-400">{value}</span>
    </span>
  );
}
