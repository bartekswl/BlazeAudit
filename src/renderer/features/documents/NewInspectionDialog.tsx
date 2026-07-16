import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { todayLocalIsoDate, validateInspectionDate } from '../../../shared/dates';
import type { TemplateKind, TemplatePickerItem } from '../../../shared/document';
import type { Client } from '../../../shared/types';
import { InspectionDateField } from '../../components/InspectionDateField';

const selectCls = 'ba-select';

function templatePickerKey(kind: TemplateKind, id: string): string {
  return `${kind}:${id}`;
}

function parseTemplatePickerKey(key: string): { kind: TemplateKind; id: string } | null {
  const sep = key.indexOf(':');
  if (sep <= 0) return null;
  const kind = key.slice(0, sep);
  if (kind !== 'builtin' && kind !== 'custom') return null;
  const id = key.slice(sep + 1);
  return id ? { kind, id } : null;
}

export function NewInspectionDialog({
  clients,
  templates,
  initialClientId,
  onClose,
  onCreate,
}: {
  clients: Client[];
  templates: TemplatePickerItem[];
  initialClientId?: string;
  onClose: () => void;
  onCreate: (input: {
    clientId: string;
    templateKind: TemplateKind;
    templateId: string;
    inspectedAt: string;
    projectNumber: string;
  }) => Promise<void>;
}) {
  const [clientId, setClientId] = useState(initialClientId ?? clients[0]?.id ?? '');
  const [templateKey, setTemplateKey] = useState(
    templates[0] ? templatePickerKey(templates[0].kind, templates[0].id) : '',
  );
  const [inspectedAt, setInspectedAt] = useState(todayLocalIsoDate);
  const [projectNumber, setProjectNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialClientId) setClientId(initialClientId);
  }, [initialClientId]);

  useEffect(() => {
    if (templates.length === 0) {
      setTemplateKey('');
      return;
    }
    const current = parseTemplatePickerKey(templateKey);
    const stillValid =
      current &&
      templates.some((t) => t.kind === current.kind && t.id === current.id);
    if (!stillValid) {
      setTemplateKey(templatePickerKey(templates[0].kind, templates[0].id));
    }
  }, [templates, templateKey]);

  const selectedTemplateRef = useMemo(
    () => parseTemplatePickerKey(templateKey),
    [templateKey],
  );
  const canCreate = clients.length > 0 && templates.length > 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientId || !selectedTemplateRef) {
      setError('Choose a client and template.');
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
      await onCreate({
        clientId,
        templateKind: selectedTemplateRef.kind,
        templateId: selectedTemplateRef.id,
        inspectedAt,
        projectNumber: projectNumber.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create inspection.');
      setLoading(false);
    }
  };

  return (
    <div className="ba-modal-overlay fixed inset-0 z-50 grid place-items-center p-4">
      <div className="ba-modal w-full max-w-md p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-neutral-100">New inspection</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
          >
            <X className="size-4" />
          </button>
        </div>

        {clients.length === 0 || templates.length === 0 ? (
          <p className="text-sm text-neutral-400">
            {clients.length === 0
              ? 'Add a client first under Customers.'
              : 'Add a custom template under Templates first.'}
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-400">Template</span>
              <select
                className={selectCls}
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
              >
                {templates.map((template) => {
                  const key = templatePickerKey(template.kind, template.id);
                  const kindLabel = template.kind === 'builtin' ? 'Built-in' : 'Custom';
                  return (
                    <option key={key} value={key}>
                      {template.name} ({kindLabel})
                    </option>
                  );
                })}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-medium text-neutral-400">Client</span>
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
              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-medium text-neutral-400">Date</span>
                <InspectionDateField value={inspectedAt} onChange={setInspectedAt} />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-400">
                Project Number
              </span>
              <input
                type="text"
                className="ba-input"
                value={projectNumber}
                onChange={(e) => setProjectNumber(e.target.value)}
                placeholder="Optional"
              />
            </label>
            <button
              type="submit"
              disabled={loading || !canCreate}
              className="w-full rounded-lg bg-flame-500 py-2 text-sm font-semibold text-white hover:bg-flame-600 disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create draft'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
