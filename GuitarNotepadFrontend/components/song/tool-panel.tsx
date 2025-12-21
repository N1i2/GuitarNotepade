"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MousePointer,
  Music,
  ListMusic,
  MessageSquare,
  X,
  Eraser,
  Plus,
  Palette,
  Replace,
  Brush,
} from "lucide-react";
import { AddChordModal } from "./add-chord-modal";
import { AddPatternModal } from "./add-pattern-modal";
import { CHORD_COLORS, PATTERN_COLORS } from "@/lib/song-segment-utils";
import { useSongCreation } from "@/app/contexts/song-creation-context";
import { ReplaceChordModal } from "./replace-chord-modal";
import { ReplacePatternModal } from "./replace-pattern-modal";

export function ToolPanel() {
  const { state, dispatch } = useSongCreation();
  const [showAddChord, setShowAddChord] = useState(false);
  const [showAddPattern, setShowAddPattern] = useState(false);
  const [showReplaceChord, setShowReplaceChord] = useState<string | null>(null);
  const [showReplacePattern, setShowReplacePattern] = useState<string | null>(
    null
  );
  const [editingChordId, setEditingChordId] = useState<string | null>(null);
  const [editingPatternId, setEditingPatternId] = useState<string | null>(null);

  const handleToolSelect = (
    tool: "select" | "chord" | "pattern" | "comment"
  ) => {
    dispatch({ type: "SET_TOOL", payload: tool });
  };

  const handleChordSelect = (chordId: string) => {
    dispatch({ type: "SELECT_CHORD", payload: chordId });
    dispatch({ type: "SET_TOOL", payload: "chord" });
  };

  const handlePatternSelect = (patternId: string) => {
    dispatch({ type: "SELECT_PATTERN", payload: patternId });
    dispatch({ type: "SET_TOOL", payload: "pattern" });
  };

  const handleClearChordTool = () => {
    dispatch({ type: "SELECT_CHORD", payload: "empty" });
    dispatch({ type: "SET_TOOL", payload: "chord" });
  };

  const handleClearPatternTool = () => {
    dispatch({ type: "SELECT_PATTERN", payload: "empty" });
    dispatch({ type: "SET_TOOL", payload: "pattern" });
  };

  const handleRemoveChord = (chordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: "REMOVE_CHORD", payload: chordId });
  };

  const handleRemovePattern = (patternId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: "REMOVE_PATTERN", payload: patternId });
  };

  const handleUpdateChordColor = (chordId: string, color: string) => {
    dispatch({ type: "UPDATE_CHORD_COLOR", payload: { chordId, color } });
    setEditingChordId(null);
  };

  const handleUpdatePatternColor = (patternId: string, color: string) => {
    dispatch({ type: "UPDATE_PATTERN_COLOR", payload: { patternId, color } });
    setEditingPatternId(null);
  };

  const getActiveToolInfo = () => {
    if (state.currentTool === "chord" && state.selectedChordId) {
      if (state.selectedChordId === "empty") {
        return {
          title: "Режим очистки аккордов",
          description: "Выделите текст для удаления аккордов",
          icon: <Eraser className="h-4 w-4" />,
        };
      } else {
        const chord = state.selectedChords.find(
          (c) => c.chordId === state.selectedChordId
        );
        return {
          title: `Аккорд: ${chord?.chordName}`,
          description: "Выделите текст для применения аккорда",
          color: chord?.color,
          icon: <Brush className="h-4 w-4" />,
        };
      }
    } else if (state.currentTool === "pattern" && state.selectedPatternId) {
      if (state.selectedPatternId === "empty") {
        return {
          title: "Режим очистки паттернов",
          description: "Выделите текст для удаления паттернов",
          icon: <Eraser className="h-4 w-4" />,
        };
      } else {
        const pattern = state.selectedPatterns.find(
          (p) => p.patternId === state.selectedPatternId
        );
        return {
          title: `Паттерн: ${pattern?.patternName}`,
          description: "Выделите текст для применения паттерна",
          color: pattern?.color,
          icon: <Brush className="h-4 w-4" />,
        };
      }
    } else if (state.currentTool === "comment") {
      return {
        title: "Режим комментариев",
        description: "Кликните по тексту для добавления комментария",
        icon: <MessageSquare className="h-4 w-4" />,
      };
    } else if (state.currentTool === "select") {
      return {
        title: "Режим выбора",
        description: "Выделяйте текст для редактирования",
        icon: <MousePointer className="h-4 w-4" />,
      };
    }
    return null;
  };

  const activeToolInfo = getActiveToolInfo();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Инструменты</CardTitle>
          <CardDescription>
            Выберите инструмент для работы с текстом
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant={state.currentTool === "select" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolSelect("select")}
              className="h-10"
              title="Режим выбора"
            >
              <MousePointer className="h-4 w-4" />
            </Button>
            <Button
              variant={state.currentTool === "chord" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolSelect("chord")}
              className="h-10"
              title="Режим аккордов"
            >
              <Music className="h-4 w-4" />
            </Button>
            <Button
              variant={state.currentTool === "pattern" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolSelect("pattern")}
              className="h-10"
              title="Режим паттернов"
            >
              <ListMusic className="h-4 w-4" />
            </Button>
            <Button
              variant={state.currentTool === "comment" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolSelect("comment")}
              className="h-10"
              title="Режим комментариев"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddChord(true)}
              disabled={state.selectedChords.length >= 20}
              className="flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Добавить аккорд
              <Badge variant="secondary" className="ml-1">
                {state.selectedChords.length}/20
              </Badge>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddPattern(true)}
              disabled={state.selectedPatterns.length >= 10}
              className="flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Добавить паттерн
              <Badge variant="secondary" className="ml-1">
                {state.selectedPatterns.length}/10
              </Badge>
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={
                state.currentTool === "chord" &&
                state.selectedChordId === "empty"
                  ? "destructive"
                  : "outline"
              }
              size="sm"
              onClick={handleClearChordTool}
              className="flex-1"
            >
              <Eraser className="h-4 w-4 mr-2" />
              Очистить аккорды
            </Button>
            <Button
              variant={
                state.currentTool === "pattern" &&
                state.selectedPatternId === "empty"
                  ? "destructive"
                  : "outline"
              }
              size="sm"
              onClick={handleClearPatternTool}
              className="flex-1"
            >
              <Eraser className="h-4 w-4 mr-2" />
              Очистить паттерны
            </Button>
          </div>

          {state.selectedChords.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Аккорды в песне</div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {state.selectedChords.map((chord) => (
                  <div
                    key={chord.chordId}
                    className={`flex items-center justify-between p-2 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors ${
                      state.selectedChordId === chord.chordId
                        ? "ring-2 ring-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => handleChordSelect(chord.chordId)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: chord.color }}
                      />
                      <span className="font-medium">{chord.chordName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReplaceChord(chord.chordId);
                        }}
                        className="h-6 w-6 p-0"
                        title="Заменить аккорд"
                      >
                        <Replace className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChordId(chord.chordId);
                        }}
                        className="h-6 w-6 p-0"
                        title="Изменить цвет"
                      >
                        <Palette className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleRemoveChord(chord.chordId, e)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Удалить аккорд"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {state.selectedPatterns.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Паттерны в песне</div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {state.selectedPatterns.map((pattern) => (
                  <div
                    key={pattern.patternId}
                    className={`flex items-center justify-between p-2 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors ${
                      state.selectedPatternId === pattern.patternId
                        ? "ring-2 ring-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => handlePatternSelect(pattern.patternId)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: pattern.color }}
                      />
                      <div>
                        <div className="font-medium">{pattern.patternName}</div>
                        <div className="text-xs text-muted-foreground">
                          {pattern.isFingerStyle ? "Fingerstyle" : "Strumming"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReplacePattern(pattern.patternId);
                        }}
                        className="h-6 w-6 p-0"
                        title="Заменить паттерн"
                      >
                        <Replace className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPatternId(pattern.patternId);
                        }}
                        className="h-6 w-6 p-0"
                        title="Изменить цвет"
                      >
                        <Palette className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) =>
                          handleRemovePattern(pattern.patternId, e)
                        }
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Удалить паттерн"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeToolInfo && (
            <div className="p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeToolInfo.icon}
                  <span className="font-medium">{activeToolInfo.title}</span>
                  {activeToolInfo.color && (
                    <div
                      className="w-3 h-3 rounded-full ml-2 border"
                      style={{ backgroundColor: activeToolInfo.color }}
                    />
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    dispatch({ type: "SET_TOOL", payload: "select" });
                    dispatch({ type: "SELECT_CHORD", payload: undefined! });
                    dispatch({ type: "SELECT_PATTERN", payload: undefined! });
                  }}
                  className="h-6 w-6 p-0"
                  title="Отменить инструмент"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {activeToolInfo.description}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showAddChord && (
        <AddChordModal
          open={showAddChord}
          onClose={() => setShowAddChord(false)}
          existingChordIds={state.selectedChords.map((c) => c.chordId)}
        />
      )}

      {showAddPattern && (
        <AddPatternModal
          open={showAddPattern}
          onClose={() => setShowAddPattern(false)}
          existingPatternIds={state.selectedPatterns.map((p) => p.patternId)}
        />
      )}

      {showReplaceChord && (
        <ReplaceChordModal
          open={!!showReplaceChord}
          onClose={() => setShowReplaceChord(null)}
          chordId={showReplaceChord!}
          existingChordIds={state.selectedChords
            .map((c) => c.chordId)
            .filter((id) => id !== showReplaceChord)}
        />
      )}

      {showReplacePattern && (
        <ReplacePatternModal
          open={!!showReplacePattern}
          onClose={() => setShowReplacePattern(null)}
          patternId={showReplacePattern!}
        />
      )}

      <Dialog
        open={!!editingChordId}
        onOpenChange={() => setEditingChordId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Изменить цвет аккорда</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-2">
              Выберите новый цвет. Цвета не могут повторяться ни у аккордов, ни
              у паттернов.
            </div>
            <div className="grid grid-cols-5 gap-2">
              {CHORD_COLORS.map((color) => {
                const isUsed = [
                  ...state.selectedChords.map((c) => c.color),
                  ...state.selectedPatterns.map((p) => p.color),
                ].includes(color);
                const isCurrent =
                  state.selectedChords.find((c) => c.chordId === editingChordId)
                    ?.color === color;
                return (
                  <button
                    key={color}
                    className={`h-10 rounded-md border-2 transition-all hover:scale-105 ${
                      isCurrent ? "ring-2 ring-offset-2 ring-primary" : ""
                    } ${
                      isUsed && !isCurrent
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      if (!isUsed || isCurrent) {
                        editingChordId &&
                          handleUpdateChordColor(editingChordId, color);
                      }
                    }}
                    title={color}
                    disabled={isUsed && !isCurrent}
                  />
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingPatternId}
        onOpenChange={() => setEditingPatternId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Изменить цвет паттерна</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-2">
              Выберите новый цвет. Цвета не могут повторяться ни у аккордов, ни
              у паттернов.
            </div>
            <div className="grid grid-cols-5 gap-2">
              {PATTERN_COLORS.map((color) => {
                const isUsed = [
                  ...state.selectedChords.map((c) => c.color),
                  ...state.selectedPatterns.map((p) => p.color),
                ].includes(color);
                const isCurrent =
                  state.selectedPatterns.find(
                    (p) => p.patternId === editingPatternId
                  )?.color === color;
                return (
                  <button
                    key={color}
                    className={`h-10 rounded-md border transition-all hover:scale-105 ${
                      isCurrent ? "ring-2 ring-offset-2 ring-primary" : ""
                    } ${
                      isUsed && !isCurrent
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      if (!isUsed || isCurrent) {
                        editingPatternId &&
                          handleUpdatePatternColor(editingPatternId, color);
                      }
                    }}
                    title={color}
                    disabled={isUsed && !isCurrent}
                  />
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
