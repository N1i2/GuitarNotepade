'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  SongCreationState, 
  UIComment, 
  UISegment, 
  SelectedChord, 
  SelectedPattern,
  ToolMode 
} from '@/types/songs';
import { applyToolToSelection, clearToolFromSelection } from '@/lib/song-segment-utils';

type SongCreationAction =
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_PUBLIC'; payload: boolean }
  | { type: 'SET_TEXT'; payload: string }
  | { type: 'SET_TOOL'; payload: ToolMode }
  | { type: 'SELECT_CHORD'; payload: string }
  | { type: 'SELECT_PATTERN'; payload: string }
  | { type: 'ADD_CHORD'; payload: SelectedChord }
  | { type: 'ADD_PATTERN'; payload: SelectedPattern }
  | { type: 'REMOVE_CHORD'; payload: string }
  | { type: 'REMOVE_PATTERN'; payload: string }
  | { type: 'UPDATE_CHORD_COLOR'; payload: { chordId: string; color: string } }
  | { type: 'UPDATE_PATTERN_COLOR'; payload: { patternId: string; color: string } }
  | { type: 'APPLY_TO_SELECTION'; payload: { start: number; end: number } }
  | { type: 'CLEAR_FROM_SELECTION'; payload: { start: number; end: number } }
  | { type: 'ADD_SEGMENT'; payload: UISegment }
  | { type: 'UPDATE_SEGMENT'; payload: UISegment }
  | { type: 'REMOVE_SEGMENT'; payload: string }
  | { type: 'SET_SEGMENTS'; payload: UISegment[] }
  | { type: 'ADD_COMMENT'; payload: UIComment }
  | { type: 'REMOVE_COMMENT'; payload: string }
  | { type: 'RESET_STATE' };

const initialState: SongCreationState = {
  title: '',
  isPublic: false,
  text: '',
  selectedChords: [],
  selectedPatterns: [],
  segments: [], 
  comments: [],
  currentTool: 'select',
};

function songCreationReducer(state: SongCreationState, action: SongCreationAction): SongCreationState {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.payload };
    case 'SET_PUBLIC':
      return { ...state, isPublic: action.payload };
    case 'SET_TEXT':
      return { ...state, text: action.payload };
    case 'SET_TOOL':
      return { ...state, currentTool: action.payload };
    case 'SELECT_CHORD':
      return { 
        ...state, 
        selectedChordId: action.payload,
        selectedPatternId: undefined,
        currentTool: 'chord'
      };
    case 'SELECT_PATTERN':
      return { 
        ...state, 
        selectedPatternId: action.payload,
        selectedChordId: undefined,
        currentTool: 'pattern'
      };
    case 'ADD_CHORD':
      if (state.selectedChords.length >= 20) return state;
      return { ...state, selectedChords: [...state.selectedChords, action.payload] };
    case 'ADD_PATTERN':
      if (state.selectedPatterns.length >= 10) return state;
      return { ...state, selectedPatterns: [...state.selectedPatterns, action.payload] };
    case 'REMOVE_CHORD':
      return {
        ...state,
        selectedChords: state.selectedChords.filter(c => c.chordId !== action.payload),
        selectedChordId: state.selectedChordId === action.payload ? undefined : state.selectedChordId,
        segments: state.segments.map(segment => 
          segment.chordId === action.payload 
            ? { ...segment, chordId: undefined, color: undefined }
            : segment
        ),
      };
    case 'REMOVE_PATTERN':
      return {
        ...state,
        selectedPatterns: state.selectedPatterns.filter(p => p.patternId !== action.payload),
        selectedPatternId: state.selectedPatternId === action.payload ? undefined : state.selectedPatternId,
        segments: state.segments.map(segment => 
          segment.patternId === action.payload 
            ? { ...segment, patternId: undefined, backgroundColor: undefined }
            : segment
        ),
      };
    case 'UPDATE_CHORD_COLOR':
      return {
        ...state,
        selectedChords: state.selectedChords.map(chord =>
          chord.chordId === action.payload.chordId
            ? { ...chord, color: action.payload.color }
            : chord
        ),
        segments: state.segments.map(segment =>
          segment.chordId === action.payload.chordId
            ? { ...segment, color: action.payload.color }
            : segment
        ),
      };
    case 'UPDATE_PATTERN_COLOR':
      return {
        ...state,
        selectedPatterns: state.selectedPatterns.map(pattern =>
          pattern.patternId === action.payload.patternId
            ? { ...pattern, color: action.payload.color }
            : pattern
        ),
        segments: state.segments.map(segment =>
          segment.patternId === action.payload.patternId
            ? { ...segment, backgroundColor: action.payload.color }
            : segment
        ),
      };
    case 'APPLY_TO_SELECTION':
      const { start, end } = action.payload;
      let tool: 'chord' | 'pattern';
      let selectedId: string;
      
      if (state.currentTool === 'chord' && state.selectedChordId) {
        tool = 'chord';
        selectedId = state.selectedChordId;
      } else if (state.currentTool === 'pattern' && state.selectedPatternId) {
        tool = 'pattern';
        selectedId = state.selectedPatternId;
      } else {
        return state; 
      }
      
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
      
      return { ...state, segments: newSegments };
    case 'CLEAR_FROM_SELECTION':
      const { start: clearStart, end: clearEnd } = action.payload;
      let clearTool: 'chord' | 'pattern' | null = null;
      
      if (state.currentTool === 'chord' && state.selectedChordId === 'empty') {
        clearTool = 'chord';
      } else if (state.currentTool === 'pattern' && state.selectedPatternId === 'empty') {
        clearTool = 'pattern';
      }
      
      if (clearTool) {
        const clearedSegments = clearToolFromSelection(
          state.segments,
          clearStart,
          clearEnd,
          clearTool
        );
        return { ...state, segments: clearedSegments };
      }
      return state;
    case 'ADD_SEGMENT':
      return { ...state, segments: [...state.segments, action.payload] };
    case 'UPDATE_SEGMENT':
      return {
        ...state,
        segments: state.segments.map(segment =>
          segment.id === action.payload.id ? action.payload : segment
        ),
      };
    case 'REMOVE_SEGMENT':
      return {
        ...state,
        segments: state.segments.filter(segment => segment.id !== action.payload),
        comments: state.comments.filter(comment => comment.segmentId !== action.payload),
      };
    case 'SET_SEGMENTS':
      return { ...state, segments: action.payload };
    case 'ADD_COMMENT':
      return { ...state, comments: [...state.comments, action.payload] };
    case 'REMOVE_COMMENT':
      return { ...state, comments: state.comments.filter(comment => comment.id !== action.payload) };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

interface SongCreationContextValue {
  state: SongCreationState;
  dispatch: React.Dispatch<SongCreationAction>;
}

const SongCreationContext = createContext<SongCreationContextValue | undefined>(undefined);

export function SongCreationProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [state, dispatch] = useReducer(songCreationReducer, initialState);

  return (
    <SongCreationContext.Provider value={{ state, dispatch }}>
      {children}
    </SongCreationContext.Provider>
  );
}

export function useSongCreation(): SongCreationContextValue {
  const context = useContext(SongCreationContext);
  if (!context) {
    throw new Error('useSongCreation must be used within SongCreationProvider');
  }
  return context;
}