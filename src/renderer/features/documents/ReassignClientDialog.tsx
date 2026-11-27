import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Client } from '../../../shared/types';
import { cn } from '../../lib/cn';

export function ReassignClientDialog({
  clients,
  currentClientId,
  documentTitle,
  onClose,
  onReassign,
}: {
  clients: Client[];
  currentClientId: string;
  documentTitle: string;
  onClose: () => void;
  onReassign: (clientId: string) => Promise<void>;
}) {
  const otherClients = clients.filter((client) => client.id !== currentClientId);
  const [clientId, setClientId] = useState(otherClients[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setClientId((prev) =>
      otherClients.some((client) => client.id === prev) ? prev : (otherClients[0]?.id ?? ''),
    );
  }, [clients, currentClientId]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return otherClients;
    return otherClients.filter((client) => client.name.toLowerCase().includes(q));
  }, [otherClients, search]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setError('Choose a client.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onReassign(clientId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reassign document.');
      setLoading(false);
    }
  };

  return (
    <div
      className="ba-modal-overlay fixed inset-0 z-50 grid place-items-center p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(e) => void submit(e)}
        className="ba-modal w-full max-w-md p-4"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-neutral-100">Change Client</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mb-3 text-sm text-neutral-400">
          Move{' '}
          <span className="font-medium text-[var(--ba-text-primary)]">{documentTitle}</span> to
          another client. Report content stays as written.
        </p>

        {otherClients.length === 0 ? (
          <p className="text-sm text-amber-300">No other clients available.</p>
        ) : (
          <div className="mb-3">
            <span className="mb-1 block text-xs font-medium text-neutral-400">Client</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              autoFocus
              className="ba-input mb-2 w-full"
            />
            <div className="max-h-56 overflow-y-auto rounded-lg border border-[var(--ba-panel-border)]">
              {filteredClients.length === 0 ? (
                <p className="px-3 py-2 text-sm text-neutral-500">No clients match.</p>
              ) : (
                <ul className="divide-y divide-[var(--ba-panel-border)]">
                  {filteredClients.map((client) => {
                    const selected = client.id === clientId;
                    return (
                      <li key={client.id}>
                        <button
                          type="button"
                          onClick={() => setClientId(client.id)}
                          className={cn(
                            'flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors',
                            selected
                              ? 'bg-flame-500/15 text-[var(--ba-text-primary)]'
                              : 'text-neutral-200 hover:bg-white/5',
                          )}
                        >
                          <span className="truncate text-sm font-medium">{client.name}</span>
                          {client.address ? (
                            <span className="truncate text-xs text-neutral-500">{client.address}</span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {error ? (
          <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-[var(--ba-panel-border)] pt-3">
          <button type="button" onClick={onClose} className="ba-btn-ghost">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !clientId || otherClients.length === 0}
            className="ba-btn-primary disabled:opacity-50"
          >
            {loading ? 'Reassigning…' : 'Reassign'}
          </button>
        </div>
      </form>
    </div>
  );
}
