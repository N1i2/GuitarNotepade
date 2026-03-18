"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import {
  SongChordDto,
  SongPatternDto,
  TableSegment,
  SegmentType,
} from "@/types/songs";
import { ColorPool } from "@/lib/color-pool";

interface TableEditorState {
  segments: TableSegment[];
  chords: SongChordDto[];
  patterns: SongPatternDto[];
  repeatGroups: string[];
  colorPool: ColorPool;
}

function determineSegmentType(text: string, patternId?: string): SegmentType {
  const hasText = text?.trim().length > 0;
  const hasPattern = !!patternId;

  if (hasText && !hasPattern) return SegmentType.Text;
  if (!hasText && hasPattern) return SegmentType.Playback;
  if (!hasText && !hasPattern) return SegmentType.Space;

  return SegmentType.Section;
}

type TableEditorAction =
  | { type: "SET_SEGMENTS"; payload: TableSegment[] }
  | { type: "ADD_SEGMENT"; payload?: TableSegment }
  | {
      type: "UPDATE_SEGMENT";
      payload: { index: number; segment: TableSegment };
    }
  | { type: "DELETE_SEGMENT"; payload: number }
  | { type: "REORDER_SEGMENTS"; payload: { from: number; to: number } }
  | { type: "SET_CHORDS"; payload: SongChordDto[] }
  | { type: "SET_PATTERNS"; payload: SongPatternDto[] }
  | { type: "RESET_COLORS" }
  | { type: "DELETE_CHORD_FROM_SONG"; payload: string }
  | { type: "DELETE_PATTERN_FROM_SONG"; payload: string }
  | {
      type: "REPLACE_CHORD";
      payload: { oldChordId: string; newChordId: string };
    }
  | {
      type: "REPLACE_PATTERN";
      payload: { oldPatternId: string; newPatternId: string };
    };

const initialState: TableEditorState = {
  segments: [],
  chords: [],
  patterns: [],
  repeatGroups: [],
  colorPool: new ColorPool(),
};

function tableEditorReducer(
  state: TableEditorState,
  action: TableEditorAction,
): TableEditorState {
  switch (action.type) {
    case "SET_SEGMENTS":
      return { ...state, segments: action.payload };

    case "ADD_SEGMENT": {
      const newSegment: TableSegment = action.payload || {
        id: crypto.randomUUID(),
        order: state.segments.length,
        type: SegmentType.Space,
        text: "",
        repeatGroup: undefined,
        comment: "",
      };
      return {
        ...state,
        segments: [...state.segments, newSegment],
      };
    }

    case "UPDATE_SEGMENT": {
      const newSegments = [...state.segments];
      const oldSegment = newSegments[action.payload.index];
      const updatedSegment = { ...action.payload.segment };

      if (oldSegment.chordId !== updatedSegment.chordId) {
        if (oldSegment.chordId) {
          const isChordUsedElsewhere = newSegments.some(
            (s, i) =>
              i !== action.payload.index && s.chordId === oldSegment.chordId,
          );
          if (!isChordUsedElsewhere) {
            state.colorPool.releaseColor(oldSegment.chordId);
          }
        }

        if (updatedSegment.chordId) {
          const chord = state.chords.find(
            (c) => c.id === updatedSegment.chordId,
          );
          if (chord) {
            const color = state.colorPool.getColor(
              updatedSegment.chordId,
              "chord",
              chord.name,
            );
            updatedSegment.color = color;
          }
        } else {
          updatedSegment.color = undefined;
        }
      } else {
      }

      if (oldSegment.patternId !== updatedSegment.patternId) {
        if (oldSegment.patternId) {
          const isPatternUsedElsewhere = newSegments.some(
            (s, i) =>
              i !== action.payload.index &&
              s.patternId === oldSegment.patternId,
          );
          if (!isPatternUsedElsewhere) {
            state.colorPool.releaseColor(oldSegment.patternId);
          }
        }

        if (updatedSegment.patternId) {
          const pattern = state.patterns.find(
            (p) => p.id === updatedSegment.patternId,
          );
          if (pattern) {
            const color = state.colorPool.getColor(
              updatedSegment.patternId,
              "pattern",
              pattern.name,
            );
            updatedSegment.backgroundColor = color;
          }
        } else {
          updatedSegment.backgroundColor = undefined;
        }
      }

      const newType = determineSegmentType(
        updatedSegment.text,
        updatedSegment.patternId,
      );

      newSegments[action.payload.index] = {
        ...updatedSegment,
        type: newType,
      };

      return { ...state, segments: newSegments };
    }

    case "DELETE_SEGMENT": {
      const deletedSegment = state.segments[action.payload];
      const newSegments = state.segments.filter((_, i) => i !== action.payload);

      if (deletedSegment.chordId) {
        const isChordUsedElsewhere = newSegments.some(
          (s) => s.chordId === deletedSegment.chordId,
        );
        if (!isChordUsedElsewhere) {
          state.colorPool.releaseColor(deletedSegment.chordId);
        }
      }

      if (deletedSegment.patternId) {
        const isPatternUsedElsewhere = newSegments.some(
          (s) => s.patternId === deletedSegment.patternId,
        );
        if (!isPatternUsedElsewhere) {
          state.colorPool.releaseColor(deletedSegment.patternId);
        }
      }

      return { ...state, segments: newSegments };
    }

    case "REORDER_SEGMENTS": {
      const newSegments = [...state.segments];
      const [moved] = newSegments.splice(action.payload.from, 1);
      newSegments.splice(action.payload.to, 0, moved);

      const reorderedSegments = newSegments.map((segment, index) => ({
        ...segment,
        order: index,
      }));

      return { ...state, segments: reorderedSegments };
    }

    case "SET_CHORDS":
      return { ...state, chords: action.payload };

    case "SET_PATTERNS":
      return { ...state, patterns: action.payload };

    case "RESET_COLORS":
      state.colorPool.reset();
      const segmentsWithoutColors = state.segments.map((segment) => ({
        ...segment,
        color: undefined,
        backgroundColor: undefined,
      }));
      return { ...state, segments: segmentsWithoutColors };

    case "DELETE_CHORD_FROM_SONG": {
      const chordId = action.payload;

      const newSegments = state.segments.map((segment) => {
        if (segment.chordId === chordId) {
          const { chordId, color, ...rest } = segment;
          return { ...rest, chordId: undefined, color: undefined };
        }
        return segment;
      });

      state.colorPool.releaseColor(chordId);

      return { ...state, segments: newSegments };
    }

    case "DELETE_PATTERN_FROM_SONG": {
      const patternId = action.payload;

      const newSegments = state.segments.map((segment) => {
        if (segment.patternId === patternId) {
          const { patternId, backgroundColor, ...rest } = segment;
          return { ...rest, patternId: undefined, backgroundColor: undefined };
        }
        return segment;
      });

      state.colorPool.releaseColor(patternId);

      return { ...state, segments: newSegments };
    }

    case "REPLACE_CHORD": {
      const { oldChordId, newChordId } = action.payload;
      const newChord = state.chords.find((c) => c.id === newChordId);

      if (!newChord) return state;

      const newColor = state.colorPool.getColor(
        newChordId,
        "chord",
        newChord.name,
      );

      const newSegments = state.segments.map((segment) => {
        if (segment.chordId === oldChordId) {
          return {
            ...segment,
            chordId: newChordId,
            color: newColor,
          };
        }
        return segment;
      });

      const oldChordStillUsed = newSegments.some(
        (s) => s.chordId === oldChordId,
      );
      if (!oldChordStillUsed) {
        state.colorPool.releaseColor(oldChordId);
      }

      return { ...state, segments: newSegments };
    }

    case "REPLACE_PATTERN": {
      const { oldPatternId, newPatternId } = action.payload;
      const newPattern = state.patterns.find((p) => p.id === newPatternId);

      if (!newPattern) return state;

      const newColor = state.colorPool.getColor(
        newPatternId,
        "pattern",
        newPattern.name,
      );

      const newSegments = state.segments.map((segment) => {
        if (segment.patternId === oldPatternId) {
          return {
            ...segment,
            patternId: newPatternId,
            backgroundColor: newColor,
          };
        }
        return segment;
      });

      const oldPatternStillUsed = newSegments.some(
        (s) => s.patternId === oldPatternId,
      );
      if (!oldPatternStillUsed) {
        state.colorPool.releaseColor(oldPatternId);
      }

      return { ...state, segments: newSegments };
    }

    default:
      return state;
  }
}

const TableEditorContext = createContext<
  | {
      state: TableEditorState;
      dispatch: React.Dispatch<TableEditorAction>;
    }
  | undefined
>(undefined);

export function TableEditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tableEditorReducer, initialState);

  return (
    <TableEditorContext.Provider value={{ state, dispatch }}>
      {children}
    </TableEditorContext.Provider>
  );
}

export function useTableEditor() {
  const context = useContext(TableEditorContext);
  if (!context) {
    throw new Error("useTableEditor must be used within TableEditorProvider");
  }
  return context;
}
