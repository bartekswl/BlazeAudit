import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutTemplate, Search } from 'lucide-react';
import type { BuiltinTemplateSummary } from '../../../shared/document';
import type { BuiltinTemplate } from '../../../shared/form';
import { InlineLoader } from '../../components/LoadingOverlay';
import { ListPagination } from '../../components/ListPagination';
import { paginateItems } from '../../lib/pagination';
import { BuiltinFormViewer } from '../form/BuiltinFormViewer';

export type BuiltinTemplateDetailBreadcrumb = {
  templateName: string;
  onBack: () => void;
};

function builtinTemplateSubtitle(template: BuiltinTemplateSummary): string {
  const parts: string[] = [];
  if (template.code) parts.push(template.code);
  if (template.title) parts.push(template.title);
  parts.push(`${template.pageCount} page${template.pageCount === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

export function BuiltinTemplatesScreen({
  onDetailChange,
}: {
  onDetailChange?: (detail: BuiltinTemplateDetailBreadcrumb | null) => void;
}) {
  const [templates, setTemplates] = useState<BuiltinTemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<BuiltinTemplate | null>(null);
  const [listPage, setListPage] = useState(1);

  const goBackToList = useCallback(() => {
    setViewingId(null);
    setViewingTemplate(null);
  }, []);

  useEffect(() => {
    if (!onDetailChange) return;
    if (viewingId && viewingTemplate) {
      onDetailChange({ templateName: viewingTemplate.name, onBack: goBackToList });
    } else {
      onDetailChange(null);
    }
  }, [viewingId, viewingTemplate, onDetailChange, goBackToList]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await window.blazeaudit.templates.builtin.list());
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
    if (!viewingId) return;
    let cancelled = false;
    void window.blazeaudit.templates.builtin.get(viewingId).then((template) => {
      if (!cancelled) setViewingTemplate(template);
    });
    return () => {
      cancelled = true;
    };
  }, [viewingId]);

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

  if (viewingId) {
    if (!viewingTemplate) {
      return <InlineLoader label="Loading template…" />;
    }
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto">
        <BuiltinFormViewer template={viewingTemplate} />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <p className="shrink-0 text-sm text-neutral-400">
        Inspection definitions shipped with BlazeAudit. Use them as-is when creating documents.
      </p>

      {error && (
        <div className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500" />
          <input
            className="ba-search"
            placeholder="Search built-in templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <InlineLoader label="Loading templates…" />
      ) : filtered.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
          <LayoutTemplate className="mx-auto mb-3 size-8 text-neutral-600" />
          <p className="text-sm text-neutral-400">
            {search ? 'No templates match your search.' : 'No built-in templates found.'}
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {paged.items.map((template) => (
              <li key={template.id}>
                <button
                  type="button"
                  onClick={() => setViewingId(template.id)}
                  className="flex w-full flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-[var(--ba-text-primary)]">
                      {template.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--ba-text-muted)]">
                      {builtinTemplateSubtitle(template)}
                    </p>
                  </div>
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
            className="shrink-0"
          />
        </div>
      )}
    </div>
  );
}
