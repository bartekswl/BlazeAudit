import type { DocumentContext } from '../../../shared/document';
import {
  FORM_FOOTER_HEIGHT_PERCENT,
  formSectionAnchorId,
  pageBodyPercent,
  resolveFormBinding,
  type BuiltinTemplate,
  type FormDefinition,
  type FormPage,
} from '../../../shared/form';
import { cn } from '../../lib/cn';
import { FormElementView } from './FormElementView';

export function FormPageCanvas({
  form,
  page,
  pageIndex,
  template,
  context,
  values,
  readOnly,
  onValueChange,
}: {
  form: FormDefinition;
  page: FormPage;
  pageIndex: number;
  template?: Pick<BuiltinTemplate, 'code' | 'title' | 'name'>;
  context?: DocumentContext | null;
  values?: Record<string, unknown>;
  readOnly?: boolean;
  onValueChange?: (elementId: string, value: unknown) => void;
}) {
  const bodyPercent = pageBodyPercent(page);
  const totalPages = form.pages.length;

  return (
    <div className="form-page-sheet">
      <div className="form-page-body" style={{ height: `${bodyPercent}%` }}>
        {page.regions.length > 0 && (
          <div className="form-page-header">
            {page.regions.map((region) => {
              if (region.content.kind === 'spacer') {
                return (
                  <div
                    key={region.id}
                    className="shrink-0"
                    style={{ height: `${region.heightPercent}%` }}
                  />
                );
              }
              const text = resolveFormBinding(region.content.binding, context ?? null, template);
              return (
                <div
                  key={region.id}
                  className={cn(
                    'form-page-header-line font-semibold text-[var(--ba-text-primary)]',
                    region.content.align === 'center' && 'text-center',
                    region.content.align === 'right' && 'text-right',
                  )}
                >
                  {text || (
                    <span className="text-[var(--ba-text-muted)]">{region.content.binding}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="form-page-content">
          {page.sections.map((section) => (
            <section
              key={section.id}
              id={formSectionAnchorId(section.id)}
              className="form-page-section scroll-mt-3"
              style={
                section.heightPercent
                  ? { minHeight: `${section.heightPercent}%` }
                  : undefined
              }
            >
              <h3 className="form-page-section-title">
                {section.number}
                {section.title ? `. ${section.title}` : ''}
              </h3>
              <div className="space-y-3">
                {section.elements.map((element) => (
                  <FormElementView
                    key={element.id}
                    element={element}
                    value={values?.[element.id]}
                    readOnly={readOnly}
                    bindingText={
                      element.kind === 'text' && element.binding
                        ? resolveFormBinding(element.binding, context ?? null, template)
                        : undefined
                    }
                    onChange={
                      onValueChange
                        ? (next) => onValueChange(element.id, next)
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <footer
        className="form-page-footer"
        style={{ height: `${FORM_FOOTER_HEIGHT_PERCENT}%` }}
      >
        <div className="form-page-footer-count">
          Page {pageIndex + 1} of {totalPages}
        </div>
        <p className="form-page-footer-disclaimer">{form.disclaimer}</p>
      </footer>
    </div>
  );
}
