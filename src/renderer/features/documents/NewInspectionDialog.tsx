import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { CADENCE_PRESETS, type CadencePreset } from '../../../shared/cadence';
import type { Client } from '../../../shared/types';
import type { TemplateSummary } from '../../../shared/document';
import { inputCls } from '../templates/BlockList';

export function NewInspectionDialog({
  clients,
  templates,
  initialClientId,
  onClose,
  onCreate,
}: {
  clients: Client[];
  templates: TemplateSummary[];
  initialClientId?: string;
  onClose: () => void;
  onCreate: (input: {
    clientId: string;
    templateId: string;
    title: string;
    inspector: string;
    inspectedAt: string;
    cadence: CadencePreset;
  }) => Promise<void>;
}) {
  const [clientId, setClientId] = useState(initialClientId ?? clients[0]?.id ?? '');
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [inspector, setInspector] = useState('');
  const [inspectedAt, setInspectedAt] = useState(new Date().toISOString().slice(0, 10));
  const [cadence, setCadence] = useState<CadencePreset>('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialClientId) setClientId(initialClientId);
  }, [initialClientId]);

  const selectedTemplate = templates.find((t) => t.id === templateId);
  const selectedClient = clients.find((c) => c.id === clientId);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientId || !templateId) {
      setError('Choose a client and template.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const autoTitle =
        title.trim() ||
        `${selectedTemplate?.name ?? 'Inspection'} — ${selectedClient?.name ?? 'Client'}`;
      await onCreate({
        clientId,
        templateId,
        title: autoTitle,
        inspector: inspector.trim(),
        inspectedAt,
        cadence,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create inspection.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-100">New inspection</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
          >
            <X className="size-5" />
          </button>
        </div>

        {clients.length === 0 || templates.length === 0 ? (
          <p className="text-sm text-neutral-400">
            {clients.length === 0
              ? 'Add a client first under Customers.'
              : 'Add or seed a template first under Templates.'}
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-neutral-400">Client</span>
              <select
                className={inputCls}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-neutral-400">Template</span>
              <select
                className={inputCls}
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-neutral-400">Title</span>
              <input
                className={inputCls}
                value={title}
                placeholder={
                  selectedTemplate && selectedClient
                    ? `${selectedTemplate.name} — ${selectedClient.name}`
                    : ''
                }
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-neutral-400">Inspector</span>
                <input
                  className={inputCls}
                  value={inspector}
                  onChange={(e) => setInspector(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-neutral-400">
                  Inspection date
                </span>
                <input
                  className={inputCls}
                  type="date"
                  value={inspectedAt}
                  onChange={(e) => setInspectedAt(e.target.value)}
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-neutral-400">Cadence</span>
              <select
                className={inputCls}
                value={cadence}
                onChange={(e) => setCadence(e.target.value as CadencePreset)}
              >
                {CADENCE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-flame-500 py-2.5 text-sm font-semibold text-white hover:bg-flame-600 disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create draft'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
