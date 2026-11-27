import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Copy,
  Download,
  LayoutTemplate,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import type { CustomTemplateSummary, Template } from '../../../shared/document';
import { cn } from '../../lib/cn';
import { InlineLoader } from '../../components/LoadingOverlay';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ListPagination } from '../../components/ListPagination';
import { paginateItems } from '../../lib/pagination';
import { TemplateEditor } from './TemplateEditor';

export type CustomTemplateDetailBreadcrumb = {
  templateName: string;
  onBack: () => void;
};

export function CustomTemplatesScreen({
  onDetailChange,
}: {
  onDetailChange?: (detail: CustomTemplateDetailBreadcrumb | null) => void;
}) {
  const [templates, setTemplates] = useState<CustomTemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomTemplateSummary | null>(null);
  const [confirmDiscardBack, setConfirmDiscardBack] = useState(false);
  const [listPage, setListPage] = useState(1);

  const editorDirtyRef = useRef(false);

  const forceBackToList = useCallback(() => {
    editorDirtyRef.current = false;
    setConfirmDiscardBack(false);
    setEditingId(null);
    setEditingTemplate(null);
  }, []);

  const requestBackToList = useCallback(() => {
    if (editorDirtyRef.current) {
      setConfirmDiscardBack(true);
      return;
    }
    forceBackToList();
  }, [forceBackToList]);

  useEffect(() => {
    if (!onDetailChange) return;
    if (editingId === 'new') {
      onDetailChange({ templateName: 'New Custom Template', onBack: requestBackToList });
    } else if (editingId && editingTemplate) {
      onDetailChange({ templateName: editingTemplate.name, onBack: requestBackToList });
    } else {
      onDetailChange(null);
    }
  }, [editingId, editingTemplate, onDetailChange, requestBackToList]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await window.blazeaudit.templates.custom.list());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!editingId || editingId === 'new') return;
    let cancelled = false;
    void window.blazeaudit.templates.custom.get(editingId).then((template) => {
      if (!cancelled && template) setEditingTemplate(template);
    });
    return () => {
      cancelled = true;
    };
  }, [editingId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    );
  }, [templates, search]);

  useEffect(() => {
    setListPage(1);
  }, [search]);

  const paged = useMemo(() => paginateItems(filtered, listPage), [filtered, listPage]);

  const importJson = async () => {
    setMessage(null);
    setError(null);
    try {
      const result = await window.blazeaudit.templates.custom.importJson();
      if (result.imported) {
        setMessage(`Imported template from ${result.filePath}`);
        await refresh();
        editorDirtyRef.current = false;
        setEditingTemplate(null);
        setEditingId(result.templateId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.');
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await window.blazeaudit.templates.custom.remove(pendingDelete.id);
    setPendingDelete(null);
    await refresh();
  };

  const openEditor = (id: string | 'new') => {
    setMessage(null);
    setError(null);
    editorDirtyRef.current = false;
    setEditingTemplate(null);
    setEditingId(id);
  };

  if (editingId) {
    if (editingId !== 'new' && !editingTemplate) {
      return <InlineLoader label="Loading template…" />;
    }
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <TemplateEditor
          key={editingId === 'new' ? 'new' : editingTemplate?.id ?? editingId}
          templateId={editingId === 'new' ? null : editingId}
          initial={editingId === 'new' ? undefined : editingTemplate ?? undefined}
          onCancel={requestBackToList}
          onDirtyChange={(dirty) => {
            editorDirtyRef.current = dirty;
          }}
          onSaved={async (saved) => {
            editorDirtyRef.current = false;
            setEditingTemplate(saved);
            setEditingId(saved.id);
            await refresh();
          }}
        />

        {confirmDiscardBack && (
          <ConfirmDialog
            title="Discard unsaved changes?"
            icon={AlertTriangle}
            confirmLabel="Discard changes"
            cancelLabel="Keep editing"
            onCancel={() => setConfirmDiscardBack(false)}
            onConfirm={forceBackToList}
          >
            <p>You have unsaved edits on your custom A4 template.</p>
            <p>Leaving now will discard changes made since your last save.</p>
          </ConfirmDialog>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <p className="shrink-0 text-sm text-[var(--ba-text-muted)]">
        Design custom A4 inspection forms on a printable dot grid — checklists, equipment tables,
        notes, and sign-off blocks.
      </p>

      {message && (
        <div className="shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {message}
        </div>
      )}
      {error && (
        <div className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--ba-text-faint)]" />
          <input
            className="ba-search"
            placeholder="Search custom templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => openEditor('new')}
          className="inline-flex items-center gap-2 rounded-lg bg-flame-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-flame-600"
        >
          <Plus className="size-4" />
          New template
        </button>
        <button
          type="button"
          onClick={() => void importJson()}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--ba-panel-border)] px-3 py-2 text-sm text-[var(--ba-text-secondary)] transition-colors hover:bg-[var(--ba-hover-bg)]"
        >
          <Upload className="size-4" />
          Import JSON
        </button>
      </div>

      {loading ? (
        <InlineLoader label="Loading templates…" />
      ) : filtered.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--ba-panel-border)] px-6 py-12 text-center">
          <LayoutTemplate className="mx-auto mb-3 size-8 text-[var(--ba-text-faint)]" />
          <p className="text-sm font-medium text-[var(--ba-text-secondary)]">
            {search ? 'No templates match your search.' : 'No custom templates yet.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => openEditor('new')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-flame-500/40 bg-flame-500/15 px-3 py-1.5 text-xs font-semibold text-flame-400 transition-colors hover:bg-flame-500/25"
            >
              <Plus className="size-3.5" />
              Create your first A4 template
            </button>
          )}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {paged.items.map((template) => (
              <li key={template.id}>
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--ba-panel-border)] bg-[var(--ba-panel-bg)] px-4 py-3 transition-colors hover:border-flame-500/30">
                  <button
                    type="button"
                    onClick={() => openEditor(template.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-base font-semibold text-[var(--ba-text-primary)]">
                      {template.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--ba-text-muted)]">
                      {template.description || 'Custom A4 inspection template'} · v{template.version}
                    </p>
                  </button>
                  <div className="flex flex-wrap gap-1">
                    <IconButton
                      label="Edit in A4 Studio"
                      onClick={() => openEditor(template.id)}
                      icon={Pencil}
                    />
                    <IconButton
                      label="Duplicate"
                      onClick={async () => {
                        await window.blazeaudit.templates.custom.duplicate(template.id);
                        await refresh();
                      }}
                      icon={Copy}
                    />
                    <IconButton
                      label="Export JSON"
                      onClick={async () => {
                        const result = await window.blazeaudit.templates.custom.exportJson(
                          template.id,
                        );
                        if (result.saved) setMessage(`Exported to ${result.filePath}`);
                      }}
                      icon={Download}
                    />
                    <IconButton
                      label="Delete"
                      danger
                      onClick={() => setPendingDelete(template)}
                      icon={Trash2}
                    />
                  </div>
                </div>
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
            className="shrink-0"
          />
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete template?"
          icon={Trash2}
          confirmLabel="Delete"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void confirmDelete()}
        >
          <p>
            <span className="font-medium text-[var(--ba-text-primary)]">{pendingDelete.name}</span>{' '}
            will be permanently deleted.
          </p>
          <p>This cannot be undone.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}

function IconButton({
  label,
  icon: Icon,
  onClick,
  danger,
}: {
  label: string;
  icon: typeof Pencil;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={() => void onClick()}
      className={cn(
        'rounded-lg border border-[var(--ba-panel-border)] p-2 text-[var(--ba-text-muted)] transition-colors hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)]',
        danger && 'hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400',
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
