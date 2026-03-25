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
import { useSongCreation } from "@/app/contexts/song-creation-context";

interface ReplaceChordModalProps {
  open: boolean;
  onClose: () => void;
  chordId: string;
  existingChordIds: string[];
}

export function ReplaceChordModal({
  open,
  onClose,
  chordId,
  existingChordIds,
}: ReplaceChordModalProps) {
  const { state, dispatch } = useSongCreation();
  const [chords, setChords] = useState<Chord[]>([]);
  const [filteredChords, setFilteredChords] = useState<Chord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChordId, setSelectedChordId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const currentChord = state.selectedChords.find((c) => c.id === chordId);

  useEffect(() => {
    if (open) {
      loadChords();
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      setFilteredChords(
        chords.filter(
          (chord) =>
            chord.name.toLowerCase().includes(searchLower) &&
            chord.id !== chordId &&
            !existingChordIds.includes(chord.id),
        ),
      );
    } else {
      setFilteredChords(
        chords.filter(
          (chord) =>
            chord.id !== chordId && !existingChordIds.includes(chord.id),
        ),
      );
    }
  }, [searchTerm, chords, chordId, existingChordIds]);

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplaceChord = () => {
    if (!selectedChordId || !currentChord) return;

    const newChord = chords.find((c) => c.id === selectedChordId);
    if (!newChord) return;

    const newChordDto = {
      id: newChord.id,
      name: newChord.name,
      fingering: newChord.fingering,
      description: newChord.description,
      color: currentChord.color,
    };

    dispatch({
      type: "REPLACE_CHORD",
      payload: {
        oldId: chordId,
        newId: newChord.id,
        chord: newChordDto,
      },
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Replace Chord</DialogTitle>
          <DialogDescription>
            Select a new chord to replace "{currentChord?.name}"
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
                  {searchTerm
                    ? "No chords found"
                    : "No available replacement chords"}
                </div>
              )}
            </ScrollArea>
          </div>

          {selectedChordId && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentChord && (
                    <div
                      className="w-5 h-5 rounded-full border"
                      style={{ backgroundColor: currentChord.color }}
                    />
                  )}
                  <div>
                    <div className="font-medium">
                      Replacement: {currentChord?.name} →{" "}
                      {chords.find((c) => c.id === selectedChordId)?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      The chord color will remain the same
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleReplaceChord} disabled={!selectedChordId}>
              Replace chord
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
