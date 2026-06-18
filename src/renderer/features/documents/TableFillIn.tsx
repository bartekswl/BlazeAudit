import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';

import { Columns3, Lock, LockOpen, Plus, Trash2 } from 'lucide-react';

import type { Block, BlockPath, TableColumn } from '../../../shared/document';

import {

  addTableColumn,

  addTableRow,

  DEFAULT_TABLE_COL_WIDTH,

  readTableValue,

  removeTableColumn,

  removeTableRow,

  rowHeightAt,

  setTableLayoutLocked,

  updateTableCell,

  updateTableColumn,

  updateTableColumnWidth,

  updateTableRowHeight,

} from '../../../shared/document';



type ColResizeState = { key: string; startX: number; startWidth: number };

type RowResizeState = { index: number; startY: number; startHeight: number };



export function TableFillIn({

  block,

  path,

  onPatchBlocks,

  readOnly = false,

}: {

  block: Block;

  path: BlockPath;

  onPatchBlocks: (mutator: (blocks: Block[]) => Block[]) => void;

  readOnly?: boolean;

}) {

  const columns = (block.config.columns as TableColumn[] | undefined) ?? [];

  const tableValue = readTableValue(block.value);

  const rows = tableValue.rows;

  const rowHeights = tableValue.rowHeights;

  const layoutLocked = Boolean(block.config.layoutLocked);

  if (readOnly) {
    return (
      <div className="min-w-0 overflow-x-auto">
        <p className="mb-2 text-xs font-medium text-neutral-400">{block.label || 'Table'}</p>
        <table className="w-max min-w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="border border-white/10 bg-white/[0.03] px-2 py-1.5 text-left text-xs font-medium text-neutral-300"
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="border border-white/10 px-3 py-4 text-center text-xs text-neutral-500"
                >
                  No rows in this table.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="border border-white/10 px-2 py-1.5 text-xs text-neutral-400"
                    >
                      {row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }



  const [colPreview, setColPreview] = useState<Record<string, number>>({});

  const [rowPreview, setRowPreview] = useState<Record<number, number>>({});

  const [resizingCol, setResizingCol] = useState<ColResizeState | null>(null);

  const [resizingRow, setResizingRow] = useState<RowResizeState | null>(null);



  const tableRef = useRef<HTMLDivElement>(null);

  const onPatchRef = useRef(onPatchBlocks);

  const pathRef = useRef(path);



  useEffect(() => {

    onPatchRef.current = onPatchBlocks;

    pathRef.current = path;

  });



  useEffect(() => {

    if (!resizingCol) return;

    const onMove = (e: MouseEvent) => {

      const delta = e.clientX - resizingCol.startX;

      setColPreview((prev) => ({

        ...prev,

        [resizingCol.key]: resizingCol.startWidth + delta,

      }));

    };

    const onUp = (e: MouseEvent) => {

      const delta = e.clientX - resizingCol.startX;

      const width = resizingCol.startWidth + delta;

      onPatchRef.current((blocks) =>

        updateTableColumnWidth(blocks, pathRef.current, resizingCol.key, width),

      );

      setColPreview((prev) => {

        const next = { ...prev };

        delete next[resizingCol.key];

        return next;

      });

      setResizingCol(null);

    };

    window.addEventListener('mousemove', onMove);

    window.addEventListener('mouseup', onUp);

    return () => {

      window.removeEventListener('mousemove', onMove);

      window.removeEventListener('mouseup', onUp);

    };

  }, [resizingCol]);



  useEffect(() => {

    if (!resizingRow) return;

    const onMove = (e: MouseEvent) => {

      const delta = e.clientY - resizingRow.startY;

      setRowPreview((prev) => ({

        ...prev,

        [resizingRow.index]: resizingRow.startHeight + delta,

      }));

    };

    const onUp = (e: MouseEvent) => {

      const delta = e.clientY - resizingRow.startY;

      const height = resizingRow.startHeight + delta;

      onPatchRef.current((blocks) =>

        updateTableRowHeight(blocks, pathRef.current, resizingRow.index, height),

      );

      setRowPreview((prev) => {

        const next = { ...prev };

        delete next[resizingRow.index];

        return next;

      });

      setResizingRow(null);

    };

    window.addEventListener('mousemove', onMove);

    window.addEventListener('mouseup', onUp);

    return () => {

      window.removeEventListener('mousemove', onMove);

      window.removeEventListener('mouseup', onUp);

    };

  }, [resizingRow]);



  const patch = (mutator: (blocks: Block[]) => Block[]) => onPatchBlocks(mutator);



  const columnWidth = (col: TableColumn) =>

    colPreview[col.key] ?? col.width ?? DEFAULT_TABLE_COL_WIDTH;



  const rowHeight = (rowIndex: number) =>

    rowPreview[rowIndex] ?? rowHeightAt(rowHeights, rowIndex);



  const startColResize = (e: ReactMouseEvent, col: TableColumn) => {

    if (layoutLocked) return;

    e.preventDefault();

    setResizingCol({

      key: col.key,

      startX: e.clientX,

      startWidth: columnWidth(col),

    });

  };



  const startRowResize = (e: ReactMouseEvent, rowIndex: number) => {

    if (layoutLocked) return;

    e.preventDefault();

    setResizingRow({

      index: rowIndex,

      startY: e.clientY,

      startHeight: rowHeight(rowIndex),

    });

  };



  return (

    <div ref={tableRef} className="group/table relative min-w-0 overflow-x-auto">

      <div className="mb-2 flex items-center justify-between gap-2">

        <div className="min-w-0">

          <p className="text-xs font-medium text-neutral-400">{block.label || 'Table'}</p>

          {layoutLocked && (

            <p className="text-[10px] text-neutral-600">Layout locked — sizes apply to PDF export</p>

          )}

        </div>

        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover/table:opacity-100">

          <TableToolButton

            label={layoutLocked ? 'Unlock layout' : 'Lock layout'}

            onClick={() => patch((blocks) => setTableLayoutLocked(blocks, path, !layoutLocked))}

          >

            {layoutLocked ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}

            {layoutLocked ? 'Locked' : 'Lock'}

          </TableToolButton>

          <TableToolButton label="Add column" onClick={() => patch((blocks) => addTableColumn(blocks, path))}>

            <Columns3 className="size-3.5" />

            Column

          </TableToolButton>

          <TableToolButton label="Add row" onClick={() => patch((blocks) => addTableRow(blocks, path))}>

            <Plus className="size-3.5" />

            Row

          </TableToolButton>

        </div>

      </div>



      <table className="w-max min-w-full border-collapse text-sm">

        <colgroup>

          <col style={{ width: 32 }} />

          {columns.map((col) => (

            <col key={col.key} style={{ width: columnWidth(col) }} />

          ))}

        </colgroup>

        <thead>

          <tr>

            <th className="w-8 border border-white/10 bg-white/[0.02] p-0" aria-label="Row actions" />

            {columns.map((col) => {

              const width = columnWidth(col);

              return (

                <th

                  key={col.key}

                  style={{ width, minWidth: width, maxWidth: width }}

                  className={`group/col relative border border-white/10 bg-white/[0.03] p-0 text-left ${

                    resizingCol?.key === col.key ? 'border-flame-500/40' : ''

                  }`}

                >

                  <div className="flex items-center gap-1 px-1 py-1">

                    <input

                      className="min-w-0 flex-1 bg-transparent px-1 py-0.5 text-xs font-medium text-neutral-300 outline-none focus:text-neutral-100"

                      value={col.title}

                      onChange={(e) =>

                        patch((blocks) => updateTableColumn(blocks, path, col.key, e.target.value))

                      }

                    />

                    {columns.length > 1 && (

                      <button

                        type="button"

                        aria-label={`Remove ${col.title}`}

                        onClick={() => patch((blocks) => removeTableColumn(blocks, path, col.key))}

                        className="rounded p-0.5 text-neutral-600 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-300 group-hover/col:opacity-100"

                      >

                        <Trash2 className="size-3" />

                      </button>

                    )}

                  </div>

                  {!layoutLocked && (

                    <div

                      role="separator"

                      aria-orientation="vertical"

                      aria-label={`Resize ${col.title}`}

                      onMouseDown={(e) => startColResize(e, col)}

                      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-flame-500/40"

                    />

                  )}

                </th>

              );

            })}

          </tr>

        </thead>

        <tbody>

          {rows.length === 0 ? (

            <tr>

              <td

                colSpan={columns.length + 1}

                className="border border-white/10 px-3 py-4 text-center text-xs text-neutral-500"

              >

                No rows yet — hover the table and click{' '}

                <button

                  type="button"

                  onClick={() => patch((blocks) => addTableRow(blocks, path))}

                  className="text-flame-400 hover:text-flame-300"

                >

                  + Row

                </button>

              </td>

            </tr>

          ) : (

            rows.map((row, rowIndex) => {

              const height = rowHeight(rowIndex);

              return (

                <tr key={rowIndex} className="group/row">

                  <td

                    style={{ height, maxHeight: height }}

                    className="relative border border-white/10 bg-white/[0.02] p-0 text-center align-top"

                  >

                    <button

                      type="button"

                      aria-label="Remove row"

                      onClick={() => patch((blocks) => removeTableRow(blocks, path, rowIndex))}

                      className="rounded p-1 text-neutral-600 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-300 group-hover/row:opacity-100"

                    >

                      <Trash2 className="size-3.5" />

                    </button>

                    {!layoutLocked && (

                      <div

                        role="separator"

                        aria-orientation="horizontal"

                        aria-label="Resize row height"

                        onMouseDown={(e) => startRowResize(e, rowIndex)}

                        className={`absolute right-0 bottom-0 left-0 z-10 h-1.5 cursor-row-resize hover:bg-flame-500/40 ${

                          resizingRow?.index === rowIndex ? 'bg-flame-500/40' : ''

                        }`}

                      />

                    )}

                  </td>

                  {columns.map((col) => {

                    const width = columnWidth(col);

                    return (

                      <td

                        key={col.key}

                        style={{ width, minWidth: width, maxWidth: width, height, maxHeight: height }}

                        className="overflow-hidden border border-white/10 p-0 align-top"

                      >

                        <input

                          className="box-border h-full w-full resize-none bg-transparent px-2 py-1.5 text-xs text-neutral-100 outline-none focus:bg-white/[0.03]"

                          value={row[col.key] ?? ''}

                          onChange={(e) =>

                            patch((blocks) =>

                              updateTableCell(blocks, path, rowIndex, col.key, e.target.value),

                            )

                          }

                        />

                      </td>

                    );

                  })}

                </tr>

              );

            })

          )}

        </tbody>

      </table>

    </div>

  );

}



function TableToolButton({

  label,

  onClick,

  children,

}: {

  label: string;

  onClick: () => void;

  children: React.ReactNode;

}) {

  return (

    <button

      type="button"

      aria-label={label}

      onClick={onClick}

      className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-neutral-400 hover:bg-white/5 hover:text-neutral-200"

    >

      {children}

    </button>

  );

}


