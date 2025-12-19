'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Eraser, Music, ListMusic } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useSongCreation } from '@/app/contexts/song-creation-context';
import { applyToolToSelection } from '@/lib/song-segment-utils';

export function SongTextEditor() {
  const { state, dispatch } = useSongCreation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const handleTextChange = (value: string) => {
    dispatch({ type: 'SET_TEXT', payload: value });
    
    const validSegments = state.segments
      .filter(segment => segment.startIndex < value.length)
      .map(segment => ({
        ...segment,
        length: Math.min(segment.length, value.length - segment.startIndex),
        text: value.substring(segment.startIndex, segment.startIndex + segment.length)
      }))
      .filter(segment => segment.length > 0);
    
    if (validSegments.length !== state.segments.length) {
      dispatch({ type: 'SET_SEGMENTS', payload: validSegments });
    }
  };

  const handleTextareaSelect = () => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    setSelection({ start, end });
    
    if (start !== end && (state.selectedChordId || state.selectedPatternId)) {
      applyToSelection(start, end);
    }
  };

  const applyToSelection = (start: number, end: number) => {
    const selectedText = state.text.substring(start, end);
    if (!selectedText.trim() && selectedText !== '[SPACE]') return;

    let tool: 'chord' | 'pattern' | null = null;
    let selectedId: string | undefined;
    
    if (state.currentTool === 'chord' && state.selectedChordId) {
      tool = 'chord';
      selectedId = state.selectedChordId;
    } else if (state.currentTool === 'pattern' && state.selectedPatternId) {
      tool = 'pattern';
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

    dispatch({ type: 'SET_SEGMENTS', payload: newSegments });

    if (textareaRef.current) {
      textareaRef.current.setSelectionRange(start, start);
      textareaRef.current.focus();
    }
  };

  const handleManualApply = () => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    if (start === end) {
      alert('Пожалуйста, выделите текст сначала');
      return;
    }
    
    if (!state.selectedChordId && !state.selectedPatternId) {
      alert('Пожалуйста, выберите аккорд или паттерн сначала');
      return;
    }
    
    applyToSelection(start, end);
  };

  const addSpaceSegment = () => {
    const spaceText = '[SPACE]';
    const newText = state.text + (state.text && !state.text.endsWith('\n') ? '\n' : '') + spaceText + '\n';
    handleTextChange(newText);
    
    const startIndex = newText.lastIndexOf(spaceText);
    const newSegment = {
      id: `space-${Date.now()}`,
      startIndex,
      length: spaceText.length,
      text: spaceText,
      chordId: undefined,
      patternId: undefined,
      backgroundColor: '#f0f0f0',
    };
    dispatch({ type: 'ADD_SEGMENT', payload: newSegment });
  };

  const handleClearSelection = () => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    if (start === end) return;
    
    const newSegments = state.segments.map(segment => {
      if (segment.startIndex < end && segment.startIndex + segment.length > start) {
        if (state.currentTool === 'chord' && state.selectedChordId === 'empty') {
          return { ...segment, chordId: undefined, color: undefined };
        } else if (state.currentTool === 'pattern' && state.selectedPatternId === 'empty') {
          return { ...segment, patternId: undefined, backgroundColor: undefined };
        }
      }
      return segment;
    });
    
    dispatch({ type: 'SET_SEGMENTS', payload: newSegments });
  };

  const renderTextWithSegments = () => {
    if (!state.text) return null;

    const segments = [...state.segments].sort((a, b) => a.startIndex - b.startIndex);
    const result = [];
    let lastIndex = 0;

    for (const segment of segments) {
      if (segment.startIndex > state.text.length) continue;
      
      if (segment.startIndex > lastIndex) {
        const beforeText = state.text.substring(lastIndex, segment.startIndex);
        if (beforeText) {
          result.push(<span key={`text-${lastIndex}`}>{beforeText}</span>);
        }
      }

      const segmentEnd = Math.min(segment.startIndex + segment.length, state.text.length);
      const segmentText = state.text.substring(segment.startIndex, segmentEnd);
      
      if (!segmentText) {
        lastIndex = segmentEnd;
        continue;
      }

      const segmentStyles: React.CSSProperties = {};
      
      if (segment.color) {
        segmentStyles.borderBottom = `3px solid ${segment.color}`;
        segmentStyles.paddingBottom = '1px';
      }
      
      if (segment.backgroundColor) {
        segmentStyles.backgroundColor = segment.backgroundColor;
        segmentStyles.padding = '2px 4px';
        segmentStyles.borderRadius = '3px';
      }

      result.push(
        <span
          key={segment.id}
          style={segmentStyles}
          className="relative inline-block group"
          data-segment-start={segment.startIndex}
          title={segmentText}
        >
          {segmentText}
        </span>
      );

      lastIndex = segmentEnd;
    }

    if (lastIndex < state.text.length) {
      result.push(<span key={`text-${lastIndex}`}>{state.text.substring(lastIndex)}</span>);
    }

    return result;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {state.text.length} символов • {state.segments.length} сегментов
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={addSpaceSegment}
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить пробел
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label>Редактировать текст</Label>
          <Textarea
            ref={textareaRef}
            value={state.text}
            onChange={(e) => handleTextChange(e.target.value)}
            onSelect={handleTextareaSelect}
            placeholder="Напишите текст песни здесь..."
            className="min-h-[350px] font-mono resize-none"
            rows={15}
          />
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleManualApply}
                disabled={!state.selectedChordId && !state.selectedPatternId}
                className="flex-1"
              >
                Применить {state.currentTool === 'chord' ? 'аккорд' : state.currentTool === 'pattern' ? 'паттерн' : ''}
              </Button>
              {(state.selectedChordId === 'empty' || state.selectedPatternId === 'empty') && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleClearSelection}
                  className="flex-1"
                >
                  Очистить выделение
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Предпросмотр</Label>
          <div className="min-h-[350px] p-4 border rounded-lg bg-background whitespace-pre-wrap font-mono overflow-y-auto leading-relaxed">
            {renderTextWithSegments() || (
              <div className="text-muted-foreground italic h-full flex items-center justify-center">
                Предпросмотр текста появится здесь...
              </div>
            )}
          </div>
        </div>
      </div>

      {(state.currentTool === 'chord' && state.selectedChordId) || 
       (state.currentTool === 'pattern' && state.selectedPatternId) ? (
        <div className="p-4 rounded-lg border-2 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <div className="flex-1">
              <div className="font-semibold">
                {state.currentTool === 'chord' 
                  ? (state.selectedChordId === 'empty' 
                      ? 'Режим очистки аккордов' 
                      : `Активный аккорд: ${state.selectedChords.find(c => c.chordId === state.selectedChordId)?.chordName}`)
                  : (state.selectedPatternId === 'empty'
                      ? 'Режим очистки паттернов'
                      : `Активный паттерн: ${state.selectedPatterns.find(p => p.patternId === state.selectedPatternId)?.patternName}`)
                }
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Выделите текст для применения
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                dispatch({ type: 'SET_TOOL', payload: 'select' });
                dispatch({ type: 'SELECT_CHORD', payload: undefined! });
                dispatch({ type: 'SELECT_PATTERN', payload: undefined! });
              }}
              className="h-8 w-8 p-0"
            >
              <div className="text-lg">×</div>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}