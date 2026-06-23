import { Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import type { DocumentContext } from '../../../shared/document';
import type { BuiltinTemplate, FormDefinition, FormPage } from '../../../shared/form';
import { FormPageCanvas } from './FormPageCanvas';

function pageHasLinedNotes(page: FormPage): boolean {
  return page.sections.some((section) =>
    section.elements.some(
      (element) => element.kind === 'recommendations' || element.kind === 'testingNotes',
    ),
  );
}

export async function measureLinedNotesPdfRowHeights({
  form,
  values,
  context,
  template,
  linedNotesVisibleLines,
  printCss,
}: {
  form: FormDefinition;
  values: Record<string, unknown>;
  context: DocumentContext | null;
  template?: Pick<BuiltinTemplate, 'code' | 'title' | 'name'>;
  linedNotesVisibleLines?: Record<string, number>;
  printCss: string;
}): Promise<Record<string, number>> {
  if (!linedNotesVisibleLines || Object.keys(linedNotesVisibleLines).length === 0) {
    return {};
  }

  const host = document.createElement('div');
  host.className = 'form-print-root';
  host.setAttribute('data-theme', 'light');
  Object.assign(host.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: '210mm',
    visibility: 'hidden',
    pointerEvents: 'none',
  });

  const style = document.createElement('style');
  style.textContent = printCss;
  host.appendChild(style);

  const mount = document.createElement('div');
  host.appendChild(mount);
  document.body.appendChild(host);

  const root = createRoot(mount);
  const pages = form.pages
    .map((page, pageIndex) => ({ page, pageIndex }))
    .filter(({ page }) => pageHasLinedNotes(page));

  try {
    flushSync(() => {
      root.render(
        <Fragment>
          {pages.map(({ page, pageIndex }) => (
            <FormPageCanvas
              key={page.id}
              form={form}
              page={page}
              pageIndex={pageIndex}
              template={template}
              context={context}
              values={values}
              readOnly
              fixedPageLayout
              linedNotesVisibleLines={linedNotesVisibleLines}
            />
          ))}
        </Fragment>,
      );
    });

    const rowHeights: Record<string, number> = {};
    host.querySelectorAll<HTMLElement>('[data-lined-notes-stack]').forEach((stack) => {
      const elementId = stack.dataset.linedNotesStack;
      const lineCount = elementId ? linedNotesVisibleLines[elementId] : undefined;
      if (!elementId || !lineCount) return;

      const heightPx = stack.clientHeight;
      if (heightPx <= 0) return;
      rowHeights[elementId] = heightPx / lineCount;
    });

    return rowHeights;
  } finally {
    root.unmount();
    host.remove();
  }
}
