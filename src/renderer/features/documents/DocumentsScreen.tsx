import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Plus, Search, Trash2 } from 'lucide-react';
import { cadenceLabel, isOverdue } from '../../../shared/cadence';
import type { Inspection, InspectionSummary } from '../../../shared/inspection';
import type { Client } from '../../../shared/types';
import type { TemplatePickerItem } from '../../../shared/document';
import { cn } from '../../lib/cn';
import { InlineLoader } from '../../components/LoadingOverlay';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ListPagination } from '../../components/ListPagination';
import { paginateItems } from '../../lib/pagination';

const InspectionEditor = lazy(() =>
  import('./InspectionEditor').then((module) => ({ default: module.InspectionEditor })),
);
const NewInspectionDialog = lazy(() =>
  import('./NewInspectionDialog').then((module) => ({ default: module.NewInspectionDialog })),
);

export type DocumentDetailBreadcrumb = {
  documentTitle: string;
  onBack: () => void;
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
  const [listPage, setListPage] = useState(1);
  const [showNew, setShowNew] = useState(false);
  const [newClientId, setNewClientId] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  const [pendingDelete, setPendingDelete] = useState<InspectionSummary | null>(null);

  const goBackToList = useCallback(() => {
    setEditingId(null);
    setEditingInspection(null);
  }, []);

  useEffect(() => {
    if (!onDetailChange) return;
    if (editingId && editingInspection) {
      onDetailChange({ documentTitle: editingInspection.title, onBack: goBackToList });
    } else {
      onDetailChange(null);
    }
  }, [editingId, editingInspection, onDetailChange, goBackToList]);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inspections.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.title.toLowerCase().includes(q) ||
        row.clientName.toLowerCase().includes(q) ||
        row.inspector.toLowerCase().includes(q)
      );
    });
  }, [inspections, search, statusFilter]);

  useEffect(() => {
    setListPage(1);
  }, [search, statusFilter]);

  const paged = useMemo(
    () => paginateItems(filtered, listPage),
    [filtered, listPage],
  );

  const createInspection = async (input: {
    clientId: string;
    templateKind: 'builtin' | 'custom';
    templateId: string;
    inspectedAt: string;
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
        <InspectionEditor
          inspection={editingInspection}
          onBack={goBackToList}
          onSaved={(saved) => {
            setEditingInspection(saved);
            void refresh();
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-400">
        All inspections live here — drafts and completed reports attached to clients.
      </p>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500" />
          <input
            className="ba-search"
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="ba-select w-auto rounded-lg px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="draft">Drafts</option>
          <option value="complete">Complete</option>
        </select>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-flame-500 px-3 py-2 text-sm font-semibold text-white hover:bg-flame-600"
        >
          <Plus className="size-4" />
          New inspection
        </button>
      </div>

      {loading ? (
        <InlineLoader label="Loading documents…" />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
          <FileText className="mx-auto mb-3 size-8 text-neutral-600" />
          <p className="text-sm text-neutral-400">
            {search || statusFilter !== 'all' ? 'No documents match your filters.' : 'No inspections yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2">
            {paged.items.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
            >
              <button
                type="button"
                onClick={() => setEditingId(row.id)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate font-medium text-neutral-100">{row.title}</p>
                <p className="truncate text-xs text-neutral-500">
                  {row.clientName}
                  {row.inspectedAt ? ` · ${row.inspectedAt}` : ''}
                  {row.inspector ? ` · ${row.inspector}` : ''}
                  {row.nextDueAt
                    ? ` · Next due ${row.nextDueAt}${isOverdue(row.nextDueAt) ? ' (overdue)' : ''}`
                    : ''}
                  {row.cadence ? ` · ${cadenceLabel(row.cadence)}` : ''}
                </p>
              </button>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs',
                  row.status === 'complete'
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border border-amber-500/30 bg-amber-500/10 text-amber-300',
                )}
              >
                {row.status}
              </span>
              <button
                type="button"
                aria-label={`Delete ${row.title}`}
                onClick={() => setPendingDelete(row)}
                className="rounded-lg border border-white/10 p-2 text-neutral-500 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
            ))}
          </ul>
          <ListPagination
            page={paged.page}
            totalPages={paged.totalPages}
            totalItems={paged.totalItems}
            startIndex={paged.startIndex}
            endIndex={paged.endIndex}
            onPageChange={setListPage}
          />
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
    </div>
  );
}
