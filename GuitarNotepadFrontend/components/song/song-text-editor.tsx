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
  MousePointer,
} from "lucide-react";
import { useSongCreation } from "@/app/contexts/song-creation-context";
import {
  assignChordToWord,
  assignPatternToText,
  findSegmentAtPosition,
  updateSegmentsForTextChange,
  generateSegmentId,
  splitTextIntoWords,
  findWordAtPosition,
} from "@/lib/song-segment-utils";
import { AddCommentModal } from "./add-comment-modal";
import { toast } from "sonner";
import { SegmentsList } from "./segments-list";
import { UISegment } from "@/types/songs";

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
  const [selectionStart, setSelectionStart] = useState<number>(0);
  const [selectionEnd, setSelectionEnd] = useState<number>(0);

  // Обновляем текст
  const handleTextChange = useCallback(
    (value: string) => {
      // Заменяем переносы строк на пробелы для внутреннего хранения
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

  // Обработка клика по тексту
  const handleTextClick = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      if (!textareaRef.current) return;

      const cursorPosition = textareaRef.current.selectionStart;
      
      // Для комментариев
      if (state.currentTool === "comment") {
        const segment = findSegmentAtPosition(state.segments, cursorPosition);
        if (segment) {
          setCommentSegmentId(segment.id);
          setShowAddComment(true);
        } else {
          toast.error("Click on a word to add a comment");
        }
        return;
      }
      
      // Для аккордов - назначаем на слово
      if (state.currentTool === "chord" && state.selectedChordId) {
        const word = findWordAtPosition(state.text, cursorPosition);
        if (word) {
          const newSegments = assignChordToWord(
            state.segments,
            state.text,
            word.start,
            state.selectedChordId,
            state.selectedChords,
            state.selectedPatterns
          );
          dispatch({ type: "SET_SEGMENTS", payload: newSegments });
          // toast.success(`Chord assigned to "${word.word}"`);
        } else {
          toast.error("Click on a word to assign a chord");
        }
        return;
      }
      
      // Для паттернов - сохраняем начало выделения
      if (state.currentTool === "pattern" && state.selectedPatternId) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        
        if (start === end) {
          // Одиночный клик - выбираем слово
          const word = findWordAtPosition(state.text, cursorPosition);
          if (word) {
            const newSegments = assignPatternToText(
              state.segments,
              state.text,
              word.start,
              word.end,
              state.selectedPatternId,
              state.selectedChords,
              state.selectedPatterns
            );
            dispatch({ type: "SET_SEGMENTS", payload: newSegments });
            // toast.success(`Pattern assigned to "${word.word}"`);
          }
        } else {
          // Выделение - применяем паттерн к выделенному тексту
          const newSegments = assignPatternToText(
            state.segments,
            state.text,
            start,
            end,
            state.selectedPatternId,
            state.selectedChords,
            state.selectedPatterns
          );
          dispatch({ type: "SET_SEGMENTS", payload: newSegments });
          // toast.success(`Pattern assigned to selected text`);
        }
        return;
      }
      
      // Для режима выбора - просто сбрасываем выделение
      if (state.currentTool === "select") {
        // Ничего не делаем, просто позволяем выбирать текст
        return;
      }
    },
    [state, dispatch]
  );

  // Обработка выделения текста
  const handleTextSelect = useCallback(() => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    setSelectionStart(start);
    setSelectionEnd(end);
    
    // Для режима паттерна можно применить к выделению по кнопке
    if (state.currentTool === "pattern" && state.selectedPatternId && start !== end) {
      // Показываем подсказку
      const selectedText = textareaRef.current.value.substring(start, end);
      if (selectedText.trim()) {
        // Можно добавить плавающую кнопку для применения паттерна
      }
    }
  }, [state]);

  // Кнопка "Применить паттерн" для выделенного текста
  const applyPatternToSelection = useCallback(() => {
    if (!textareaRef.current || !state.selectedPatternId) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    if (start === end) {
      toast.error("Select text first");
      return;
    }
    
    const newSegments = assignPatternToText(
      state.segments,
      state.text,
      start,
      end,
      state.selectedPatternId,
      state.selectedChords,
      state.selectedPatterns
    );
    
    dispatch({ type: "SET_SEGMENTS", payload: newSegments });
    toast.success(`Pattern applied to selected text`);
  }, [state, dispatch]);

  // Кнопка "Применить аккорд" для выделенных слов
  const applyChordToSelectedWords = useCallback(() => {
    if (!textareaRef.current || !state.selectedChordId) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    if (start === end) {
      toast.error("Select text first");
      return;
    }
    
    // Находим все слова в выделении
    const words = splitTextIntoWords(state.text.substring(start, end));
    let result = state.segments;
    
    words.forEach(word => {
      result = assignChordToWord(
        result,
        state.text,
        word.start + start,
        state.selectedChordId!,
        state.selectedChords,
        state.selectedPatterns
      );
    });
    
    dispatch({ type: "SET_SEGMENTS", payload: result });
    toast.success(`Chord applied to ${words.length} word(s)`);
  }, [state, dispatch]);

  // Форматирование для предпросмотра
  const formattedText = useMemo(() => {
    if (!state.text) return "";
    
    // Просто возвращаем текст с пробелами вместо \n для отображения
    return state.text.replace(/\n/g, ' ');
  }, [state.text]);

  const textSegments = useMemo(() => {
    const segments: TextSegment[] = [];
    if (!state.text) return segments;
    
    const sortedSegments = [...state.segments].sort((a, b) => a.startIndex - b.startIndex);
    let lastIndex = 0;
    
    sortedSegments.forEach((segment, index) => {
      // Текст до сегмента
      if (segment.startIndex > lastIndex) {
        const textBefore = state.text.substring(lastIndex, segment.startIndex);
        if (textBefore) {
          segments.push({
            id: `text-${lastIndex}`,
            type: "text",
            content: textBefore,
          });
        }
      }
      
      // Сам сегмент
      const segmentText = segment.text || state.text.substring(
        segment.startIndex,
        segment.startIndex + segment.length
      );
      
      const chord = segment.chordId ? 
        state.selectedChords.find(c => c.id === segment.chordId) : null;
      const pattern = segment.patternId ? 
        state.selectedPatterns.find(p => p.id === segment.patternId) : null;
      
      segments.push({
        id: segment.id,
        type: "segment",
        content: segmentText,
        startIndex: segment.startIndex,
        length: segment.length,
        segmentId: segment.id,
        color: chord?.color,
        backgroundColor: pattern?.color,
        hasComments: segment.comments && segment.comments.length > 0,
        chordId: segment.chordId,
        patternId: segment.patternId,
      });
      
      lastIndex = segment.startIndex + segment.length;
    });
    
    // Текст после последнего сегмента
    if (lastIndex < state.text.length) {
      const remainingText = state.text.substring(lastIndex);
      if (remainingText) {
        segments.push({
          id: `text-${lastIndex}`,
          type: "text",
          content: remainingText,
        });
      }
    }
    
    return segments;
  }, [state.text, state.segments, state.selectedChords, state.selectedPatterns]);

  // Рендер предпросмотра
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
        margin: "0 1px",
        padding: "0 2px",
        borderRadius: "3px",
      };
      
      if (segment.color) {
        segmentStyles.borderBottom = `3px solid ${segment.color}`;
      }
      
      if (segment.backgroundColor) {
        segmentStyles.backgroundColor = segment.backgroundColor;
      }
      
      const chord = segment.chordId ? 
        state.selectedChords.find(c => c.id === segment.chordId) : null;
      const pattern = segment.patternId ? 
        state.selectedPatterns.find(p => p.id === segment.patternId) : null;
      
      return (
        <span
          key={segment.id}
          style={segmentStyles}
          className="relative inline-block group cursor-pointer transition-all hover:shadow-md"
          onMouseEnter={() => setHoveredSegmentId(segment.segmentId || null)}
          onMouseLeave={() => setHoveredSegmentId(null)}
          onClick={() => {
            if (segment.segmentId && textareaRef.current) {
              const start = segment.startIndex || 0;
              const end = start + (segment.length || 0);
              textareaRef.current.focus();
              textareaRef.current.setSelectionRange(start, end);
            }
          }}
          title={`${segment.content}\n${
            chord ? `Chord: ${chord.name}` : ''
          }\n${
            pattern ? `Pattern: ${pattern.name}` : ''
          }`}
        >
          {segment.content}
          {segment.hasComments && (
            <MessageSquare className="absolute -top-1 -right-1 h-3 w-3 text-blue-500" />
          )}
          
          {hoveredSegmentId === segment.segmentId && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md shadow-lg z-50 whitespace-nowrap min-w-[150px]">
              <div className="font-medium mb-1">{segment.content}</div>
              {chord && (
                <div className="flex items-center gap-2 text-xs">
                  <Music className="h-3 w-3" />
                  <span>Chord: {chord.name}</span>
                </div>
              )}
              {pattern && (
                <div className="flex items-center gap-2 text-xs">
                  <ListMusic className="h-3 w-3" />
                  <span>Pattern: {pattern.name}</span>
                </div>
              )}
              {!chord && !pattern && (
                <div className="text-xs text-gray-300">No chord or pattern</div>
              )}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
            </div>
          )}
        </span>
      );
    });
  }, [textSegments, state.selectedChords, state.selectedPatterns, hoveredSegmentId]);

  // Обработчики для сегментов
  const handleSegmentClick = useCallback((segmentId: string) => {
    const segment = state.segments.find(s => s.id === segmentId);
    if (!segment || !textareaRef.current) return;
    
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(
      segment.startIndex,
      segment.startIndex + segment.length
    );
  }, [state.segments]);

  const handleDeleteComment = useCallback((commentId: string) => {
    dispatch({ type: "DELETE_COMMENT", payload: commentId });
  }, [dispatch]);

  // Информация о текущем инструменте
  const getToolInfo = useMemo(() => {
    if (state.currentTool === "chord" && state.selectedChordId) {
      const chord = state.selectedChords.find(c => c.id === state.selectedChordId);
      return {
        title: `Chord: ${chord?.name || "Clear"}`,
        description: state.selectedChordId === "empty" 
          ? "Click on words to remove chords" 
          : "Click on words to assign chord",
        icon: <Music className="h-4 w-4" />,
        color: chord?.color,
      };
    }
    
    if (state.currentTool === "pattern" && state.selectedPatternId) {
      const pattern = state.selectedPatterns.find(p => p.id === state.selectedPatternId);
      return {
        title: `Pattern: ${pattern?.name || "Clear"}`,
        description: state.selectedPatternId === "empty"
          ? "Select text and click 'Apply' to remove patterns"
          : "Select text and click 'Apply' or click on words",
        icon: <ListMusic className="h-4 w-4" />,
        color: pattern?.color,
      };
    }
    
    if (state.currentTool === "comment") {
      return {
        title: "Comment",
        description: "Click on words to add comments",
        icon: <MessageSquare className="h-4 w-4" />,
      };
    }
    
    return {
      title: "Selection",
      description: "Select text for applying tools",
      icon: <MousePointer className="h-4 w-4" />,
    };
  }, [state]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Левая колонка - редактирование */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Edit Text</Label>
            <div className="text-sm text-muted-foreground">
              {state.text.length} chars • {state.segments.length} segments
            </div>
          </div>
          
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={formattedText}
              onChange={(e) => handleTextChange(e.target.value)}
              onClick={handleTextClick}
              onSelect={handleTextSelect}
              placeholder="Write your song lyrics here..."
              className="min-h-[400px] font-mono resize-none text-base leading-relaxed whitespace-pre-wrap"
              rows={20}
            />
            
            {/* Подсказка по текущему инструменту */}
            <div className="absolute bottom-2 left-2 right-2 p-2 bg-black/70 text-white text-xs rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getToolInfo.icon}
                <span>{getToolInfo.title}</span>
                {getToolInfo.color && (
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getToolInfo.color }}
                  />
                )}
              </div>
              <div className="text-gray-300">{getToolInfo.description}</div>
            </div>
          </div>
          
          {/* Кнопки действий */}
          <div className="flex flex-wrap gap-2">
            {state.currentTool === "chord" && state.selectedChordId && state.selectedChordId !== "empty" && (
              <Button
                size="sm"
                onClick={applyChordToSelectedWords}
                className="flex-1"
              >
                <Music className="h-4 w-4 mr-2" />
                Apply chord to selection
              </Button>
            )}
            
            {state.currentTool === "pattern" && state.selectedPatternId && state.selectedPatternId !== "empty" && (
              <Button
                size="sm"
                onClick={applyPatternToSelection}
                className="flex-1"
              >
                <ListMusic className="h-4 w-4 mr-2" />
                Apply pattern to selection
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const segment: UISegment = {
                  id: generateSegmentId(state.text.length, 7),
                  order: state.segments.length,
                  startIndex: state.text.length,
                  length: 7,
                  text: "[SPACE]",
                  chordId: undefined,
                  patternId: undefined,
                  backgroundColor: "#f0f0f0",
                };
                const newText = state.text + (state.text ? " " : "") + "[SPACE]";
                dispatch({ type: "SET_TEXT", payload: newText });
                dispatch({ type: "ADD_SEGMENT", payload: segment });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add space
            </Button>
          </div>
        </div>
        
        {/* Правая колонка - предпросмотр */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Preview</Label>
            <div className="text-sm text-muted-foreground">
              Hover over highlighted text for details
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
                Text preview will appear here...
              </div>
            )}
          </div>
          
          {/* Легенда */}
          <div className="p-3 bg-muted/30 rounded-lg border text-xs">
            <div className="font-medium mb-2">Legend:</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-blue-500"></div>
                <span>Chord (bottom border)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span>Pattern (background)</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3 w-3 text-blue-500" />
                <span>Has comment</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-300"></div>
                <span>[SPACE] segment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Список сегментов */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <ChevronRight className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Segments List</h3>
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