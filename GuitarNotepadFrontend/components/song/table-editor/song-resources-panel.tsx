"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Music,
  GitFork,
  Eye,
  Trash2,
  Replace,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SongChordDto, SongPatternDto, TableSegment } from "@/types/songs";
import { DeleteResourceDialog } from "./delete-resource-dialog";
import { ReplaceResourceDialog } from "./replace-resource-dialog";

interface SongResourcesPanelProps {
  segments: TableSegment[];
  chords: SongChordDto[];
  patterns: SongPatternDto[];
  onChordClick?: (chordId: string) => void;
  onPatternClick?: (patternId: string) => void;
  onDeleteChord?: (chordId: string) => void;
  onDeletePattern?: (patternId: string) => void;
  onReplaceChord?: (oldChordId: string, newChordId: string) => void;
  onReplacePattern?: (oldPatternId: string, newPatternId: string) => void;
  onCreateChord?: () => void;
  onCreatePattern?: () => void;
}

export function SongResourcesPanel({
  segments,
  chords,
  patterns,
  onChordClick,
  onPatternClick,
  onDeleteChord,
  onDeletePattern,
  onReplaceChord,
  onReplacePattern,
  onCreateChord,
  onCreatePattern,
}: SongResourcesPanelProps) {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "chord" | "pattern";
    id: string;
    name: string;
  }>({
    open: false,
    type: "chord",
    id: "",
    name: "",
  });

  const [replaceDialog, setReplaceDialog] = useState<{
    open: boolean;
    type: "chord" | "pattern";
    id: string;
    name: string;
  }>({
    open: false,
    type: "chord",
    id: "",
    name: "",
  });

  const uniqueChordIds = Array.from(
    new Set(segments.filter((s) => s.chordId).map((s) => s.chordId!)),
  );

  const uniquePatternIds = Array.from(
    new Set(segments.filter((s) => s.patternId).map((s) => s.patternId!)),
  );

  const usedChords = chords.filter((chord) =>
    uniqueChordIds.includes(chord.id),
  );

  const usedPatterns = patterns.filter((pattern) =>
    uniquePatternIds.includes(pattern.id),
  );

  const chordColors = new Map<string, string>();
  segments.forEach((segment) => {
    if (segment.chordId && segment.color) {
      chordColors.set(segment.chordId, segment.color);
    }
  });

  const patternColors = new Map<string, string>();
  segments.forEach((segment) => {
    if (segment.patternId && segment.backgroundColor) {
      patternColors.set(segment.patternId, segment.backgroundColor);
    }
  });

  const handleDeleteClick = (
    type: "chord" | "pattern",
    id: string,
    name: string,
  ) => {
    setDeleteDialog({ open: true, type, id, name });
  };

  const handleReplaceClick = (
    type: "chord" | "pattern",
    id: string,
    name: string,
  ) => {
    setReplaceDialog({ open: true, type, id, name });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.type === "chord" && onDeleteChord) {
      onDeleteChord(deleteDialog.id);
    } else if (deleteDialog.type === "pattern" && onDeletePattern) {
      onDeletePattern(deleteDialog.id);
    }
    setDeleteDialog({ ...deleteDialog, open: false });
  };

  const handleReplaceConfirm = (newResourceId: string) => {
    if (replaceDialog.type === "chord" && onReplaceChord) {
      onReplaceChord(replaceDialog.id, newResourceId);
    } else if (replaceDialog.type === "pattern" && onReplacePattern) {
      onReplacePattern(replaceDialog.id, newResourceId);
    }
    setReplaceDialog({ ...replaceDialog, open: false });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 mb-2">
            <Music className="h-5 w-5" />
            Song Resources
          </CardTitle>
          <div className="flex gap-2 pt-1">
            {onCreateChord && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateChord}
                className="flex-1"
              >
                <Music className="h-4 w-4 mr-2" />
                New Chord
              </Button>
            )}
            {onCreatePattern && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCreatePattern}
                className="flex-1"
              >
                <GitFork className="h-4 w-4 mr-2" />
                New Pattern
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
              <Music className="h-4 w-4" />
              <span>Chords ({usedChords.length})</span>
            </div>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-2">
                {usedChords.map((chord) => (
                  <div
                    key={chord.id}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => onChordClick?.(chord.id)}
                    >
                      <div
                        className="w-6 h-6 rounded-full shrink-0"
                        style={{
                          backgroundColor: chordColors.get(chord.id) || "#ccc",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{chord.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {chord.fingering}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onChordClick?.(chord.name)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleReplaceClick("chord", chord.id, chord.name)
                          }
                        >
                          <Replace className="h-4 w-4 mr-2" />
                          Replace All
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleDeleteClick("chord", chord.id, chord.name)
                          }
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete All
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
                {usedChords.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No chords added yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
              <GitFork className="h-4 w-4" />
              <span>Patterns ({usedPatterns.length})</span>
            </div>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-2">
                {usedPatterns.map((pattern) => (
                  <div
                    key={pattern.id}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => onPatternClick?.(pattern.id)}
                    >
                      <div
                        className="w-6 h-6 rounded border-2 shrink-0"
                        style={{
                          backgroundColor:
                            patternColors.get(pattern.id) || "#ccc",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {pattern.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {pattern.isFingerStyle ? "Fingerstyle" : "Strumming"}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onPatternClick?.(pattern.name)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleReplaceClick(
                              "pattern",
                              pattern.id,
                              pattern.name,
                            )
                          }
                        >
                          <Replace className="h-4 w-4 mr-2" />
                          Replace All
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleDeleteClick(
                              "pattern",
                              pattern.id,
                              pattern.name,
                            )
                          }
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete All
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
                {usedPatterns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    <GitFork className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No patterns added yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      <DeleteResourceDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        resourceType={deleteDialog.type}
        resourceName={deleteDialog.name}
        onConfirm={handleDeleteConfirm}
      />

      <ReplaceResourceDialog
        open={replaceDialog.open}
        onOpenChange={(open) => setReplaceDialog({ ...replaceDialog, open })}
        resourceType={replaceDialog.type}
        currentResourceId={replaceDialog.id}
        currentResourceName={replaceDialog.name}
        availableResources={replaceDialog.type === "chord" ? chords : patterns}
        onConfirm={handleReplaceConfirm}
      />
    </>
  );
}
