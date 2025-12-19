'use client';

import { useState, useEffect } from 'react';
import { PatternsService } from '@/lib/api/patterns-service';
import { Pattern } from '@/types/patterns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X, Check, Music, ListMusic } from 'lucide-react';
import { useSongCreation } from '@/app/contexts/song-creation-context';
import { useThemeColors } from '@/hooks/theme-song';

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
  const { dispatch } = useSongCreation();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [filteredPatterns, setFilteredPatterns] = useState<Pattern[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatternId, setSelectedPatternId] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [patternType, setPatternType] = useState<
    "all" | "strumming" | "fingerstyle"
  >("all");
  const [isLoading, setIsLoading] = useState(true);
  
  const { patternColors } = useThemeColors();

  const usedColors = existingPatternIds.map(id => {
    return '#FFE5EC'; 
  });
  const availableColors = patternColors.filter(
    (color) => !usedColors.includes(color)
  );

  useEffect(() => {
    if (open) {
      loadPatterns();
    }
  }, [open]);

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
      console.error("Failed to load patterns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPattern = () => {
    if (!selectedPatternId || !selectedColor) return;

    const pattern = patterns.find((p) => p.id === selectedPatternId);
    if (!pattern) return;

    const newPattern = {
      patternId: pattern.id,
      patternName: pattern.name,
      isFingerStyle: pattern.isFingerStyle,
      color: selectedColor,
    };

    dispatch({ type: "ADD_PATTERN", payload: newPattern });

    dispatch({ type: "SELECT_PATTERN", payload: pattern.id });
    dispatch({ type: "SET_TOOL", payload: "pattern" });

    onClose();
    setSelectedPatternId("");
    setSelectedColor("");
    setSearchTerm("");
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Pattern</DialogTitle>
          <DialogDescription>
            Select a pattern from the library and choose a background color for
            it
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search Patterns</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patterns by name..."
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
                <TabsTrigger value="all">All</TabsTrigger>
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

          <div className="space-y-3">
            <Label>Available Patterns ({filteredPatterns.length})</Label>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-md" />
                ))}
              </div>
            ) : filteredPatterns.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto p-2 border rounded-md">
                {filteredPatterns.map((pattern) => (
                  <Button
                    key={pattern.id}
                    variant={
                      selectedPatternId === pattern.id ? "default" : "outline"
                    }
                    className="justify-start h-auto py-3 px-4"
                    onClick={() => setSelectedPatternId(pattern.id)}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="text-left">
                        <div className="font-medium">{pattern.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {pattern.description || "No description"}
                        </div>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {pattern.isFingerStyle ? "Fingerstyle" : "Strumming"}
                        </Badge>
                      </div>
                      {selectedPatternId === pattern.id && (
                        <Check className="h-4 w-4 ml-2" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-md">
                {existingPatternIds.length >= 10
                  ? "Maximum 10 patterns reached"
                  : searchTerm || patternType !== "all"
                  ? "No patterns found matching your filters"
                  : "All available patterns already added"}
              </div>
            )}
          </div>

          {selectedPatternId && (
            <div className="space-y-3">
              <Label>Select Background Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {availableColors.map((color) => (
                  <button
                    key={`color-${color}`}
                    className={`h-10 rounded-md border transition-all ${
                      selectedColor === color
                        ? "ring-2 ring-offset-2 ring-primary"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                    disabled={usedColors.includes(color)}
                  />
                ))}
              </div>
              {selectedColor && (
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span>Preview: This is how the background will look</span>
                </div>
              )}
              {availableColors.length === 0 && (
                <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  All colors are already used. Remove some patterns to free up
                  colors.
                </div>
              )}
            </div>
          )}

          {selectedPatternId && (
            <div className="p-3 bg-muted rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedColor && (
                    <div
                      className="w-5 h-5 rounded border"
                      style={{ backgroundColor: selectedColor }}
                    />
                  )}
                  <div>
                    <div className="font-medium">
                      {patterns.find((p) => p.id === selectedPatternId)?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {patterns.find((p) => p.id === selectedPatternId)
                        ?.isFingerStyle
                        ? "Fingerstyle pattern"
                        : "Strumming pattern"}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedPatternId("");
                    setSelectedColor("");
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAddPattern}
              disabled={!selectedPatternId || !selectedColor}
            >
              Add Pattern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}