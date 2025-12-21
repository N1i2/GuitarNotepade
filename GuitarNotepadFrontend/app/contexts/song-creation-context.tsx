"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import {
  SongCreationState,
  ToolMode,
  SongChordDto,
  SongPatternDto,
  UISegment,
  UIComment,
} from "@/types/songs";
import { mergeAdjacentSegments } from "@/lib/song-segment-utils";

type SongCreationAction =
  | { type: "SET_TITLE"; payload: string }
  | { type: "SET_ARTIST"; payload: string }
  | { type: "SET_GENRE"; payload: string }
  | { type: "SET_THEME"; payload: string }
  | { type: "SET_DESCRIPTION"; payload: string }
  | { type: "SET_PUBLIC"; payload: boolean }
  | { type: "SET_TEXT"; payload: string }
  | { type: "SET_TOOL"; payload: ToolMode }
  | { type: "SELECT_CHORD"; payload: string }
  | { type: "SELECT_PATTERN"; payload: string }
  | { type: "ADD_CHORD"; payload: SongChordDto }
  | { type: "ADD_PATTERN"; payload: SongPatternDto }
  | { type: "REMOVE_CHORD"; payload: string }
  | { type: "REMOVE_PATTERN"; payload: string }
  | {
      type: "REPLACE_CHORD";
      payload: { oldId: string; newId: string; chord: SongChordDto };
    }
  | {
      type: "REPLACE_PATTERN";
      payload: { oldId: string; newId: string; pattern: SongPatternDto };
    }
  | { type: "UPDATE_CHORD_COLOR"; payload: { chordId: string; color: string } }
  | {
      type: "UPDATE_PATTERN_COLOR";
      payload: { patternId: string; color: string };
    }
  | { type: "ADD_SEGMENT"; payload: UISegment }
  | { type: "SET_SEGMENTS"; payload: UISegment[] }
  | { type: "UPDATE_SEGMENT"; payload: UISegment }
  | { type: "REMOVE_SEGMENTS_BY_CHORD"; payload: string }
  | { type: "REMOVE_SEGMENTS_BY_PATTERN"; payload: string }
  | { type: "ADD_COMMENT"; payload: UIComment }
  | { type: "UPDATE_COMMENT"; payload: UIComment }
  | { type: "REMOVE_COMMENT"; payload: string }
  | { type: "SET_COMMENTS"; payload: UIComment[] }
  | { type: "RESET_STATE" }
  | { type: "SET_STATE"; payload: Partial<SongCreationState> };

const initialState: SongCreationState = {
  title: "",
  artist: "",
  genre: "",
  theme: "",
  description: "",
  isPublic: false,
  text: "",
  selectedChords: [],
  selectedPatterns: [],
  segments: [],
  comments: [],
  currentTool: "select",
  selectedChordId: undefined,
  selectedPatternId: undefined,
};

function songCreationReducer(
  state: SongCreationState,
  action: SongCreationAction
): SongCreationState {
  switch (action.type) {
    case "SET_TITLE":
      return { ...state, title: action.payload };

    case "SET_ARTIST":
      return { ...state, artist: action.payload };

    case "SET_GENRE":
      return { ...state, genre: action.payload };

    case "SET_THEME":
      return { ...state, theme: action.payload };

    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };

    case "SET_PUBLIC":
      return { ...state, isPublic: action.payload };

    case "SET_TEXT":
      return { ...state, text: action.payload };

    case "SET_TOOL":
      return { ...state, currentTool: action.payload };

    case "SELECT_CHORD":
      return {
        ...state,
        selectedChordId: action.payload,
        selectedPatternId: undefined,
        currentTool: "chord",
      };

    case "SELECT_PATTERN":
      return {
        ...state,
        selectedPatternId: action.payload,
        selectedChordId: undefined,
        currentTool: "pattern",
      };

    case "ADD_CHORD":
      if (state.selectedChords.length >= 20) return state;
      return {
        ...state,
        selectedChords: [...state.selectedChords, action.payload],
        selectedChordId: action.payload.chordId,
      };

    case "ADD_PATTERN":
      if (state.selectedPatterns.length >= 10) return state;
      return {
        ...state,
        selectedPatterns: [...state.selectedPatterns, action.payload],
        selectedPatternId: action.payload.patternId,
      };

    case "REMOVE_CHORD":
      const segmentsAfterChordRemoval = state.segments
        .filter((segment) => segment.chordId !== action.payload)
        .map((segment) => ({
          ...segment,
          color: segment.chordId === action.payload ? undefined : segment.color,
        }));

      return {
        ...state,
        selectedChords: state.selectedChords.filter(
          (c) => c.chordId !== action.payload
        ),
        segments: mergeAdjacentSegments(segmentsAfterChordRemoval),
        selectedChordId:
          state.selectedChordId === action.payload
            ? undefined
            : state.selectedChordId,
      };

    case "REMOVE_PATTERN":
      const segmentsAfterPatternRemoval = state.segments
        .filter((segment) => segment.patternId !== action.payload)
        .map((segment) => ({
          ...segment,
          backgroundColor:
            segment.patternId === action.payload
              ? undefined
              : segment.backgroundColor,
        }));

      return {
        ...state,
        selectedPatterns: state.selectedPatterns.filter(
          (p) => p.patternId !== action.payload
        ),
        segments: mergeAdjacentSegments(segmentsAfterPatternRemoval),
        selectedPatternId:
          state.selectedPatternId === action.payload
            ? undefined
            : state.selectedPatternId,
      };

    case "REPLACE_CHORD":
      return {
        ...state,
        selectedChords: state.selectedChords.map((c) =>
          c.chordId === action.payload.oldId ? action.payload.chord : c
        ),
        segments: state.segments.map((segment) =>
          segment.chordId === action.payload.oldId
            ? {
                ...segment,
                chordId: action.payload.newId,
                color: action.payload.chord.color,
              }
            : segment
        ),
        selectedChordId:
          state.selectedChordId === action.payload.oldId
            ? action.payload.newId
            : state.selectedChordId,
      };

    case "REPLACE_PATTERN":
      return {
        ...state,
        selectedPatterns: state.selectedPatterns.map((p) =>
          p.patternId === action.payload.oldId ? action.payload.pattern : p
        ),
        segments: state.segments.map((segment) =>
          segment.patternId === action.payload.oldId
            ? {
                ...segment,
                patternId: action.payload.newId,
                backgroundColor: action.payload.pattern.color,
              }
            : segment
        ),
        selectedPatternId:
          state.selectedPatternId === action.payload.oldId
            ? action.payload.newId
            : state.selectedPatternId,
      };

    case "UPDATE_CHORD_COLOR":
      return {
        ...state,
        selectedChords: state.selectedChords.map((c) =>
          c.chordId === action.payload.chordId
            ? { ...c, color: action.payload.color }
            : c
        ),
        segments: state.segments.map((segment) =>
          segment.chordId === action.payload.chordId
            ? { ...segment, color: action.payload.color }
            : segment
        ),
      };
    case "UPDATE_PATTERN_COLOR":
      return {
        ...state,
        selectedPatterns: state.selectedPatterns.map((p) =>
          p.patternId === action.payload.patternId
            ? { ...p, color: action.payload.color }
            : p
        ),
        segments: state.segments.map((segment) =>
          segment.patternId === action.payload.patternId
            ? { ...segment, backgroundColor: action.payload.color }
            : segment
        ),
      };

    case "ADD_SEGMENT":
      return { ...state, segments: [...state.segments, action.payload] };

    case "SET_SEGMENTS":
      return { ...state, segments: action.payload };

    case "UPDATE_SEGMENT":
      return {
        ...state,
        segments: state.segments.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };

    case "REMOVE_SEGMENTS_BY_CHORD":
      return {
        ...state,
        segments: state.segments.map((segment) =>
          segment.chordId === action.payload
            ? { ...segment, chordId: undefined, color: undefined }
            : segment
        ),
      };

    case "REMOVE_SEGMENTS_BY_PATTERN":
      return {
        ...state,
        segments: state.segments.map((segment) =>
          segment.patternId === action.payload
            ? { ...segment, patternId: undefined, backgroundColor: undefined }
            : segment
        ),
      };

    case "ADD_COMMENT":
      return { ...state, comments: [...state.comments, action.payload] };

    case "UPDATE_COMMENT":
      return {
        ...state,
        comments: state.comments.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };

    case "REMOVE_COMMENT":
      return {
        ...state,
        comments: state.comments.filter((c) => c.id !== action.payload),
      };

    case "SET_COMMENTS":
      return { ...state, comments: action.payload };

    case "RESET_STATE":
      return initialState;

    case "SET_STATE":
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

const SongCreationContext = createContext<
  | {
      state: SongCreationState;
      dispatch: React.Dispatch<SongCreationAction>;
    }
  | undefined
>(undefined);

export function SongCreationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(songCreationReducer, initialState);

  return (
    <SongCreationContext.Provider value={{ state, dispatch }}>
      {children}
    </SongCreationContext.Provider>
  );
}

export function useSongCreation() {
  const context = useContext(SongCreationContext);
  if (context === undefined) {
    throw new Error(
      "useSongCreation must be used within a SongCreationProvider"
    );
  }
  return context;
}
