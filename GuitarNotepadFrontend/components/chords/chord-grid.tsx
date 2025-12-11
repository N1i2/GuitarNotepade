"use client";

import { Chord } from "@/types/chords";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, User } from "lucide-react";

interface ChordGridProps {
  chords: (Chord & {
    variationsCount?: number;
    canEdit?: boolean;
    userVariationsCount?: number;
  })[];
  onChordClick: (chordName: string) => void;
  onEditClick?: (chordName: string, e: React.MouseEvent) => void;
  showVariationCount?: boolean; 
  showOnlyMyChords?: boolean;
}

export function ChordGrid({ 
  chords, 
  onChordClick, 
  onEditClick,
  showVariationCount = true,
  showOnlyMyChords = false 
}: ChordGridProps) {
  const getChordColor = (name: string) => {
    const colors = [
      "bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/20 border-teal-200 dark:border-teal-800",
      "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800",
      "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800",
      "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800",
      "bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-900/20 border-rose-200 dark:border-rose-800",
      "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    ];

    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleCardClick = (chordName: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.edit-button')) {
      return;
    }
    onChordClick(chordName);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {chords.map((chord) => (
        <Card
          key={chord.id}
          className={`cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg border-2 ${getChordColor(chord.name)} relative group`}
          onClick={(e) => handleCardClick(chord.name, e)}
        >
          {chord.canEdit && !showOnlyMyChords && (
            <div className="absolute -top-2 -right-2 z-10">
              <Badge variant="secondary" className="px-2 py-1 text-xs">
                <User className="h-3 w-3 mr-1" />
                Can edit
              </Badge>
            </div>
          )}
          
          <CardContent className="p-6 flex flex-col items-center justify-center h-32">
            <div className="text-5xl font-bold text-center">
              {chord.name}
            </div>
            
            {showVariationCount && chord.variationsCount && (
              <div className="mt-2 text-sm">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-muted-foreground">All</span>
                  <span className="font-medium text-foreground">
                    {chord.variationsCount}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span className={`font-medium ${
                    chord.userVariationsCount && chord.userVariationsCount > 0 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {chord.userVariationsCount || 0}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    of your
                  </span>
                </div>
              </div>
            )}
            
            {chord.canEdit && onEditClick && (
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="outline"
                  className="edit-button h-8 w-8 p-0 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                  onClick={(e) => onEditClick(chord.name, e)}
                  title="Edit my variation"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}