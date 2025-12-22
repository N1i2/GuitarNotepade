"use client";

import { useState, useEffect } from "react";
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
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AddChordModal } from "./add-chord-modal";
import { AddPatternModal } from "./add-pattern-modal";
import { CHORD_COLORS, PATTERN_COLORS } from "@/lib/song-segment-utils";
import { useSongCreation } from "@/app/contexts/song-creation-context";
import { ReplaceChordModal } from "./replace-chord-modal";
import { ReplacePatternModal } from "./replace-pattern-modal";
import { ChordsService } from "@/lib/api/chords-service";
import { PatternsService } from "@/lib/api/patterns-service";
import { Chord, PaginatedChords } from "@/types/chords";
import { Pattern } from "@/types/patterns";
import { SVGChordDiagram } from "@/components/chords/svg-chord-diagram";
import { PatternDiagram } from "@/components/patterns/pattern-diagram";
import { FingerStyleDiagram } from "@/components/patterns/finger-style-diagram";

function ChordModal({
  chordName,
  onClose,
}: {
  chordName: string;
  onClose: () => void;
}) {
  const [variations, setVariations] = useState<PaginatedChords | null>(null);
  const [currentVariation, setCurrentVariation] = useState<Chord | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVariations();
  }, [chordName]);

  const loadVariations = async () => {
    setIsLoading(true);
    try {
      const data = await ChordsService.getChordsByExactName(chordName, 1, 100);
      setVariations(data);

      if (data.items.length > 0) {
        setCurrentVariation(data.items[0]);
        setCurrentIndex(0);
      }
    } catch (error: unknown) {
      console.error("Failed to load chord variations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (!variations || currentIndex <= 0) return;

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    setCurrentVariation(variations.items[newIndex]);
  };

  const handleNext = () => {
    if (!variations || currentIndex >= variations.items.length - 1) return;

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    setCurrentVariation(variations.items[newIndex]);
  };

  const parseFingering = (fingering: string): string[] => {
    if (!fingering) return Array(6).fill("0");

    let values: string[];

    if (fingering.includes("-")) {
      values = fingering.split("-");
    } else {
      values = fingering.split("");
    }

    while (values.length < 6) {
      values.push("0");
    }

    return values.slice(0, 6);
  };

  const currentFingeringValues = currentVariation
    ? parseFingering(currentVariation.fingering)
    : [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              {chordName} Chord
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1">
              Variation {currentIndex + 1} of {variations?.items.length || 0}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading chord...</p>
          </div>
        ) : !currentVariation ? (
          <div className="py-8 text-center">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Chord not found</h3>
            <p className="text-muted-foreground mt-2">
              No variations found for chord "{chordName}"
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border rounded-lg p-6 bg-gradient-to-b from-background to-muted/20">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Chord Diagram
              </h3>
              <div className="flex justify-center">
                <SVGChordDiagram
                  fingering={currentVariation.fingering}
                  name={currentVariation.name}
                  width={300}
                  height={400}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Fingering Details
                </h3>
                <div className="font-mono text-2xl font-bold bg-muted p-4 rounded text-center">
                  {currentVariation.fingering}
                </div>

                <div className="mt-4 grid grid-cols-6 gap-2">
                  {[6, 5, 4, 3, 2, 1].map((stringNum, index) => {
                    const fretValue = currentFingeringValues[index];
                    return (
                      <div
                        key={stringNum}
                        className="text-center p-2 bg-muted/50 rounded"
                      >
                        <div className="text-sm text-muted-foreground">
                          String {stringNum}
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            fretValue === "0"
                              ? "text-green-600"
                              : fretValue === "X" || fretValue === "x"
                              ? "text-red-600"
                              : "text-blue-600"
                          }`}
                        >
                          {fretValue === "0"
                            ? "Open"
                            : fretValue === "X" || fretValue === "x"
                            ? "Mute"
                            : `Fret ${fretValue}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {currentVariation.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground p-3 bg-muted/30 rounded">
                    {currentVariation.description}
                  </p>
                </div>
              )}
            </div>

            {variations && variations.items.length > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="flex gap-2">
                  {variations.items.map((_, index) => (
                    <Button
                      key={index}
                      variant={index === currentIndex ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => {
                        setCurrentIndex(index);
                        setCurrentVariation(variations.items[index]);
                      }}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={currentIndex === variations.items.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PatternModal({
  patternName,
  onClose,
}: {
  patternName: string;
  onClose: () => void;
}) {
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    loadPattern();
  }, [patternName]);

  const loadPattern = async () => {
    setIsLoading(true);
    try {
      const data = await PatternsService.getPatternByName(patternName);
      setPattern(data);
    } catch (error: unknown) {
      console.error("Failed to load pattern:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              {patternName} Pattern
            </div>
            {pattern && (
              <Badge variant={pattern.isFingerStyle ? "secondary" : "default"}>
                {pattern.isFingerStyle ? "Fingerstyle" : "Strumming"}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading pattern...</p>
          </div>
        ) : !pattern ? (
          <div className="py-8 text-center">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Pattern not found</h3>
            <p className="text-muted-foreground mt-2">
              Pattern "{patternName}" was not found
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border rounded-lg p-6 bg-gradient-to-b from-background to-muted/20">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Pattern Visualization
              </h3>
              {pattern.isFingerStyle ? (
                <FingerStyleDiagram
                  pattern={pattern.pattern}
                  name={pattern.name}
                />
              ) : (
                <PatternDiagram pattern={pattern.pattern} name={pattern.name} />
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Pattern Notation</h3>
                <div className="font-mono text-2xl font-bold bg-muted p-4 rounded text-center break-all">
                  {pattern.pattern}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Type</div>
                  <div className="font-medium">
                    {pattern.isFingerStyle ? "Fingerstyle" : "Strumming"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Length</div>
                  <div className="font-medium">
                    {pattern.isFingerStyle
                      ? `${pattern.pattern.length} symbols`
                      : `${pattern.pattern.length} steps`}
                  </div>
                </div>
              </div>

              {pattern.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground p-3 bg-muted/30 rounded">
                    {pattern.description}
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Symbol Legend</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLegend(!showLegend)}
                >
                  {showLegend ? "Hide" : "Show"} Legend
                </Button>
              </div>

              {showLegend &&
                (pattern.isFingerStyle ? (
                  <div className="p-3 bg-muted/30 rounded">
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4, 5, 6, "X", "."].map((symbol) => (
                        <div
                          key={symbol}
                          className="flex items-center gap-2 p-2"
                        >
                          <div className="font-mono font-bold">{symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {symbol === 1 && "String 1 (High E)"}
                            {symbol === 2 && "String 2 (B)"}
                            {symbol === 3 && "String 3 (G)"}
                            {symbol === 4 && "String 4 (D)"}
                            {symbol === 5 && "String 5 (A)"}
                            {symbol === 6 && "String 6 (Low E)"}
                            {symbol === "X" && "Scratch/Chuck"}
                            {symbol === "." && "Mute"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/30 rounded">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex items-center gap-2 p-2">
                        <div className="font-mono font-bold">D</div>
                        <div className="text-sm text-muted-foreground">
                          Down All
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <div className="font-mono font-bold">d</div>
                        <div className="text-sm text-muted-foreground">
                          Down Top
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <div className="font-mono font-bold">U</div>
                        <div className="text-sm text-muted-foreground">
                          Up All
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <div className="font-mono font-bold">u</div>
                        <div className="text-sm text-muted-foreground">
                          Up Top
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <div className="font-mono font-bold">X</div>
                        <div className="text-sm text-muted-foreground">
                          Scratch
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <div className="font-mono font-bold">-</div>
                        <div className="text-sm text-muted-foreground">
                          Pause
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <div className="font-mono font-bold">.</div>
                        <div className="text-sm text-muted-foreground">
                          Mute
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

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
  const [selectedChordName, setSelectedChordName] = useState<string | null>(
    null
  );
  const [selectedPatternName, setSelectedPatternName] = useState<string | null>(
    null
  );

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
          (c) => c.id === state.selectedChordId
        );
        return {
          title: `Аккорд: ${chord?.name}`,
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
          (p) => p.id === state.selectedPatternId
        );
        return {
          title: `Паттерн: ${pattern?.name}`,
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
                    key={chord.id}
                    className={`flex items-center justify-between p-2 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors ${
                      state.selectedChordId === chord.id
                        ? "ring-2 ring-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => handleChordSelect(chord.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: chord.color }}
                      />
                      <span className="font-medium">{chord.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedChordName(chord.name);
                        }}
                        className="h-6 w-6 p-0"
                        title="Show chord"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReplaceChord(chord.id);
                        }}
                        className="h-6 w-6 p-0"
                        title="Change chord"
                      >
                        <Replace className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChordId(chord.id);
                        }}
                        className="h-6 w-6 p-0"
                        title="Change color"
                      >
                        <Palette className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleRemoveChord(chord.id, e)}
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
                    key={pattern.id}
                    className={`flex items-center justify-between p-2 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors ${
                      state.selectedPatternId === pattern.id
                        ? "ring-2 ring-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => handlePatternSelect(pattern.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: pattern.color }}
                      />
                      <div>
                        <div className="font-medium">{pattern.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {pattern.isFingerStyle ? "Fingerstyle" : "Strumming"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedPatternName(pattern.name);
                        }}
                        className="h-6 w-6 p-0"
                        title="Show pattern"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReplacePattern(pattern.id);
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
                          setEditingPatternId(pattern.id);
                        }}
                        className="h-6 w-6 p-0"
                        title="Изменить цвет"
                      >
                        <Palette className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleRemovePattern(pattern.id, e)}
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
          existingChordIds={state.selectedChords.map((c) => c.id)}
        />
      )}

      {showAddPattern && (
        <AddPatternModal
          open={showAddPattern}
          onClose={() => setShowAddPattern(false)}
          existingPatternIds={state.selectedPatterns.map((p) => p.id)}
        />
      )}

      {showReplaceChord && (
        <ReplaceChordModal
          open={!!showReplaceChord}
          onClose={() => setShowReplaceChord(null)}
          chordId={showReplaceChord!}
          existingChordIds={state.selectedChords
            .map((c) => c.id)
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
                  state.selectedChords.find((c) => c.id === editingChordId)
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
                  state.selectedPatterns.find((p) => p.id === editingPatternId)
                    ?.color === color;
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

      {selectedChordName && (
        <ChordModal
          chordName={selectedChordName}
          onClose={() => setSelectedChordName(null)}
        />
      )}

      {selectedPatternName && (
        <PatternModal
          patternName={selectedPatternName}
          onClose={() => setSelectedPatternName(null)}
        />
      )}
    </>
  );
}
