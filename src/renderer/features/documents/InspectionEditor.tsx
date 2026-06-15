import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { FileDown } from 'lucide-react';

import { CADENCE_PRESETS, cadenceLabel, type CadencePreset } from '../../../shared/cadence';

import type { Block, BlockPath, Document } from '../../../shared/document';

import { setBlockValue } from '../../../shared/document';

import type { Inspection, InspectionStatus } from '../../../shared/inspection';

import { BlockFillIn } from './BlockFillIn';
import { useRegisterDocumentOutline } from './DocumentOutlineContext';

const AUTOSAVE_MS = 900;

const compactInputCls =
  'w-full min-w-0 rounded border border-white/10 bg-neutral-950 px-2 py-1 text-xs text-neutral-100 outline-none focus:border-flame-500';



export function InspectionEditor({

  inspection,

  onSaved,

  onBack,

}: {

  inspection: Inspection;

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

  const [document, setDocument] = useState<Document>(inspection.document);

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [exportingPdf, setExportingPdf] = useState(false);

  const [pdfMessage, setPdfMessage] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  const dirtyRef = useRef(false);

  const changeGenRef = useRef(0);

  const inspectionIdRef = useRef(inspection.id);

  const saveRef = useRef<(overrides?: { status?: InspectionStatus }) => Promise<void>>(

    async () => {},

  );



  useEffect(() => {

    const isNewInspection = inspectionIdRef.current !== inspection.id;

    inspectionIdRef.current = inspection.id;

    if (!isNewInspection && dirtyRef.current) return;

    setTitle(inspection.title);

    setStatus(inspection.status);

    setInspector(inspection.inspector);

    setInspectedAt(inspection.inspectedAt ?? '');

    setCadence(

      (CADENCE_PRESETS.some((p) => p.id === inspection.cadence)

        ? inspection.cadence

        : 'annual') as CadencePreset,

    );

    setDocument(inspection.document);

  }, [inspection.id, inspection.updatedAt, inspection.document, inspection.title, inspection.status, inspection.inspector, inspection.inspectedAt, inspection.cadence]);



  const buildPayload = useCallback(

    (overrides?: { status?: InspectionStatus }) => {

      const effectiveStatus = overrides?.status ?? status;

      const nextDocument: Document = {

        ...document,

        meta: {

          ...document.meta,

          title,

          clientId: inspection.clientId,

          inspectionDate: inspectedAt || null,

          inspectionType: document.meta.inspectionType,

        },

      };

      return {

        title: title.trim(),

        status: effectiveStatus,

        inspector: inspector.trim(),

        document: nextDocument,

        inspectedAt: inspectedAt || null,

        cadence,

      };

    },

    [title, status, inspector, inspectedAt, cadence, document, inspection.clientId],

  );



  const save = useCallback(

    async (overrides?: { status?: InspectionStatus }) => {

      if (timerRef.current) {

        window.clearTimeout(timerRef.current);

        timerRef.current = null;

      }



      const payload = buildPayload(overrides);

      if (!payload.title) {

        setSaveState('error');

        setError('Title is required.');

        return;

      }

      setSaveState('saving');

      setError(null);

      const genAtStart = changeGenRef.current;

      try {

        const saved = await window.blazeaudit.inspections.update(inspection.id, {

          title: payload.title,

          status: payload.status,

          inspector: payload.inspector,

          document: payload.document,

          inspectedAt: payload.inspectedAt,

          cadence: payload.cadence,

        });

        if (genAtStart !== changeGenRef.current) {

          rescheduleSave();

          return;

        }

        dirtyRef.current = false;

        setSaveState('saved');

        setStatus(saved.status);

        onSaved(saved);

      } catch (e) {

        setSaveState('error');

        setError(e instanceof Error ? e.message : 'Save failed.');

      }

    },

    [buildPayload, inspection.id, onSaved],

  );



  saveRef.current = save;



  const rescheduleSave = useCallback(() => {

    dirtyRef.current = true;

    setSaveState((prev) => (prev === 'saved' || prev === 'error' ? 'idle' : prev));

    if (timerRef.current) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(() => {

      void saveRef.current();

    }, AUTOSAVE_MS);

  }, []);



  const scheduleSave = useCallback(() => {

    changeGenRef.current += 1;

    rescheduleSave();

  }, [rescheduleSave]);



  useEffect(() => {

    return () => {

      if (timerRef.current) window.clearTimeout(timerRef.current);

    };

  }, []);



  const handleValueChange = useCallback((path: BlockPath, value: unknown) => {

    setDocument((prev) => ({ ...prev, blocks: setBlockValue(prev.blocks, path, value) }));

    scheduleSave();

  }, [scheduleSave]);



  const handlePatchBlocks = useCallback((mutator: (blocks: Block[]) => Block[]) => {

    setDocument((prev) => ({ ...prev, blocks: mutator(prev.blocks) }));

    scheduleSave();

  }, [scheduleSave]);



  useRegisterDocumentOutline(document.blocks);



  const toggleStatus = async () => {

    const next: InspectionStatus = status === 'complete' ? 'draft' : 'complete';

    setStatus(next);

    await save({ status: next });

  };



  const exportPdf = async () => {

    setExportingPdf(true);

    setPdfMessage(null);

    setError(null);

    try {

      if (dirtyRef.current || timerRef.current) {

        await save();

      }

      const result = await window.blazeaudit.inspections.exportPdf(inspection.id);

      if (result.saved) {

        setPdfMessage(`PDF saved to ${result.filePath}`);

      }

    } catch (e) {

      setError(e instanceof Error ? e.message : 'PDF export failed.');

    } finally {

      setExportingPdf(false);

    }

  };



  return (

    <div className="flex h-full min-h-0 flex-col gap-2">

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">

        <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11px] text-neutral-500">

          <span

            className={

              status === 'complete'

                ? 'rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-emerald-300'

                : 'rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-amber-300'

            }

          >

            {status === 'complete' ? 'Complete' : 'Draft'}

          </span>

          <span>

            {saveState === 'saving'

              ? 'Saving…'

              : saveState === 'saved'

                ? 'Saved'

                : saveState === 'error'

                  ? 'Save error'

                  : dirtyRef.current

                    ? 'Unsaved changes'

                    : 'Autosave on'}

          </span>

          {inspection.templateName && <span className="truncate">From {inspection.templateName}</span>}

        </div>

        <div className="flex shrink-0 gap-1.5">

          <button

            type="button"

            onClick={onBack}

            className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-neutral-300 hover:bg-white/5"

          >

            Back

          </button>

          <button

            type="button"

            onClick={() => void save()}

            className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-neutral-200 hover:bg-white/5"

          >

            Save now

          </button>

          <button

            type="button"

            disabled={exportingPdf}

            onClick={() => void exportPdf()}

            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 text-xs text-neutral-200 hover:bg-white/5 disabled:opacity-50"

          >

            <FileDown className="size-3.5" />

            {exportingPdf ? 'Exporting…' : 'Save as PDF'}

          </button>

          <button

            type="button"

            onClick={() => void toggleStatus()}

            className="rounded-md bg-flame-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-flame-600"

          >

            {status === 'complete' ? 'Reopen as draft' : 'Mark complete'}

          </button>

        </div>

      </div>



      {error && (

        <div className="shrink-0 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300">

          {error}

        </div>

      )}

      {pdfMessage && (

        <div className="shrink-0 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-200">

          {pdfMessage}

        </div>

      )}



      <div className="shrink-0 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4 lg:grid-cols-6">

          <HeaderField label="Title" className="col-span-2 md:col-span-2 lg:col-span-2">

            <input

              className={compactInputCls}

              value={title}

              onChange={(e) => {

                setTitle(e.target.value);

                scheduleSave();

              }}

            />

          </HeaderField>

          <HeaderField label="Client">

            <p

              className="truncate rounded border border-white/5 bg-neutral-950/60 px-2 py-1 text-xs text-neutral-300"

              title={inspection.clientName}

            >

              {inspection.clientName}

            </p>

          </HeaderField>

          <HeaderField label="Type">

            <p

              className="truncate rounded border border-white/5 bg-neutral-950/60 px-2 py-1 text-xs text-neutral-400"

              title={document.meta.inspectionType}

            >

              {document.meta.inspectionType || '—'}

            </p>

          </HeaderField>

          <HeaderField label="Inspector">

            <input

              className={compactInputCls}

              value={inspector}

              onChange={(e) => {

                setInspector(e.target.value);

                scheduleSave();

              }}

            />

          </HeaderField>

          <HeaderField label="Date">

            <input

              className={compactInputCls}

              type="date"

              value={inspectedAt}

              onChange={(e) => {

                setInspectedAt(e.target.value);

                scheduleSave();

              }}

            />

          </HeaderField>

          <HeaderField label={`Cadence · ${cadenceLabel(cadence)}`}>

            <select

              className={compactInputCls}

              value={cadence}

              onChange={(e) => {

                setCadence(e.target.value as CadencePreset);

                scheduleSave();

              }}

            >

              {CADENCE_PRESETS.map((preset) => (

                <option key={preset.id} value={preset.id}>

                  {preset.label}

                </option>

              ))}

            </select>

          </HeaderField>

        </div>

      </div>



      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">

        <BlockFillIn

          blocks={document.blocks}

          onValueChange={handleValueChange}

          onPatchBlocks={handlePatchBlocks}

          canEditStructure={status === 'draft'}

        />

      </div>

    </div>

  );

}



function HeaderField({

  label,

  children,

  className,

}: {

  label: string;

  children: ReactNode;

  className?: string;

}) {

  return (

    <label className={`block min-w-0 ${className ?? ''}`}>

      <span className="mb-0.5 block text-[10px] font-medium text-neutral-500">{label}</span>

      {children}

    </label>

  );

}


