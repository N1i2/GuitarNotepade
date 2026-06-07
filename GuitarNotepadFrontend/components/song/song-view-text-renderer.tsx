"use client";

import React from "react";
import { MessageSquare } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  needsLineBreakBefore,
  splitInternalUppercaseLineBreaks,
} from "@/lib/song-view-text-utils";

interface SongViewSegment {
  id: string;
  startIndex: number;
  length: number;
  chordId?: string;
  patternId?: string;
  color?: string;
  backgroundColor?: string;
  comments?: Array<{ text?: string; authorName?: string }>;
}

interface SongViewResource {
  id: string;
  name: string;
  color?: string;
}

interface SongViewTextRendererProps {
  songText: string;
  segments: SongViewSegment[];
  chords: SongViewResource[];
  patterns: SongViewResource[];
  showAllHints: boolean;
  popoverSegment: string | null;
  onPopoverSegmentChange: (segmentId: string | null) => void;
  onSegmentMouseEnter: (segmentId: string, event: React.MouseEvent) => void;
  onSegmentMouseLeave: () => void;
}

function getSegmentStyles({
  hasChord,
  hasPattern,
  chordColor,
  patternColor,
}: {
  hasChord: boolean;
  hasPattern: boolean;
  chordColor?: string;
  patternColor?: string;
}): React.CSSProperties {
  const styles: React.CSSProperties = {
    display: "inline",
    padding: "1px 6px",
    margin: "0 2px",
    borderRadius: "5px",
    lineHeight: 1.8,
  };

  if (hasChord && chordColor) {
    styles.border = `3px solid ${chordColor}`;
    styles.backgroundColor = `${chordColor}22`;
  }

  if (hasPattern && patternColor) {
    styles.backgroundColor = patternColor;
    styles.padding = "1px 6px";
    styles.borderRadius = "5px";
  }

  return styles;
}

function renderPlainTextParts(
  text: string,
  globalOffset: number,
  keyPrefix: string,
  breakBeforeChunk = false,
): React.ReactNode[] {
  const parts = splitInternalUppercaseLineBreaks(text, globalOffset);
  const nodes: React.ReactNode[] = [];

  parts.forEach((part, index) => {
    if (breakBeforeChunk || index > 0) {
      nodes.push(<br key={`${keyPrefix}-br-${index}`} />);
      breakBeforeChunk = false;
    }

    nodes.push(
      <span
        key={`${keyPrefix}-text-${index}`}
        className="whitespace-pre-wrap leading-[1.8]"
      >
        {part}
      </span>,
    );
  });

  return nodes;
}

export function SongViewTextRenderer({
  songText,
  segments,
  chords,
  patterns,
  showAllHints,
  popoverSegment,
  onPopoverSegmentChange,
  onSegmentMouseEnter,
  onSegmentMouseLeave,
}: SongViewTextRendererProps) {
  const sortedSegments = [...segments].sort(
    (left, right) => left.startIndex - right.startIndex,
  );
  const result: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedSegments.forEach((segment) => {
    if (segment.startIndex > songText.length) {
      return;
    }

    if (segment.startIndex > lastIndex) {
      const beforeText = songText.substring(lastIndex, segment.startIndex);
      if (beforeText) {
        result.push(
          ...renderPlainTextParts(
            beforeText,
            lastIndex,
            `before-${segment.id}-${lastIndex}`,
          ),
        );
      }
    }

    const segmentEnd = Math.min(
      segment.startIndex + segment.length,
      songText.length,
    );
    const segmentText = songText.substring(segment.startIndex, segmentEnd);
    const hasContent = segmentText.trim().length > 0;
    const hasChord = !!segment.chordId;
    const hasPattern = !!segment.patternId;
    const isEmptyPlayback = !hasContent && (hasChord || hasPattern);
    const breakBeforeSegment =
      hasContent && needsLineBreakBefore(segmentText, segment.startIndex);
    const chordName = chords.find((chord) => chord.id === segment.chordId)?.name;
    const pattern = patterns.find((item) => item.id === segment.patternId);
    const patternColor = pattern?.color ?? segment.backgroundColor;
    const hasComments = segment.comments && segment.comments.length > 0;

    const segmentStyles = getSegmentStyles({
      hasChord,
      hasPattern,
      chordColor: segment.color,
      patternColor,
    });

    const renderSegmentBody = (text: string, partKey: string, isPrimaryPart: boolean) => (
      <span
        key={partKey}
        id={isPrimaryPart ? `song-segment-${segment.id}` : undefined}
        style={segmentStyles}
        className={`relative group cursor-default ${isEmptyPlayback ? "inline-block min-w-8" : ""}`}
        title={!showAllHints ? chordName || undefined : undefined}
        onMouseEnter={(event) => onSegmentMouseEnter(segment.id, event)}
        onMouseLeave={onSegmentMouseLeave}
      >
        {showAllHints && chordName && isPrimaryPart && (
          <span className="mr-1 inline-block rounded bg-popover px-1 py-0.5 align-middle text-[10px] text-popover-foreground shadow-sm">
            {chordName}
          </span>
        )}

        {isEmptyPlayback ? (
          <span className="text-sm italic opacity-50">⏺</span>
        ) : (
          text
        )}

        {hasComments && isPrimaryPart && (
          <Popover
            open={popoverSegment === segment.id}
            onOpenChange={(open) =>
              onPopoverSegmentChange(open ? segment.id : null)
            }
          >
            <PopoverTrigger asChild>
              <span className="absolute -right-2 -top-2 cursor-help">
                <MessageSquare className="h-3 w-3 fill-blue-100 text-blue-500" />
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span>Comment</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {segment.comments?.[0]?.text || "No comment"}
                </div>
                {segment.comments?.[0]?.authorName && (
                  <div className="border-t pt-1 text-xs text-muted-foreground">
                    – {segment.comments[0].authorName}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </span>
    );

    if (isEmptyPlayback) {
      result.push(renderSegmentBody("", segment.id, true));
    } else {
      const parts = splitInternalUppercaseLineBreaks(
        segmentText,
        segment.startIndex,
      );

      parts.forEach((part, index) => {
        if (breakBeforeSegment || index > 0) {
          result.push(<br key={`${segment.id}-br-${index}`} />);
        }

        result.push(
          renderSegmentBody(part, `${segment.id}-${index}`, index === 0),
        );
      });
    }

    lastIndex = segmentEnd;
  });

  if (lastIndex < songText.length) {
    const trailingText = songText.substring(lastIndex);
    result.push(
      ...renderPlainTextParts(
        trailingText,
        lastIndex,
        `end-${lastIndex}`,
        needsLineBreakBefore(trailingText, lastIndex),
      ),
    );
  }

  return <>{result}</>;
}
