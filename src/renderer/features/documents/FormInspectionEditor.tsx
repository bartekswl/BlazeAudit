import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  ClipboardCopy,
  ClipboardPaste,
  FileDown,
  MousePointer2,
  Pin,
  PinOff,
  Scissors,
  TriangleAlert,
  Undo2,
} from 'lucide-react';
import { cn } from '../../lib/cn';
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
  syncFormDocumentProjectNumber,
  extractFormDocumentProjectNumber,
  migrateFormInspectionPowerSupplyLayout,
  migrateFormInspectionIdrRowGaps,
  normalizeUlcSection1Value,
  type FormInspectionDocument,
  type RepeatableFormPageKind,
} from '../../../shared/form';
import type { Inspection, InspectionStatus } from '../../../shared/inspection';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useRegisterFormOutline } from './DocumentOutlineContext';
import { useDocumentAutosave } from './useDocumentAutosave';
import { useDocumentUndoHotkey, useDocumentUndoStack } from './useDocumentUndoStack';
import { FormPageCanvas, type FormPageExtraControlsConfig } from '../form/FormPageCanvas';
import { FormPageViewport } from '../form/FormPageViewport';
import { collectLinedNotesVisibleLines } from '../form/collectLinedNotesVisibleLines';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { useFormFieldClipboard } from './useFormFieldClipboard';

type PendingPageRemove =
  | { kind: 'idr'; pageIndex: number }
  | { kind: 'repeatable'; pageKind: RepeatableFormPageKind; pageIndex: number };

type FormEditorSnapshot = {
  formDoc: FormInspectionDocument;
  status: InspectionStatus;
  inspectedAt: string;
  projectNumber: string;
  cadence: CadencePreset;
};

const compactInputCls = 'ba-input ba-input--compact';
const compactFieldCls = `${compactInputCls} !py-0.5 !text-[11px] !leading-4`;
const toolbarBtnCls =
  'inline-flex h-6 items-center gap-1 rounded-md border border-flame-500/30 bg-flame-500/10 px-1.5 text-[11px] leading-4 text-flame-300 transition-colors hover:bg-flame-500/20 disabled:opacity-50';
const toolbarIconBtnCls =
  'inline-flex size-6 items-center justify-center rounded-md border border-flame-500/30 bg-flame-500/10 text-flame-300 transition-colors hover:bg-flame-500/20 disabled:opacity-50';

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
  const [projectNumber, setProjectNumber] = useState(() => {
    const fromDb = inspection.projectNumber?.trim() ?? '';
    if (fromDb) return fromDb;
    return extractFormDocumentProjectNumber(formDocInitial);
  });
  const [cadence, setCadence] = useState(
    (CADENCE_PRESETS.some((p) => p.id === inspection.cadence)
      ? inspection.cadence
      : 'annual') as CadencePreset,
  );
  const [formDoc, setFormDoc] = useState<FormInspectionDocument>(() => {
    const migrated = migrateFormInspectionIdrRowGaps(
      migrateFormInspectionPowerSupplyLayout(formDocInitial),
    );
    const withDate = syncFormDocumentInspectionDate(migrated, inspection.inspectedAt ?? null);
    const initialProject =
      inspection.projectNumber?.trim() || extractFormDocumentProjectNumber(withDate);
    return syncFormDocumentProjectNumber(withDate, initialProject);
  });
  const [context, setContext] = useState<DocumentContext | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(() => {
    const migrated = migrateFormInspectionIdrRowGaps(
      migrateFormInspectionPowerSupplyLayout(formDocInitial),
    );
    const withDate = syncFormDocumentInspectionDate(migrated, inspection.inspectedAt ?? null);
    const initialProject =
      inspection.projectNumber?.trim() || extractFormDocumentProjectNumber(withDate);
    const synced = syncFormDocumentProjectNumber(withDate, initialProject);
    return synced !== formDocInitial;
  });
  const [pendingPageRemove, setPendingPageRemove] = useState<PendingPageRemove | null>(null);
  const [pendingDateChange, setPendingDateChange] = useState<string | null>(null);
  const [metaPinned, setMetaPinned] = useState(true);
  const formStackRef = useRef<HTMLDivElement>(null);
  const {
    selectMode,
    toggleSelectMode,
    copySelected,
    cutSelected,
    pasteSelected,
  } = useFormFieldClipboard(formStackRef);

  const formDocRef = useRef(formDoc);
  formDocRef.current = formDoc;

  const snapshotRef = useRef<FormEditorSnapshot>({
    formDoc,
    status,
    inspectedAt,
    projectNumber,
    cadence,
  });
  snapshotRef.current = { formDoc, status, inspectedAt, projectNumber, cadence };

  const { canUndo, push: pushUndo, undo: popUndo } = useDocumentUndoStack<FormEditorSnapshot>();

  const recordUndo = useCallback(
    (coalesceKey?: string) => {
      pushUndo(snapshotRef.current, coalesceKey);
    },
    [pushUndo],
  );

  const applyUndo = useCallback(() => {
    const prev = popUndo();
    if (!prev) return;
    setFormDoc(prev.formDoc);
    setStatus(prev.status);
    setInspectedAt(prev.inspectedAt);
    setProjectNumber(prev.projectNumber);
    setCadence(prev.cadence);
    setIsDirty(true);
    setSaveState((s) => (s === 'saved' || s === 'error' ? 'idle' : s));
  }, [popUndo]);

  useDocumentUndoHotkey(canUndo, applyUndo);

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
    const trimmedProject = projectNumber.trim();
    let documentToSave = syncFormDocumentInspectionDate(formDoc, inspectedAt || null);
    documentToSave = syncFormDocumentProjectNumber(documentToSave, trimmedProject);
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
        projectNumber: trimmedProject,
        cadence,
      });
      onSaved(saved);
      setSaveState('saved');
      setIsDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
      setSaveState('error');
    }
  }, [inspection.id, title, status, formDoc, inspectedAt, projectNumber, cadence, onSaved]);

  useDocumentAutosave(save, isDirty, saveState === 'saving', inspection.id);

  const markDirty = useCallback(() => {
    setIsDirty(true);
    setSaveState((prev) => (prev === 'saved' || prev === 'error' ? 'idle' : prev));
  }, []);

  const markDirtyRef = useRef(markDirty);
  markDirtyRef.current = markDirty;

  const onValueChange = useCallback((elementId: string, value: unknown) => {
    if (typeof value === 'object' && value !== null && 'dateOfService' in value) {
      const prev = normalizeUlcSection1Value(formDocRef.current.values[elementId]);
      const next = normalizeUlcSection1Value(value);
      if (prev.dateOfService !== next.dateOfService) {
        // Date of Service ↔ top-panel date; confirm before applying. Last Service is untouched.
        setPendingDateChange(next.dateOfService);
        return;
      }
    }
    recordUndo(`value:${elementId}`);
    if (
      typeof value === 'object' &&
      value !== null &&
      ('projectNumber' in value || 'workOrderNumber' in value)
    ) {
      setProjectNumber(normalizeUlcSection1Value(value).projectNumber);
    }
    setFormDoc((prev) => ({
      ...prev,
      values: setElementValue(prev.values, elementId, value),
    }));
    markDirtyRef.current();
  }, [recordUndo]);

  const onAddIdrPage = useCallback((afterPageIndex: number) => {
    recordUndo();
    setFormDoc((prev) => addIndividualDeviceRecordPage(prev, afterPageIndex));
    markDirtyRef.current();
  }, [recordUndo]);

  const onRemoveIdrPage = useCallback((pageIndex: number) => {
    recordUndo();
    setFormDoc((prev) => removeIndividualDeviceRecordPage(prev, pageIndex));
    markDirtyRef.current();
  }, [recordUndo]);

  const onAddRepeatablePage = useCallback((afterPageIndex: number) => {
    recordUndo();
    setFormDoc((prev) => addRepeatableFormPage(prev, afterPageIndex));
    markDirtyRef.current();
  }, [recordUndo]);

  const onRemoveRepeatablePage = useCallback((pageIndex: number) => {
    recordUndo();
    setFormDoc((prev) => removeRepeatableFormPage(prev, pageIndex));
    markDirtyRef.current();
  }, [recordUndo]);

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

  const applyInspectionDateChange = useCallback(
    (nextDate: string) => {
      recordUndo('meta:inspectedAt');
      setInspectedAt(nextDate);
      setFormDoc((prev) => syncFormDocumentInspectionDate(prev, nextDate || null));
      setContext((prev) =>
        prev
          ? {
              ...prev,
              inspection: { ...prev.inspection, inspectedAt: nextDate || null },
            }
          : prev,
      );
      markDirtyRef.current();
    },
    [recordUndo],
  );

  const requestInspectionDateChange = useCallback(
    (nextDate: string) => {
      if (nextDate === inspectedAt) return;
      setPendingDateChange(nextDate);
    },
    [inspectedAt],
  );

  const confirmPendingDateChange = useCallback(() => {
    if (pendingDateChange == null) return;
    applyInspectionDateChange(pendingDateChange);
    setPendingDateChange(null);
  }, [pendingDateChange, applyInspectionDateChange]);

  const onProjectNumberChange = useCallback((next: string) => {
    recordUndo('meta:projectNumber');
    setProjectNumber(next);
    setFormDoc((prev) => syncFormDocumentProjectNumber(prev, next));
    markDirtyRef.current();
  }, [recordUndo]);

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
    setPdfMessage(null);
    // Prefetch the print builder while the user picks a save path.
    const buildModulePromise = import('../form/buildFormPrintHtml');
    const targetPath = await window.blazeaudit.inspections.pickPdfPath(inspection.id);
    if (!targetPath) return;

    // Force the overlay to paint before heavy HTML/PDF work blocks the UI.
    flushSync(() => {
      setExportingPdf(true);
    });
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    try {
      // Persist first so the PDF embed JSON matches the visible report.
      await save();
      const linedNotesVisibleLines = collectLinedNotesVisibleLines();
      const { buildFormPrintHtml } = await buildModulePromise;
      const latest = formDocRef.current;
      const printHtml = await buildFormPrintHtml({
        form: latest.form,
        values: latest.values,
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
      const result = await window.blazeaudit.inspections.exportPdf(
        inspection.id,
        printHtml,
        targetPath,
      );
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
      {exportingPdf ? <LoadingOverlay label="Exporting PDF…" /> : null}
      {pendingDateChange != null ? (
        <ConfirmDialog
          title="Change date of service?"
          icon={TriangleAlert}
          confirmLabel="Change date"
          onCancel={() => setPendingDateChange(null)}
          onConfirm={confirmPendingDateChange}
        >
          <p>
            This updates the document date and Date of Service together
            {pendingDateChange.trim()
              ? ` to ${pendingDateChange}`
              : ' (clearing the date)'}
            .
          </p>
          <p>Last Service Date is not changed.</p>
        </ConfirmDialog>
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

      <div
        className={cn(
          'relative shrink-0 rounded-md border border-[var(--ba-panel-border)] bg-[var(--ba-panel-bg)] transition-[padding,min-height] duration-200',
          metaPinned ? 'px-2 py-1' : 'h-2 overflow-hidden px-0 py-0',
        )}
      >
        <button
          type="button"
          onClick={() => setMetaPinned((v) => !v)}
          className={cn(
            toolbarIconBtnCls,
            'absolute right-1 top-0.5 z-10',
            !metaPinned && 'top-[-1px] right-1 size-5',
          )}
          title={metaPinned ? 'Unpin meta panel' : 'Pin meta panel'}
          aria-pressed={metaPinned}
        >
          {metaPinned ? <PinOff className="size-3" /> : <Pin className="size-3" />}
        </button>

        {metaPinned ? (
          <>
            <div className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-2 gap-y-0.5 pr-7">
              <div className="min-w-0">
                <span className="mb-px block text-[9px] leading-none text-[var(--ba-text-muted)]">
                  Title
                </span>
                <p
                  className={`${compactFieldCls} truncate font-medium text-[var(--ba-text-primary)]`}
                >
                  {title}
                </p>
              </div>
              <label className="block min-w-0">
                <span className="mb-px block text-[9px] leading-none text-[var(--ba-text-muted)]">
                  Project Number
                </span>
                <input
                  type="text"
                  className={compactFieldCls}
                  value={projectNumber}
                  onChange={(e) => onProjectNumberChange(e.target.value)}
                  placeholder="—"
                />
              </label>
              <label className="block min-w-0">
                <span className="mb-px block text-[9px] leading-none text-[var(--ba-text-muted)]">
                  Date
                </span>
                <input
                  type="date"
                  className={compactFieldCls}
                  value={inspectedAt}
                  onChange={(e) => requestInspectionDateChange(e.target.value)}
                />
              </label>
              <label className="block min-w-0">
                <span className="mb-px block text-[9px] leading-none text-[var(--ba-text-muted)]">
                  Status
                </span>
                <select
                  className={`${compactFieldCls} ba-select`}
                  value={status}
                  onChange={(e) => {
                    recordUndo('meta:status');
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
              className="mt-1 grid gap-x-2 gap-y-0"
              style={{ gridTemplateColumns: '7rem minmax(0, 12rem) 1fr' }}
            >
              <span className="text-[9px] leading-none text-[var(--ba-text-muted)]">Cadence</span>
              <span className="text-[9px] leading-none text-[var(--ba-text-muted)]">Client</span>
              <span aria-hidden="true" />
              <select
                className={`${compactFieldCls} ba-select`}
                value={cadence}
                onChange={(e) => {
                  recordUndo('meta:cadence');
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
              <div className="flex flex-wrap items-center justify-end gap-1 pr-7">
                <button
                  type="button"
                  onClick={() => void copySelected()}
                  className={toolbarBtnCls}
                  title="Copy selected field(s)"
                >
                  <ClipboardCopy className="size-3" />
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => void pasteSelected()}
                  className={toolbarBtnCls}
                  title="Paste into selected field(s)"
                >
                  <ClipboardPaste className="size-3" />
                  Paste
                </button>
                <button
                  type="button"
                  onClick={() => void cutSelected()}
                  className={toolbarBtnCls}
                  title="Cut selected field(s)"
                >
                  <Scissors className="size-3" />
                  Cut
                </button>
                <button
                  type="button"
                  onClick={toggleSelectMode}
                  className={cn(toolbarBtnCls, selectMode && 'bg-flame-500/30 ring-1 ring-flame-400/50')}
                  title={
                    selectMode
                      ? 'Exit select mode'
                      : 'Select fields (hand cursor). Ctrl+click or drag for multiple'
                  }
                  aria-pressed={selectMode}
                >
                  <MousePointer2 className="size-3" />
                  {selectMode ? 'Selecting' : 'Select'}
                </button>
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={applyUndo}
                  className={toolbarBtnCls}
                  title="Undo last change (Ctrl+Z)"
                >
                  <Undo2 className="size-3" />
                  Undo
                </button>
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
                  <FileDown className="size-3" />
                  {exportingPdf ? 'Exporting…' : 'Export PDF'}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <FormPageViewport pageIndex={0} totalPages={pageCount} continuous showZoomControls>
          <div
            ref={formStackRef}
            className={cn('form-page-stack', selectMode && 'ba-form-field-select-mode')}
          >
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
