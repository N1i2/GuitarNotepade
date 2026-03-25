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
  const [uniqueChords, setUniqueChords] = useState<Chord[]>([]);
  const [filteredChords, setFilteredChords] = useState<Chord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChordId, setSelectedChordId] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const usedChordColors = state.selectedChords
    .map((c) => c.color)
    .filter((color): color is string => color !== undefined);

  const usedPatternColors = state.selectedPatterns
    .map((p) => p.color)
    .filter((color): color is string => color !== undefined);

  const allUsedColors = [...usedChordColors, ...usedPatternColors];

  const availableColors = CHORD_COLORS.filter(
    (color) =>
      isColorValidForType(color, "chord") && !allUsedColors.includes(color),
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
        uniqueChords.filter(
          (chord) =>
            chord.name.toLowerCase().includes(searchLower) &&
            !existingChordIds.includes(chord.id),
        ),
      );
    } else {
      setFilteredChords(
        uniqueChords.filter((chord) => !existingChordIds.includes(chord.id)),
      );
    }
  }, [searchTerm, uniqueChords, existingChordIds]);

  const loadChords = async () => {
    try {
      setIsLoading(true);
      const data = await ChordsService.getAllChords({
        page: 1,
        pageSize: 100,
        sortBy: "name",
        sortOrder: "asc",
      });

      const uniqueByName = new Map<string, Chord>();
      data.items.forEach((item) => {
        if (!uniqueByName.has(item.name)) {
          uniqueByName.set(item.name, item);
        }
      });

      const uniqueChordsArray = Array.from(uniqueByName.values());
      setChords(data.items);
      setUniqueChords(uniqueChordsArray);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChord = () => {
    if (!selectedChordId || !selectedColor) return;

    const chord = chords.find((c) => c.id === selectedChordId);
    if (!chord) return;

    const newChordDto = {
      id: chord.id,
      name: chord.name,
      fingering: chord.fingering,
      description: chord.description,
      color: selectedColor,
    };

    dispatch({ type: "ADD_CHORD", payload: newChordDto });
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
          <DialogTitle>Add Chord</DialogTitle>
          <DialogDescription>
            Select a chord and color to highlight
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          <div className="space-y-2">
            <Label>Chord Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter the name of the chord..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col space-y-3">
            <Label>Available chords ({filteredChords.length})</Label>
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
                    ? "Maximum 20 chords reached"
                    : searchTerm
                      ? "No chords found"
                      : "All available chords have already been added"}
                </div>
              )}
            </ScrollArea>
          </div>

          {selectedChordId && (
            <div className="space-y-3 border-t pt-4">
              <Label>Select a color for the underline</Label>
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
                  <span>This is what the underline will look like</span>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <div>• Chords can only use the first 20 colors</div>
                <div>
                  • Each color can only be used once (neither chords nor
                  patterns)
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAddChord}
              disabled={!selectedChordId || !selectedColor}
            >
              Add a chord
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
