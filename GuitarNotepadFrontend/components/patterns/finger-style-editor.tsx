"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Trash2,
  Plus,
  GripVertical,
  Music,
  Grid,
  MoveLeft,
  MoveRight,
} from "lucide-react";

interface FingerStyleEditorProps {
  pattern: string;
  onPatternChange: (pattern: string) => void;
  maxColumns?: number;
}

export type FingerStyleSymbol = "1" | "2" | "3" | "4" | "5" | "6" | "X" | ".";

interface Column {
  id: number;
  order: number;
}

type CellState = Record<number, boolean>;

interface Row {
  id: number;
  label: string;
  symbol: FingerStyleSymbol;
  color: string;
  bgColor: string;
  borderColor: string;
  cells: CellState;
}

export function FingerStyleEditor({
  pattern,
  onPatternChange,
  maxColumns = 32,
}: FingerStyleEditorProps) {
  const [columns, setColumns] = useState<Column[]>([{ id: 1, order: 0 }]);
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const initialRows = useMemo(
    (): Row[] => [
      {
        id: 1,
        label: "String 1",
        symbol: "1",
        color: "text-blue-600 dark:text-blue-300",
        bgColor:
          "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/50 dark:hover:bg-blue-900/70",
        borderColor: "border-blue-200 dark:border-blue-700",
        cells: {} as CellState,
      },
      {
        id: 2,
        label: "String 2",
        symbol: "2",
        color: "text-green-600 dark:text-green-300",
        bgColor:
          "bg-green-50 hover:bg-green-100 dark:bg-green-900/50 dark:hover:bg-green-900/70",
        borderColor: "border-green-200 dark:border-green-700",
        cells: {} as CellState,
      },
      {
        id: 3,
        label: "String 3",
        symbol: "3",
        color: "text-yellow-600 dark:text-yellow-300",
        bgColor:
          "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/50 dark:hover:bg-yellow-900/70",
        borderColor: "border-yellow-200 dark:border-yellow-700",
        cells: {} as CellState,
      },
      {
        id: 4,
        label: "String 4",
        symbol: "4",
        color: "text-purple-600 dark:text-purple-300",
        bgColor:
          "bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/50 dark:hover:bg-purple-900/70",
        borderColor: "border-purple-200 dark:border-purple-700",
        cells: {} as CellState,
      },
      {
        id: 5,
        label: "String 5",
        symbol: "5",
        color: "text-pink-600 dark:text-pink-300",
        bgColor:
          "bg-pink-50 hover:bg-pink-100 dark:bg-pink-900/50 dark:hover:bg-pink-900/70",
        borderColor: "border-pink-200 dark:border-pink-700",
        cells: {} as CellState,
      },
      {
        id: 6,
        label: "String 6",
        symbol: "6",
        color: "text-red-600 dark:text-red-300",
        bgColor:
          "bg-red-50 hover:bg-red-100 dark:bg-red-900/50 dark:hover:bg-red-900/70",
        borderColor: "border-red-200 dark:border-red-700",
        cells: {} as CellState,
      },
      {
        id: 7,
        label: "Scratch",
        symbol: "X",
        color: "text-amber-600 dark:text-amber-300",
        bgColor:
          "bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/50 dark:hover:bg-amber-900/70",
        borderColor: "border-amber-200 dark:border-amber-700",
        cells: {} as CellState,
      },
      {
        id: 8,
        label: "Mute",
        symbol: ".",
        color: "text-gray-600 dark:text-gray-300",
        bgColor:
          "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800/70",
        borderColor: "border-gray-200 dark:border-gray-700",
        cells: {} as CellState,
      },
    ],
    [],
  );

  const [rows, setRows] = useState<Row[]>(initialRows);
  const [isParsing, setIsParsing] = useState(false);

  const parsePatternToState = useCallback(
    (patternStr: string, skipUpdate = false) => {
      setIsParsing(true);

      if (!patternStr) {
        const resetRows = initialRows.map((row) => ({
          ...row,
          cells: {} as CellState,
        }));
        setRows(resetRows);
        setColumns([{ id: 1, order: 0 }]);
        setIsParsing(false);
        return resetRows;
      }

      const steps: string[] = [];
      let i = 0;

      while (i < patternStr.length) {
        if (patternStr[i] === "(") {
          const closeIndex = patternStr.indexOf(")", i);
          if (closeIndex === -1) break;
          steps.push(patternStr.substring(i, closeIndex + 1));
          i = closeIndex + 1;
        } else if (
          ["1", "2", "3", "4", "5", "6", "X", "."].includes(patternStr[i])
        ) {
          steps.push(patternStr[i]);
          i++;
        } else {
          i++;
        }
      }

      const newColumns: Column[] = steps.map((_, index) => ({
        id: index + 1,
        order: index,
      }));

      const newRows = initialRows.map((row) => ({
        ...row,
        cells: {} as CellState,
      }));

      steps.forEach((step, colIndex) => {
        const columnId = colIndex + 1;
        let symbols: string[] = [];

        if (step.startsWith("(") && step.endsWith(")")) {
          symbols = step.substring(1, step.length - 1).split("");
        } else {
          symbols = [step];
        }

        symbols.forEach((symbol) => {
          const row = newRows.find(
            (r) => r.symbol === (symbol as FingerStyleSymbol),
          );
          if (row) {
            row.cells[columnId] = true;
          }
        });
      });

      setColumns(newColumns);
      setRows(newRows);
      setIsParsing(false);

      return newRows;
    },
    [initialRows],
  );

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      parsePatternToState(pattern, true);
    } else {
      parsePatternToState(pattern);
    }
  }, [pattern, parsePatternToState]);

  const updatePattern = useCallback(
    (updatedRows: Row[], updatedColumns: Column[]) => {
      if (isParsing) return;

      const sortedColumns = [...updatedColumns].sort(
        (a, b) => a.order - b.order,
      );
      let result = "";

      sortedColumns.forEach((column) => {
        const columnSymbols: FingerStyleSymbol[] = [];

        updatedRows.forEach((row) => {
          if (row.cells[column.id]) {
            columnSymbols.push(row.symbol);
          }
        });

        if (columnSymbols.length > 0) {
          if (columnSymbols.length === 1) {
            result += columnSymbols[0];
          } else {
            result += `(${columnSymbols.join("")})`;
          }
        }
      });

      onPatternChange(result);
    },
    [onPatternChange, isParsing],
  );

  const handleCellToggle = useCallback(
    (rowId: number, columnId: number) => {
      setRows((prevRows) => {
        const newRows = prevRows.map((row) => {
          if (row.id === rowId) {
            const currentState = row.cells[columnId] || false;
            const newCells = { ...row.cells };
            newCells[columnId] = !currentState;

            return { ...row, cells: newCells };
          }
          return row;
        });

        setTimeout(() => {
          updatePattern(newRows, columns);
        }, 0);

        return newRows;
      });
    },
    [columns, updatePattern],
  );

  const handleAddColumn = useCallback(() => {
    if (columns.length >= maxColumns) return;

    const newId = Math.max(0, ...columns.map((c) => c.id)) + 1;
    const newOrder = Math.max(0, ...columns.map((c) => c.order)) + 1;

    const newColumn: Column = { id: newId, order: newOrder };
    const newColumns = [...columns, newColumn];

    setColumns(newColumns);
  }, [columns, maxColumns]);

  const handleRemoveColumn = useCallback(
    (columnId: number) => {
      if (columns.length <= 1) {
        setRows((prevRows) => {
          const newRows = prevRows.map((row) => {
            const newCells = { ...row.cells };
            delete newCells[columnId];
            return { ...row, cells: newCells };
          });

          setTimeout(() => {
            updatePattern(newRows, columns);
          }, 0);

          return newRows;
        });
        return;
      }

      const columnIndex = columns.findIndex((col) => col.id === columnId);
      if (columnIndex === -1) return;

      const newColumns = columns.filter((col) => col.id !== columnId);

      const reorderedColumns = newColumns.map((col, index) => ({
        ...col,
        order: index,
      }));

      setRows((prevRows) => {
        const newRows = prevRows.map((row) => {
          const newCells: CellState = {};

          columns.forEach((col) => {
            if (col.id !== columnId) {
              const oldIndex = columns.findIndex((c) => c.id === col.id);
              const newIndex = oldIndex > columnIndex ? oldIndex - 1 : oldIndex;
              const newColId = reorderedColumns[newIndex]?.id || col.id;
              newCells[newColId] = row.cells[col.id] || false;
            }
          });

          return { ...row, cells: newCells };
        });

        setColumns(reorderedColumns);

        setTimeout(() => {
          updatePattern(newRows, reorderedColumns);
        }, 0);

        return newRows;
      });
    },
    [columns, updatePattern],
  );

  const handleClearAll = useCallback(() => {
    const newRows = initialRows.map((row) => ({
      ...row,
      cells: {} as CellState,
    }));
    const newColumns = [{ id: 1, order: 0 }];
    setRows(newRows);
    setColumns(newColumns);

    setTimeout(() => {
      updatePattern(newRows, newColumns);
    }, 0);
  }, [initialRows, updatePattern]);

  const handleDragStart = (e: React.DragEvent, columnId: number) => {
    e.dataTransfer.setData("text/plain", columnId.toString());
    setDraggedColumn(columnId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: number) => {
    e.preventDefault();
    if (draggedColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent, targetColumnId: number) => {
      e.preventDefault();
      const draggedColumnId = parseInt(
        e.dataTransfer.getData("text/plain"),
        10,
      );

      if (isNaN(draggedColumnId) || draggedColumnId === targetColumnId) {
        setDragOverColumn(null);
        return;
      }

      const newColumns = [...columns];
      const draggedCol = newColumns.find((c) => c.id === draggedColumnId);
      const targetCol = newColumns.find((c) => c.id === targetColumnId);

      if (draggedCol && targetCol) {
        const draggedOrder = draggedCol.order;
        draggedCol.order = targetCol.order;
        targetCol.order = draggedOrder;

        const sortedColumns = [...newColumns].sort((a, b) => a.order - b.order);

        setRows((prevRows) => {
          const newRows = prevRows.map((row) => {
            const newCells: CellState = {};

            const columnMapping: Record<number, number> = {};
            sortedColumns.forEach((col, index) => {
              columnMapping[
                columns.find((c) => c.order === index)?.id || col.id
              ] = col.id;
            });

            Object.keys(row.cells).forEach((oldColId) => {
              const oldId = parseInt(oldColId);
              const newColId = columnMapping[oldId];
              if (newColId && row.cells[oldId]) {
                newCells[newColId] = true;
              }
            });

            return { ...row, cells: newCells };
          });

          setColumns(sortedColumns);

          setTimeout(() => {
            updatePattern(newRows, sortedColumns);
          }, 0);

          return newRows;
        });
      }

      setDragOverColumn(null);
    },
    [columns, updatePattern],
  );

  const handleTextInput = (value: string) => {
    onPatternChange(value);
  };

  const handleMoveColumn = useCallback(
    (columnId: number, direction: "left" | "right") => {
      const columnIndex = columns.findIndex((c) => c.id === columnId);
      if (columnIndex === -1) return;

      if (direction === "left" && columnIndex === 0) return;
      if (direction === "right" && columnIndex === columns.length - 1) return;

      const newColumns = [...columns];
      const targetIndex =
        direction === "left" ? columnIndex - 1 : columnIndex + 1;

      const currentOrder = newColumns[columnIndex].order;
      const targetOrder = newColumns[targetIndex].order;

      newColumns[columnIndex].order = targetOrder;
      newColumns[targetIndex].order = currentOrder;

      const sortedColumns = [...newColumns].sort((a, b) => a.order - b.order);

      setRows((prevRows) => {
        const newRows = prevRows.map((row) => {
          const newCells: CellState = {};

          sortedColumns.forEach((col, index) => {
            const oldColId = columns[index]?.id;
            if (oldColId && row.cells[oldColId]) {
              newCells[col.id] = true;
            }
          });

          return { ...row, cells: newCells };
        });

        setColumns(sortedColumns);

        setTimeout(() => {
          updatePattern(newRows, sortedColumns);
        }, 0);

        return newRows;
      });
    },
    [columns, updatePattern],
  );

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const totalSelected = rows.reduce((sum, row) => {
    return sum + Object.values(row.cells).filter(Boolean).length;
  }, 0);

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-medium">
            Pattern: {sortedColumns.length} step
            {sortedColumns.length !== 1 ? "s" : ""}, {totalSelected} note
            {totalSelected !== 1 ? "s" : ""}
          </div>
          <div className="text-xs text-muted-foreground">
            Max {maxColumns} steps. Click cells to toggle notes. Drag columns to
            reorder.
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={totalSelected === 0 && columns.length <= 1}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Music className="h-5 w-5 text-primary" />
            <div className="text-sm font-medium dark:text-gray-100">
              String Legend
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className={`text-center p-2 rounded-lg border ${row.borderColor} ${row.bgColor}`}
              >
                <div className={`text-lg font-bold ${row.color}`}>
                  {row.symbol}
                </div>
                <div className="text-xs font-medium dark:text-gray-100">
                  {row.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardContent className="p-4">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Grid className="h-5 w-5 text-primary" />
              <div className="text-sm font-medium dark:text-gray-100">
                Fingerstyle Pattern Editor
              </div>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <div className="min-w-max">
                <div className="flex border-b bg-muted/50 dark:bg-gray-800/50">
                  <div className="w-40 p-3 border-r">
                    <div className="text-xs font-medium text-muted-foreground">
                      String / Action
                    </div>
                  </div>

                  {sortedColumns.map((column, index) => {
                    const isDragged = draggedColumn === column.id;
                    const isDragOver = dragOverColumn === column.id;
                    const selectedCount = rows.filter(
                      (row) => row.cells[column.id],
                    ).length;

                    return (
                      <div
                        key={column.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, column.id)}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, column.id)}
                        className={`
                          w-16 p-2 border-r relative
                          ${isDragged ? "opacity-50" : ""}
                          ${
                            isDragOver
                              ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                              : "hover:bg-muted/30 dark:hover:bg-gray-700/30"
                          }
                          transition-all cursor-move
                        `}
                      >
                        <div className="flex flex-col items-center">
                          <div className="flex items-center justify-between w-full mb-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() =>
                                handleMoveColumn(column.id, "left")
                              }
                              disabled={index === 0}
                            >
                              <MoveLeft className="h-3 w-3" />
                            </Button>

                            <div className="cursor-grab active:cursor-grabbing">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() =>
                                handleMoveColumn(column.id, "right")
                              }
                              disabled={index === sortedColumns.length - 1}
                            >
                              <MoveRight className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="text-xs font-mono font-bold mb-1 dark:text-gray-100">
                            Step {index + 1}
                          </div>

                          {selectedCount > 0 && (
                            <div className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full mb-1">
                              {selectedCount}
                            </div>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 mt-1"
                            onClick={() => handleRemoveColumn(column.id)}
                            disabled={sortedColumns.length <= 1}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {isDragOver && (
                          <div className="absolute inset-0 border-2 border-dashed border-primary"></div>
                        )}
                      </div>
                    );
                  })}

                  <div className="w-16 p-2 border-r flex items-center justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-12 w-12"
                      onClick={handleAddColumn}
                      disabled={columns.length >= maxColumns}
                      title="Add new column"
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                {rows.map((row) => (
                  <div key={row.id} className="flex border-b last:border-b-0">
                    <div
                      className={`w-40 p-3 border-r flex items-center gap-3 ${row.bgColor}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${row.color} border ${row.borderColor}`}
                      >
                        <span className="font-bold">{row.symbol}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium dark:text-gray-100">
                          {row.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Object.values(row.cells).filter(Boolean).length}{" "}
                          selected
                        </div>
                      </div>
                    </div>

                    {sortedColumns.map((column) => {
                      const isChecked = row.cells[column.id] || false;

                      return (
                        <div
                          key={`${row.id}-${column.id}`}
                          className="w-16 p-4 border-r flex items-center justify-center hover:bg-muted/20 dark:hover:bg-gray-700/20 cursor-pointer"
                          onClick={() => handleCellToggle(row.id, column.id)}
                          title={`${row.label} - Step ${
                            sortedColumns.findIndex((c) => c.id === column.id) +
                            1
                          }`}
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="sr-only"
                            />
                            <div
                              className={`
                              w-8 h-8 rounded border-2 flex items-center justify-center
                              transition-all hover:scale-110
                              ${
                                isChecked
                                  ? `${row.borderColor} ${row.bgColor
                                      .replace("hover:", "")
                                      .replace(" dark:hover:", "")} ${
                                      row.color
                                    } border-2`
                                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                              }
                            `}
                            >
                              {isChecked && (
                                <span className="font-bold">{row.symbol}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="w-16 p-4 border-r"></div>
                  </div>
                ))}
              </div>
            </div>

            {columns.length >= maxColumns && (
              <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg text-center">
                <div className="text-sm text-amber-800 dark:text-amber-300">
                  Maximum number of steps ({maxColumns}) reached
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
              <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <p>
                  <strong>How it works:</strong>
                </p>
                <p>• Click cells to toggle notes in columns</p>
                <p>• Drag column headers to reorder columns</p>
                <p>
                  • Use <MoveLeft className="inline h-3 w-3" /> and{" "}
                  <MoveRight className="inline h-3 w-3" /> buttons to move
                  columns left/right
                </p>
                <p>
                  • Click <Plus className="inline h-3 w-3" /> button to add new
                  column
                </p>
                <p>
                  • Click <Trash2 className="inline h-3 w-3" /> button on column
                  to remove it
                </p>
                <p>
                  • Scratch (X) and Mute (.) are mutually exclusive per column
                </p>
                <p>
                  • Pattern format: Single notes as numbers, multiple notes in
                  parentheses
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="text-sm font-medium dark:text-gray-100">
              Quick Pattern Input
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={pattern}
                onChange={(e) => handleTextInput(e.target.value)}
                placeholder="Format: 1(12)3(45) or 123(X) etc."
                className="flex-1 font-mono text-sm h-10 px-4 border rounded-lg dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
              />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Format rules:</p>
              <p>
                • Single notes:{" "}
                <span className="font-mono">1 2 3 4 5 6 X .</span>
              </p>
              <p>
                • Multiple notes in column:{" "}
                <span className="font-mono">(123)</span> (strings 1,2,3
                together)
              </p>
              <p>
                • No nested parentheses:{" "}
                <span className="font-mono">(12(34))</span> → invalid
              </p>
              <p>• Empty columns are ignored</p>
              <p>• Max {maxColumns} steps total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
