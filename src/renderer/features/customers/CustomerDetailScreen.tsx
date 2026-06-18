import { useCallback, useEffect, useState } from 'react';
import { FileText, Pencil, Plus } from 'lucide-react';
import { formatAddress } from '../../../shared/address';
import { cadenceLabel, isOverdue } from '../../../shared/cadence';
import type { InspectionSummary } from '../../../shared/inspection';
import type { Client } from '../../../shared/types';
import { cn } from '../../lib/cn';

export function CustomerDetailScreen({
  clientId,
  onEdit,
  onNewInspection,
  onOpenInspection,
}: {
  clientId: string;
  onEdit: (client: Client) => void;
  onNewInspection: (clientId: string) => void;
  onOpenInspection: (inspectionId: string) => void;
}) {
  const [client, setClient] = useState<Client | null>(null);
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [stats, setStats] = useState<{
    documentCount: number;
    lastDocumentDate: string | null;
    nextInspectionDue: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [result, rows, clientStats] = await Promise.all([
        window.blazeaudit.clients.get(clientId),
        window.blazeaudit.inspections.list({ clientId }),
        window.blazeaudit.inspections.getClientStats(clientId),
      ]);
      setClient(result);
      setInspections(rows);
      setStats(clientStats);
      setError(result ? null : 'Client not found.');
    } catch (e) {
      setClient(null);
      setError(e instanceof Error ? e.message : 'Failed to load client.');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading…</p>;
  }

  if (error || !client) {
    return <p className="text-sm text-red-300">{error ?? 'Client not found.'}</p>;
  }

  const fullAddress = formatAddress(client);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <section className="shrink-0 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-base font-semibold text-neutral-100">{client.name}</h2>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onNewInspection(clientId)}
              className="inline-flex items-center gap-1.5 rounded-md border border-flame-500/30 bg-flame-500/10 px-2.5 py-1.5 text-xs text-flame-300 transition-colors hover:bg-flame-500/20"
            >
              <Plus className="size-3.5" />
              New inspection
            </button>
            <button
              type="button"
              onClick={() => onEdit(client)}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/5 hover:text-neutral-100"
            >
              <Pencil className="size-3.5" />
              Edit
            </button>
          </div>
        </div>

        <dl className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-2">
          <DetailField label="Contact" value={client.contactName} />
          <DetailField label="Phone" value={client.phone} />
          <DetailField label="Email" value={client.email} />
          <DetailField label="Address" value={fullAddress} />
          <DetailField label="Owner / manager" value={client.ownerManagerName} />
          <DetailField label="Owner / manager phone" value={client.ownerManagerPhone} />
          <DetailField label="Signal receiving center" value={client.signalReceivingCenterName} />
          <DetailField
            label="Signal receiving center phone"
            value={client.signalReceivingCenterPhone}
          />
        </dl>

        {client.notes.trim() && (
          <p className="mt-2 border-t border-white/5 pt-2 text-xs text-neutral-500">
            <span className="font-medium text-neutral-400">Notes · </span>
            {client.notes.trim()}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/5 pt-2.5 text-[11px] text-neutral-500">
          <Stat label="Documents" value={String(stats?.documentCount ?? 0)} />
          <Stat label="Last document date" value={stats?.lastDocumentDate ?? '—'} />
          <Stat
            label="Next inspection due"
            value={
              stats?.nextInspectionDue
                ? `${stats.nextInspectionDue}${isOverdue(stats.nextInspectionDue) ? ' (overdue)' : ''}`
                : '—'
            }
          />
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
        <h3 className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Documents
        </h3>
        {inspections.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 text-center">
            <div className="grid size-10 place-items-center rounded-lg bg-white/5 text-neutral-500">
              <FileText className="size-5" />
            </div>
            <p className="text-sm text-neutral-400">No documents for this client yet.</p>
            <button
              type="button"
              onClick={() => onNewInspection(clientId)}
              className="text-sm text-flame-400 hover:text-flame-300"
            >
              Create first inspection
            </button>
          </div>
        ) : (
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {inspections.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => onOpenInspection(row.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-white/5 bg-neutral-950/40 px-3 py-2.5 text-left transition-colors hover:border-white/10 hover:bg-white/[0.03]"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/5 text-neutral-500">
                    <FileText className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-neutral-100">
                      {row.title}
                    </span>
                    <span className="block truncate text-xs text-neutral-500">
                      {row.status}
                      {row.inspectedAt ? ` · ${row.inspectedAt}` : ''}
                      {row.cadence ? ` · ${cadenceLabel(row.cadence)}` : ''}
                      {row.nextDueAt
                        ? ` · due ${row.nextDueAt}${isOverdue(row.nextDueAt) ? ' (overdue)' : ''}`
                        : ''}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px]',
                      row.status === 'complete'
                        ? 'border border-emerald-500/30 text-emerald-300'
                        : 'border border-amber-500/30 text-amber-300',
                    )}
                  >
                    {row.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  const trimmed = value.trim();
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd
        className={cn('truncate text-xs text-neutral-200', !trimmed && 'text-neutral-600')}
        title={trimmed || undefined}
      >
        {trimmed || '—'}
      </dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="text-neutral-600">{label}</span>{' '}
      <span className="font-medium text-neutral-400">{value}</span>
    </span>
  );
}
