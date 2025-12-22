"use client";

import { useState, useRef, useCallback } from "react";
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
import { SegmentsListForCreation } from "./segments-list-for-creation";
import { SegmentsList } from "./segments-list";

export function SongTextEditor() {
  const { state, dispatch } = useSongCreation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showAddComment, setShowAddComment] = useState(false);
  const [commentSegmentId, setCommentSegmentId] = useState<string>("");
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  const handleTextChange = (value: string) => {
    dispatch({ type: "SET_TEXT", payload: value });

    const validSegments = state.segments
      .filter((segment) => segment.startIndex < value.length)
      .map((segment) => ({
        ...segment,
        length: Math.min(segment.length, value.length - segment.startIndex),
        text: value.substring(
          segment.startIndex,
          segment.startIndex + segment.length
        ),
      }))
      .filter((segment) => segment.length > 0);

    if (validSegments.length !== state.segments.length) {
      dispatch({ type: "SET_SEGMENTS", payload: validSegments });
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
    const selectedText = state.text.substring(start, end);
    if (!selectedText.trim() && selectedText !== "[SPACE]") return;

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

    console.log(`=== НАЧАЛО ПРИМЕНЕНИЯ ===`);
    console.log(
      `Режим: ${state.currentTool}, Инструмент: ${tool}, ID: ${selectedId}`
    );
    console.log(`Выделен текст: "${selectedText}" (${start}-${end})`);

    const newSegments = applyToolToSelection(
      state.segments,
      state.text,
      start,
      end,
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

    const segment = findSegmentAtPosition(state.segments, cursorPosition);
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
      start,
      end,
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

  const addSpaceSegment = () => {
    const spaceText = "[SPACE]";
    const newText =
      state.text +
      (state.text && !state.text.endsWith("\n") ? "\n" : "") +
      spaceText +
      "\n";
    handleTextChange(newText);

    const startIndex = newText.lastIndexOf(spaceText);
    const newSegment = {
      id: `space-${Date.now()}`,
      order: state.segments.length,
      startIndex,
      length: spaceText.length,
      text: spaceText,
      chordId: undefined,
      patternId: undefined,
      backgroundColor: "#f0f0f0",
    };
    dispatch({ type: "ADD_SEGMENT", payload: newSegment });
  };

  const handleAddCommentOld = () => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    if (start === end) {
      toast.error("Please select text for comment");
      return;
    }

    const selectedText = state.text.substring(start, end);
    const existingSegment = state.segments.find(
      (s) => s.startIndex === start && s.length === end - start
    );

    let segmentId: string;
    if (existingSegment) {
      segmentId = existingSegment.id;
    } else {
      segmentId = `comment-segment-${Date.now()}`;
      const newSegment: any = {
        id: segmentId,
        order: state.segments.length,
        startIndex: start,
        length: end - start,
        text: selectedText,
        chordId: undefined,
        patternId: undefined,
      };

      dispatch({ type: "ADD_SEGMENT", payload: newSegment });
    }

    setCommentSegmentId(segmentId);
    setShowAddComment(true);
  };

  const handleSegmentClick = (segmentId: string) => {
    const segment = state.segments.find((s) => s.id === segmentId);
    if (!segment || !textareaRef.current) return;

    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(
      segment.startIndex,
      segment.startIndex + segment.length
    );

    const lineHeight = 20;
    const linesBefore =
      state.text.substring(0, segment.startIndex).split("\n").length - 1;
    textareaRef.current.scrollTop = linesBefore * lineHeight;
  };

  const handleCloseCommentModal = () => {
    setShowAddComment(false);
    setCommentSegmentId("");
  };

  const renderTextWithSegments = () => {
    if (!state.text) return null;

    const segments = [...state.segments].sort(
      (a, b) => a.startIndex - b.startIndex
    );
    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    segments.forEach((segment, index) => {
      if (segment.startIndex > state.text.length) return;

      if (segment.startIndex > lastIndex) {
        const beforeText = state.text.substring(lastIndex, segment.startIndex);
        if (beforeText) {
          result.push(
            <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
              {beforeText}
            </span>
          );
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

      const hasComments = state.comments.some(
        (c) => c.segmentId === segment.id
      );

      result.push(
        <span
          key={segment.id}
          style={segmentStyles}
          className="relative inline-block group cursor-pointer whitespace-pre-wrap"
          data-segment-index={index}
          onMouseEnter={() => setHoveredSegment(index)}
          onMouseLeave={() => setHoveredSegment(null)}
          onClick={() => handleSegmentClick(segment.id)}
          title={`${segmentText}\n${
            segment.chordId
              ? "Аккорд: " +
                state.selectedChords.find((c) => c.id === segment.chordId)?.name
              : ""
          }\n${
            segment.patternId
              ? "Паттерн: " +
                state.selectedPatterns.find((p) => p.id === segment.patternId)
                  ?.name
              : ""
          }`}
        >
          {segmentText}
          {hasComments && (
            <span className="absolute -top-1 -right-1">
              <MessageSquare className="h-3 w-3 text-blue-500" />
            </span>
          )}

          {hoveredSegment === index &&
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

      lastIndex = segmentEnd;
    });

    if (lastIndex < state.text.length) {
      result.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {state.text.substring(lastIndex)}
        </span>
      );
    }

    return result;
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
              value={state.text}
              onChange={(e) => handleTextChange(e.target.value)}
              onSelect={handleTextareaSelect}
              onClick={handleTextareaClick}
              placeholder="Напишите текст песни здесь..."
              className="min-h-[400px] font-mono resize-none text-base leading-relaxed"
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
            <Button size="sm" variant="outline" onClick={handleAddCommentOld}>
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
