import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp,
  FileText,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { cadenceLabel, isOverdue } from '../../../shared/cadence';
import { formatDateTimeCompact, formatDateTimeListParts } from '../../../shared/dates';
import {
  shortInspectionDisplayName,
  sortInspectionsByDate,
  type Inspection,
  type InspectionSummary,
} from '../../../shared/inspection';
import type { Client } from '../../../shared/types';
import type { TemplatePickerItem } from '../../../shared/document';
import { cn } from '../../lib/cn';
import { InlineLoader } from '../../components/LoadingOverlay';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ListPagination } from '../../components/ListPagination';
import { paginateItems } from '../../lib/pagination';
import { useInspectionPdfImport } from './useInspectionPdfImport';

const filterInputCls =
  'rounded-md border border-white/10 bg-neutral-950/60 text-[11px] text-neutral-300 placeholder:text-neutral-600 focus:border-flame-500/40 focus:outline-none';

/**
 * Shared track sizes for header + rows (must match exactly).
 * Modified + delete share the last track so they stay close; fixed cols are centered.
 */
const docRowGrid =
  'grid-cols-[minmax(0,1fr)_5.5rem_5.5rem_3.75rem_auto] gap-x-3';

const docMetaTailCls = 'flex items-center justify-end gap-1.5';
const docModifiedColCls = 'w-[4.75rem] shrink-0 text-center';
const docDeleteColCls = 'grid w-7 shrink-0 place-items-center';

const InspectionEditor = lazy(() =>
  import('./InspectionEditor').then((module) => ({ default: module.InspectionEditor })),
);
const NewInspectionDialog = lazy(() =>
  import('./NewInspectionDialog').then((module) => ({ default: module.NewInspectionDialog })),
);

export type DocumentDetailBreadcrumb = {
  documentTitle: string;
  onBack: () => void;
  metaPinned?: boolean;
  onToggleMetaPin?: () => void;
};

export type DocumentsBootState = {
  openNew?: boolean;
  clientId?: string;
  inspectionId?: string;
};

export function DocumentsScreen({
  boot,
  onBootConsumed,
  onDetailChange,
}: {
  boot?: DocumentsBootState | null;
  onBootConsumed?: () => void;
  onDetailChange?: (detail: DocumentDetailBreadcrumb | null) => void;
}) {
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<TemplatePickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'complete'>('all');
  const [yearFilter, setYearFilter] = useState<'all' | string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
  const [listPage, setListPage] = useState(1);
  const [showNew, setShowNew] = useState(false);
  const [newClientId, setNewClientId] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  const [pendingDelete, setPendingDelete] = useState<InspectionSummary | null>(null);
  const [metaPinned, setMetaPinned] = useState(true);
  const toggleMetaPin = useCallback(() => setMetaPinned((v) => !v), []);

  const goBackToList = useCallback(() => {
    setEditingId(null);
    setEditingInspection(null);
  }, []);

  useEffect(() => {
    if (!onDetailChange) return;
    if (editingId && editingInspection) {
      onDetailChange({
        documentTitle: shortInspectionDisplayName(
          editingInspection.title,
          editingInspection.clientName,
        ),
        onBack: goBackToList,
        metaPinned,
        onToggleMetaPin: toggleMetaPin,
      });
    } else {
      onDetailChange(null);
    }
  }, [editingId, editingInspection, onDetailChange, goBackToList, metaPinned, toggleMetaPin]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [inspectionRows, clientRows, templateRows] = await Promise.all([
        window.blazeaudit.inspections.list(),
        window.blazeaudit.clients.list(),
        window.blazeaudit.templates.listForPicker(),
      ]);
      setInspections(inspectionRows);
      setClients(clientRows);
      setTemplates(templateRows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  const { startPdfImport, importingPdf, pdfImportDialogs } = useInspectionPdfImport({
    onImported: async (result) => {
      setEditingId(result.inspectionId);
      await refresh();
    },
    onError: (message) => setError(message),
  });

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!boot) return;
    if (boot.openNew) {
      setShowNew(true);
      if (boot.clientId) setNewClientId(boot.clientId);
    }
    if (boot.inspectionId) setEditingId(boot.inspectionId);
    onBootConsumed?.();
  }, [boot, onBootConsumed]);

  useEffect(() => {
    if (!editingId) return;
    void window.blazeaudit.inspections.get(editingId).then((row) => {
      if (row) setEditingInspection(row);
    });
  }, [editingId]);

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    const current = new Date().getFullYear();
    years.add(current);
    for (const row of inspections) {
      const raw = row.inspectedAt?.trim();
      if (!raw || raw.length < 4) continue;
      const y = Number.parseInt(raw.slice(0, 4), 10);
      if (!Number.isNaN(y) && y >= 1990 && y <= current + 1) years.add(y);
    }
    return [...years].sort((a, b) => b - a);
  }, [inspections]);

  const hasActiveFilters = Boolean(
    search || statusFilter !== 'all' || yearFilter !== 'all' || dateFrom || dateTo,
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = inspections.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (yearFilter !== 'all') {
        if (!row.inspectedAt?.startsWith(yearFilter)) return false;
      }
      if (q) {
        const matches =
          row.title.toLowerCase().includes(q) ||
          row.clientName.toLowerCase().includes(q) ||
          row.inspector.toLowerCase().includes(q) ||
          row.projectNumber.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (dateFrom && (!row.inspectedAt || row.inspectedAt < dateFrom)) return false;
      if (dateTo && (!row.inspectedAt || row.inspectedAt > dateTo)) return false;
      return true;
    });
    return sortInspectionsByDate(rows, dateSort);
  }, [inspections, search, statusFilter, yearFilter, dateFrom, dateTo, dateSort]);

  useEffect(() => {
    setListPage(1);
  }, [search, statusFilter, yearFilter, dateFrom, dateTo, dateSort]);

  const paged = useMemo(() => paginateItems(filtered, listPage), [filtered, listPage]);

  const createInspection = async (input: {
    clientId: string;
    templateKind: 'builtin' | 'custom';
    templateId: string;
    inspectedAt: string;
    projectNumber: string;
  }) => {
    const created = await window.blazeaudit.inspections.create({
      ...input,
      inspector: '',
      cadence: 'annual',
    });
    setShowNew(false);
    setEditingId(created.id);
    setEditingInspection(created);
    await refresh();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await window.blazeaudit.inspections.remove(pendingDelete.id);
    setPendingDelete(null);
    await refresh();
  };

  if (editingId) {
    if (!editingInspection) {
      return <InlineLoader label="Loading inspection…" />;
    }
    return (
      <Suspense fallback={<InlineLoader label="Loading inspection editor…" />}>
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <InspectionEditor
            inspection={editingInspection}
            onBack={goBackToList}
            metaPinned={metaPinned}
            onToggleMetaPin={toggleMetaPin}
            onSaved={(saved) => {
              setEditingId(saved.id);
              setEditingInspection(saved);
              void refresh();
            }}
          />
        </div>
      </Suspense>
    );
  }

  const hasAnyInspections = inspections.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <p className="min-w-0 text-sm text-neutral-400">
          All inspections live here — drafts and completed reports attached to clients.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={importingPdf}
            onClick={() => {
              setError(null);
              void startPdfImport();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-flame-500/40 bg-flame-500/10 px-3 py-2 text-sm font-semibold text-flame-300 hover:bg-flame-500/20 disabled:opacity-50"
          >
            <Upload className="size-4" />
            {importingPdf ? 'Importing…' : 'Import Document'}
          </button>
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-flame-500 px-3 py-2 text-sm font-semibold text-white hover:bg-flame-600"
          >
            <Plus className="size-4" />
            New inspection
          </button>
        </div>
      </div>

      {error && (
        <div className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <InlineLoader label="Loading documents…" />
      ) : !hasAnyInspections ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
          <FileText className="mx-auto mb-3 size-8 text-neutral-600" />
          <p className="text-sm text-neutral-400">No inspections yet.</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <div className="relative w-44">
              <Search className="pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, client, Project #"
                className={cn(filterInputCls, 'w-full py-1 pl-6 pr-2')}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className={cn(filterInputCls, 'px-1.5 py-1')}
            >
              <option value="all">All statuses</option>
              <option value="draft">Drafts</option>
              <option value="complete">Complete</option>
            </select>
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
                  setSearch('');
                  setStatusFilter('all');
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
              className="ml-auto inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
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

          {filtered.length === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
              <FileText className="mx-auto mb-3 size-8 text-neutral-600" />
              <p className="text-sm text-neutral-400">No documents match your filters.</p>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  'grid shrink-0 px-4 text-[10px] font-medium uppercase tracking-wide text-neutral-600',
                  docRowGrid,
                )}
              >
                <span>Name</span>
                <span className="text-center">Project #</span>
                <span className="text-center">Date</span>
                <span className="text-center">Status</span>
                <div className={docMetaTailCls}>
                  <span className={docModifiedColCls}>Modified</span>
                  <span className={docDeleteColCls} aria-hidden="true" />
                </div>
              </div>
              <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                {paged.items.map((row) => {
                  const displayName = shortInspectionDisplayName(row.title, row.clientName);
                  const modified = formatDateTimeListParts(row.updatedAt);
                  const meta = [
                    row.clientName,
                    row.inspector ? row.inspector : '',
                    row.nextDueAt
                      ? `due ${row.nextDueAt}${isOverdue(row.nextDueAt) ? ' (overdue)' : ''}`
                      : '',
                    row.cadence ? cadenceLabel(row.cadence) : '',
                  ]
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <li
                      key={row.id}
                      className={cn(
                        'grid items-center rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5',
                        docRowGrid,
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setEditingId(row.id)}
                        className="min-w-0 text-left"
                        title={[displayName, row.templateName, meta].filter(Boolean).join('\n')}
                      >
                        <p className="line-clamp-2 text-sm font-medium leading-tight text-neutral-100">
                          {displayName}
                        </p>
                        {row.templateName ? (
                          <p className="truncate text-[10px] leading-tight text-neutral-500">
                            {row.templateName}
                          </p>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(row.id)}
                        className={cn(
                          'min-w-0 truncate text-center text-xs leading-tight',
                          row.projectNumber.trim() ? 'text-neutral-300' : 'text-neutral-600',
                        )}
                        title={row.projectNumber.trim() || undefined}
                      >
                        {row.projectNumber.trim() || '—'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(row.id)}
                        className="min-w-0 truncate text-center text-xs leading-tight text-neutral-400"
                      >
                        {row.inspectedAt || '—'}
                      </button>
                      <span
                        className={cn(
                          'justify-self-center rounded-full px-1.5 py-0.5 text-center text-[9px] leading-none capitalize',
                          row.status === 'complete'
                            ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border border-amber-500/30 bg-amber-500/10 text-amber-300',
                        )}
                      >
                        {row.status}
                      </span>
                      <div className={docMetaTailCls}>
                        <button
                          type="button"
                          onClick={() => setEditingId(row.id)}
                          className={cn(
                            docModifiedColCls,
                            'text-[10px] leading-tight text-neutral-500',
                          )}
                          title={formatDateTimeCompact(row.updatedAt)}
                        >
                          <span className="block truncate">{modified.date}</span>
                          {modified.time ? (
                            <span className="block truncate">{modified.time}</span>
                          ) : null}
                        </button>
                        <div className={docDeleteColCls}>
                          <button
                            type="button"
                            aria-label={`Delete ${row.title}`}
                            onClick={() => setPendingDelete(row)}
                            className="rounded-lg border border-white/10 p-1.5 text-neutral-500 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <ListPagination
                page={paged.page}
                totalPages={paged.totalPages}
                totalItems={paged.totalItems}
                startIndex={paged.startIndex}
                endIndex={paged.endIndex}
                onPageChange={setListPage}
                className="shrink-0"
              />
            </>
          )}
        </div>
      )}

      {showNew && (
        <Suspense fallback={<InlineLoader label="Preparing new inspection…" />}>
          <NewInspectionDialog
            clients={clients}
            templates={templates}
            initialClientId={newClientId}
            onClose={() => setShowNew(false)}
            onCreate={createInspection}
          />
        </Suspense>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete document?"
          icon={Trash2}
          confirmLabel="Delete"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void confirmDelete()}
        >
          <p>
            <span className="font-medium text-[var(--ba-text-primary)]">{pendingDelete.title}</span>{' '}
            will be permanently deleted.
          </p>
          <p>This cannot be undone.</p>
        </ConfirmDialog>
      )}

      {pdfImportDialogs}
    </div>
  );
}
