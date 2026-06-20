import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react';
import { FileText, Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { validateCountry, validatePhone, validatePostCode, validateProvince } from '../../../shared/address';
import type { Client, ClientInput } from '../../../shared/types';
import { cn } from '../../lib/cn';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CustomerDetailScreen } from './CustomerDetailScreen';
import { filterClients } from './filterClients';
import { inputCls } from '../templates/BlockList';

const EMPTY: ClientInput = {
  name: '',
  street: '',
  unit: '',
  city: '',
  postCode: '',
  country: '',
  province: '',
  contactName: '',
  phone: '',
  email: '',
  ownerManagerName: '',
  ownerManagerPhone: '',
  signalReceivingCenterName: '',
  signalReceivingCenterPhone: '',
  notes: '',
};

type EditorState = { mode: 'closed' } | { mode: 'new' } | { mode: 'edit'; client: Client };

export type CustomerDetailBreadcrumb = {
  clientName: string;
  onBack: () => void;
};

export function CustomersScreen({
  onDetailChange,
  onNewInspection,
  onOpenInspection,
}: {
  onDetailChange?: (detail: CustomerDetailBreadcrumb | null) => void;
  onNewInspection?: (clientId: string) => void;
  onOpenInspection?: (inspectionId: string) => void;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>({ mode: 'closed' });
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<Client | null>(null);
  const [blockedDelete, setBlockedDelete] = useState<{
    client: Client;
    documentCount: number;
  } | null>(null);

  const goBackToList = useCallback(() => {
    setSelectedId(null);
    setSelectedClientName(null);
  }, []);

  useEffect(() => {
    if (!onDetailChange) return;
    if (selectedId && selectedClientName) {
      onDetailChange({ clientName: selectedClientName, onBack: goBackToList });
    } else {
      onDetailChange(null);
    }
  }, [selectedId, selectedClientName, onDetailChange, goBackToList]);

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

  const filtered = useMemo(() => filterClients(clients, search), [clients, search]);

  const requestDelete = async (client: Client) => {
    setError(null);
    try {
      const stats = await window.blazeaudit.inspections.getClientStats(client.id);
      if (stats.documentCount > 0) {
        setBlockedDelete({ client, documentCount: stats.documentCount });
        return;
      }
      setPendingDelete(client);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to check customer documents.');
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await window.blazeaudit.clients.remove(pendingDelete.id);
      if (selectedId === pendingDelete.id) goBackToList();
      setPendingDelete(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete customer.');
      setPendingDelete(null);
    }
  };

  const deleteConfirmDialog = pendingDelete ? (
    <ConfirmDialog
      title="Delete customer?"
      icon={Trash2}
      confirmLabel="Delete"
      onCancel={() => setPendingDelete(null)}
      onConfirm={() => void confirmDelete()}
    >
      <p>
        <span className="font-medium text-[var(--ba-text-primary)]">{pendingDelete.name}</span>{' '}
        will be permanently deleted.
      </p>
      <p>This cannot be undone.</p>
    </ConfirmDialog>
  ) : null;

  const blockedDeleteDialog = blockedDelete ? (
    <ConfirmDialog
      title="Cannot delete customer"
      icon={FileText}
      confirmLabel="OK"
      showCancel={false}
      onCancel={() => setBlockedDelete(null)}
      onConfirm={() => setBlockedDelete(null)}
    >
      <p>
        <span className="font-medium text-[var(--ba-text-primary)]">{blockedDelete.client.name}</span>{' '}
        has {blockedDelete.documentCount}{' '}
        {blockedDelete.documentCount === 1 ? 'document' : 'documents'}.
      </p>
      <p>Delete those documents first, then you can remove this customer.</p>
    </ConfirmDialog>
  ) : null;

  if (selectedId) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <CustomerDetailScreen
          key={`${selectedId}-${detailRefreshKey}`}
          clientId={selectedId}
          onEdit={(client) => setEditor({ mode: 'edit', client })}
          onNewInspection={(clientId) => onNewInspection?.(clientId)}
          onOpenInspection={(inspectionId) => onOpenInspection?.(inspectionId)}
        />
        {editor.mode !== 'closed' && (
          <ClientEditor
            initial={editor.mode === 'edit' ? editor.client : null}
            onClose={() => setEditor({ mode: 'closed' })}
            onSaved={async () => {
              setEditor({ mode: 'closed' });
              const updated = await window.blazeaudit.clients.list();
              setClients(updated);
              setError(null);
              setLoading(false);
              if (selectedId) {
                const match = updated.find((c) => c.id === selectedId);
                if (match) setSelectedClientName(match.name);
              }
              setDetailRefreshKey((k) => k + 1);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by building, contact person, or address…"
            className="ba-search"
          />
        </div>
        <button
          type="button"
          onClick={() => setEditor({ mode: 'new' })}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-flame-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-flame-600"
        >
          <Plus className="size-4" />
          Add client
        </button>
      </div>

      <p className="mb-4 text-sm text-neutral-400">
        {search.trim()
          ? `${filtered.length} of ${clients.length} ${clients.length === 1 ? 'client' : 'clients'}`
          : `${clients.length} ${clients.length === 1 ? 'client' : 'clients'}`}
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : clients.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-[var(--ba-flame-soft)] text-[var(--ba-flame)] shadow-md shadow-flame-500/15">
            <Users className="size-7" />
          </div>
          <p className="text-sm text-neutral-400">No clients yet. Add your first one.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-[var(--ba-flame-soft)] text-[var(--ba-flame)] shadow-md shadow-flame-500/15">
            <Search className="size-7" />
          </div>
          <p className="text-sm text-neutral-400">No clients match your search.</p>
        </div>
      ) : (
        <div className="ba-table-wrap min-h-0 flex-1 overflow-y-auto">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="ba-table-head sticky top-0 text-xs uppercase tracking-wide text-[var(--ba-text-secondary)]">
              <tr>
                <th className="w-[18%] px-4 py-3 font-medium">Building name</th>
                <th className="w-[14%] px-4 py-3 font-medium">Contact person</th>
                <th className="w-[12%] px-4 py-3 font-medium">Phone</th>
                <th className="w-[18%] px-4 py-3 font-medium">Email</th>
                <th className="w-[30%] px-4 py-3 font-medium">Address</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => {
                    setSelectedId(client.id);
                    setSelectedClientName(client.name);
                  }}
                  className="cursor-pointer border-t border-[var(--ba-panel-border)] hover:bg-[var(--ba-row-hover-bg)]"
                >
                  <TruncateCell value={client.name} className="font-medium" />
                  <TruncateCell value={client.contactName} />
                  <TruncateCell value={client.phone} />
                  <TruncateCell value={client.email} />
                  <TruncateCell value={client.address} />
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        aria-label={`Edit ${client.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditor({ mode: 'edit', client });
                        }}
                        className="rounded-md p-1.5 text-[var(--ba-text-muted)] hover:bg-[var(--ba-hover-bg)] hover:text-[var(--ba-text-primary)]"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${client.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          void requestDelete(client);
                        }}
                        className="rounded-md p-1.5 text-[var(--ba-text-muted)] hover:bg-red-500/20 hover:text-red-300"
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

      {deleteConfirmDialog}
      {blockedDeleteDialog}
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
          street: initial.street,
          unit: initial.unit,
          city: initial.city,
          postCode: initial.postCode,
          country: initial.country,
          province: initial.province,
          contactName: initial.contactName,
          phone: initial.phone,
          email: initial.email,
          ownerManagerName: initial.ownerManagerName,
          ownerManagerPhone: initial.ownerManagerPhone,
          signalReceivingCenterName: initial.signalReceivingCenterName,
          signalReceivingCenterPhone: initial.signalReceivingCenterPhone,
          notes: initial.notes,
        }
      : EMPTY,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ClientInput, string>>>({});

  const set = (key: keyof ClientInput) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((errs) => {
      const next = { ...errs };
      delete next[key];
      return next;
    });
  };

  const validateForm = (): boolean => {
    const errs: Partial<Record<keyof ClientInput, string>> = {};
    if (!form.name.trim()) errs.name = 'Building name is required.';

    const postCodeErr = validatePostCode(form.postCode ?? '');
    if (postCodeErr) errs.postCode = postCodeErr;
    const countryErr = validateCountry(form.country ?? '');
    if (countryErr) errs.country = countryErr;
    const provinceErr = validateProvince(form.province ?? '');
    if (provinceErr) errs.province = provinceErr;

    const contactPhoneErr = validatePhone(form.phone ?? '');
    if (contactPhoneErr) errs.phone = contactPhoneErr;
    const ownerPhoneErr = validatePhone(form.ownerManagerPhone ?? '');
    if (ownerPhoneErr) errs.ownerManagerPhone = ownerPhoneErr;
    const signalPhoneErr = validatePhone(form.signalReceivingCenterPhone ?? '');
    if (signalPhoneErr) errs.signalReceivingCenterPhone = signalPhoneErr;

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;
    setSaving(true);
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
    <div className="ba-modal-overlay fixed inset-0 z-50 flex justify-end" onMouseDown={onClose}>
      <form
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="ba-drawer flex h-full w-full max-w-md flex-col"
      >
        <div className="flex items-center justify-between border-b border-[var(--ba-panel-border)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--ba-text-primary)]">
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
          <Field label="Building name" required error={fieldErrors.name}>
            <input className={inputCls} value={form.name} onChange={set('name')} autoFocus />
          </Field>

          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Address</p>
          <Field label="Street" error={fieldErrors.street}>
            <input className={inputCls} value={form.street} onChange={set('street')} />
          </Field>
          <Field label="Unit / suite" error={fieldErrors.unit}>
            <input className={inputCls} value={form.unit} onChange={set('unit')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" error={fieldErrors.city}>
              <input className={inputCls} value={form.city} onChange={set('city')} />
            </Field>
            <Field label="Post code" error={fieldErrors.postCode}>
              <input
                className={inputCls}
                value={form.postCode}
                onChange={set('postCode')}
                placeholder="A1A 1A1"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Province" error={fieldErrors.province}>
              <input
                className={inputCls}
                value={form.province}
                onChange={set('province')}
                placeholder="ON"
              />
            </Field>
            <Field label="Country" error={fieldErrors.country}>
              <input
                className={inputCls}
                value={form.country}
                onChange={set('country')}
                placeholder="Canada"
              />
            </Field>
          </div>

          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Contact person</p>
          <Field label="Name">
            <input className={inputCls} value={form.contactName} onChange={set('contactName')} />
          </Field>
          <Field label="Phone" error={fieldErrors.phone}>
            <input
              className={inputCls}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="416-555-0100"
              value={form.phone}
              onChange={set('phone')}
            />
          </Field>
          <Field label="Email">
            <input className={inputCls} type="email" value={form.email} onChange={set('email')} />
          </Field>

          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Owner / manager</p>
          <Field label="Name">
            <input
              className={inputCls}
              value={form.ownerManagerName}
              onChange={set('ownerManagerName')}
            />
          </Field>
          <Field label="Phone" error={fieldErrors.ownerManagerPhone}>
            <input
              className={inputCls}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="416-555-0100"
              value={form.ownerManagerPhone}
              onChange={set('ownerManagerPhone')}
            />
          </Field>

          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Signal receiving center
          </p>
          <Field label="Name">
            <input
              className={inputCls}
              value={form.signalReceivingCenterName}
              onChange={set('signalReceivingCenterName')}
            />
          </Field>
          <Field label="Phone" error={fieldErrors.signalReceivingCenterPhone}>
            <input
              className={inputCls}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="416-555-0100"
              value={form.signalReceivingCenterPhone}
              onChange={set('signalReceivingCenterPhone')}
            />
          </Field>

          <Field label="Notes">
            <textarea className={cn(inputCls, 'min-h-24 resize-y')} value={form.notes} onChange={set('notes')} />
          </Field>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--ba-panel-border)] px-6 py-4">
          <button type="button" onClick={onClose} className="ba-btn-ghost">
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

/** Truncated table cell; native tooltip shows the full value on hover. */
function TruncateCell({ value, className }: { value: string; className?: string }) {
  const trimmed = value.trim();
  const isEmpty = !trimmed;
  return (
    <td
      className={cn(
        'truncate px-4 py-3',
        isEmpty ? 'text-[var(--ba-text-faint)]' : 'text-[var(--ba-text-primary)]',
        className,
      )}
      title={trimmed || undefined}
    >
      {trimmed || '—'}
    </td>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="ba-field-label">
        {label}
        {required && <span className="text-flame-500"> *</span>}
      </span>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </label>
  );
}
