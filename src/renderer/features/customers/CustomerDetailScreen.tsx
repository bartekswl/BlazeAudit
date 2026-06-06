import { useCallback, useEffect, useState } from 'react';
import { FileText, Pencil } from 'lucide-react';
import { formatAddress } from '../../../shared/address';
import type { Client } from '../../../shared/types';
import { cn } from '../../lib/cn';

/** Placeholder until products & documents land in later phases. */
const CLIENT_STATS = {
  products: '—',
  documents: 0,
  lastDocumentDate: '—',
  nextInspectionDue: '—',
} as const;

export function CustomerDetailScreen({
  clientId,
  onEdit,
}: {
  clientId: string;
  onEdit: (client: Client) => void;
}) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.blazeaudit.clients.get(clientId);
      setClient(result);
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
          <button
            type="button"
            onClick={() => onEdit(client)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/5 hover:text-neutral-100"
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
        </div>

        <dl className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-2">
          <DetailField label="Contact" value={client.contactName} />
          <DetailField label="Phone" value={client.phone} />
          <DetailField label="Email" value={client.email} />
          <DetailField label="Address" value={fullAddress} />
        </dl>

        {client.notes.trim() && (
          <p className="mt-2 border-t border-white/5 pt-2 text-xs text-neutral-500">
            <span className="font-medium text-neutral-400">Notes · </span>
            {client.notes.trim()}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/5 pt-2.5 text-[11px] text-neutral-500">
          <Stat label="Products" value={CLIENT_STATS.products} />
          <Stat label="Documents" value={String(CLIENT_STATS.documents)} />
          <Stat label="Last document date" value={CLIENT_STATS.lastDocumentDate} />
          <Stat label="Next inspection due" value={CLIENT_STATS.nextInspectionDue} />
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
        <h3 className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Documents
        </h3>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 text-center">
          <div className="grid size-10 place-items-center rounded-lg bg-white/5 text-neutral-500">
            <FileText className="size-5" />
          </div>
          <p className="text-sm text-neutral-400">No documents for this client yet.</p>
          <p className="max-w-sm text-xs text-neutral-500">
            Inspections and reports will appear here once the document model is built.
          </p>
        </div>
      </section>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  const trimmed = value.trim();
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className={cn('truncate text-xs text-neutral-200', !trimmed && 'text-neutral-600')} title={trimmed || undefined}>
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
