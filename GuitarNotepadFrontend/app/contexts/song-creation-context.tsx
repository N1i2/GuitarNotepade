"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useState,
} from "react";
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
  | { type: "SET_STATE"; payload: Partial<SongCreationState> }
  | { type: "CLEAR_STORAGE" };

const LOCAL_STORAGE_KEY = "song-creation-state";
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

interface StoredState {
  state: SongCreationState;
  timestamp: number;
}

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

function loadStateFromStorage(): SongCreationState | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return null;

    const parsed: StoredState = JSON.parse(stored);

    if (Date.now() - parsed.timestamp > SESSION_TIMEOUT) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return null;
    }

    return parsed.state;
  } catch (error) {
    console.error("Error loading state from storage:", error);
    return null;
  }
}

function saveStateToStorage(state: SongCreationState) {
  if (typeof window === "undefined") return;

  try {
    const storedState: StoredState = {
      state,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedState));
  } catch (error) {
    console.error("Error saving state to storage:", error);
  }
}

function clearStorage() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing storage:", error);
  }
}

function songCreationReducer(
  state: SongCreationState,
  action: SongCreationAction
): SongCreationState {
  let newState: SongCreationState;

  switch (action.type) {
    case "SET_TITLE":
      newState = { ...state, title: action.payload };
      break;

    case "SET_ARTIST":
      newState = { ...state, artist: action.payload };
      break;

    case "SET_GENRE":
      newState = { ...state, genre: action.payload };
      break;

    case "SET_THEME":
      newState = { ...state, theme: action.payload };
      break;

    case "SET_DESCRIPTION":
      newState = { ...state, description: action.payload };
      break;

    case "SET_PUBLIC":
      newState = { ...state, isPublic: action.payload };
      break;

    case "SET_TEXT":
      newState = { ...state, text: action.payload };
      break;

    case "SET_TOOL":
      newState = { ...state, currentTool: action.payload };
      break;

    case "SELECT_CHORD":
      newState = {
        ...state,
        selectedChordId: action.payload,
        selectedPatternId: undefined,
        currentTool: "chord",
      };
      break;

    case "SELECT_PATTERN":
      newState = {
        ...state,
        selectedPatternId: action.payload,
        selectedChordId: undefined,
        currentTool: "pattern",
      };
      break;

    case "ADD_CHORD":
      if (state.selectedChords.length >= 20) return state;
      newState = {
        ...state,
        selectedChords: [...state.selectedChords, action.payload],
        selectedChordId: action.payload.id,
      };
      break;

    case "ADD_PATTERN":
      if (state.selectedPatterns.length >= 10) return state;
      newState = {
        ...state,
        selectedPatterns: [...state.selectedPatterns, action.payload],
        selectedPatternId: action.payload.id,
      };
      break;

    case "REMOVE_CHORD":
      const segmentsAfterChordRemoval = state.segments
        .filter((segment) => segment.chordId !== action.payload)
        .map((segment) => ({
          ...segment,
          color: segment.chordId === action.payload ? undefined : segment.color,
        }));

      newState = {
        ...state,
        selectedChords: state.selectedChords.filter(
          (c) => c.id !== action.payload
        ),
        segments: mergeAdjacentSegments(segmentsAfterChordRemoval),
        selectedChordId:
          state.selectedChordId === action.payload
            ? undefined
            : state.selectedChordId,
      };
      break;

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

      newState = {
        ...state,
        selectedPatterns: state.selectedPatterns.filter(
          (p) => p.id !== action.payload
        ),
        segments: mergeAdjacentSegments(segmentsAfterPatternRemoval),
        selectedPatternId:
          state.selectedPatternId === action.payload
            ? undefined
            : state.selectedPatternId,
      };
      break;

    case "REPLACE_CHORD":
      newState = {
        ...state,
        selectedChords: state.selectedChords.map((c) =>
          c.id === action.payload.oldId ? action.payload.chord : c
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
      break;

    case "REPLACE_PATTERN":
      newState = {
        ...state,
        selectedPatterns: state.selectedPatterns.map((p) =>
          p.id === action.payload.oldId ? action.payload.pattern : p
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
      break;

    case "UPDATE_CHORD_COLOR":
      newState = {
        ...state,
        selectedChords: state.selectedChords.map((c) =>
          c.id === action.payload.chordId
            ? { ...c, color: action.payload.color }
            : c
        ),
        segments: state.segments.map((segment) =>
          segment.chordId === action.payload.chordId
            ? { ...segment, color: action.payload.color }
            : segment
        ),
      };
      break;

    case "UPDATE_PATTERN_COLOR":
      newState = {
        ...state,
        selectedPatterns: state.selectedPatterns.map((p) =>
          p.id === action.payload.patternId
            ? { ...p, color: action.payload.color }
            : p
        ),
        segments: state.segments.map((segment) =>
          segment.patternId === action.payload.patternId
            ? { ...segment, backgroundColor: action.payload.color }
            : segment
        ),
      };
      break;

    case "ADD_SEGMENT":
      newState = { ...state, segments: [...state.segments, action.payload] };
      break;

    case "SET_SEGMENTS":
      newState = { ...state, segments: action.payload };
      break;

    case "UPDATE_SEGMENT":
      newState = {
        ...state,
        segments: state.segments.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
      break;

    case "REMOVE_SEGMENTS_BY_CHORD":
      newState = {
        ...state,
        segments: state.segments.map((segment) =>
          segment.chordId === action.payload
            ? { ...segment, chordId: undefined, color: undefined }
            : segment
        ),
      };
      break;

    case "REMOVE_SEGMENTS_BY_PATTERN":
      newState = {
        ...state,
        segments: state.segments.map((segment) =>
          segment.patternId === action.payload
            ? { ...segment, patternId: undefined, backgroundColor: undefined }
            : segment
        ),
      };
      break;

    case "ADD_COMMENT":
      newState = { ...state, comments: [...state.comments, action.payload] };
      break;

    case "UPDATE_COMMENT":
      newState = {
        ...state,
        comments: state.comments.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
      break;

    case "REMOVE_COMMENT":
      newState = {
        ...state,
        comments: state.comments.filter((c) => c.id !== action.payload),
      };
      break;

    case "SET_COMMENTS":
      newState = { ...state, comments: action.payload };
      break;

    case "RESET_STATE":
      newState = initialState;
      break;

    case "SET_STATE":
      newState = { ...state, ...action.payload };
      break;

    case "CLEAR_STORAGE":
      clearStorage();
      return state;

    default:
      return state;
  }

  saveStateToStorage(newState);
  return newState;
}

const SongCreationContext = createContext<
  | {
      state: SongCreationState;
      dispatch: React.Dispatch<SongCreationAction>;
      clearState: () => void;
    }
  | undefined
>(undefined);

export function SongCreationProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  const initialLoadedState = isMounted
    ? loadStateFromStorage() || initialState
    : initialState;

  const [state, dispatch] = useReducer(songCreationReducer, initialLoadedState);

  useEffect(() => {
    setIsMounted(true);

    if (isMounted) {
      const loadedState = loadStateFromStorage();
      if (loadedState) {
        dispatch({ type: "SET_STATE", payload: loadedState });
      }
    }

    return () => {
      saveStateToStorage(state);
    };
  }, [isMounted]);

  const clearState = () => {
    dispatch({ type: "CLEAR_STORAGE" });
    dispatch({ type: "RESET_STATE" });
  };

  const value = {
    state,
    dispatch,
    clearState,
  };

  return (
    <SongCreationContext.Provider value={value}>
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

export { clearStorage as clearSongCreationStorage };
