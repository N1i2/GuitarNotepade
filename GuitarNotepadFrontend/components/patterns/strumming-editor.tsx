"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical, X, MoveLeft, MoveRight, Plus } from "lucide-react";

interface StrummingEditorProps {
  pattern: string;
  onPatternChange: (pattern: string) => void;
  maxLength?: number;
}

type PatternSymbol = "D" | "d" | "U" | "u" | "X" | "-" | ".";

export function StrummingEditor({
  pattern,
  onPatternChange,
  maxLength = 16,
}: StrummingEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const symbols: Array<{
    value: PatternSymbol;
    label: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
  }> = [
    {
      value: "D",
      label: "Down All",
      color: "text-blue-700",
      bgColor:
        "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60",
      borderColor: "border-blue-300",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      ),
    },
    {
      value: "U",
      label: "Up All",
      color: "text-green-700",
      bgColor:
        "bg-green-100 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-900/60",
      borderColor: "border-green-300",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      ),
    },
    {
      value: "d",
      label: "Down Top",
      color: "text-blue-500",
      bgColor:
        "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40",
      borderColor: "border-blue-200",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      ),
    },
    {
      value: "u",
      label: "Up Top",
      color: "text-green-500",
      bgColor:
        "bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40",
      borderColor: "border-green-200",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      ),
    },
    {
      value: "X",
      label: "Scratch",
      color: "text-red-700",
      bgColor:
        "bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60",
      borderColor: "border-red-300",
      icon: (
        <div className="relative w-6 h-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current rounded-full"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center rotate-45">
            <div className="w-4 h-0.5 bg-current"></div>
          </div>
        </div>
      ),
    },
    {
      value: "-",
      label: "Pause",
      color: "text-gray-700",
      bgColor:
        "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/40 dark:hover:bg-gray-800/60",
      borderColor: "border-gray-300",
      icon: (
        <div className="w-6 h-6 flex items-center justify-center">
          <div className="w-4 h-1 bg-current"></div>
        </div>
      ),
    },
    {
      value: ".",
      label: "Mute",
      color: "text-amber-700",
      bgColor:
        "bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60",
      borderColor: "border-amber-300",
      icon: (
        <div className="w-6 h-6 flex items-center justify-center">
          <div className="relative w-4 h-4">
            <div className="absolute inset-0 border-2 border-current rounded-full"></div>
            <div className="absolute inset-1 bg-current rounded-full opacity-50"></div>
          </div>
        </div>
      ),
    },
  ];

  const patternArray = pattern.split("");

  const handleAddSymbol = (symbol: PatternSymbol) => {
    if (patternArray.length >= maxLength) return;
    onPatternChange(pattern + symbol);
  };

  const handleRemoveSymbol = (index: number) => {
    const newArray = [...patternArray];
    newArray.splice(index, 1);
    onPatternChange(newArray.join(""));
  };

  const handleMoveSymbol = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newArray = [...patternArray];
    const [movedItem] = newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, movedItem);

    onPatternChange(newArray.join(""));
  };

  const handleClearAll = () => {
    onPatternChange("");
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);

    if (!isNaN(dragIndex) && dragIndex !== dropIndex) {
      handleMoveSymbol(dragIndex, dropIndex);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getSymbolInfo = (symbol: string) => {
    const found = symbols.find((s) => s.value === symbol);
    return found || symbols[0];
  };

  const isAtMaxLength = patternArray.length >= maxLength;

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          Pattern Length: {patternArray.length}/{maxLength} symbols
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={patternArray.length === 0}
          >
            Clear All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPatternChange(pattern.slice(0, -1))}
            disabled={patternArray.length === 0}
          >
            Remove Last
          </Button>
        </div>
      </div>

      <Card className="border-2">
        <CardContent className="p-6">
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">
              Pattern Sequence (drag to reorder)
            </div>
            {patternArray.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Plus className="h-8 w-8" />
                  <div>Add symbols to start building your pattern</div>
                  <div className="text-sm">
                    Click buttons below or use text input
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {patternArray.map((symbol, index) => {
                  const info = getSymbolInfo(symbol);
                  const isDragged = draggedIndex === index;
                  const isDragOver = dragOverIndex === index;

                  return (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`
                        relative group rounded-lg p-3 border-2
                        ${isDragged ? "opacity-50" : ""}
                        ${
                          isDragOver
                            ? "border-primary ring-2 ring-primary/20"
                            : info.borderColor
                        }
                        hover:border-primary/50 transition-all cursor-move
                        flex flex-col items-center justify-center gap-1
                        ${info.bgColor}
                      `}
                    >
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSymbol(index);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <div className="cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      <div className={`text-2xl mb-1 ${info.color}`}>
                        {info.icon}
                      </div>

                      <div className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {index + 1}
                      </div>

                      <div
                        className={`text-lg font-bold font-mono ${info.color}`}
                      >
                        {symbol}
                      </div>

                      <div className="flex gap-1 mt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (index > 0) handleMoveSymbol(index, index - 1);
                          }}
                          disabled={index === 0}
                        >
                          <MoveLeft className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (index < patternArray.length - 1)
                              handleMoveSymbol(index, index + 1);
                          }}
                          disabled={index === patternArray.length - 1}
                        >
                          <MoveRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="text-sm font-medium">Symbols (click to add)</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {symbols.map((symbol) => (
                <Button
                  key={symbol.value}
                  type="button"
                  variant="outline"
                  className={`h-auto py-3 flex flex-col gap-2 ${symbol.bgColor} border ${symbol.borderColor} hover:border-primary/50`}
                  onClick={() => handleAddSymbol(symbol.value)}
                  disabled={isAtMaxLength}
                >
                  <div className={`text-xl ${symbol.color}`}>{symbol.icon}</div>
                  <div className="text-xs font-medium">{symbol.label}</div>
                  <div
                    className={`text-lg font-bold font-mono ${symbol.color}`}
                  >
                    {symbol.value}
                  </div>
                </Button>
              ))}
            </div>
            {isAtMaxLength && (
              <div className="text-center text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                Maximum pattern length ({maxLength} symbols) reached
              </div>
            )}
          </div>

          <div className="mt-6 space-y-2">
            <div className="text-sm font-medium">Quick Text Input</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={pattern}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  const filtered = value
                    .split("")
                    .filter(
                      (char) =>
                        ["D", "U", "X", "-", "."].includes(char) ||
                        char.toLowerCase() === "d" ||
                        char.toLowerCase() === "u",
                    )
                    .join("");
                  const trimmed = filtered.slice(0, maxLength);
                  onPatternChange(trimmed);
                }}
                placeholder="Enter pattern (D, d, U, u, X, -, .)"
                className="flex-1 font-mono text-center text-lg h-12 px-4 border rounded-lg"
                maxLength={maxLength}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Type allowed symbols:{" "}
              <span className="font-mono">D d U u X - .</span> (max {maxLength})
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
