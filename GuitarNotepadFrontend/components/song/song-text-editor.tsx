"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Plus,
  MessageSquare,
  ChevronRight,
  Music,
  ListMusic,
} from "lucide-react";
import { useSongCreation } from "@/app/contexts/song-creation-context";
import {
  applyToolToSelection,
  findSegmentAtPosition,
  updateSegmentsForTextChange,
  generateSegmentId,
} from "@/lib/song-segment-utils";
import { AddCommentModal } from "./add-comment-modal";
import { toast } from "sonner";
import { SegmentsList } from "./segments-list";

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

export function SongTextEditor() {
  const { state, dispatch } = useSongCreation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [showAddComment, setShowAddComment] = useState(false);
  const [commentSegmentId, setCommentSegmentId] = useState<string>("");
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);

  const formattedText = useMemo(() => {
    if (!state.text) return "";

    const sortedSegments = [...state.segments].sort(
      (a, b) => a.startIndex - b.startIndex
    );
    let result = "";
    let currentLine = "";

    sortedSegments.forEach((segment, index) => {
      const segmentText =
        segment.text ||
        state.text.substring(
          segment.startIndex,
          segment.startIndex + segment.length
        );

      const textBeforeSegment =
        index === 0 ? state.text.substring(0, segment.startIndex) : "";

      if (textBeforeSegment) {
        if (
          currentLine.length + textBeforeSegment.length > 30 &&
          currentLine.length > 0
        ) {
          result += currentLine.trimEnd() + "\n";
          currentLine = textBeforeSegment;
        } else {
          currentLine += textBeforeSegment;
        }
      }

      if (
        currentLine.length + segmentText.length > 30 &&
        currentLine.length > 0
      ) {
        result += currentLine.trimEnd() + "\n";
        currentLine = segmentText;
      } else {
        currentLine += segmentText;
      }
    });

    if (sortedSegments.length > 0) {
      const lastSegment = sortedSegments[sortedSegments.length - 1];
      const remainingText = state.text.substring(
        lastSegment.startIndex + lastSegment.length
      );

      if (remainingText) {
        if (
          currentLine.length + remainingText.length > 30 &&
          currentLine.length > 0
        ) {
          result += currentLine.trimEnd() + "\n";
          currentLine = remainingText;
        } else {
          currentLine += remainingText;
        }
      }
    } else if (state.text) {
      const words = state.text.split(" ");
      words.forEach((word) => {
        if (
          currentLine.length + word.length + 1 > 30 &&
          currentLine.length > 0
        ) {
          result += currentLine.trimEnd() + "\n";
          currentLine = word + " ";
        } else {
          currentLine += word + " ";
        }
      });
    }

    if (currentLine) {
      result += currentLine.trimEnd();
    }

    return result;
  }, [state.text, state.segments]);

  const textSegments = useMemo(() => {
    const segments: TextSegment[] = [];
    if (!state.text || !formattedText) return segments;

    const plainText = formattedText.replace(/\n/g, " ");
    let segmentCounter = 0;

    const sortedSegments = [...state.segments].sort(
      (a, b) => a.startIndex - b.startIndex
    );
    let lastIndex = 0;

    sortedSegments.forEach((segment, index) => {
      if (segment.startIndex > lastIndex) {
        const textBefore = state.text.substring(lastIndex, segment.startIndex);
        if (textBefore) {
          segments.push({
            id: `text-before-${index}-${segmentCounter++}`,
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
  }, [state.text, state.segments, formattedText]);

  const handleTextChange = useCallback(
    (value: string) => {
      const newPlainText = value.replace(/\n/g, " ");

      const updatedSegments = updateSegmentsForTextChange(
        state.text,
        newPlainText,
        state.segments
      );

      dispatch({ type: "SET_TEXT", payload: newPlainText });
      dispatch({ type: "SET_SEGMENTS", payload: updatedSegments });
    },
    [state.text, state.segments, dispatch]
  );

  const handleTextareaSelect = useCallback(() => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    if (start !== end && (state.selectedChordId || state.selectedPatternId)) {
      const selectedDisplayText = formattedText.substring(start, end);
      if (selectedDisplayText.trim()) {
        applyToSelection(start, end);
      }
    }
  }, [formattedText, state.selectedChordId, state.selectedPatternId]);

  const applyToSelection = useCallback(
    (start: number, end: number) => {
      if (!textareaRef.current || !formattedText) return;

      const selectedDisplayText = formattedText.substring(start, end);
      if (!selectedDisplayText.trim()) return;

      const plainText = formattedText.replace(/\n/g, " ");
      const displayTextBeforeStart = formattedText.substring(0, start);
      const plainTextBeforeStart = displayTextBeforeStart.replace(/\n/g, " ");
      const displayTextBeforeEnd = formattedText.substring(0, end);
      const plainTextBeforeEnd = displayTextBeforeEnd.replace(/\n/g, " ");

      const plainStart = plainTextBeforeStart.length;
      const plainEnd = plainTextBeforeEnd.length;

      let tool: "chord" | "pattern" | null = null;
      let selectedId: string | undefined;

      if (state.currentTool === "chord" && state.selectedChordId) {
        tool = "chord";
        selectedId = state.selectedChordId;
      } else if (state.currentTool === "pattern" && state.selectedPatternId) {
        tool = "pattern";
        selectedId = state.selectedPatternId;
      }

      if (!tool || !selectedId) return;

      const newSegments = applyToolToSelection(
        state.segments,
        state.text,
        plainStart,
        plainEnd,
        tool,
        selectedId,
        state.selectedChords,
        state.selectedPatterns
      );

      dispatch({ type: "SET_SEGMENTS", payload: newSegments });

      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(start, start);
        textareaRef.current.focus();
      }
    },
    [formattedText, state, dispatch]
  );

  const handleTextareaClick = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      if (!textareaRef.current || state.currentTool !== "comment") return;

      const cursorPosition = textareaRef.current.selectionStart;
      const displayTextBeforeCursor = formattedText.substring(
        0,
        cursorPosition
      );
      const plainTextPosition = displayTextBeforeCursor.replace(
        /\n/g,
        " "
      ).length;

      const segment = findSegmentAtPosition(state.segments, plainTextPosition);
      if (segment) {
        setCommentSegmentId(segment.id);
        setShowAddComment(true);
      } else {
        toast.error("Unable to find segment for comment");
      }
    },
    [formattedText, state.segments, state.currentTool]
  );

  const handleManualApply = useCallback(() => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    if (start === end) {
      toast.error("Please select the text first");
      return;
    }

    if (!state.selectedChordId && !state.selectedPatternId) {
      toast.error("Please select a chord or pattern first");
      return;
    }

    applyToSelection(start, end);
  }, [applyToSelection, state.selectedChordId, state.selectedPatternId]);

  const addSpaceSegment = useCallback(() => {
    const spaceText = "[SPACE]";
    const newPlainText = state.text + (state.text ? " " : "") + spaceText + " ";

    const newSegment = {
      id: generateSegmentId(
        state.text.length + (state.text ? 1 : 0),
        spaceText.length
      ),
      order: state.segments.length,
      startIndex: state.text.length + (state.text ? 1 : 0),
      length: spaceText.length,
      text: spaceText,
      chordId: undefined,
      patternId: undefined,
      backgroundColor: "#f0f0f0",
    };

    dispatch({ type: "SET_TEXT", payload: newPlainText });
    dispatch({ type: "ADD_SEGMENT", payload: newSegment });
  }, [state.text, state.segments.length, dispatch]);

  const handleSegmentClick = useCallback(
    (segmentId: string) => {
      const segment = state.segments.find((s) => s.id === segmentId);
      if (!segment || !textareaRef.current) return;

      const plainTextBeforeSegment = state.text.substring(
        0,
        segment.startIndex
      );
      const displayPosition = countDisplayPosition(plainTextBeforeSegment);

      const segmentText =
        segment.text ||
        state.text.substring(
          segment.startIndex,
          segment.startIndex + segment.length
        );
      const plainTextIncludingSegment = state.text.substring(
        0,
        segment.startIndex + segmentText.length
      );
      const displayEndPosition = countDisplayPosition(
        plainTextIncludingSegment
      );

      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        displayPosition,
        displayEndPosition
      );
    },
    [state.segments, state.text]
  );

  const countDisplayPosition = useCallback(
    (plainText: string): number => {
      if (!formattedText) return 0;

      let displayPos = 0;
      let plainPos = 0;
      const plainTextWithoutNewlines = formattedText.replace(/\n/g, " ");

      while (plainPos < plainText.length && displayPos < formattedText.length) {
        if (formattedText[displayPos] === "\n") {
          displayPos++;
        } else {
          if (plainPos < plainText.length) {
            plainPos++;
          }
          displayPos++;
        }
      }

      return displayPos;
    },
    [formattedText]
  );

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      dispatch({ type: "DELETE_COMMENT", payload: commentId });
    },
    [dispatch]
  );

  const renderPreview = useMemo(() => {
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
          className="relative inline-block group cursor-pointer"
          onMouseEnter={() => setHoveredSegmentId(segment.segmentId || null)}
          onMouseLeave={() => setHoveredSegmentId(null)}
          onClick={() =>
            segment.segmentId && handleSegmentClick(segment.segmentId)
          }
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
    handleSegmentClick,
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Edit Text</Label>
            <div className="text-sm text-muted-foreground">
              {state.text.length} characters • {state.segments.length} segments
            </div>
          </div>
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={formattedText}
              onChange={(e) => handleTextChange(e.target.value)}
              onSelect={handleTextareaSelect}
              onClick={handleTextareaClick}
              placeholder="Write song lyrics here..."
              className="min-h-[400px] font-mono resize-none text-base leading-relaxed whitespace-pre-wrap"
              rows={20}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              size="sm"
              onClick={handleManualApply}
              disabled={!state.selectedChordId && !state.selectedPatternId}
              className="flex-1"
            >
              Apply{" "}
              {state.currentTool === "chord"
                ? "chord"
                : state.currentTool === "pattern"
                ? "[pattern]"
                : ""}
            </Button>
            <Button size="sm" variant="outline" onClick={addSpaceSegment}>
              <Plus className="h-4 w-4 mr-2" />
              Add a space
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (textareaRef.current) {
                  const start = textareaRef.current.selectionStart;
                  const end = textareaRef.current.selectionEnd;

                  if (start === end) {
                    toast.error("Please select text for comment");
                    return;
                  }

                  const displayTextBeforeCursor = formattedText.substring(
                    0,
                    start
                  );
                  const plainTextPosition = displayTextBeforeCursor.replace(
                    /\n/g,
                    " "
                  ).length;
                  const segment = findSegmentAtPosition(
                    state.segments,
                    plainTextPosition
                  );
                  if (segment) {
                    setCommentSegmentId(segment.id);
                    setShowAddComment(true);
                  }
                }
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Add a comment
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Preview</Label>
            <div className="text-sm text-muted-foreground">
              Hover over the highlighted text for information
            </div>
          </div>
          <div
            ref={previewRef}
            className="min-h-[400px] p-4 border rounded-lg bg-background whitespace-pre-wrap font-mono overflow-y-auto leading-relaxed text-base"
            style={{ wordBreak: "break-word" }}
          >
            {renderPreview.length > 0 ? (
              renderPreview
            ) : (
              <div className="text-muted-foreground italic h-full flex items-center justify-center">
                A preview of the text will appear here...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <ChevronRight className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">List of segments</h3>
          <span className="text-sm text-muted-foreground ml-2">
            ({state.segments.length} segments)
          </span>
        </div>
        <SegmentsList
          onSegmentClick={handleSegmentClick}
          segments={state.segments}
          chords={state.selectedChords}
          patterns={state.selectedPatterns}
          comments={state.comments}
          onDeleteComment={handleDeleteComment}
        />
      </div>

      {showAddComment && (
        <AddCommentModal
          open={showAddComment}
          onClose={() => {
            setShowAddComment(false);
            setCommentSegmentId("");
          }}
          segmentId={commentSegmentId}
        />
      )}
    </div>
  );
}
