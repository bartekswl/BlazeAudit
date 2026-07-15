import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileDown, TriangleAlert } from 'lucide-react';
import { CADENCE_PRESETS, type CadencePreset } from '../../../shared/cadence';
import type { DocumentContext } from '../../../shared/document';
import {
  addIndividualDeviceRecordPage,
  addRepeatableFormPage,
  buildFormOutline,
  individualDeviceRecordPageControls,
  individualDeviceRecordPageHasContent,
  isFormInspectionDocument,
  removeIndividualDeviceRecordPage,
  removeRepeatableFormPage,
  REPEATABLE_PAGE_LABELS,
  resolveRepeatableFormPageKind,
  repeatablePageControlsForIndex,
  repeatablePageHasContent,
  scrollToFormSection,
  setElementValue,
  syncFormDocumentInspectionDate,
  migrateFormInspectionPowerSupplyLayout,
  type FormInspectionDocument,
  type RepeatableFormPageKind,
} from '../../../shared/form';
import type { Inspection, InspectionStatus } from '../../../shared/inspection';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useRegisterFormOutline } from './DocumentOutlineContext';
import { FormPageCanvas, type FormPageExtraControlsConfig } from '../form/FormPageCanvas';
import { FormPageViewport } from '../form/FormPageViewport';
import { collectLinedNotesVisibleLines } from '../form/collectLinedNotesVisibleLines';
import { LoadingOverlay } from '../../components/LoadingOverlay';

type PendingPageRemove =
  | { kind: 'idr'; pageIndex: number }
  | { kind: 'repeatable'; pageKind: RepeatableFormPageKind; pageIndex: number };

const compactInputCls = 'ba-input ba-input--compact';
const compactFieldCls = `${compactInputCls} !py-1`;
const toolbarBtnCls =
  'inline-flex h-[1.75rem] items-center gap-1.5 rounded-md border border-flame-500/30 bg-flame-500/10 px-2.5 text-xs leading-5 text-flame-300 transition-colors hover:bg-flame-500/20 disabled:opacity-50';

export function FormInspectionEditor(props: {
  inspection: Inspection;
  onSaved: (inspection: Inspection) => void;
  onBack: () => void;
}) {
  if (!isFormInspectionDocument(props.inspection.document)) {
    return <p className="text-sm text-red-300">Invalid form inspection document.</p>;
  }
  return <FormInspectionEditorInner {...props} document={props.inspection.document} />;
}

function FormInspectionEditorInner({
  inspection,
  document: formDocInitial,
  onSaved,
}: {
  inspection: Inspection;
  document: FormInspectionDocument;
  onSaved: (inspection: Inspection) => void;
  onBack: () => void;
}) {
  const [title] = useState(inspection.title);
  const [status, setStatus] = useState<InspectionStatus>(inspection.status);
  const [inspectedAt, setInspectedAt] = useState(inspection.inspectedAt ?? '');
  const [cadence, setCadence] = useState(
    (CADENCE_PRESETS.some((p) => p.id === inspection.cadence)
      ? inspection.cadence
      : 'annual') as CadencePreset,
  );
  const [formDoc, setFormDoc] = useState<FormInspectionDocument>(() =>
    syncFormDocumentInspectionDate(
      migrateFormInspectionPowerSupplyLayout(formDocInitial),
      inspection.inspectedAt ?? null,
    ),
  );
  const [context, setContext] = useState<DocumentContext | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(() => {
    const migrated = migrateFormInspectionPowerSupplyLayout(formDocInitial);
    return migrated !== formDocInitial;
  });
  const [pendingPageRemove, setPendingPageRemove] = useState<PendingPageRemove | null>(null);

  const formDocRef = useRef(formDoc);
  formDocRef.current = formDoc;

  useEffect(() => {
    void window.blazeaudit.inspections.resolveContext(inspection.id).then(setContext);
  }, [inspection.id]);

  const pageCount = formDoc.form.pages.length;
  const formSections = useMemo(() => buildFormOutline(formDoc.form), [formDoc.form]);
  const outlineTitle = context?.template?.title || title;

  const handleOutlineNavigate = useCallback((sectionId: string, _targetPageIndex: number) => {
    window.requestAnimationFrame(() => scrollToFormSection(sectionId));
  }, []);

  useRegisterFormOutline(outlineTitle, formSections, handleOutlineNavigate);

  const save = useCallback(async () => {
    setSaveState('saving');
    setError(null);
    const documentToSave = syncFormDocumentInspectionDate(formDoc, inspectedAt || null);
    if (documentToSave !== formDoc) {
      setFormDoc(documentToSave);
    }
    try {
      const saved = await window.blazeaudit.inspections.update(inspection.id, {
        title,
        status,
        inspector: '',
        document: documentToSave,
        inspectedAt: inspectedAt || null,
        cadence,
      });
      onSaved(saved);
      setSaveState('saved');
      setIsDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
      setSaveState('error');
    }
  }, [inspection.id, title, status, formDoc, inspectedAt, cadence, onSaved]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
    setSaveState((prev) => (prev === 'saved' || prev === 'error' ? 'idle' : prev));
  }, []);

  const markDirtyRef = useRef(markDirty);
  markDirtyRef.current = markDirty;

  const onValueChange = useCallback((elementId: string, value: unknown) => {
    setFormDoc((prev) => ({
      ...prev,
      values: setElementValue(prev.values, elementId, value),
    }));
    markDirtyRef.current();
  }, []);

  const onAddIdrPage = useCallback((afterPageIndex: number) => {
    setFormDoc((prev) => addIndividualDeviceRecordPage(prev, afterPageIndex));
    markDirtyRef.current();
  }, []);

  const onRemoveIdrPage = useCallback((pageIndex: number) => {
    setFormDoc((prev) => removeIndividualDeviceRecordPage(prev, pageIndex));
    markDirtyRef.current();
  }, []);

  const onAddRepeatablePage = useCallback((afterPageIndex: number) => {
    setFormDoc((prev) => addRepeatableFormPage(prev, afterPageIndex));
    markDirtyRef.current();
  }, []);

  const onRemoveRepeatablePage = useCallback((pageIndex: number) => {
    setFormDoc((prev) => removeRepeatableFormPage(prev, pageIndex));
    markDirtyRef.current();
  }, []);

  const requestRemoveIdrPage = useCallback(
    (pageIndex: number) => {
      if (individualDeviceRecordPageHasContent(formDocRef.current, pageIndex)) {
        setPendingPageRemove({ kind: 'idr', pageIndex });
        return;
      }
      onRemoveIdrPage(pageIndex);
    },
    [onRemoveIdrPage],
  );

  const requestRemoveRepeatablePage = useCallback(
    (pageIndex: number) => {
      const pageKind = resolveRepeatableFormPageKind(formDocRef.current.form, pageIndex);
      if (!pageKind) return;
      if (repeatablePageHasContent(formDocRef.current, pageIndex)) {
        setPendingPageRemove({ kind: 'repeatable', pageKind, pageIndex });
        return;
      }
      onRemoveRepeatablePage(pageIndex);
    },
    [onRemoveRepeatablePage],
  );

  const confirmPendingPageRemove = useCallback(() => {
    if (!pendingPageRemove) return;
    if (pendingPageRemove.kind === 'idr') {
      onRemoveIdrPage(pendingPageRemove.pageIndex);
    } else {
      onRemoveRepeatablePage(pendingPageRemove.pageIndex);
    }
    setPendingPageRemove(null);
  }, [pendingPageRemove, onRemoveIdrPage, onRemoveRepeatablePage]);

  const onAddIdrPageRef = useRef(onAddIdrPage);
  onAddIdrPageRef.current = onAddIdrPage;
  const onRemoveIdrPageRef = useRef(requestRemoveIdrPage);
  onRemoveIdrPageRef.current = requestRemoveIdrPage;
  const onAddRepeatablePageRef = useRef(onAddRepeatablePage);
  onAddRepeatablePageRef.current = onAddRepeatablePage;
  const onRemoveRepeatablePageRef = useRef(requestRemoveRepeatablePage);
  onRemoveRepeatablePageRef.current = requestRemoveRepeatablePage;

  const pageExtraControlsFor = useCallback(
    (index: number): FormPageExtraControlsConfig | null => {
      const form = formDoc.form;
      const idrMode = individualDeviceRecordPageControls(form, index);
      if (idrMode !== 'none') {
        return {
          mode: idrMode,
          ariaLabel: 'Individual Device Record page controls',
          addTooltip:
            'Add another 23.2 Individual Device Record page after this one. The new page starts empty.',
          removeTooltip:
            'Remove this 23.2 page from the inspection. At least three Individual Device Record pages must remain.',
          onAdd: () => onAddIdrPageRef.current(index),
          onRemove: () => onRemoveIdrPageRef.current(index),
        };
      }

      const repeatableKind = resolveRepeatableFormPageKind(form, index);
      if (!repeatableKind) return null;
      const mode = repeatablePageControlsForIndex(form, index);
      if (mode === 'none') return null;
      const labels = REPEATABLE_PAGE_LABELS[repeatableKind];
      return {
        mode,
        ariaLabel: `${labels.short} page controls`,
        addTooltip: labels.addTooltip,
        removeTooltip: labels.removeTooltip,
        onAdd: () => onAddRepeatablePageRef.current(index),
        onRemove: () => onRemoveRepeatablePageRef.current(index),
      };
    },
    [formDoc.form],
  );

  const onInspectionDateChange = useCallback((nextDate: string) => {
    setInspectedAt(nextDate);
    setFormDoc((prev) => syncFormDocumentInspectionDate(prev, nextDate || null));
    markDirtyRef.current();
  }, []);

  const editorTemplate = useMemo(
    () =>
      context?.template
        ? {
            code: context.template.code,
            title: context.template.title,
            name: context.template.name,
          }
        : undefined,
    [context?.template?.code, context?.template?.title, context?.template?.name],
  );

  const exportPdf = async () => {
    setExportingPdf(true);
    setPdfMessage(null);
    // Let the loading overlay paint before blocking HTML/PDF work.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    try {
      const linedNotesVisibleLines = collectLinedNotesVisibleLines();
      const { buildFormPrintHtml } = await import('../form/buildFormPrintHtml');
      const printHtml = await buildFormPrintHtml({
        form: formDoc.form,
        values: formDoc.values,
        context,
        template: context?.template
          ? {
              code: context.template.code,
              title: context.template.title,
              name: context.template.name,
            }
          : undefined,
        title,
        linedNotesVisibleLines,
      });
      const result = await window.blazeaudit.inspections.exportPdf(inspection.id, printHtml);
      if (result.saved) setPdfMessage(`Exported to ${result.filePath}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF export failed.');
    } finally {
      setExportingPdf(false);
    }
  };

  const saveLabel =
    saveState === 'saving' ? 'Saving…' : saveState === 'saved' && !isDirty ? 'Saved' : 'Save';

  if (pageCount === 0) {
    return <p className="text-sm text-neutral-500">This form has no pages.</p>;
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-2">
      {exportingPdf ? (
        <LoadingOverlay label="Exporting PDF…" position="absolute" />
      ) : null}
      {pendingPageRemove != null ? (
        <ConfirmDialog
          title={
            pendingPageRemove.kind === 'idr'
              ? 'Remove 23.2 page?'
              : REPEATABLE_PAGE_LABELS[pendingPageRemove.pageKind].removeTitle
          }
          icon={TriangleAlert}
          confirmLabel="Remove page"
          onCancel={() => setPendingPageRemove(null)}
          onConfirm={confirmPendingPageRemove}
        >
          <p>
            {pendingPageRemove.kind === 'idr'
              ? 'This Individual Device Record page has data entered in the table. Removing it will permanently delete that data from this inspection.'
              : `This ${REPEATABLE_PAGE_LABELS[pendingPageRemove.pageKind].short} page has data entered. Removing it will permanently delete that data from this inspection.`}
          </p>
          <p>This cannot be undone unless you re-enter the information on another page.</p>
        </ConfirmDialog>
      ) : null}
      {error && <div className="ba-alert ba-alert--error shrink-0">{error}</div>}
      {pdfMessage && <div className="ba-alert ba-alert--success shrink-0">{pdfMessage}</div>}

      <div className="shrink-0 rounded-lg border border-[var(--ba-panel-border)] bg-[var(--ba-panel-bg)] p-2">
        <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-2 gap-y-1.5">
          <div className="min-w-0">
            <span className="mb-0.5 block text-[10px] text-[var(--ba-text-muted)]">Title</span>
            <p className={`${compactFieldCls} truncate font-medium text-[var(--ba-text-primary)]`}>
              {title}
            </p>
          </div>
          <label className="block min-w-0">
            <span className="mb-0.5 block text-[10px] text-[var(--ba-text-muted)]">Date</span>
            <input
              type="date"
              className={compactFieldCls}
              value={inspectedAt}
              onChange={(e) => onInspectionDateChange(e.target.value)}
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-0.5 block text-[10px] text-[var(--ba-text-muted)]">Status</span>
            <select
              className={`${compactFieldCls} ba-select`}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as InspectionStatus);
                markDirty();
              }}
            >
              <option value="draft">Draft</option>
              <option value="complete">Complete</option>
            </select>
          </label>
        </div>

        <div
          className="mt-2 grid gap-x-2 gap-y-0.5"
          style={{ gridTemplateColumns: '8rem minmax(0, 14rem) 1fr' }}
        >
          <span className="text-[10px] text-[var(--ba-text-muted)]">Cadence</span>
          <span className="text-[10px] text-[var(--ba-text-muted)]">Client</span>
          <span aria-hidden="true" />
          <select
            className={`${compactFieldCls} ba-select`}
            value={cadence}
            onChange={(e) => {
              setCadence(e.target.value as CadencePreset);
              markDirty();
            }}
          >
            {CADENCE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <p
            className={`${compactFieldCls} min-w-0 truncate font-medium text-[var(--ba-text-primary)]`}
            title={inspection.clientName}
          >
            {inspection.clientName}
          </p>
          <div className="flex items-center justify-end gap-2 pr-2">
            <button
              type="button"
              disabled={saveState === 'saving'}
              onClick={() => void save()}
              className={toolbarBtnCls}
            >
              {saveLabel}
            </button>
            <button
              type="button"
              disabled={exportingPdf}
              onClick={() => void exportPdf()}
              className={toolbarBtnCls}
            >
              <FileDown className="size-3.5" />
              {exportingPdf ? 'Exporting…' : 'Export PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <FormPageViewport pageIndex={0} totalPages={pageCount} continuous showZoomControls>
          <div className="form-page-stack">
            {formDoc.form.pages.map((p, index) => (
              <FormPageCanvas
                key={p.id}
                form={formDoc.form}
                page={p}
                pageIndex={index}
                template={editorTemplate}
                context={context}
                values={formDoc.values}
                onValueChange={onValueChange}
                pageExtraControls={pageExtraControlsFor(index)}
              />
            ))}
          </div>
        </FormPageViewport>
      </div>
    </div>
  );
}
