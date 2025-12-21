"use client";

import { useState, useEffect } from "react";
import { ChordsService } from "@/lib/api/chords-service";
import { Chord } from "@/types/chords";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Check } from "lucide-react";
import {
  CHORD_COLORS,
  isColorValidForType,
  getNextAvailableColorForType,
} from "@/lib/song-segment-utils";
import { useSongCreation } from "@/app/contexts/song-creation-context";

interface AddChordModalProps {
  open: boolean;
  onClose: () => void;
  existingChordIds: string[];
}

export function AddChordModal({
  open,
  onClose,
  existingChordIds,
}: AddChordModalProps) {
  const { state, dispatch } = useSongCreation();
  const [chords, setChords] = useState<Chord[]>([]);
  const [filteredChords, setFilteredChords] = useState<Chord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChordId, setSelectedChordId] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const usedChordColors = state.selectedChords.map((c) => c.color);

  const usedPatternColors = state.selectedPatterns.map((p) => p.color);

  const allUsedColors = [...usedChordColors, ...usedPatternColors];

  const availableColors = CHORD_COLORS.filter(
    (color) =>
      isColorValidForType(color, "chord") && !allUsedColors.includes(color)
  );

  useEffect(() => {
    if (open) {
      loadChords();
      setSelectedColor(getNextAvailableColorForType(allUsedColors, "chord"));
    }
  }, [open, state.selectedChords, state.selectedPatterns]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      setFilteredChords(
        chords.filter(
          (chord) =>
            chord.name.toLowerCase().includes(searchLower) &&
            !existingChordIds.includes(chord.id)
        )
      );
    } else {
      setFilteredChords(
        chords.filter((chord) => !existingChordIds.includes(chord.id))
      );
    }
  }, [searchTerm, chords, existingChordIds]);

  const loadChords = async () => {
    try {
      setIsLoading(true);
      const data = await ChordsService.getAllChords({
        page: 1,
        pageSize: 100,
        sortBy: "name",
        sortOrder: "asc",
      });
      setChords(data.items);
    } catch (error) {
      console.error("Failed to load chords:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChord = () => {
    if (!selectedChordId || !selectedColor) return;

    const chord = chords.find((c) => c.id === selectedChordId);
    if (!chord) return;

    const newChord = {
      chordId: chord.id,
      chordName: chord.name,
      color: selectedColor,
    };

    dispatch({ type: "ADD_CHORD", payload: newChord });
    dispatch({ type: "SELECT_CHORD", payload: chord.id });
    dispatch({ type: "SET_TOOL", payload: "chord" });

    onClose();
    setSelectedChordId("");
    setSelectedColor("");
    setSearchTerm("");
  };

  const handleColorSelect = (color: string) => {
    if (isColorValidForType(color, "chord") && !allUsedColors.includes(color)) {
      setSelectedColor(color);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Добавить аккорд</DialogTitle>
          <DialogDescription>
            Выберите аккорд и цвет для подчеркивания
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          <div className="space-y-2">
            <Label>Поиск аккордов</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Введите название аккорда..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col space-y-3">
            <Label>Доступные аккорды ({filteredChords.length})</Label>
            <ScrollArea className="flex-1 border rounded-md p-2">
              {isLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-md" />
                  ))}
                </div>
              ) : filteredChords.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {filteredChords.map((chord) => (
                    <Button
                      key={chord.id}
                      variant={
                        selectedChordId === chord.id ? "default" : "outline"
                      }
                      className="justify-start h-auto py-3"
                      onClick={() => setSelectedChordId(chord.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{chord.name}</span>
                        {selectedChordId === chord.id && (
                          <Check className="h-4 w-4" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {existingChordIds.length >= 20
                    ? "Достигнут максимум 20 аккордов"
                    : searchTerm
                    ? "Аккорды не найдены"
                    : "Все доступные аккорды уже добавлены"}
                </div>
              )}
            </ScrollArea>
          </div>

          {selectedChordId && (
            <div className="space-y-3 border-t pt-4">
              <Label>Выберите цвет для подчеркивания</Label>
              <div className="grid grid-cols-5 gap-2">
                {availableColors.map((color) => (
                  <button
                    key={`color-${color}`}
                    className={`h-10 rounded-md border-2 transition-all ${
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
                    className="w-4 h-1 rounded"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span>Так будет выглядеть подчеркивание</span>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <div>• Аккорды могут использовать только первые 20 цветов</div>
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
              onClick={handleAddChord}
              disabled={!selectedChordId || !selectedColor}
            >
              Добавить аккорд
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
