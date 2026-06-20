import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileDown } from 'lucide-react';
import { CADENCE_PRESETS, cadenceLabel, type CadencePreset } from '../../../shared/cadence';
import type { DocumentContext } from '../../../shared/document';
import {
  buildFormOutline,
  isFormInspectionDocument,
  scrollToFormSection,
  setElementValue,
  type FormInspectionDocument,
} from '../../../shared/form';
import type { Inspection, InspectionStatus } from '../../../shared/inspection';
import { useRegisterFormOutline } from './DocumentOutlineContext';
import { FormPageCanvas } from '../form/FormPageCanvas';
import { FormPageViewport } from '../form/FormPageViewport';

const AUTOSAVE_MS = 900;
const compactInputCls =
  'w-full min-w-0 rounded border border-white/10 bg-neutral-950 px-2 py-1 text-xs text-neutral-100 outline-none focus:border-flame-500';

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
  onBack,
}: {
  inspection: Inspection;
  document: FormInspectionDocument;
  onSaved: (inspection: Inspection) => void;
  onBack: () => void;
}) {
  const [title, setTitle] = useState(inspection.title);
  const [status, setStatus] = useState<InspectionStatus>(inspection.status);
  const [inspector, setInspector] = useState(inspection.inspector);
  const [inspectedAt, setInspectedAt] = useState(inspection.inspectedAt ?? '');
  const [cadence, setCadence] = useState(
    (CADENCE_PRESETS.some((p) => p.id === inspection.cadence)
      ? inspection.cadence
      : 'annual') as CadencePreset,
  );
  const [formDoc, setFormDoc] = useState<FormInspectionDocument>(formDocInitial);
  const [context, setContext] = useState<DocumentContext | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    void window.blazeaudit.inspections.resolveContext(inspection.id).then(setContext);
  }, [inspection.id]);

  const page = formDoc.form.pages[pageIndex];
  const formSections = useMemo(() => buildFormOutline(formDoc.form), [formDoc.form]);
  const outlineTitle = context?.template?.title || title;

  const handleOutlineNavigate = useCallback((sectionId: string, targetPageIndex: number) => {
    setPageIndex(targetPageIndex);
    window.requestAnimationFrame(() => scrollToFormSection(sectionId));
  }, []);

  useRegisterFormOutline(outlineTitle, formSections, handleOutlineNavigate);

  const save = useCallback(async () => {
    setSaveState('saving');
    setError(null);
    try {
      const saved = await window.blazeaudit.inspections.update(inspection.id, {
        title,
        status,
        inspector,
        document: formDoc,
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
  }, [inspection.id, title, status, inspector, formDoc, inspectedAt, cadence, onSaved]);

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

  const exportPdf = async () => {
    setExportingPdf(true);
    setPdfMessage(null);
    try {
      if (dirtyRef.current) await save();
      const result = await window.blazeaudit.inspections.exportPdf(inspection.id);
      if (result.saved) setPdfMessage(`Exported to ${result.filePath}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF export failed.');
    } finally {
      setExportingPdf(false);
    }
  };

  if (!page) {
    return <p className="text-sm text-neutral-500">This form has no pages.</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-neutral-500">
          Form inspection · {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 hover:bg-white/5"
          >
            Back
          </button>
          <button
            type="button"
            disabled={exportingPdf}
            onClick={() => void exportPdf()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 hover:bg-white/5 disabled:opacity-50"
          >
            <FileDown className="size-4" />
            {exportingPdf ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      {pdfMessage && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {pdfMessage}
        </div>
      )}

      <div className="grid shrink-0 gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 md:grid-cols-4">
        <label className="block md:col-span-2">
          <span className="mb-1 block text-xs text-neutral-500">Title</span>
          <input
            className={compactInputCls}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              scheduleSave();
            }}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">Inspector</span>
          <input
            className={compactInputCls}
            value={inspector}
            onChange={(e) => {
              setInspector(e.target.value);
              scheduleSave();
            }}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">Date</span>
          <input
            type="date"
            className={compactInputCls}
            value={inspectedAt}
            onChange={(e) => {
              setInspectedAt(e.target.value);
              scheduleSave();
            }}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">Status</span>
          <select
            className={compactInputCls}
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
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">Cadence</span>
          <select
            className={compactInputCls}
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
        </label>
        <p className="flex items-end text-xs text-neutral-500 md:col-span-2">
          Client: {inspection.clientName} · {cadenceLabel(cadence)}
        </p>
      </div>

      {formDoc.form.pages.length > 1 && (
        <div className="flex shrink-0 flex-wrap gap-1">
          {formDoc.form.pages.map((p, index) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPageIndex(index)}
              className={
                index === pageIndex
                  ? 'rounded-lg bg-flame-500 px-3 py-1.5 text-xs font-semibold text-white'
                  : 'rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-400 hover:bg-white/5'
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
        totalPages={formDoc.form.pages.length}
        onPageChange={formDoc.form.pages.length > 1 ? setPageIndex : undefined}
      >
        <FormPageCanvas
          form={formDoc.form}
          page={page}
          pageIndex={pageIndex}
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
      </FormPageViewport>
      </div>
    </div>
  );
}
