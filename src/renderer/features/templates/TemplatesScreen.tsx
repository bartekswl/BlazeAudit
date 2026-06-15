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
import type { Template, TemplateSummary } from '../../../shared/document';
import { cn } from '../../lib/cn';
import { TemplateEditor } from './TemplateEditor';

export type TemplateDetailBreadcrumb = {
  templateName: string;
  onBack: () => void;
};

export function TemplatesScreen({
  onDetailChange,
}: {
  onDetailChange?: (detail: TemplateDetailBreadcrumb | null) => void;
}) {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const goBackToList = useCallback(() => {
    setEditingId(null);
    setEditingTemplate(null);
  }, []);

  useEffect(() => {
    if (!onDetailChange) return;
    if (editingId && editingTemplate) {
      onDetailChange({ templateName: editingTemplate.name, onBack: goBackToList });
    } else if (editingId === 'new') {
      onDetailChange({ templateName: 'New template', onBack: goBackToList });
    } else {
      onDetailChange(null);
    }
  }, [editingId, editingTemplate, onDetailChange, goBackToList]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await window.blazeaudit.templates.list());
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
    void window.blazeaudit.templates.get(editingId).then((template) => {
      if (template) setEditingTemplate(template);
    });
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

  const importJson = async () => {
    setMessage(null);
    setError(null);
    try {
      const result = await window.blazeaudit.templates.importJson();
      if (result.imported) {
        setMessage(`Imported template from ${result.filePath}`);
        await refresh();
        setEditingId(result.templateId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.');
    }
  };

  if (editingId) {
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-400">
        Build reusable inspection definitions from typed blocks — tables, checklists, write-on
        lines, and more.
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
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading templates…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
          <LayoutTemplate className="mx-auto mb-3 size-8 text-neutral-600" />
          <p className="text-sm text-neutral-400">
            {search ? 'No templates match your search.' : 'No templates yet.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((template) => (
            <li
              key={template.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
            >
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
                    await window.blazeaudit.templates.duplicate(template.id);
                    await refresh();
                  }}
                  icon={Copy}
                />
                <IconButton
                  label="Export JSON"
                  onClick={async () => {
                    const result = await window.blazeaudit.templates.exportJson(template.id);
                    if (result.saved) setMessage(`Exported to ${result.filePath}`);
                  }}
                  icon={Download}
                />
                <IconButton
                  label="Delete"
                  danger
                  onClick={async () => {
                    if (!window.confirm(`Delete "${template.name}"? This cannot be undone.`)) {
                      return;
                    }
                    await window.blazeaudit.templates.remove(template.id);
                    await refresh();
                  }}
                  icon={Trash2}
                />
              </div>
            </li>
          ))}
        </ul>
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
