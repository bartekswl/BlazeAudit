import { useEffect, useState, type ReactNode } from 'react';
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

export function DatabaseScreen() {
  const [dataDir, setDataDir] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [openingFolder, setOpeningFolder] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
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
        description="Export or restore the entire encrypted local database — clients, templates, inspections, and settings. On a normal install the database lives in your Windows AppData folder."
      >
        <ActionButton
          icon={FolderOpen}
          label="Open data folder"
          loadingLabel="Opening…"
          onClick={() => void openDataFolder()}
          loading={openingFolder}
        />
        <ActionButton icon={Download} label="Export database" disabled hint="Coming soon" />
        <ActionButton icon={Upload} label="Import database" disabled hint="Coming soon" />
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
        <ActionButton icon={Download} label="Export schema kit" disabled hint="Coming soon" />
        <ActionButton icon={Upload} label="Import AI-generated JSON" disabled hint="Coming soon" />
        <ActionButton
          icon={FileText}
          label="Import from BlazeAudit PDF"
          disabled
          hint="Coming soon"
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
          label="Import from CSV / Excel / JSON"
          disabled
          hint="Coming soon"
        />
      </Section>

      <div className="flex items-center gap-2 text-xs text-neutral-600">
        <Database className="size-3.5" />
        <span>All data stays on this machine unless you export it.</span>
      </div>
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
