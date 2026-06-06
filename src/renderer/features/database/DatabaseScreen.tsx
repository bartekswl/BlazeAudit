import { useState, type ReactNode } from 'react';
import {
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  HardDriveDownload,
  Upload,
} from 'lucide-react';
import { CLIENT_SPREADSHEET_COLUMNS } from '../../../shared/clientColumns';

export function DatabaseScreen() {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        description="Export or restore the entire encrypted local database — clients, templates, inspections, and settings."
      >
        <ActionButton icon={Download} label="Export database" disabled hint="Coming soon" />
        <ActionButton icon={Upload} label="Import database" disabled hint="Coming soon" />
      </Section>

      <Section
        icon={FileJson}
        title="Schema & PDF portability"
        description="Export the document JSON schema kit for external tools and PDF round-trip re-import."
      >
        <ActionButton icon={Download} label="Export schema kit" disabled hint="Coming soon" />
      </Section>

      <Section
        icon={FileSpreadsheet}
        title="Customer list"
        description="Move clients in and out using spreadsheets. Excel (.xlsx) and CSV import will map columns to the fields below."
      >
        <ActionButton
          icon={Download}
          label="Export to CSV"
          onClick={() => void exportCustomersCsv()}
          loading={exporting}
        />
        <ActionButton icon={Download} label="Export to Excel (.xlsx)" disabled hint="Coming soon" />
        <ActionButton
          icon={Upload}
          label="Import from CSV / Excel"
          disabled
          hint="Coming soon"
        />
      </Section>

      <section className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-medium text-neutral-200">Customer spreadsheet columns</h3>
        <p className="mt-1 text-xs text-neutral-500">
          Exports and imports use these headers, matching the customer editor fields.
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900/80 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Column</th>
                <th className="px-4 py-2.5 font-medium">Required</th>
              </tr>
            </thead>
            <tbody>
              {CLIENT_SPREADSHEET_COLUMNS.map((col) => (
                <tr key={col.key} className="border-t border-white/5">
                  <td className="px-4 py-2.5 text-neutral-200">{col.header}</td>
                  <td className="px-4 py-2.5 text-neutral-500">
                    {'required' in col && col.required ? 'Yes' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
  hint,
}: {
  icon: typeof Download;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
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
      {loading ? 'Exporting…' : label}
      {hint && disabled && (
        <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[10px] text-neutral-500">
          {hint}
        </span>
      )}
    </button>
  );
}
