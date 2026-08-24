import { useEffect, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import {
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  HardDriveDownload,
  Upload,
} from 'lucide-react';
import type { DatabaseBackupInspectResult } from '../../../shared/databaseBackup';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { LoadingOverlay } from '../../components/LoadingOverlay';

function formatStamp(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  return new Date(ms).toLocaleString();
}

function recencyCopy(preview: Extract<DatabaseBackupInspectResult, { canceled: false }>): {
  title: string;
  body: string;
  warnOlder: boolean;
} {
  if (preview.recency === 'newer') {
    return {
      title: 'Import newer backup?',
      body: `This backup is more recent than your current data (backup ${formatStamp(preview.header.dataStamp)}; local ${formatStamp(preview.localDataStamp)}). Importing will replace clients, documents, templates, preferences, logo, and ID photos on this account.`,
      warnOlder: false,
    };
  }
  if (preview.recency === 'older') {
    return {
      title: 'This backup is older',
      body: `This backup is not more recent than your current data (backup ${formatStamp(preview.header.dataStamp)}; local ${formatStamp(preview.localDataStamp)}). Importing will overwrite newer local changes with the older backup.`,
      warnOlder: true,
    };
  }
  return {
    title: 'Import backup?',
    body: `This backup looks about the same age as your current data (${formatStamp(preview.header.dataStamp)}). Importing will replace clients, documents, templates, preferences, logo, and ID photos on this account.`,
    warnOlder: false,
  };
}

export function DatabaseScreen({
  onInspectionImported,
}: {
  onInspectionImported?: (inspectionId: string) => void;
}) {
  const [dataDir, setDataDir] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingKit, setExportingKit] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);
  const [inspectingBackup, setInspectingBackup] = useState(false);
  const [applyingBackup, setApplyingBackup] = useState(false);
  const [backupPreview, setBackupPreview] = useState<Extract<
    DatabaseBackupInspectResult,
    { canceled: false }
  > | null>(null);
  const [importingJson, setImportingJson] = useState(false);
  const [importingPdf, setImportingPdf] = useState(false);
  const [importingClients, setImportingClients] = useState(false);
  const [openingFolder, setOpeningFolder] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const backupEnabled = window.blazeaudit.database.backupEnabled;

  useEffect(() => {
    void window.blazeaudit.database.getDataDir().then(setDataDir);
  }, []);

  const exportCustomersCsv = async () => {
    setExporting(true);
    setMessage(null);
    setError(null);
    try {
      const result = await window.blazeaudit.database.exportClientsCsv();
      if (result.saved) {
        setMessage(`Customer list exported to ${result.filePath}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const importCustomersCsv = async () => {
    setImportingClients(true);
    setMessage(null);
    setError(null);
    try {
      const result = await window.blazeaudit.database.importClientsCsv();
      if (result.imported) {
        const parts = [`Added ${result.created} customer${result.created === 1 ? '' : 's'}`];
        if (result.skippedExisting > 0) {
          parts.push(`skipped ${result.skippedExisting} already in the system`);
        }
        setMessage(`${parts.join('; ')}.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Customer import failed.');
    } finally {
      setImportingClients(false);
    }
  };

  const exportSchemaKit = async () => {
    setExportingKit(true);
    setMessage(null);
    setError(null);
    try {
      const result = await window.blazeaudit.templates.exportSchemaKit();
      if (result.saved) {
        setMessage(`Schema kit exported to ${result.directory}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setExportingKit(false);
    }
  };

  const importTemplateJson = async () => {
    setImportingJson(true);
    setMessage(null);
    setError(null);
    try {
      const result = await window.blazeaudit.database.importTemplateJson();
      if (result.imported) {
        setMessage(`Template imported from ${result.filePath}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setImportingJson(false);
    }
  };

  const importInspectionPdf = async () => {
    setImportingPdf(true);
    setMessage(null);
    setError(null);
    try {
      const result = await window.blazeaudit.inspections.importPdf();
      if (result.imported) {
        setMessage(`Inspection imported from ${result.filePath}`);
        onInspectionImported?.(result.inspectionId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF import failed.');
    } finally {
      setImportingPdf(false);
    }
  };

  const openDataFolder = async () => {
    setOpeningFolder(true);
    setMessage(null);
    setError(null);
    try {
      const result = await window.blazeaudit.database.openDataFolder();
      setMessage(`Opened ${result.path}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open data folder.');
    } finally {
      setOpeningFolder(false);
    }
  };

  const exportBackup = async () => {
    setExportingBackup(true);
    setMessage(null);
    setError(null);
    try {
      const result = await window.blazeaudit.database.exportBackup();
      if (result.saved) {
        setMessage(`Database backup exported to ${result.filePath}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Database export failed.');
    } finally {
      setExportingBackup(false);
    }
  };

  const beginImportBackup = async () => {
    setInspectingBackup(true);
    setMessage(null);
    setError(null);
    try {
      const result = await window.blazeaudit.database.inspectBackup();
      if (!result.canceled) {
        setBackupPreview(result);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Database import failed.');
    } finally {
      setInspectingBackup(false);
    }
  };

  const confirmImportBackup = async () => {
    if (!backupPreview) return;
    const filePath = backupPreview.filePath;
    // Paint the restoring overlay before the (blocking) main-process import.
    flushSync(() => {
      setBackupPreview(null);
      setApplyingBackup(true);
      setError(null);
      setMessage(null);
    });
    try {
      const result = await window.blazeaudit.database.applyBackup(filePath);
      if (result.applied) {
        flushSync(() => {
          setMessage('Database restored. Reloading…');
        });
        window.setTimeout(() => window.location.reload(), 250);
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Database import failed.');
    } finally {
      setApplyingBackup(false);
    }
  };

  const previewCopy = backupPreview ? recencyCopy(backupPreview) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {applyingBackup ? <LoadingOverlay label="Restoring database…" /> : null}
      <p className="text-sm text-neutral-400">
        Import, export, and portability tools for your local BlazeAudit data.
      </p>

      {message && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <Section
        icon={HardDriveDownload}
        title="Full database"
        description="Export or restore the entire encrypted local database — clients, templates, inspections, preferences, company logo, and ID photos — as one .blazebak file. Import works on any PC as long as you are logged in with the same account email."
      >
        <ActionButton
          icon={FolderOpen}
          label="Open data folder"
          loadingLabel="Opening…"
          onClick={() => void openDataFolder()}
          loading={openingFolder}
        />
        {backupEnabled ? (
          <>
            <ActionButton
              icon={Download}
              label="Export database"
              loadingLabel="Exporting…"
              onClick={() => void exportBackup()}
              loading={exportingBackup}
            />
            <ActionButton
              icon={Upload}
              label="Import database"
              loadingLabel="Checking…"
              onClick={() => void beginImportBackup()}
              loading={inspectingBackup || applyingBackup}
            />
          </>
        ) : (
          <>
            <ActionButton icon={Download} label="Export database" disabled hint="Coming soon" />
            <ActionButton icon={Upload} label="Import database" disabled hint="Coming soon" />
          </>
        )}
        {dataDir && (
          <p className="w-full text-xs text-neutral-600">
            <span className="text-neutral-500">Data folder · </span>
            <span className="break-all font-mono">{dataDir}</span>
          </p>
        )}
      </Section>

      <Section
        icon={FileJson}
        title="Schema & PDF portability"
        description="Export a schema kit (JSON Schema, example, and prompt) for an external AI/LLM to turn legacy PDFs into JSON that matches our document model — you run the AI off-app, then bring the result back here. Import that AI-generated JSON, or a BlazeAudit PDF to read embedded document JSON losslessly (no OCR)."
      >
        <ActionButton
          icon={Download}
          label="Export schema kit"
          loadingLabel="Exporting…"
          onClick={() => void exportSchemaKit()}
          loading={exportingKit}
        />
        <ActionButton
          icon={Upload}
          label="Import AI-generated JSON"
          loadingLabel="Importing…"
          onClick={() => void importTemplateJson()}
          loading={importingJson}
        />
        <ActionButton
          icon={FileText}
          label="Import from BlazeAudit PDF"
          loadingLabel="Importing…"
          onClick={() => void importInspectionPdf()}
          loading={importingPdf}
        />
      </Section>

      <Section
        icon={FileSpreadsheet}
        title="Customer list"
        description="Move clients in and out using CSV, Excel, or JSON. Import will match columns to our client fields automatically — including splitting combined values when street, post code, or similar data share one cell."
      >
        <ActionButton
          icon={Download}
          label="Export to CSV"
          loadingLabel="Exporting…"
          onClick={() => void exportCustomersCsv()}
          loading={exporting}
        />
        <ActionButton icon={Download} label="Export to Excel (.xlsx)" disabled hint="Coming soon" />
        <ActionButton icon={Download} label="Export to JSON" disabled hint="Coming soon" />
        <ActionButton
          icon={Upload}
          label="Import from CSV"
          loadingLabel="Importing…"
          onClick={() => void importCustomersCsv()}
          loading={importingClients}
        />
        <ActionButton icon={Upload} label="Import from Excel / JSON" disabled hint="Coming soon" />
      </Section>

      <div className="flex items-center gap-2 text-xs text-neutral-600">
        <Database className="size-3.5" />
        <span>All data stays on this machine unless you export it.</span>
      </div>

      {backupPreview && previewCopy ? (
        <ConfirmDialog
          title={previewCopy.title}
          confirmLabel={applyingBackup ? 'Importing…' : 'Import and replace'}
          cancelLabel="Cancel"
          onConfirm={() => void confirmImportBackup()}
          onCancel={() => {
            if (!applyingBackup) setBackupPreview(null);
          }}
        >
          <p>{previewCopy.body}</p>
          {previewCopy.warnOlder ? (
            <p className="mt-2 text-amber-300/90">
              You can still continue, but anything newer on this PC will be lost.
            </p>
          ) : null}
        </ConfirmDialog>
      ) : null}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Database;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/5 text-neutral-400">
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-neutral-200">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">{description}</p>
          <div className="mt-4 flex flex-wrap gap-2">{children}</div>
        </div>
      </div>
    </section>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  loading,
  loadingLabel,
  hint,
}: {
  icon: typeof Download;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  hint?: string;
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      title={hint}
      className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-neutral-300"
    >
      <Icon className="size-4" />
      {loading ? (loadingLabel ?? 'Working…') : label}
      {hint && disabled && (
        <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[10px] text-neutral-500">
          {hint}
        </span>
      )}
    </button>
  );
}
