import { useCallback, useMemo, useState } from 'react';
import { buildFormOutline, scrollToFormSection, type BuiltinTemplate } from '../../../shared/form';
import { useRegisterFormOutline } from '../documents/DocumentOutlineContext';
import { FormPageCanvas } from './FormPageCanvas';
import { FormPageViewport } from './FormPageViewport';

export function BuiltinFormViewer({
  template,
  onBack,
}: {
  template: BuiltinTemplate;
  onBack: () => void;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const page = template.form.pages[pageIndex];
  const formSections = useMemo(() => buildFormOutline(template.form), [template.form]);

  const handleOutlineNavigate = useCallback((sectionId: string, targetPageIndex: number) => {
    setPageIndex(targetPageIndex);
    window.requestAnimationFrame(() => scrollToFormSection(sectionId));
  }, []);

  useRegisterFormOutline(template.title || template.name, formSections, handleOutlineNavigate);

  if (!page) {
    return <p className="text-sm text-[var(--ba-text-muted)]">This form has no pages.</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-[var(--ba-text-muted)]">
            Built-in form · v{template.version} · {template.form.pages.length} page
            {template.form.pages.length === 1 ? '' : 's'}
          </p>
          {template.description ? (
            <p className="mt-0.5 truncate text-sm text-[var(--ba-text-secondary)]">
              {template.description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-[var(--ba-panel-border)] px-3 py-2 text-sm text-[var(--ba-text-secondary)] hover:bg-[var(--ba-hover-bg)]"
        >
          Back
        </button>
      </div>

      {template.form.pages.length > 1 && (
        <div className="flex shrink-0 flex-wrap gap-1">
          {template.form.pages.map((p, index) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPageIndex(index)}
              className={
                index === pageIndex
                  ? 'rounded-lg bg-flame-500 px-3 py-1.5 text-xs font-semibold text-white'
                  : 'rounded-lg border border-[var(--ba-panel-border)] px-3 py-1.5 text-xs text-[var(--ba-text-muted)] hover:bg-[var(--ba-hover-bg)]'
              }
            >
              {p.label ?? `Page ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        <FormPageViewport
        pageIndex={pageIndex}
        totalPages={template.form.pages.length}
        onPageChange={template.form.pages.length > 1 ? setPageIndex : undefined}
      >
        <FormPageCanvas
          form={template.form}
          page={page}
          pageIndex={pageIndex}
          template={template}
          readOnly
        />
      </FormPageViewport>
      </div>
    </div>
  );
}
