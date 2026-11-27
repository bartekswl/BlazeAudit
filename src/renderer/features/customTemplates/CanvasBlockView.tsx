import { useRef } from 'react';
import { ImagePlus, Plus, X } from 'lucide-react';
import {
  DEFAULT_TABLE_COL_WIDTH,
  DEFAULT_TABLE_ROW_HEIGHT,
  newBlockId,
  readTableValue,
} from '../../../shared/document';
import type { Block, ChecklistItem, TableColumn } from '../../../shared/document';
import { cn } from '../../lib/cn';
import { gridSpanToMm, type GridBox } from './pageModel';

export function CanvasBlockView({
  block,
  box,
  editable,
  selected,
  onPatchBlock,
}: {
  block: Block;
  box: GridBox;
  editable: boolean;
  selected: boolean;
  onPatchBlock: (updater: (current: Block) => Block) => void;
}) {
  const stopDragFromInput = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
  };

  switch (block.type) {
    case 'heading': {
      const level = Math.min(3, Math.max(1, Number(block.config.level ?? 2)));
      const text = (block.config.text as string) ?? '';
      const sizeCls =
        level === 1
          ? 'text-[13px] font-extrabold tracking-wide uppercase'
          : level === 2
            ? 'text-[11.5px] font-bold tracking-wide'
            : 'text-[10.5px] font-semibold';

      return (
        <div className="ct-heading-banner">
          {editable ? (
            <input
              type="text"
              value={text}
              onPointerDown={stopDragFromInput}
              onChange={(e) =>
                onPatchBlock((cur) => ({
                  ...cur,
                  config: { ...cur.config, text: e.target.value },
                }))
              }
              placeholder="Section heading…"
              className={cn('ct-inline-input', sizeCls)}
            />
          ) : (
            <span className={cn('truncate', sizeCls)}>{text || 'Section'}</span>
          )}
        </div>
      );
    }

    case 'paragraph': {
      const text = (block.config.text as string) ?? '';
      return (
        <div className="flex h-full w-full flex-col overflow-hidden rounded border border-[var(--ct-line-soft)] border-l-[3px] border-l-slate-500 bg-[var(--ct-surface-card)] px-2.5 py-1.5 text-[10px] leading-snug text-[var(--ct-ink-secondary)]">
          {editable ? (
            <textarea
              value={text}
              onPointerDown={stopDragFromInput}
              onChange={(e) =>
                onPatchBlock((cur) => ({
                  ...cur,
                  config: { ...cur.config, text: e.target.value },
                }))
              }
              placeholder="Enter static instruction, code reference, or note…"
              className="ct-inline-input h-full w-full resize-none leading-snug"
            />
          ) : (
            <p className="whitespace-pre-wrap">{text}</p>
          )}
        </div>
      );
    }

    case 'textField': {
      const multiline = Boolean(block.config.multiline);
      const placeholder = (block.config.placeholder as string) ?? '';
      return (
        <div className="ct-field-card rounded border border-[var(--ct-line-soft)] bg-[var(--ct-surface-card)]">
          <div className="ct-field-label">
            {editable ? (
              <input
                type="text"
                value={block.label ?? ''}
                onPointerDown={stopDragFromInput}
                onChange={(e) =>
                  onPatchBlock((cur) => ({ ...cur, label: e.target.value }))
                }
                placeholder="FIELD LABEL"
                className="ct-inline-input uppercase"
              />
            ) : (
              <span>{block.label || 'Field'}</span>
            )}
          </div>
          <div className="ct-field-input-well flex items-start">
            {editable ? (
              multiline ? (
                <textarea
                  value={placeholder}
                  onPointerDown={stopDragFromInput}
                  onChange={(e) =>
                    onPatchBlock((cur) => ({
                      ...cur,
                      config: { ...cur.config, placeholder: e.target.value },
                    }))
                  }
                  placeholder="Optional field hint / placeholder…"
                  className="ct-inline-input h-full w-full resize-none text-[10px] italic text-[var(--ct-ink-muted)] placeholder:text-[var(--ct-ink-faint)]"
                />
              ) : (
                <input
                  type="text"
                  value={placeholder}
                  onPointerDown={stopDragFromInput}
                  onChange={(e) =>
                    onPatchBlock((cur) => ({
                      ...cur,
                      config: { ...cur.config, placeholder: e.target.value },
                    }))
                  }
                  placeholder="Optional placeholder…"
                  className="ct-inline-input text-[10px] italic text-[var(--ct-ink-muted)] placeholder:text-[var(--ct-ink-faint)]"
                />
              )
            ) : (
              <span className="text-[10px] italic text-[var(--ct-ink-faint)]">
                {placeholder || '\u00a0'}
              </span>
            )}
          </div>
        </div>
      );
    }

    case 'lines': {
      const count = Math.max(1, Math.min(40, Number(block.config.count ?? 4)));
      return (
        <div className="ct-lined-notes-panel">
          <div className="ct-lined-notes-header">
            {editable ? (
              <input
                type="text"
                value={block.label ?? ''}
                onPointerDown={stopDragFromInput}
                onChange={(e) =>
                  onPatchBlock((cur) => ({ ...cur, label: e.target.value }))
                }
                placeholder="NOTES SECTION TITLE"
                className="ct-inline-input uppercase text-white placeholder:text-white/50"
              />
            ) : (
              <span className="truncate">{block.label || 'Notes'}</span>
            )}
            <span className="shrink-0 text-[8.5px] font-medium opacity-75">
              {count} {count === 1 ? 'line' : 'lines'}
            </span>
          </div>
          <div className="ct-lined-notes-rows">
            {Array.from({ length: count }).map((_, idx) => (
              <div key={idx} className="ct-lined-rule" />
            ))}
          </div>
        </div>
      );
    }

    case 'checklist':
      return (
        <ChecklistBlockCanvas
          block={block}
          editable={editable}
          selected={selected}
          onPatchBlock={onPatchBlock}
        />
      );

    case 'table':
      return (
        <TableBlockCanvas
          block={block}
          editable={editable}
          selected={selected}
          onPatchBlock={onPatchBlock}
        />
      );

    case 'signature':
      return (
        <div className="ct-signoff-panel">
          <div className="ct-panel-caption">
            {editable ? (
              <input
                type="text"
                value={block.label ?? ''}
                onPointerDown={stopDragFromInput}
                onChange={(e) =>
                  onPatchBlock((cur) => ({ ...cur, label: e.target.value }))
                }
                placeholder="TECHNICIAN AFFIRMATION"
                className="ct-inline-input uppercase"
              />
            ) : (
              <span className="truncate">{block.label || 'Signature'}</span>
            )}
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2 px-2.5 py-1.5 text-[9.5px]">
            <div className="flex flex-col justify-between border-b border-[var(--ct-line-strong)] pb-1">
              <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--ct-ink-muted)]">
                Inspector / Technician Name
              </span>
              <span className="text-[9.5px] italic text-[var(--ct-ink-faint)]">[Print Name]</span>
            </div>
            <div className="flex flex-col justify-between border-b border-[var(--ct-line-strong)] pb-1">
              <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--ct-ink-muted)]">
                Date Signed
              </span>
              <span className="text-[9.5px] italic text-[var(--ct-ink-faint)]">[YYYY-MM-DD]</span>
            </div>
            <div className="col-span-2 flex items-end justify-between border-b border-[var(--ct-ink-secondary)] pb-0.5 pt-1">
              <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--ct-ink-muted)]">
                Authorized Signature
              </span>
              <span className="text-[9px] text-[var(--ct-ink-faint)]">×</span>
            </div>
          </div>
        </div>
      );

    case 'image':
      return (
        <div className="flex h-full w-full flex-col justify-between overflow-hidden rounded border border-dashed border-[var(--ct-line-strong)] bg-[var(--ct-surface-subtle)] p-2">
          <div className="flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-wider text-[var(--ct-ink-secondary)]">
            {editable ? (
              <input
                type="text"
                value={block.label ?? ''}
                onPointerDown={stopDragFromInput}
                onChange={(e) =>
                  onPatchBlock((cur) => ({ ...cur, label: e.target.value }))
                }
                placeholder="PHOTO / DIAGRAM CAPTION"
                className="ct-inline-input uppercase"
              />
            ) : (
              <span className="truncate">{block.label || 'Photo'}</span>
            )}
            <span className="shrink-0 font-normal text-[var(--ct-ink-faint)]">
              {gridSpanToMm(box.colSpan)}×{gridSpanToMm(box.rowSpan)} mm
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center text-[var(--ct-ink-faint)]">
            <ImagePlus className="size-4 opacity-70" />
            <span className="text-[9px]">Photo / Diagram Frame</span>
          </div>
        </div>
      );

    case 'spacer': {
      const showRule = block.config.showRule !== false;
      return (
        <div className="flex h-full w-full items-center px-1">
          {showRule ? (
            <div className="h-px w-full border-t border-[var(--ct-line-strong)]" />
          ) : (
            <div className="h-full w-full rounded border border-dashed border-[var(--ct-printable-guide)] opacity-40" />
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

function ChecklistBlockCanvas({
  block,
  editable,
  selected,
  onPatchBlock,
}: {
  block: Block;
  editable: boolean;
  selected: boolean;
  onPatchBlock: (updater: (current: Block) => Block) => void;
}) {
  const items = ((block.config.items as ChecklistItem[] | undefined) ?? []);
  const choiceStyle = block.config.choiceStyle === 'yesNo' ? 'yesNo' : 'passFail';
  const colYes = choiceStyle === 'yesNo' ? 'YES' : 'PASS';
  const colNo = choiceStyle === 'yesNo' ? 'NO' : 'FAIL';
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const stopDrag = (e: React.PointerEvent | React.MouseEvent) => e.stopPropagation();

  const updateItemLabel = (id: string, label: string) => {
    onPatchBlock((cur) => {
      const curItems = (cur.config.items as ChecklistItem[] | undefined) ?? [];
      return {
        ...cur,
        config: {
          ...cur.config,
          items: curItems.map((it) => (it.id === id ? { ...it, label } : it)),
        },
      };
    });
  };

  const insertItemAfter = (afterIndex: number) => {
    const nextId = newBlockId();
    onPatchBlock((cur) => {
      const curItems = [...((cur.config.items as ChecklistItem[] | undefined) ?? [])];
      curItems.splice(afterIndex + 1, 0, {
        id: nextId,
        label: `Checklist item ${curItems.length + 1}`,
      });
      return { ...cur, config: { ...cur.config, items: curItems } };
    });
    window.requestAnimationFrame(() => {
      const el = inputRefs.current[nextId];
      if (el) {
        el.focus();
        el.select();
      }
    });
  };

  const removeItem = (id: string) => {
    onPatchBlock((cur) => {
      const curItems = (cur.config.items as ChecklistItem[] | undefined) ?? [];
      if (curItems.length <= 1) return cur;
      return {
        ...cur,
        config: {
          ...cur.config,
          items: curItems.filter((it) => it.id !== id),
        },
      };
    });
  };

  return (
    <div className="ct-checklist-panel">
      <div className="ct-panel-caption">
        {editable ? (
          <input
            type="text"
            value={block.label ?? ''}
            onPointerDown={stopDrag}
            onChange={(e) =>
              onPatchBlock((cur) => ({ ...cur, label: e.target.value }))
            }
            placeholder="CHECKLIST TITLE"
            className="ct-inline-input uppercase"
          />
        ) : (
          <span className="truncate">{block.label || 'Checklist'}</span>
        )}

        {editable && selected && (
          <button
            type="button"
            onPointerDown={stopDrag}
            onClick={() => insertItemAfter(items.length - 1)}
            className="inline-flex shrink-0 items-center gap-0.5 rounded bg-[#f97316]/20 px-1.5 py-0.5 text-[8.5px] font-bold text-[#f97316] hover:bg-[#f97316]/30"
          >
            <Plus className="size-2.5" />
            Item
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <table className="ct-report-table">
          <thead>
            <tr>
              <th className="ct-report-th w-[26px] text-center">#</th>
              <th className="ct-report-th text-left">Inspection / Verification Item</th>
              <th className="ct-report-th ct-report-th--pass w-[36px]">{colYes}</th>
              <th className="ct-report-th ct-report-th--fail w-[36px]">{colNo}</th>
              <th className="ct-report-th ct-report-th--na w-[36px]">N/A</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} className="group">
                <td className="ct-report-td text-center text-[9.5px] font-semibold text-[var(--ct-ink-muted)]">
                  {idx + 1}
                </td>
                <td className="ct-report-td">
                  <div className="flex items-center gap-1">
                    {editable ? (
                      <input
                        ref={(el) => {
                          inputRefs.current[item.id] = el;
                        }}
                        type="text"
                        value={item.label}
                        onPointerDown={stopDrag}
                        onChange={(e) => updateItemLabel(item.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            insertItemAfter(idx);
                          } else if (
                            e.key === 'Backspace' &&
                            item.label === '' &&
                            items.length > 1
                          ) {
                            e.preventDefault();
                            removeItem(item.id);
                          }
                        }}
                        className="ct-inline-input text-[10px]"
                      />
                    ) : (
                      <span className="truncate text-[10px]">{item.label}</span>
                    )}
                    {editable && selected && items.length > 1 && (
                      <button
                        type="button"
                        onPointerDown={stopDrag}
                        onClick={() => removeItem(item.id)}
                        title="Remove checklist line"
                        className="shrink-0 rounded p-0.5 text-[var(--ct-ink-faint)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                      >
                        <X className="size-2.5" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="ct-report-td text-center">
                  <span className="ct-check-box-dot" />
                </td>
                <td className="ct-report-td text-center">
                  <span className="ct-check-box-dot" />
                </td>
                <td className="ct-report-td text-center">
                  <span className="ct-check-box-dot" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableBlockCanvas({
  block,
  editable,
  selected,
  onPatchBlock,
}: {
  block: Block;
  editable: boolean;
  selected: boolean;
  onPatchBlock: (updater: (current: Block) => Block) => void;
}) {
  const columns = (block.config.columns as TableColumn[] | undefined) ?? [];
  const tableVal = readTableValue(block.value);
  const rows = tableVal.rows;
  const isDanger = block.config.accent === 'danger';

  const totalColWeight = Math.max(
    1,
    columns.reduce((sum, col) => sum + (col.width ?? DEFAULT_TABLE_COL_WIDTH), 0),
  );

  const stopDrag = (e: React.PointerEvent | React.MouseEvent) => e.stopPropagation();

  const updateColTitle = (key: string, title: string) => {
    onPatchBlock((cur) => {
      const curCols = (cur.config.columns as TableColumn[] | undefined) ?? [];
      return {
        ...cur,
        config: {
          ...cur.config,
          columns: curCols.map((c) => (c.key === key ? { ...c, title } : c)),
        },
      };
    });
  };

  const addColumn = () => {
    onPatchBlock((cur) => {
      const curCols = [...((cur.config.columns as TableColumn[] | undefined) ?? [])];
      const nextKey = `col_${newBlockId().slice(0, 6)}`;
      curCols.push({
        key: nextKey,
        title: `Column ${curCols.length + 1}`,
        width: DEFAULT_TABLE_COL_WIDTH,
      });
      const val = readTableValue(cur.value);
      const nextRows = val.rows.map((r) => ({ ...r, [nextKey]: '' }));
      return {
        ...cur,
        config: { ...cur.config, columns: curCols },
        value: { ...val, rows: nextRows },
      };
    });
  };

  const removeColumn = (key: string) => {
    onPatchBlock((cur) => {
      const curCols = (cur.config.columns as TableColumn[] | undefined) ?? [];
      if (curCols.length <= 1) return cur;
      const filtered = curCols.filter((c) => c.key !== key);
      const val = readTableValue(cur.value);
      const nextRows = val.rows.map((r) => {
        const copy = { ...r };
        delete copy[key];
        return copy;
      });
      return {
        ...cur,
        config: { ...cur.config, columns: filtered },
        value: { ...val, rows: nextRows },
      };
    });
  };

  const addStarterRow = () => {
    onPatchBlock((cur) => {
      const curCols = (cur.config.columns as TableColumn[] | undefined) ?? [];
      const val = readTableValue(cur.value);
      const emptyRow: Record<string, string> = {};
      for (const c of curCols) emptyRow[c.key] = '';
      return {
        ...cur,
        value: {
          rows: [...val.rows, emptyRow],
          rowHeights: [...(val.rowHeights ?? []), DEFAULT_TABLE_ROW_HEIGHT],
        },
      };
    });
  };

  const removeStarterRow = (rowIndex: number) => {
    onPatchBlock((cur) => {
      const val = readTableValue(cur.value);
      return {
        ...cur,
        value: {
          rows: val.rows.filter((_, idx) => idx !== rowIndex),
          rowHeights: (val.rowHeights ?? []).filter((_, idx) => idx !== rowIndex),
        },
      };
    });
  };

  const updateStarterCell = (rowIndex: number, colKey: string, text: string) => {
    onPatchBlock((cur) => {
      const val = readTableValue(cur.value);
      const nextRows = val.rows.map((r, idx) =>
        idx === rowIndex ? { ...r, [colKey]: text } : r,
      );
      return {
        ...cur,
        value: { ...val, rows: nextRows },
      };
    });
  };

  return (
    <div className="ct-data-table-panel">
      <div className={cn('ct-accent-strip', isDanger && 'ct-accent-strip--danger')} />
      <div className="ct-panel-caption">
        {editable ? (
          <input
            type="text"
            value={block.label ?? ''}
            onPointerDown={stopDrag}
            onChange={(e) =>
              onPatchBlock((cur) => ({ ...cur, label: e.target.value }))
            }
            placeholder="TABLE TITLE"
            className="ct-inline-input uppercase"
          />
        ) : (
          <span className="truncate">{block.label || 'Table'}</span>
        )}

        {editable && selected && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onPointerDown={stopDrag}
              onClick={addColumn}
              className="inline-flex items-center gap-0.5 rounded bg-[#f97316]/20 px-1.5 py-0.5 text-[8.5px] font-bold text-[#f97316] hover:bg-[#f97316]/30"
            >
              <Plus className="size-2.5" />
              Col
            </button>
            <button
              type="button"
              onPointerDown={stopDrag}
              onClick={addStarterRow}
              className="inline-flex items-center gap-0.5 rounded bg-[#f97316]/20 px-1.5 py-0.5 text-[8.5px] font-bold text-[#f97316] hover:bg-[#f97316]/30"
            >
              <Plus className="size-2.5" />
              Row
            </button>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <table className="ct-report-table">
          <colgroup>
            {columns.map((col) => {
              const pct = ((col.width ?? DEFAULT_TABLE_COL_WIDTH) / totalColWeight) * 100;
              return <col key={col.key} style={{ width: `${pct.toFixed(2)}%` }} />;
            })}
          </colgroup>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="ct-report-th group text-left">
                  <div className="flex items-center gap-0.5">
                    {editable ? (
                      <input
                        type="text"
                        value={col.title}
                        onPointerDown={stopDrag}
                        onChange={(e) => updateColTitle(col.key, e.target.value)}
                        className="ct-inline-input font-bold uppercase"
                      />
                    ) : (
                      <span className="truncate">{col.title}</span>
                    )}
                    {editable && selected && columns.length > 1 && (
                      <button
                        type="button"
                        onPointerDown={stopDrag}
                        onClick={() => removeColumn(col.key)}
                        title="Remove column"
                        className="shrink-0 rounded p-0.5 text-[var(--ct-ink-faint)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                      >
                        <X className="size-2.5" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(1, columns.length)}
                  className="ct-report-td py-2 text-center text-[9.5px] italic text-[var(--ct-ink-faint)]"
                >
                  Dynamic table — rows added during inspection (or click + Row for starter rows)
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="group/row">
                  {columns.map((col, colIdx) => (
                    <td key={col.key} className="ct-report-td relative">
                      <div className="flex items-center gap-0.5">
                        {editable ? (
                          <input
                            type="text"
                            value={row[col.key] ?? ''}
                            onPointerDown={stopDrag}
                            onChange={(e) =>
                              updateStarterCell(rowIdx, col.key, e.target.value)
                            }
                            placeholder="—"
                            className="ct-inline-input text-[9.5px] placeholder:text-[var(--ct-ink-faint)]/60"
                          />
                        ) : (
                          <span className="truncate text-[9.5px]">
                            {row[col.key] || '\u00a0'}
                          </span>
                        )}
                        {editable &&
                          selected &&
                          colIdx === columns.length - 1 && (
                            <button
                              type="button"
                              onPointerDown={stopDrag}
                              onClick={() => removeStarterRow(rowIdx)}
                              title="Remove starter row"
                              className="shrink-0 rounded p-0.5 text-[var(--ct-ink-faint)] opacity-0 transition-opacity group-hover/row:opacity-100 hover:text-red-400"
                            >
                              <X className="size-2.5" />
                            </button>
                          )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
