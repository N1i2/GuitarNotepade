'use client';

import { useState, useEffect } from 'react';
import { ChordsService } from '@/lib/api/chords-service';
import { Chord } from '@/types/chords';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X, Check } from 'lucide-react';
import { useSongCreation } from '@/app/contexts/song-creation-context';
import { useThemeColors } from '@/hooks/theme-song';

interface AddChordModalProps {
  open: boolean;
  onClose: () => void;
  existingChordIds: string[];
}

export function AddChordModal({ open, onClose, existingChordIds }: AddChordModalProps) {
  const { dispatch } = useSongCreation();
  const [chords, setChords] = useState<Chord[]>([]);
  const [filteredChords, setFilteredChords] = useState<Chord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChordId, setSelectedChordId] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  const { chordColors } = useThemeColors();

  const usedColors = existingChordIds.map(id => {
    return '#FF6B6B'; 
  });
  const availableColors = chordColors.filter(color => !usedColors.includes(color));

  useEffect(() => {
    if (open) {
      loadChords();
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      setFilteredChords(
        chords.filter(chord => 
          chord.name.toLowerCase().includes(searchLower) &&
          !existingChordIds.includes(chord.id)
        )
      );
    } else {
      setFilteredChords(chords.filter(chord => !existingChordIds.includes(chord.id)));
    }
  }, [searchTerm, chords, existingChordIds]);

  const loadChords = async () => {
    try {
      setIsLoading(true);
      const data = await ChordsService.getAllChords({
        page: 1,
        pageSize: 100,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      setChords(data.items);
    } catch (error) {
      console.error('Failed to load chords:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChord = () => {
    if (!selectedChordId || !selectedColor) return;

    const chord = chords.find(c => c.id === selectedChordId);
    if (!chord) return;

    const newChord = {
      chordId: chord.id,
      chordName: chord.name,
      color: selectedColor,
    };

    dispatch({ type: 'ADD_CHORD', payload: newChord });
    
    dispatch({ type: 'SELECT_CHORD', payload: chord.id });
    dispatch({ type: 'SET_TOOL', payload: 'chord' });
    
    onClose();
    setSelectedChordId('');
    setSelectedColor('');
    setSearchTerm('');
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Chord</DialogTitle>
          <DialogDescription>
            Select a chord from the library and choose a color for it
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          <div className="space-y-2">
            <Label>Search Chords</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chords by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col space-y-3">
            <Label>Available Chords ({filteredChords.length})</Label>
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
                      variant={selectedChordId === chord.id ? 'default' : 'outline'}
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
                    ? 'Maximum 20 chords reached'
                    : searchTerm
                    ? 'No chords found matching your search'
                    : 'All available chords already added'
                  }
                </div>
              )}
            </ScrollArea>
          </div>

          {selectedChordId && (
            <div className="space-y-3 border-t pt-4">
              <Label>Select Color for Underline</Label>
              <ScrollArea className="max-h-32">
                <div className="grid grid-cols-5 gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={`color-${color}`}
                      className={`h-10 rounded-md border-2 transition-all ${
                        selectedColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorSelect(color)}
                      title={color}
                    />
                  ))}
                </div>
              </ScrollArea>
              {selectedColor && (
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className="w-4 h-1 rounded"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span>Preview: This is how the underline will look</span>
                </div>
              )}
              {availableColors.length === 0 && (
                <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  All colors are already used. Remove some chords to free up colors.
                </div>
              )}
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
              Add Chord
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}