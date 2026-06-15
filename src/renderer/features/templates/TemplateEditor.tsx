import { useCallback, useMemo, useState } from 'react';
import { Plus, Save } from 'lucide-react';
import type { BlockPath, BlockType, Document, Template } from '../../../shared/document';
import { emptyDocument, findBlockPath, insertBlock, moveBlock, removeBlock } from '../../../shared/document';
import { useRegisterDocumentOutline } from '../documents/DocumentOutlineContext';
import { BlockEditor } from './BlockEditor';
import { BlockList, inputCls } from './BlockList';
import { BLOCK_CATALOG } from './blockCatalog';

function getBlockAt(blocks: Document['blocks'], path: BlockPath) {
  let current = blocks;
  let node = null;
  for (let i = 0; i < path.length; i++) {
    node = current[path[i]];
    if (!node) return null;
    if (i < path.length - 1) {
      if (!node.children) return null;
      current = node.children;
    }
  }
  return node;
}

export function TemplateEditor({
  templateId,
  initial,
  onSaved,
  onCancel,
}: {
  templateId: string | null;
  initial?: Template;
  onSaved: (template: Template) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? 'New template');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [document, setDocument] = useState<Document>(
    initial?.document ?? emptyDocument({ title: 'New template' }),
  );
  const [selectedPath, setSelectedPath] = useState<BlockPath | null>(null);
  const [addType, setAddType] = useState<BlockType>('paragraph');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insertParentPath = useMemo(() => {
    if (!selectedPath) return [];
    const selected = getBlockAt(document.blocks, selectedPath);
    if (selected?.type === 'section') return selectedPath;
    return [];
  }, [document.blocks, selectedPath]);

  const handleOutlineNavigate = useCallback(
    (blockId: string) => {
      const path = findBlockPath(document.blocks, blockId);
      if (path) setSelectedPath(path);
    },
    [document.blocks],
  );

  useRegisterDocumentOutline(document.blocks, handleOutlineNavigate);

  const syncMeta = (nextName: string, doc: Document): Document => ({
    ...doc,
    meta: {
      ...doc.meta,
      title: nextName,
      clientId: null,
      inspectionDate: null,
    },
  });

  const handleNameChange = (value: string) => {
    setName(value);
    setDocument((prev) => syncMeta(value, prev));
  };

  const addBlock = () => {
    setDocument((prev) => {
      const synced = syncMeta(name, prev);
      return { ...synced, blocks: insertBlock(synced.blocks, insertParentPath, addType) };
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        document: syncMeta(name.trim(), document),
      };
      const saved = templateId
        ? await window.blazeaudit.templates.update(templateId, payload)
        : await window.blazeaudit.templates.create(payload);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-neutral-500">
            {templateId ? `Editing · v${initial?.version ?? 1}` : 'New template'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 hover:bg-white/5"
          >
            Back
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="inline-flex items-center gap-2 rounded-lg bg-flame-500 px-3 py-2 text-sm font-semibold text-white hover:bg-flame-600 disabled:opacity-50"
          >
            <Save className="size-4" />
            {saving ? 'Saving…' : 'Save template'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid shrink-0 gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-neutral-400">Template name</span>
          <input className={inputCls} value={name} onChange={(e) => handleNameChange(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-neutral-400">Inspection type</span>
          <input
            className={inputCls}
            value={document.meta.inspectionType}
            onChange={(e) =>
              setDocument((prev) => ({
                ...prev,
                meta: { ...prev.meta, inspectionType: e.target.value },
              }))
            }
          />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-neutral-400">Description</span>
          <input
            className={inputCls}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden gap-3">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-neutral-100">Body blocks</h2>
              <p className="text-xs text-neutral-500">
                {insertParentPath.length > 0
                  ? 'New blocks will be added inside the selected section.'
                  : 'Add blocks to the template body.'}
              </p>
            </div>
            <select
              className={`${inputCls} w-auto min-w-36`}
              value={addType}
              onChange={(e) => setAddType(e.target.value as BlockType)}
            >
              {BLOCK_CATALOG.map((item) => (
                <option key={item.type} value={item.type}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addBlock}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-200 hover:bg-white/5"
            >
              <Plus className="size-4" />
              Add block
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <BlockList
              blocks={document.blocks}
              pathPrefix={[]}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
              onMove={(path, direction) =>
                setDocument((prev) => ({ ...prev, blocks: moveBlock(prev.blocks, path, direction) }))
              }
              onRemove={(path) => {
                setDocument((prev) => ({ ...prev, blocks: removeBlock(prev.blocks, path) }));
                if (selectedPath && path.join('.') === selectedPath.join('.')) {
                  setSelectedPath(null);
                }
              }}
            />
          </div>
        </section>

        <section className="flex min-h-0 w-80 shrink-0 flex-col rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {selectedPath ? (
              <BlockEditor
                document={document}
                path={selectedPath}
                onChange={setDocument}
              />
            ) : (
              <p className="text-sm text-neutral-500">
                Select a block to edit headings, tables, checklist lines, and more.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
