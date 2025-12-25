"use client";

import { useState, useEffect } from "react";
import { PatternsService } from "@/lib/api/patterns-service";
import { Pattern } from "@/types/patterns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Check, Music, ListMusic } from "lucide-react";
import {
  PATTERN_COLORS,
  isColorValidForType,
  getNextAvailableColorForType,
} from "@/lib/song-segment-utils";
import { useSongCreation } from "@/app/contexts/song-creation-context";

interface AddPatternModalProps {
  open: boolean;
  onClose: () => void;
  existingPatternIds: string[];
}

export function AddPatternModal({
  open,
  onClose,
  existingPatternIds,
}: AddPatternModalProps) {
  const { state, dispatch } = useSongCreation();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [filteredPatterns, setFilteredPatterns] = useState<Pattern[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatternId, setSelectedPatternId] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [patternType, setPatternType] = useState<
    "all" | "strumming" | "fingerstyle"
  >("all");
  const [isLoading, setIsLoading] = useState(true);

  const usedPatternColors = state.selectedPatterns
    .map((p) => p.color)
    .filter((color): color is string => color !== undefined);

  const usedChordColors = state.selectedChords
    .map((c) => c.color)
    .filter((color): color is string => color !== undefined);

  const allUsedColors = [...usedChordColors, ...usedPatternColors];

  const availableColors = PATTERN_COLORS.filter(
    (color) =>
      isColorValidForType(color, "pattern") && !allUsedColors.includes(color)
  );

  useEffect(() => {
    if (open) {
      loadPatterns();
      setSelectedColor(getNextAvailableColorForType(allUsedColors, "pattern"));
    }
  }, [open, state.selectedPatterns, state.selectedChords]);

  useEffect(() => {
    let filtered = patterns.filter(
      (pattern) => !existingPatternIds.includes(pattern.id)
    );

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (pattern) =>
          pattern.name.toLowerCase().includes(searchLower) ||
          (pattern.description &&
            pattern.description.toLowerCase().includes(searchLower))
      );
    }

    if (patternType !== "all") {
      filtered = filtered.filter((pattern) =>
        patternType === "strumming"
          ? !pattern.isFingerStyle
          : pattern.isFingerStyle
      );
    }

    setFilteredPatterns(filtered);
  }, [searchTerm, patterns, existingPatternIds, patternType]);

  const loadPatterns = async () => {
    try {
      setIsLoading(true);
      const data = await PatternsService.getAllPatterns({
        page: 1,
        pageSize: 100,
        sortBy: "name",
        sortOrder: "asc",
      });
      setPatterns(data.items);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPattern = () => {
    if (!selectedPatternId || !selectedColor) return;

    const pattern = patterns.find((p) => p.id === selectedPatternId);
    if (!pattern) return;

    const newPatternDto = {
      id: pattern.id,
      name: pattern.name,
      pattern: pattern.pattern,
      isFingerStyle: pattern.isFingerStyle,
      description: pattern.description,
      color: selectedColor,
    };

    dispatch({ type: "ADD_PATTERN", payload: newPatternDto });
    dispatch({ type: "SELECT_PATTERN", payload: pattern.id });
    dispatch({ type: "SET_TOOL", payload: "pattern" });

    onClose();
    setSelectedPatternId("");
    setSelectedColor("");
    setSearchTerm("");
  };

  const handleColorSelect = (color: string) => {
    if (
      isColorValidForType(color, "pattern") &&
      !allUsedColors.includes(color)
    ) {
      setSelectedColor(color);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Добавить паттерн</DialogTitle>
          <DialogDescription>
            Выберите паттерн и цвет для фона
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Поиск паттернов</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Введите название паттерна..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs
              defaultValue="all"
              onValueChange={(v: any) => setPatternType(v)}
            >
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="all">Все</TabsTrigger>
                <TabsTrigger value="strumming">
                  <Music className="h-3 w-3 mr-2" />
                  Strumming
                </TabsTrigger>
                <TabsTrigger value="fingerstyle">
                  <ListMusic className="h-3 w-3 mr-2" />
                  Fingerstyle
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col space-y-3">
            <Label>Доступные паттерны ({filteredPatterns.length})</Label>
            <ScrollArea className="flex-1 border rounded-md p-2">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-md" />
                  ))}
                </div>
              ) : filteredPatterns.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {filteredPatterns.map((pattern) => (
                    <Button
                      key={pattern.id}
                      variant={
                        selectedPatternId === pattern.id ? "default" : "outline"
                      }
                      className="justify-start h-auto py-3 px-4 text-left"
                      onClick={() => setSelectedPatternId(pattern.id)}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="text-left">
                          <div className="font-medium">{pattern.name}</div>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {pattern.description || "Без описания"}
                          </div>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {pattern.isFingerStyle
                              ? "Fingerstyle"
                              : "Strumming"}
                          </Badge>
                        </div>
                        {selectedPatternId === pattern.id && (
                          <Check className="h-4 w-4 ml-2 flex-shrink-0" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {existingPatternIds.length >= 10
                    ? "Достигнут максимум 10 паттернов"
                    : searchTerm || patternType !== "all"
                    ? "Паттерны не найдены"
                    : "Все доступные паттерны уже добавлены"}
                </div>
              )}
            </ScrollArea>
          </div>

          {selectedPatternId && (
            <div className="space-y-3 border-t pt-4">
              <Label>Выберите цвет для фона</Label>
              <div className="grid grid-cols-5 gap-2">
                {availableColors.map((color) => (
                  <button
                    key={`color-${color}`}
                    className={`h-10 rounded-md border transition-all ${
                      selectedColor === color
                        ? "ring-2 ring-offset-2 ring-primary"
                        : ""
                    } ${
                      allUsedColors.includes(color)
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                    disabled={allUsedColors.includes(color)}
                  />
                ))}
              </div>

              {selectedColor && (
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span>Так будет выглядеть фон текста</span>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <div>
                  • Паттерны могут использовать только последние 10 цветов
                </div>
                <div>
                  • Каждый цвет может использоваться только один раз (ни
                  аккордами, ни паттернами)
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              onClick={handleAddPattern}
              disabled={!selectedPatternId || !selectedColor}
            >
              Добавить паттерн
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}