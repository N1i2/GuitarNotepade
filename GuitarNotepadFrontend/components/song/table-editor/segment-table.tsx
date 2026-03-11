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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GripVertical, Copy, Trash2, Plus } from "lucide-react";
import { SegmentType, SongChordDto, SongPatternDto, TableSegment } from "@/types/songs";

interface SegmentTableProps {
  segments: TableSegment[]
  chords: SongChordDto[]
  patterns: SongPatternDto[]
  onUpdateSegment: (index: number, segment: TableSegment) => void
  onDeleteSegment: (index: number) => void
  onAddSegment: () => void
  onReorderSegments: (fromIndex: number, toIndex: number) => void
}

export function SegmentTable({
  segments,
  chords,
  patterns,
  onUpdateSegment,
  onDeleteSegment,
  onAddSegment,
  onReorderSegments
}: SegmentTableProps) {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Text / Lyrics</TableHead>
              <TableHead>Chord</TableHead>
              <TableHead>Pattern</TableHead>
              <TableHead>Repeat Group</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {segments.map((segment, index) => (
              <TableRow key={segment.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <GripVertical className="h-4 w-4 cursor-move text-muted-foreground" />
                </TableCell>
                <TableCell>
                  <Select
                    value={String(segment.type)}
                    onValueChange={(value) => 
                      onUpdateSegment(index, { 
                        ...segment, 
                        type: parseInt(value) as SegmentType
                      })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Text</SelectItem>
                      <SelectItem value="1">Playback</SelectItem>
                      <SelectItem value="2">Space</SelectItem>
                      <SelectItem value="3">Section</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={segment.text}
                    onChange={(e) => 
                      onUpdateSegment(index, { 
                        ...segment, 
                        text: e.target.value 
                      })
                    }
                    placeholder="Lyrics..."
                    className="min-w-[200px]"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={segment.chordId || "none"}
                    onValueChange={(value) => 
                      onUpdateSegment(index, { 
                        ...segment, 
                        chordId: value === "none" ? undefined : value,
                        color: chords.find(c => c.id === value)?.color
                      })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="No chord" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {chords.map(chord => (
                        <SelectItem key={chord.id} value={chord.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: chord.color }}
                            />
                            {chord.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={segment.patternId || "none"}
                    onValueChange={(value) => 
                      onUpdateSegment(index, { 
                        ...segment, 
                        patternId: value === "none" ? undefined : value,
                        backgroundColor: patterns.find(p => p.id === value)?.color
                      })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="No pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {patterns.map(pattern => (
                        <SelectItem key={pattern.id} value={pattern.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded border" 
                              style={{ backgroundColor: pattern.color }}
                            />
                            {pattern.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={segment.repeatGroup || ""}
                    onChange={(e) => 
                      onUpdateSegment(index, { 
                        ...segment, 
                        repeatGroup: e.target.value || undefined
                      })
                    }
                    placeholder="e.g., chorus"
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newSegment = { ...segment, id: crypto.randomUUID() }
                        onAddSegment() // Добавить после текущего
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteSegment(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <Button onClick={onAddSegment} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add New Segment
      </Button>
    </div>
  )
}