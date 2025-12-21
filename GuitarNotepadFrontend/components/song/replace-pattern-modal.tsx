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
import { useSongCreation } from "@/app/contexts/song-creation-context";

interface ReplacePatternModalProps {
  open: boolean;
  onClose: () => void;
  patternId: string;
}

export function ReplacePatternModal({
  open,
  onClose,
  patternId,
}: ReplacePatternModalProps) {
  const { state, dispatch } = useSongCreation();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [filteredPatterns, setFilteredPatterns] = useState<Pattern[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatternId, setSelectedPatternId] = useState<string>("");
  const [patternType, setPatternType] = useState<
    "all" | "strumming" | "fingerstyle"
  >("all");
  const [isLoading, setIsLoading] = useState(true);

  const currentPattern = state.selectedPatterns.find(
    (p) => p.patternId === patternId
  );

  useEffect(() => {
    if (open) {
      loadPatterns();
    }
  }, [open]);

  useEffect(() => {
    let filtered = patterns.filter((pattern) => pattern.id !== patternId);

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
  }, [searchTerm, patterns, patternId, patternType]);

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
      console.error("Failed to load patterns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplacePattern = () => {
    if (!selectedPatternId || !currentPattern) return;

    const newPattern = patterns.find((p) => p.id === selectedPatternId);
    if (!newPattern) return;

    const newPatternDto = {
      patternId: newPattern.id,
      patternName: newPattern.name,
      isFingerStyle: newPattern.isFingerStyle,
      color: currentPattern.color,
    };

    dispatch({
      type: "REPLACE_PATTERN",
      payload: {
        oldId: patternId,
        newId: newPattern.id,
        pattern: newPatternDto,
      },
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Заменить паттерн</DialogTitle>
          <DialogDescription>
            Выберите новый паттерн для замены "{currentPattern?.patternName}"
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
                  {searchTerm || patternType !== "all"
                    ? "Паттерны не найдены"
                    : "Нет доступных паттернов для замены"}
                </div>
              )}
            </ScrollArea>
          </div>

          {selectedPatternId && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentPattern && (
                    <div
                      className="w-5 h-5 rounded border"
                      style={{ backgroundColor: currentPattern.color }}
                    />
                  )}
                  <div>
                    <div className="font-medium">
                      Замена: {currentPattern?.patternName} →{" "}
                      {patterns.find((p) => p.id === selectedPatternId)?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Цвет паттерна останется прежним
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              onClick={handleReplacePattern}
              disabled={!selectedPatternId}
            >
              Заменить паттерн
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
