import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { CADENCE_PRESETS, type CadencePreset } from '../../../shared/cadence';
import { todayLocalIsoDate, validateInspectionDate } from '../../../shared/dates';
import type { Inspector } from '../../../shared/profile';
import type { Client } from '../../../shared/types';
import type { TemplateSummary } from '../../../shared/document';
import { InspectionDateField } from '../../components/InspectionDateField';
import { inputCls } from '../templates/BlockList';

const selectCls = 'ba-select';

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
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [inspectorsLoading, setInspectorsLoading] = useState(true);
  const [inspectedAt, setInspectedAt] = useState(todayLocalIsoDate);
  const [cadence, setCadence] = useState<CadencePreset>('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialClientId) setClientId(initialClientId);
  }, [initialClientId]);

  useEffect(() => {
    setInspectorsLoading(true);
    void window.blazeaudit.profile
      .listInspectors()
      .then((rows) => {
        setInspectors(rows);
        if (rows.length > 0) setInspector(rows[0].name);
      })
      .finally(() => setInspectorsLoading(false));
  }, []);

  const selectedTemplate = templates.find((t) => t.id === templateId);
  const selectedClient = clients.find((c) => c.id === clientId);
  const canCreate =
    clients.length > 0 && templates.length > 0 && !inspectorsLoading && inspectors.length > 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientId || !templateId) {
      setError('Choose a client and template.');
      return;
    }
    if (!inspector) {
      setError('Choose an inspector.');
      return;
    }
    const dateError = validateInspectionDate(inspectedAt);
    if (dateError) {
      setError(dateError);
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
        inspector,
        inspectedAt,
        cadence,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create inspection.');
      setLoading(false);
    }
  };

  return (
    <div className="ba-modal-overlay fixed inset-0 z-50 grid place-items-center p-4">
      <div className="ba-modal w-full max-w-lg p-6">
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

        {inspectorsLoading ? (
          <p className="text-sm text-neutral-400">Loading inspectors…</p>
        ) : clients.length === 0 || templates.length === 0 ? (
          <p className="text-sm text-neutral-400">
            {clients.length === 0
              ? 'Add a client first under Customers.'
              : 'Add or seed a template first under Templates.'}
          </p>
        ) : inspectors.length === 0 ? (
          <p className="text-sm text-neutral-400">
            Add at least one inspector in Settings → User profile before creating an inspection.
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
                className={selectCls}
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
                className={selectCls}
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
                <select
                  className={selectCls}
                  value={inspector}
                  onChange={(e) => setInspector(e.target.value)}
                >
                  {inspectors.map((row) => (
                    <option key={row.id} value={row.name}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-neutral-400">
                  Inspection date
                </span>
                <InspectionDateField value={inspectedAt} onChange={setInspectedAt} />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-neutral-400">Cadence</span>
              <select
                className={selectCls}
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
              disabled={loading || !canCreate}
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
