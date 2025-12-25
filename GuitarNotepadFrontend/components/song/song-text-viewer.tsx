"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MessageSquare, Music, ListMusic } from "lucide-react";
import { useSongCreation } from "@/app/contexts/song-creation-context";

interface TextSegment {
  id: string;
  type: "text" | "segment";
  content: string;
  startIndex?: number;
  length?: number;
  segmentId?: string;
  color?: string;
  backgroundColor?: string;
  hasComments?: boolean;
  chordId?: string;
  patternId?: string;
}

export function SongTextViewer() {
  const { state } = useSongCreation();
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);

  const textSegments = useMemo(() => {
    const segments: TextSegment[] = [];
    if (!state.text) return segments;

    const sortedSegments = [...state.segments].sort(
      (a, b) => a.startIndex - b.startIndex
    );
    let lastIndex = 0;
    let segmentCounter = 0;

    sortedSegments.forEach((segment) => {
      if (segment.startIndex > lastIndex) {
        const textBefore = state.text.substring(lastIndex, segment.startIndex);
        if (textBefore) {
          segments.push({
            id: `text-before-${segmentCounter++}`,
            type: "text",
            content: textBefore,
          });
        }
      }

      const segmentText =
        segment.text ||
        state.text.substring(
          segment.startIndex,
          segment.startIndex + segment.length
        );

      if (segmentText) {
        const hasComments = segment.comments && segment.comments.length > 0;
        segments.push({
          id: segment.id || `segment-${segmentCounter++}`,
          type: "segment",
          content: segmentText,
          startIndex: segment.startIndex,
          length: segment.length,
          segmentId: segment.id,
          color: segment.color,
          backgroundColor: segment.backgroundColor,
          hasComments,
          chordId: segment.chordId,
          patternId: segment.patternId,
        });
      }

      lastIndex = segment.startIndex + segment.length;
    });

    if (lastIndex < state.text.length) {
      const remainingText = state.text.substring(lastIndex);
      if (remainingText) {
        segments.push({
          id: `text-end-${segmentCounter++}`,
          type: "text",
          content: remainingText,
        });
      }
    }

    return segments;
  }, [state.text, state.segments]);

  const renderViewer = useMemo(() => {
    return textSegments.map((segment) => {
      if (segment.type === "text") {
        return (
          <span key={segment.id} className="whitespace-pre-wrap">
            {segment.content}
          </span>
        );
      }

      const segmentStyles: React.CSSProperties = {
        position: "relative",
        display: "inline-block",
        whiteSpace: "pre-wrap",
      };

      if (segment.color) {
        segmentStyles.borderBottom = `3px solid ${segment.color}`;
      }

      if (segment.backgroundColor) {
        segmentStyles.backgroundColor = segment.backgroundColor;
        segmentStyles.padding = "1px 3px";
        segmentStyles.borderRadius = "3px";
        segmentStyles.margin = "0 1px";
        if (segment.color) {
          segmentStyles.marginBottom = "3px";
        }
      }

      const chord = segment.chordId
        ? state.selectedChords.find((c) => c.id === segment.chordId)
        : null;
      const pattern = segment.patternId
        ? state.selectedPatterns.find((p) => p.id === segment.patternId)
        : null;

      return (
        <span
          key={segment.id}
          style={segmentStyles}
          className="relative inline-block group"
          onMouseEnter={() => setHoveredSegmentId(segment.segmentId || null)}
          onMouseLeave={() => setHoveredSegmentId(null)}
          title={`${segment.content.trim()}\n${
            chord ? `Chord: ${chord.name}` : ""
          }\n${pattern ? `Pattern: ${pattern.name}` : ""}`}
        >
          {segment.content}
          {segment.hasComments && (
            <span className="absolute -top-1 -right-1">
              <MessageSquare className="h-3 w-3 text-blue-500" />
            </span>
          )}

          {hoveredSegmentId === segment.segmentId && (chord || pattern) && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md shadow-lg z-50 whitespace-nowrap">
              <div className="flex items-center gap-2">
                {chord && (
                  <>
                    <Music className="h-3 w-3" />
                    <span>{chord.name}</span>
                  </>
                )}
                {pattern && (
                  <>
                    <ListMusic className="h-3 w-3" />
                    <span>{pattern.name}</span>
                  </>
                )}
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
            </div>
          )}
        </span>
      );
    });
  }, [
    textSegments,
    state.selectedChords,
    state.selectedPatterns,
    hoveredSegmentId,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Lyrics (view only)</Label>
        <div className="text-sm text-muted-foreground">
          {state.text.length} characters • {state.segments.length} segments
        </div>
      </div>
      <div
        className="min-h-[400px] p-4 border rounded-lg bg-background whitespace-pre-wrap font-mono overflow-y-auto leading-relaxed text-base"
        style={{ wordBreak: "break-word" }}
      >
        {renderViewer.length > 0 ? (
          renderViewer
        ) : (
          <div className="text-muted-foreground italic h-full flex items-center justify-center">
            Lyrics...
          </div>
        )}
      </div>
    </div>
  );
}
