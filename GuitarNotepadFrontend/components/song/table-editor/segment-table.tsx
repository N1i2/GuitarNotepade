"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GripVertical, Copy, Trash2, Plus } from "lucide-react";
import { SongChordDto, SongPatternDto, TableSegment } from "@/types/songs";
import { AdvancedResourceSelect } from "./advanced-resource-select";
import { memo, useCallback, useState } from "react";

interface SegmentTableProps {
  segments: TableSegment[];
  chords: SongChordDto[];
  patterns: SongPatternDto[];
  onUpdateSegment: (index: number, segment: TableSegment) => void;
  onDeleteSegment: (index: number) => void;
  onAddSegment: (copyFromSegment?: TableSegment) => void;
  onReorderSegments: (fromIndex: number, toIndex: number) => void;
}

const SegmentRow = memo(
  function SegmentRow({
    segment,
    index,
    chords,
    patterns,
    onUpdateSegment,
    onDeleteSegment,
    onCopySegment,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDrop,
  }: {
    segment: TableSegment;
    index: number;
    chords: SongChordDto[];
    patterns: SongPatternDto[];
    onUpdateSegment: (index: number, segment: TableSegment) => void;
    onDeleteSegment: (index: number) => void;
    onCopySegment: (segment: TableSegment) => void;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
  }) {
    const [chordSearchQuery, setChordSearchQuery] = useState("");
    const [patternSearchQuery, setPatternSearchQuery] = useState("");

    const handleTextChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const updated = { ...segment, text: e.target.value };
        onUpdateSegment(index, updated);
      },
      [segment, index, onUpdateSegment],
    );

    const handleChordChange = useCallback(
      (value: string | undefined) => {
        const updated = {
          ...segment,
          chordId: value,
          color: chords.find((c) => c.id === value)?.color,
        };
        onUpdateSegment(index, updated);
        setChordSearchQuery("");
      },
      [segment, index, chords, onUpdateSegment],
    );

    const handlePatternChange = useCallback(
      (value: string | undefined) => {
        const updated = {
          ...segment,
          patternId: value,
          backgroundColor: patterns.find((p) => p.id === value)?.color,
        };
        onUpdateSegment(index, updated);
        setPatternSearchQuery("");
      },
      [segment, index, patterns, onUpdateSegment],
    );

    const handleCommentChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const updated = { ...segment, comment: e.target.value };
        onUpdateSegment(index, updated);
      },
      [segment, index, onUpdateSegment],
    );

    const handleChordSearchChange = useCallback((query: string) => {
      setChordSearchQuery(query);
    }, []);

    const handlePatternSearchChange = useCallback((query: string) => {
      setPatternSearchQuery(query);
    }, []);

    const handleDelete = useCallback(() => {
      onDeleteSegment(index);
    }, [index, onDeleteSegment]);

    const handleCopy = useCallback(() => {
      onCopySegment(segment);
    }, [segment, onCopySegment]);

    const handleDragStartWrapper = useCallback(
      (e: React.DragEvent) => {
        onDragStart(e, index);
      },
      [index, onDragStart],
    );

    const handleDropWrapper = useCallback(
      (e: React.DragEvent) => {
        onDrop(e, index);
      },
      [index, onDrop],
    );

    return (
      <TableRow
        key={segment.id}
        draggable
        onDragStart={handleDragStartWrapper}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDrop={handleDropWrapper}
        className="cursor-default hover:bg-muted/50"
      >
        <TableCell>{index + 1}</TableCell>
        <TableCell>
          <div className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </TableCell>
        <TableCell>
          <Input
            value={segment.text || ""}
            onChange={handleTextChange}
            placeholder="Lyrics..."
            className="min-w-[200px]"
          />
        </TableCell>
        <TableCell>
          <AdvancedResourceSelect
            type="chord"
            value={segment.chordId}
            onChange={handleChordChange}
            resources={chords}
            placeholder="Select chord"
            currentColor={segment.color}
            searchQuery={chordSearchQuery}
            onSearchChange={handleChordSearchChange}
          />
        </TableCell>
        <TableCell>
          <AdvancedResourceSelect
            type="pattern"
            value={segment.patternId}
            onChange={handlePatternChange}
            resources={patterns}
            placeholder="Select pattern"
            currentColor={segment.backgroundColor}
            searchQuery={patternSearchQuery}
            onSearchChange={handlePatternSearchChange}
          />
        </TableCell>
        <TableCell>
          <Input
            value={segment.comment || ""}
            onChange={handleCommentChange}
            placeholder="Comment..."
            className="min-w-[150px]"
          />
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy to end</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete segment</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.segment === nextProps.segment &&
      prevProps.index === nextProps.index &&
      prevProps.chords === nextProps.chords &&
      prevProps.patterns === nextProps.patterns &&
      prevProps.onUpdateSegment === nextProps.onUpdateSegment &&
      prevProps.onDeleteSegment === nextProps.onDeleteSegment &&
      prevProps.onCopySegment === nextProps.onCopySegment
    );
  },
);

export const SegmentTable = memo(
  function SegmentTable({
    segments,
    chords,
    patterns,
    onUpdateSegment,
    onDeleteSegment,
    onAddSegment,
    onReorderSegments,
  }: SegmentTableProps) {
    const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
      e.dataTransfer.setData("text/plain", index.toString());
      e.currentTarget.classList.add("opacity-50");
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }, []);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
      e.currentTarget.classList.remove("opacity-50");
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);

        if (!isNaN(sourceIndex) && sourceIndex !== targetIndex) {
          onReorderSegments(sourceIndex, targetIndex);
        }
      },
      [onReorderSegments],
    );

    const handleCopySegment = useCallback(
      (segment: TableSegment) => {
        const copySegment = {
          ...segment,
          id: crypto.randomUUID(),
          order: segments.length,
        };
        onAddSegment(copySegment);
      },
      [segments.length, onAddSegment],
    );

    const handleAddSegment = useCallback(() => {
      onAddSegment();
    }, [onAddSegment]);

    return (
      <TooltipProvider>
        <div className="space-y-4">
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Text / Lyrics</TableHead>
                  <TableHead>Chord</TableHead>
                  <TableHead>Pattern</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.map((segment, index) => (
                  <SegmentRow
                    key={segment.id}
                    segment={segment}
                    index={index}
                    chords={chords}
                    patterns={patterns}
                    onUpdateSegment={onUpdateSegment}
                    onDeleteSegment={onDeleteSegment}
                    onCopySegment={handleCopySegment}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <Button onClick={handleAddSegment} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add New Segment
          </Button>
        </div>
      </TooltipProvider>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.segments === nextProps.segments &&
      prevProps.chords === nextProps.chords &&
      prevProps.patterns === nextProps.patterns &&
      prevProps.onUpdateSegment === nextProps.onUpdateSegment &&
      prevProps.onDeleteSegment === nextProps.onDeleteSegment &&
      prevProps.onAddSegment === nextProps.onAddSegment &&
      prevProps.onReorderSegments === nextProps.onReorderSegments
    );
  },
);
