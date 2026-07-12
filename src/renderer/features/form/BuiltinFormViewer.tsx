import { useCallback, useMemo } from 'react';
import {
  buildFormOutline,
  createEmptyFormValues,
  scrollToFormSection,
  type BuiltinTemplate,
} from '../../../shared/form';
import { useRegisterFormOutline } from '../documents/DocumentOutlineContext';
import { FormPageCanvas } from './FormPageCanvas';
import { FormPageViewport } from './FormPageViewport';

export function BuiltinFormViewer({
  template,
}: {
  template: BuiltinTemplate;
}) {
  const formSections = useMemo(() => buildFormOutline(template.form), [template.form]);
  const pageCount = template.form.pages.length;
  const previewValues = useMemo(() => createEmptyFormValues(template.form), [template.form]);

  const handleOutlineNavigate = useCallback((sectionId: string, _pageIndex: number) => {
    window.requestAnimationFrame(() => scrollToFormSection(sectionId));
  }, []);

  useRegisterFormOutline(template.title || template.name, formSections, handleOutlineNavigate);

  if (pageCount === 0) {
    return <p className="text-sm text-[var(--ba-text-muted)]">This form has no pages.</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="shrink-0">
        <p className="text-xs text-[var(--ba-text-muted)]">
          Built-in form · v{template.version} · {pageCount} page
          {pageCount === 1 ? '' : 's'}
        </p>
        {template.description ? (
          <p className="mt-0.5 truncate text-sm text-[var(--ba-text-secondary)]">
            {template.description}
          </p>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <FormPageViewport pageIndex={0} totalPages={pageCount} continuous showZoomControls>
          <div className="form-page-stack">
            {template.form.pages.map((page, pageIndex) => (
              <FormPageCanvas
                key={page.id}
                form={template.form}
                page={page}
                pageIndex={pageIndex}
                template={template}
                values={previewValues}
                readOnly
              />
            ))}
          </div>
        </FormPageViewport>
      </div>
    </div>
  );
}
