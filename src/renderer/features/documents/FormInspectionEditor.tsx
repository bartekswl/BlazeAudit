import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileDown } from 'lucide-react';
import { CADENCE_PRESETS, type CadencePreset } from '../../../shared/cadence';
import type { DocumentContext } from '../../../shared/document';
import {
  buildFormOutline,
  isFormInspectionDocument,
  scrollToFormSection,
  setElementValue,
  syncFormDocumentInspectionDate,
  type FormInspectionDocument,
} from '../../../shared/form';
import type { Inspection, InspectionStatus } from '../../../shared/inspection';
import { useRegisterFormOutline } from './DocumentOutlineContext';
import { FormPageCanvas } from '../form/FormPageCanvas';
import { FormPageViewport } from '../form/FormPageViewport';
import { buildFormPrintHtml } from '../form/buildFormPrintHtml';
import { collectLinedNotesVisibleLines } from '../form/collectLinedNotesVisibleLines';

const AUTOSAVE_MS = 900;
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
    syncFormDocumentInspectionDate(formDocInitial, inspection.inspectedAt ?? null),
  );
  const [context, setContext] = useState<DocumentContext | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    void window.blazeaudit.inspections.resolveContext(inspection.id).then(setContext);
  }, [inspection.id]);

  const pageCount = formDoc.form.pages.length;
  const formSections = useMemo(() => buildFormOutline(formDoc.form), [formDoc.form]);
  const outlineTitle = context?.template?.title || title;

  const handleOutlineNavigate = useCallback((sectionId: string, _targetPageIndex: number) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => scrollToFormSection(sectionId));
    });
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
      dirtyRef.current = false;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
      setSaveState('error');
    }
  }, [inspection.id, title, status, formDoc, inspectedAt, cadence, onSaved]);

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    setSaveState('idle');
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => void save(), AUTOSAVE_MS);
  }, [save]);

  const onValueChange = (elementId: string, value: unknown) => {
    setFormDoc((prev) => ({
      ...prev,
      values: setElementValue(prev.values, elementId, value),
    }));
    scheduleSave();
  };

  const onInspectionDateChange = (nextDate: string) => {
    setInspectedAt(nextDate);
    setFormDoc((prev) => syncFormDocumentInspectionDate(prev, nextDate || null));
    scheduleSave();
  };

  const exportPdf = async () => {
    setExportingPdf(true);
    setPdfMessage(null);
    try {
      if (dirtyRef.current) await save();
      const linedNotesVisibleLines = collectLinedNotesVisibleLines();
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
    saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Save';

  if (pageCount === 0) {
    return <p className="text-sm text-neutral-500">This form has no pages.</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
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
                scheduleSave();
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
              scheduleSave();
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
                template={
                  context?.template
                    ? {
                        code: context.template.code,
                        title: context.template.title,
                        name: context.template.name,
                      }
                    : undefined
                }
                context={context}
                values={formDoc.values}
                onValueChange={onValueChange}
              />
            ))}
          </div>
        </FormPageViewport>
      </div>
    </div>
  );
}
