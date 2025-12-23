"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
} from "@/lib/song-segment-utils";
import { AddCommentModal } from "./add-comment-modal";
import { toast } from "sonner";
import { SegmentsList } from "./segments-list";

interface TextSegment {
  type: "text" | "segment" | "space";
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
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showAddComment, setShowAddComment] = useState(false);
  const [commentSegmentId, setCommentSegmentId] = useState<string>("");
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [displayText, setDisplayText] = useState("");

  const [isInitialized, setIsInitialized] = useState(false);

  const formatTextWithSpaces = useCallback((segments: any[], text: string) => {
    if (!text || segments.length === 0) return text;

    const sortedSegments = [...segments].sort(
      (a, b) => a.startIndex - b.startIndex
    );

    let result = "";
    let currentLine = "";
    let lastEndIndex = 0;

    for (let i = 0; i < sortedSegments.length; i++) {
      const segment = sortedSegments[i];

      if (segment.startIndex > lastEndIndex) {
        const gap = text.substring(lastEndIndex, segment.startIndex);
        if (gap) {
          currentLine += gap;
        }
      }

      let segmentText =
        segment.text ||
        text.substring(segment.startIndex, segment.startIndex + segment.length);

      if (i > 0 && !segmentText.startsWith(" ")) {
        segmentText = " " + segmentText;
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

      lastEndIndex = segment.startIndex + segment.length;
    }

    if (lastEndIndex < text.length) {
      const remaining = text.substring(lastEndIndex);
      if (remaining) {
        if (
          currentLine.length + remaining.length > 30 &&
          currentLine.length > 0
        ) {
          result += currentLine.trimEnd() + "\n";
          currentLine = remaining;
        } else {
          currentLine += remaining;
        }
      }
    }

    if (currentLine) {
      result += currentLine.trimEnd();
    }

    return result;
  }, []);

  const updateSegmentsForTextChange = useCallback(
    (oldText: string, newText: string, oldSegments: any[]) => {
      if (oldText === newText) return oldSegments;

      let changeStart = 0;
      while (
        changeStart < oldText.length &&
        changeStart < newText.length &&
        oldText[changeStart] === newText[changeStart]
      ) {
        changeStart++;
      }

      let oldEnd = oldText.length - 1;
      let newEnd = newText.length - 1;
      while (
        oldEnd >= changeStart &&
        newEnd >= changeStart &&
        oldText[oldEnd] === newText[newEnd]
      ) {
        oldEnd--;
        newEnd--;
      }

      const changeLength = oldEnd - changeStart + 1;
      const newLength = newEnd - changeStart + 1;
      const lengthDiff = newLength - changeLength;

      const updatedSegments = oldSegments
        .map((segment) => {
          if (segment.startIndex + segment.length <= changeStart) {
            return segment;
          }

          if (segment.startIndex > oldEnd) {
            return {
              ...segment,
              startIndex: segment.startIndex + lengthDiff,
            };
          }

          if (
            segment.startIndex < changeStart &&
            segment.startIndex + segment.length > changeStart
          ) {
            const newSegment = { ...segment };

            if (
              newSegment.startIndex + newSegment.length >
              changeStart + changeLength
            ) {
              newSegment.length += lengthDiff;
              newSegment.text = newText.substring(
                newSegment.startIndex,
                newSegment.startIndex + newSegment.length
              );
            }

            return newSegment;
          }

          return null;
        })
        .filter((segment) => segment !== null);

      return updatedSegments;
    },
    []
  );

  useEffect(() => {
    if (!isInitialized && state.text && state.segments.length > 0) {
      const formattedText = formatTextWithSpaces(state.segments, state.text);
      setDisplayText(formattedText);
      setIsInitialized(true);
    }
  }, [state.text, state.segments, isInitialized, formatTextWithSpaces]);

  const handleTextChange = (value: string) => {
    const oldPlainText = state.text;
    const newDisplayText = value;
    const newPlainText = value.replace(/\n/g, " ");

    setDisplayText(newDisplayText);

    dispatch({ type: "SET_TEXT", payload: newPlainText });

    const updatedSegments = updateSegmentsForTextChange(
      oldPlainText,
      newPlainText,
      state.segments
    );

    if (JSON.stringify(updatedSegments) !== JSON.stringify(state.segments)) {
      dispatch({ type: "SET_SEGMENTS", payload: updatedSegments });
    }
  };

  const handleTextareaSelect = useCallback(() => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    setSelection({ start, end });

    if (start !== end) {
      applyToSelection(start, end);
    }
  }, [
    state.selectedChordId,
    state.selectedPatternId,
    state.currentTool,
    state.segments,
    state.text,
    state.selectedChords,
    state.selectedPatterns,
  ]);

  const applyToSelection = (start: number, end: number) => {
    const selectedDisplayText = displayText.substring(start, end);
    if (!selectedDisplayText.trim() && selectedDisplayText !== "[SPACE]")
      return;

    const plainText = displayText.replace(/\n/g, " ");
    const displayTextBeforeStart = displayText.substring(0, start);
    const plainTextBeforeStart = displayTextBeforeStart.replace(/\n/g, " ");

    const displayTextBeforeEnd = displayText.substring(0, end);
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
  };

  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!textareaRef.current || state.currentTool !== "comment") return;

    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;

    const displayTextBeforeCursor = displayText.substring(0, cursorPosition);
    const plainTextPosition = displayTextBeforeCursor.replace(
      /\n/g,
      " "
    ).length;

    const segment = findSegmentAtPosition(state.segments, plainTextPosition);
    if (segment) {
      setCommentSegmentId(segment.id);
      setShowAddComment(true);
    } else {
      toast.error("Не удалось найти сегмент для комментария");
    }
  };

  const handleManualApply = () => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    if (start === end) {
      toast.error("Пожалуйста, выделите текст сначала");
      return;
    }

    if (!state.selectedChordId && !state.selectedPatternId) {
      toast.error("Пожалуйста, выберите аккорд или паттерн сначала");
      return;
    }

    applyToSelection(start, end);
  };

  const addSpaceSegment = () => {
    const spaceText = "[SPACE]";
    const newDisplayText =
      displayText +
      (displayText && !displayText.endsWith("\n") && !displayText.endsWith(" ")
        ? " "
        : "") +
      spaceText +
      " ";

    setDisplayText(newDisplayText);

    const plainText = newDisplayText.replace(/\n/g, " ");
    dispatch({ type: "SET_TEXT", payload: plainText });

    const plainTextBeforeSpace = plainText.length - spaceText.length - 1;
    const newSegment = {
      id: `space-${Date.now()}`,
      order: state.segments.length,
      startIndex: plainTextBeforeSpace,
      length: spaceText.length,
      text: spaceText,
      chordId: undefined,
      patternId: undefined,
      backgroundColor: "#f0f0f0",
    };
    dispatch({ type: "ADD_SEGMENT", payload: newSegment });
  };

  const createTextSegments = (): TextSegment[] => {
    if (!state.text) return [];

    const segments = [...state.segments].sort(
      (a, b) => a.startIndex - b.startIndex
    );
    const result: TextSegment[] = [];
    let lastIndex = 0;

    segments.forEach((segment) => {
      if (segment.startIndex > state.text.length) return;

      if (segment.startIndex > lastIndex) {
        const betweenText = state.text.substring(lastIndex, segment.startIndex);
        if (betweenText) {
          result.push({
            type: "text",
            content: betweenText,
          });
        }
      }

      const segmentEnd = Math.min(
        segment.startIndex + segment.length,
        state.text.length
      );
      const segmentText = state.text.substring(segment.startIndex, segmentEnd);

      if (!segmentText) {
        lastIndex = segmentEnd;
        return;
      }

      const hasComments = segment.comments && segment.comments.length > 0;

      result.push({
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

      lastIndex = segmentEnd;
    });

    if (lastIndex < state.text.length) {
      const remaining = state.text.substring(lastIndex);
      if (remaining) {
        result.push({
          type: "text",
          content: remaining,
        });
      }
    }

    return result;
  };

  const renderTextWithSegments = () => {
    const textSegments = createTextSegments();
    if (textSegments.length === 0) return null;

    const result: React.ReactNode[] = [];
    let currentLine: TextSegment[] = [];
    let currentLineLength = 0;

    textSegments.forEach((segment) => {
      const segmentLength = segment.content.length;

      const spaceLength = currentLine.length > 0 ? 1 : 0;

      if (
        currentLineLength + segmentLength + spaceLength > 30 &&
        currentLineLength > 0
      ) {
        renderLine(currentLine, result);
        result.push(<br key={`br-${result.length}`} />);
        currentLine = [];
        currentLineLength = 0;
      }

      currentLine.push(segment);
      currentLineLength += segmentLength + (currentLine.length > 1 ? 1 : 0);
    });

    if (currentLine.length > 0) {
      renderLine(currentLine, result);
    }

    return result;
  };

  const renderLine = (segments: TextSegment[], result: React.ReactNode[]) => {
    segments.forEach((segment, i) => {
      let content = segment.content;

      if (segment.type === "text") {
        result.push(
          <span key={`text-${i}`} className="whitespace-pre-wrap">
            {content}
          </span>
        );
      } else if (segment.type === "segment") {
        const segmentStyles: React.CSSProperties = {
          position: "relative" as "relative",
          display: "inline-block",
        };

        if (segment.color) {
          segmentStyles.borderBottom = `3px solid ${segment.color}`;
        }

        if (segment.backgroundColor) {
          segmentStyles.backgroundColor = segment.backgroundColor;
          segmentStyles.paddingLeft = "3px";
          segmentStyles.paddingRight = "3px";
          segmentStyles.paddingTop = "1px";
          segmentStyles.paddingBottom = "1px";
          segmentStyles.borderRadius = "3px";
          segmentStyles.marginLeft = "1px";
          segmentStyles.marginRight = "1px";
          if (segment.color) {
            segmentStyles.marginBottom = "3px";
          }
        }

        result.push(
          <span
            key={`segment-${segment.segmentId}`}
            style={segmentStyles}
            className="relative inline-block group cursor-pointer whitespace-pre-wrap"
            onMouseEnter={() => {
              const index = state.segments.findIndex(
                (s) => s.id === segment.segmentId
              );
              if (index !== -1) setHoveredSegment(index);
            }}
            onMouseLeave={() => setHoveredSegment(null)}
            onClick={() => handleSegmentClick(segment.segmentId!)}
            title={`${segment.content.trim()}\n${
              segment.chordId
                ? "Аккорд: " +
                  state.selectedChords.find((c) => c.id === segment.chordId)
                    ?.name
                : ""
            }\n${
              segment.patternId
                ? "Паттерн: " +
                  state.selectedPatterns.find((p) => p.id === segment.patternId)
                    ?.name
                : ""
            }`}
          >
            {content}
            {segment.hasComments && (
              <span className="absolute -top-1 -right-1">
                <MessageSquare className="h-3 w-3 text-blue-500" />
              </span>
            )}

            {hoveredSegment !== null &&
              state.segments[hoveredSegment]?.id === segment.segmentId &&
              (segment.chordId || segment.patternId) && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md shadow-lg z-50 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {segment.chordId && (
                      <>
                        <Music className="h-3 w-3" />
                        <span>
                          {
                            state.selectedChords.find(
                              (c) => c.id === segment.chordId
                            )?.name
                          }
                        </span>
                      </>
                    )}
                    {segment.patternId && (
                      <>
                        <ListMusic className="h-3 w-3" />
                        <span>
                          {
                            state.selectedPatterns.find(
                              (p) => p.id === segment.patternId
                            )?.name
                          }
                        </span>
                      </>
                    )}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                </div>
              )}
          </span>
        );
      }
    });
  };

  const handleSegmentClick = (segmentId: string) => {
    const segment = state.segments.find((s) => s.id === segmentId);
    if (!segment || !textareaRef.current) return;

    const plainTextBeforeSegment = state.text.substring(0, segment.startIndex);
    const displayTextPosition = findPositionInDisplayText(
      plainTextBeforeSegment
    );

    const plainTextEnd = segment.startIndex + segment.length;
    const plainTextBeforeEnd = state.text.substring(0, plainTextEnd);
    const displayEndPosition = findPositionInDisplayText(plainTextBeforeEnd);

    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(
      displayTextPosition,
      displayEndPosition
    );
  };

  const findPositionInDisplayText = (plainTextFragment: string): number => {
    let displayPos = 0;
    let plainPos = 0;

    for (
      let i = 0;
      i < displayText.length && plainPos < plainTextFragment.length;
      i++
    ) {
      if (displayText[i] === "\n") {
        displayPos++;
      } else {
        if (plainPos < plainTextFragment.length) {
          plainPos++;
        }
        displayPos++;
      }
    }

    return displayPos;
  };

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      dispatch({ type: "DELETE_COMMENT", payload: commentId });
    },
    [dispatch]
  );

  const handleCloseCommentModal = () => {
    setShowAddComment(false);
    setCommentSegmentId("");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Редактировать текст</Label>
            <div className="text-sm text-muted-foreground">
              {state.text.length} символов • {state.segments.length} сегментов
            </div>
          </div>
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={displayText}
              onChange={(e) => handleTextChange(e.target.value)}
              onSelect={handleTextareaSelect}
              onClick={handleTextareaClick}
              placeholder="Напишите текст песни здесь..."
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
              Применить{" "}
              {state.currentTool === "chord"
                ? "аккорд"
                : state.currentTool === "pattern"
                ? "паттерн"
                : ""}
            </Button>
            <Button size="sm" variant="outline" onClick={addSpaceSegment}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить пробел
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (textareaRef.current) {
                  const start = textareaRef.current.selectionStart;
                  const end = textareaRef.current.selectionEnd;

                  if (start === end) {
                    toast.error("Выделите текст для комментария");
                    return;
                  }

                  const displayTextBeforeCursor = displayText.substring(
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
              Добавить комментарий
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Предпросмотр</Label>
            <div className="text-sm text-muted-foreground">
              Наведите на выделенный текст для информации
            </div>
          </div>
          <div
            ref={previewRef}
            className="min-h-[400px] p-4 border rounded-lg bg-background whitespace-pre-wrap font-mono overflow-y-auto leading-relaxed text-base"
            style={{ wordBreak: "break-word" }}
          >
            {renderTextWithSegments() || (
              <div className="text-muted-foreground italic h-full flex items-center justify-center">
                Предпросмотр текста появится здесь...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <ChevronRight className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Список сегментов</h3>
          <span className="text-sm text-muted-foreground ml-2">
            ({state.segments.length} сегментов)
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
          onClose={handleCloseCommentModal}
          segmentId={commentSegmentId}
        />
      )}
    </div>
  );
}
