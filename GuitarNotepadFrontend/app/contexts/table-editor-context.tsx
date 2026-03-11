"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { SongChordDto, SongPatternDto, TableSegment, SegmentType } from "@/types/songs";

interface TableEditorState {
  segments: TableSegment[]
  chords: SongChordDto[]
  patterns: SongPatternDto[]
  repeatGroups: string[]
}

type TableEditorAction = 
  | { type: "SET_SEGMENTS"; payload: TableSegment[] }
  | { type: "ADD_SEGMENT"; payload?: TableSegment }
  | { type: "UPDATE_SEGMENT"; payload: { index: number; segment: TableSegment } }
  | { type: "DELETE_SEGMENT"; payload: number }
  | { type: "REORDER_SEGMENTS"; payload: { from: number; to: number } }
  | { type: "SET_CHORDS"; payload: SongChordDto[] }
  | { type: "SET_PATTERNS"; payload: SongPatternDto[] }

const initialState: TableEditorState = {
  segments: [],
  chords: [],
  patterns: [],
  repeatGroups: []
}

function tableEditorReducer(
  state: TableEditorState,
  action: TableEditorAction
): TableEditorState {
  switch (action.type) {
    case "SET_SEGMENTS":
      return { ...state, segments: action.payload }
      
    case "ADD_SEGMENT": {
      const newSegment: TableSegment = action.payload || {
        id: crypto.randomUUID(),
        order: state.segments.length,
        type: SegmentType.Text, 
        text: "",
        repeatGroup: undefined
      }
      return {
        ...state,
        segments: [...state.segments, newSegment]
      }
    }
    
    case "UPDATE_SEGMENT": {
      const newSegments = [...state.segments]
      newSegments[action.payload.index] = action.payload.segment
      return { ...state, segments: newSegments }
    }
    
    case "DELETE_SEGMENT": {
      const newSegments = state.segments.filter((_, i) => i !== action.payload)
      return { ...state, segments: newSegments }
    }
    
    case "REORDER_SEGMENTS": {
      const newSegments = [...state.segments]
      const [moved] = newSegments.splice(action.payload.from, 1)
      newSegments.splice(action.payload.to, 0, moved)
      return { ...state, segments: newSegments }
    }
    
    case "SET_CHORDS":
      return { ...state, chords: action.payload }
      
    case "SET_PATTERNS":
      return { ...state, patterns: action.payload }
      
    default:
      return state
  }
}

const TableEditorContext = createContext<{
  state: TableEditorState
  dispatch: React.Dispatch<TableEditorAction>
} | undefined>(undefined)

export function TableEditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tableEditorReducer, initialState)
  
  return (
    <TableEditorContext.Provider value={{ state, dispatch }}>
      {children}
    </TableEditorContext.Provider>
  )
}

export function useTableEditor() {
  const context = useContext(TableEditorContext)
  if (!context) {
    throw new Error("useTableEditor must be used within TableEditorProvider")
  }
  return context
}