import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import type { Client, ClientInput } from '../../../shared/types';
import { cn } from '../../lib/cn';

const EMPTY: ClientInput = {
  name: '',
  address: '',
  contactName: '',
  phone: '',
  email: '',
  notes: '',
};

type EditorState = { mode: 'closed' } | { mode: 'new' } | { mode: 'edit'; client: Client };

export function CustomersScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>({ mode: 'closed' });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setClients(await window.blazeaudit.clients.list());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load clients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleDelete = async (client: Client) => {
    if (!window.confirm(`Delete "${client.name}"? This cannot be undone.`)) return;
    await window.blazeaudit.clients.remove(client.id);
    await refresh();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-400">
          {clients.length} {clients.length === 1 ? 'client' : 'clients'}
        </p>
        <button
          type="button"
          onClick={() => setEditor({ mode: 'new' })}
          className="inline-flex items-center gap-2 rounded-lg bg-flame-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-flame-600"
        >
          <Plus className="size-4" />
          Add client
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : clients.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-white/5 text-neutral-500">
            <Users className="size-7" />
          </div>
          <p className="text-sm text-neutral-400">No clients yet. Add your first one.</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/5">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-neutral-900 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-neutral-100">{client.name}</td>
                  <td className="px-4 py-3 text-neutral-400">{client.contactName || '—'}</td>
                  <td className="px-4 py-3 text-neutral-400">{client.phone || '—'}</td>
                  <td className="px-4 py-3 text-neutral-400">{client.email || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        aria-label={`Edit ${client.name}`}
                        onClick={() => setEditor({ mode: 'edit', client })}
                        className="rounded-md p-1.5 text-neutral-400 hover:bg-white/10 hover:text-neutral-100"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${client.name}`}
                        onClick={() => void handleDelete(client)}
                        className="rounded-md p-1.5 text-neutral-400 hover:bg-red-500/20 hover:text-red-300"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editor.mode !== 'closed' && (
        <ClientEditor
          initial={editor.mode === 'edit' ? editor.client : null}
          onClose={() => setEditor({ mode: 'closed' })}
          onSaved={async () => {
            setEditor({ mode: 'closed' });
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function ClientEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: Client | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<ClientInput>(
    initial
      ? {
          name: initial.name,
          address: initial.address,
          contactName: initial.contactName,
          phone: initial.phone,
          email: initial.email,
          notes: initial.notes,
        }
      : EMPTY,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof ClientInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (initial) await window.blazeaudit.clients.update(initial.id, form);
      else await window.blazeaudit.clients.create(form);
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onMouseDown={onClose}>
      <form
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="flex h-full w-full max-w-md flex-col bg-neutral-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-100">
            {initial ? 'Edit client' : 'New client'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-neutral-400 hover:bg-white/10 hover:text-neutral-100"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <Field label="Name" required>
            <input className={inputCls} value={form.name} onChange={set('name')} autoFocus />
          </Field>
          <Field label="Address">
            <input className={inputCls} value={form.address} onChange={set('address')} />
          </Field>
          <Field label="Contact person">
            <input className={inputCls} value={form.contactName} onChange={set('contactName')} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={form.phone} onChange={set('phone')} />
          </Field>
          <Field label="Email">
            <input className={inputCls} type="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Notes">
            <textarea className={cn(inputCls, 'min-h-24 resize-y')} value={form.notes} onChange={set('notes')} />
          </Field>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/5 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-flame-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-flame-600 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-flame-500';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-neutral-400">
        {label}
        {required && <span className="text-flame-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
