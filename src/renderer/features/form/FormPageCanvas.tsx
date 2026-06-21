import type { DocumentContext } from '../../../shared/document';
import {
  FORM_FOOTER_HEIGHT_PERCENT,
  formSectionAnchorId,
  formSectionHeading,
  pageBodyPercent,
  resolveFormBinding,
  type BuiltinTemplate,
  type FormDefinition,
  type FormPage,
} from '../../../shared/form';
import { cn } from '../../lib/cn';
import { FormPageMetaHeader } from './FormPageMetaHeader';
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
  fixedPageLayout = false,
}: {
  form: FormDefinition;
  page: FormPage;
  pageIndex: number;
  template?: Pick<BuiltinTemplate, 'code' | 'title' | 'name'>;
  context?: DocumentContext | null;
  values?: Record<string, unknown>;
  readOnly?: boolean;
  onValueChange?: (elementId: string, value: unknown) => void;
  /** True for PDF export — A4 percent heights. False for screen — sheet hugs content. */
  fixedPageLayout?: boolean;
}) {
  const bodyPercent = pageBodyPercent(page);
  const totalPages = form.pages.length;
  const isLandscape = page.orientation === 'landscape';
  const useMetaHeader = page.header === 'codeNameMeta';

  return (
    <div
      data-form-page-index={pageIndex}
      className={cn(
        'form-page-sheet',
        isLandscape && 'form-page-sheet--landscape',
        fixedPageLayout && 'form-page-sheet--fixed',
      )}
    >
      <div
        className="form-page-body"
        style={fixedPageLayout ? { minHeight: `${bodyPercent}%` } : undefined}
      >
        {useMetaHeader ? (
          <FormPageMetaHeader context={context} template={template} />
        ) : (
          page.regions.length > 0 && (
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
          )
        )}

        <div className={cn('form-page-content', isLandscape && 'form-page-content--landscape')}>
          {page.sections.map((section) => {
            const heading = formSectionHeading(section);
            const isUlcSection =
              section.elements.length === 1 && section.elements[0]?.kind === 'ulcSection1';
            return (
            <section
              key={section.id}
              id={formSectionAnchorId(section.id)}
              className={cn(
                'form-page-section scroll-mt-3',
                isUlcSection && 'flex flex-col',
              )}
              style={
                fixedPageLayout && section.heightPercent
                  ? isUlcSection
                    ? { minHeight: `${section.heightPercent}%` }
                    : { minHeight: `${section.heightPercent}%` }
                  : undefined
              }
            >
              {heading && (
                <h3 className="form-page-section-title">{heading}</h3>
              )}
              <div className={cn(isUlcSection ? 'flex flex-col' : 'space-y-3')}>
                {section.elements.map((element) => (
                  <FormElementView
                    key={element.id}
                    element={element}
                    value={values?.[element.id]}
                    readOnly={readOnly}
                    context={context ?? null}
                    totalPages={totalPages}
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
            );
          })}
        </div>
      </div>

      <footer
        className="form-page-footer"
        style={fixedPageLayout ? { height: `${FORM_FOOTER_HEIGHT_PERCENT}%` } : undefined}
      >
        <div className="form-page-footer-count">
          Page {pageIndex + 1} of {totalPages}
        </div>
        <p className="form-page-footer-disclaimer">{form.disclaimer}</p>
      </footer>
    </div>
  );
}
