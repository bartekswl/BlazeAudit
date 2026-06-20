import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Download,
  LayoutTemplate,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import type {
  BuiltinTemplateSummary,
  CustomTemplateSummary,
  Template,
} from '../../../shared/document';
import type { BuiltinTemplate } from '../../../shared/form';
import { cn } from '../../lib/cn';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { BuiltinTemplateViewer } from './BuiltinTemplateViewer';
import { TemplateEditor } from './TemplateEditor';

export type TemplateDetailBreadcrumb = {
  templateName: string;
  onBack: () => void;
};

export type TemplatesScreenVariant = 'built-in' | 'custom';

type TemplateSummary = BuiltinTemplateSummary | CustomTemplateSummary;

export function TemplatesScreen({
  variant,
  onDetailChange,
}: {
  variant: TemplatesScreenVariant;
  onDetailChange?: (detail: TemplateDetailBreadcrumb | null) => void;
}) {
  const isCustom = variant === 'custom';
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<BuiltinTemplate | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomTemplateSummary | null>(null);

  const goBackToList = useCallback(() => {
    setViewingId(null);
    setViewingTemplate(null);
    setEditingId(null);
    setEditingTemplate(null);
  }, []);

  useEffect(() => {
    if (!onDetailChange) return;
    if (isCustom) {
      if (editingId && editingTemplate) {
        onDetailChange({ templateName: editingTemplate.name, onBack: goBackToList });
      } else if (editingId === 'new') {
        onDetailChange({ templateName: 'New template', onBack: goBackToList });
      } else {
        onDetailChange(null);
      }
      return;
    }
    if (viewingId && viewingTemplate) {
      onDetailChange({ templateName: viewingTemplate.name, onBack: goBackToList });
    } else {
      onDetailChange(null);
    }
  }, [
    isCustom,
    editingId,
    editingTemplate,
    viewingId,
    viewingTemplate,
    onDetailChange,
    goBackToList,
  ]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(
        isCustom
          ? await window.blazeaudit.templates.custom.list()
          : await window.blazeaudit.templates.builtin.list(),
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  }, [isCustom]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (isCustom) {
      if (!editingId || editingId === 'new') return;
      void window.blazeaudit.templates.custom.get(editingId).then((template) => {
        if (template) setEditingTemplate(template);
      });
      return;
    }
    if (!viewingId) return;
    void window.blazeaudit.templates.builtin.get(viewingId).then((template) => {
      setViewingTemplate(template);
    });
  }, [isCustom, editingId, viewingId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    );
  }, [templates, search]);

  const importJson = async () => {
    setMessage(null);
    setError(null);
    try {
      const result = await window.blazeaudit.templates.custom.importJson();
      if (result.imported) {
        setMessage(`Imported template from ${result.filePath}`);
        await refresh();
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

  if (isCustom && editingId) {
    if (editingId !== 'new' && !editingTemplate) {
      return <p className="text-sm text-neutral-500">Loading template…</p>;
    }
    return (
      <TemplateEditor
        templateId={editingId === 'new' ? null : editingId}
        initial={editingId === 'new' ? undefined : editingTemplate ?? undefined}
        onCancel={goBackToList}
        onSaved={async (saved) => {
          setEditingTemplate(saved);
          setEditingId(saved.id);
          setMessage('Template saved.');
          await refresh();
        }}
      />
    );
  }

  if (!isCustom && viewingId) {
    if (!viewingTemplate) {
      return <p className="text-sm text-neutral-500">Loading template…</p>;
    }
    return <BuiltinTemplateViewer template={viewingTemplate} onBack={goBackToList} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-400">
        {isCustom
          ? 'Your own templates — create, import, edit, duplicate, export, or remove.'
          : 'Inspection definitions shipped with BlazeAudit. Use them as-is when creating documents.'}
      </p>

      {message && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </div>
      )}
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
            placeholder={
              isCustom ? 'Search custom templates…' : 'Search built-in templates…'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isCustom && (
          <>
            <button
              type="button"
              onClick={() => setEditingId('new')}
              className="inline-flex items-center gap-2 rounded-lg bg-flame-500 px-3 py-2 text-sm font-semibold text-white hover:bg-flame-600"
            >
              <Plus className="size-4" />
              New template
            </button>
            <button
              type="button"
              onClick={() => void importJson()}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 hover:bg-white/5"
            >
              <Upload className="size-4" />
              Import JSON
            </button>
          </>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading templates…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
          <LayoutTemplate className="mx-auto mb-3 size-8 text-neutral-600" />
          <p className="text-sm text-neutral-400">
            {search
              ? 'No templates match your search.'
              : isCustom
                ? 'No custom templates yet.'
                : 'No built-in templates found.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((template) => (
            <li key={template.id}>
              {isCustom ? (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-neutral-100">{template.name}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {template.description || 'No description'} · {template.blockCount} block
                      {template.blockCount === 1 ? '' : 's'} · v{template.version}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <IconButton
                      label="Edit"
                      onClick={() => setEditingId(template.id)}
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
                      onClick={() => setPendingDelete(template as CustomTemplateSummary)}
                      icon={Trash2}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setViewingId(template.id)}
                  className="flex w-full flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-neutral-100">{template.name}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {'code' in template && template.code ? `${template.code} · ` : ''}
                      {template.description || 'No description'}
                      {'pageCount' in template && template.pageCount
                        ? ` · ${template.pageCount} page${template.pageCount === 1 ? '' : 's'}`
                        : ''}
                      {' · '}
                      {template.blockCount} element
                      {template.blockCount === 1 ? '' : 's'} · v{template.version}
                    </p>
                  </div>
                </button>
              )}
            </li>
          ))}
        </ul>
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
        'rounded-lg border border-white/10 p-2 text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100',
        danger && 'hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300',
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
