import { useCallback, useState } from 'react';
import type { Block, BlockPath, Template } from '../../../shared/document';
import { BlockFillIn } from '../documents/BlockFillIn';
import { useRegisterDocumentOutline } from '../documents/DocumentOutlineContext';

export function BuiltinTemplateViewer({
  template,
  onBack,
}: {
  template: Template;
  onBack: () => void;
}) {
  const [document] = useState(template.document);

  useRegisterDocumentOutline(document.blocks);

  const noopValueChange = useCallback((_path: BlockPath, _value: unknown) => {}, []);
  const noopPatchBlocks = useCallback((_mutator: (blocks: Block[]) => Block[]) => {}, []);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-neutral-500">Built-in template · v{template.version}</p>
          {template.description ? (
            <p className="mt-0.5 truncate text-sm text-neutral-400">{template.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 hover:bg-white/5"
        >
          Back
        </button>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">
        <BlockFillIn
          blocks={document.blocks}
          onValueChange={noopValueChange}
          onPatchBlocks={noopPatchBlocks}
          canEditStructure={false}
          readOnly
        />
      </div>
    </div>
  );
}
