"use client";

import { useCallback } from "react";
import { useTableEditor } from "@/app/contexts/table-editor-context";
import { ColorAssignment } from "@/lib/color-pool";
import { ChordsService } from "@/lib/api/chords-service";
import { PatternsService } from "@/lib/api/patterns-service";
import { useToast } from "@/hooks/use-toast";

const SONG_STATE_KEY = "song-editor-state";
const SONG_METADATA_KEY = "song-metadata";

export interface SavedSongState {
  segments: any[];
  chords: any[];
  patterns: any[];
  colorAssignments: ColorAssignment[];
  timestamp: number;
}

export interface SongMetadata {
  title: string;
  artist: string;
  genre: string;
  theme: string;
  description: string;
  isPublic: boolean;
  audioData?: any;
  songId?: string;
}

export function useSongEditorState() {
  const { state, dispatch } = useTableEditor();
  const toast = useToast();

  const refreshResources = useCallback(async () => {
    try {
      const [chordsData, patternsData] = await Promise.all([
        ChordsService.getAllChords({ pageSize: 100 }),
        PatternsService.getAllPatterns({ pageSize: 100 }),
      ]);

      dispatch({ type: "SET_CHORDS", payload: chordsData.items });
      dispatch({ type: "SET_PATTERNS", payload: patternsData.items });

      return { chords: chordsData.items, patterns: patternsData.items };
    } catch (error) {
      console.error("Failed to refresh resources:", error);
      toast.error("Failed to refresh chords and patterns");
      return null;
    }
  }, [dispatch, toast]);

  const validateResources = useCallback(async () => {
    try {
      const [chordsData, patternsData] = await Promise.all([
        ChordsService.getAllChords({ pageSize: 100 }),
        PatternsService.getAllPatterns({ pageSize: 100 }),
      ]);

      const validChordIds = new Set(chordsData.items.map((c) => c.id));
      const validPatternIds = new Set(patternsData.items.map((p) => p.id));

      let needsUpdate = false;
      let removedChords: string[] = [];
      let removedPatterns: string[] = [];

      const updatedSegments = state.segments.map((segment) => {
        const updated = { ...segment };

        if (segment.chordId && !validChordIds.has(segment.chordId)) {
          console.log(
            `Removing chord ${segment.chordId} from segment ${segment.id}`,
          );
          updated.chordId = undefined;
          updated.color = undefined;
          needsUpdate = true;
          removedChords.push(segment.chordId);
        }

        if (segment.patternId && !validPatternIds.has(segment.patternId)) {
          console.log(
            `Removing pattern ${segment.patternId} from segment ${segment.id}`,
          );
          updated.patternId = undefined;
          updated.backgroundColor = undefined;
          needsUpdate = true;
          removedPatterns.push(segment.patternId);
        }

        return updated;
      });

      if (needsUpdate) {
        console.log("Updating segments with removed resources:", {
          removedChords,
          removedPatterns,
        });
        dispatch({ type: "SET_SEGMENTS", payload: updatedSegments });

        Array.from(new Set(removedChords)).forEach((chordId) => {
          state.colorPool.releaseColor(chordId);
        });

        Array.from(new Set(removedPatterns)).forEach((patternId) => {
          state.colorPool.releaseColor(patternId);
        });

        if (removedChords.length > 0 || removedPatterns.length > 0) {
          toast.info(
            "Some chords or patterns were removed from the song as they no longer exist",
          );
        }
      }

      dispatch({ type: "SET_CHORDS", payload: chordsData.items });
      dispatch({ type: "SET_PATTERNS", payload: patternsData.items });

      return { needsUpdate, removedChords, removedPatterns };
    } catch (error) {
      console.error("Failed to validate resources:", error);
      return { needsUpdate: false, removedChords: [], removedPatterns: [] };
    }
  }, [state.segments, state.colorPool, dispatch, toast]);

  const saveState = useCallback(() => {
    try {
      const stateToSave: SavedSongState = {
        segments: state.segments,
        chords: state.chords,
        patterns: state.patterns,
        colorAssignments: state.colorPool.getAllAssignments(),
        timestamp: Date.now(),
      };
      sessionStorage.setItem(SONG_STATE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save song editor state:", error);
    }
  }, [state.segments, state.chords, state.patterns, state.colorPool]);

  const saveMetadata = useCallback((metadata: SongMetadata) => {
    try {
      sessionStorage.setItem(
        SONG_METADATA_KEY,
        JSON.stringify({
          ...metadata,
          timestamp: Date.now(),
        }),
      );
    } catch (error) {
      console.error("Failed to save song metadata:", error);
    }
  }, []);

  const loadState = useCallback((): boolean => {
    try {
      const savedState = sessionStorage.getItem(SONG_STATE_KEY);
      if (!savedState) return false;

      const parsed: SavedSongState = JSON.parse(savedState);

      if (Date.now() - parsed.timestamp > 60 * 60 * 1000) {
        sessionStorage.removeItem(SONG_STATE_KEY);
        return false;
      }

      if (parsed.segments) {
        dispatch({ type: "SET_SEGMENTS", payload: parsed.segments });
      }

      if (parsed.chords) {
        dispatch({ type: "SET_CHORDS", payload: parsed.chords });
      }
      if (parsed.patterns) {
        dispatch({ type: "SET_PATTERNS", payload: parsed.patterns });
      }

      if (parsed.colorAssignments) {
        state.colorPool.reset();

        parsed.colorAssignments.forEach((assignment) => {
          state.colorPool.forceAssignColor(
            assignment.id,
            assignment.type,
            assignment.name,
            assignment.color,
          );
        });

        const updatedSegments = parsed.segments.map((segment: any) => {
          const chordColor = parsed.colorAssignments.find(
            (a: ColorAssignment) =>
              a.id === segment.chordId && a.type === "chord",
          );
          const patternColor = parsed.colorAssignments.find(
            (a: ColorAssignment) =>
              a.id === segment.patternId && a.type === "pattern",
          );

          return {
            ...segment,
            color: chordColor?.color || segment.color,
            backgroundColor: patternColor?.color || segment.backgroundColor,
          };
        });

        dispatch({ type: "SET_SEGMENTS", payload: updatedSegments });
      }

      return true;
    } catch (error) {
      console.error("Failed to load song editor state:", error);
      return false;
    }
  }, [dispatch, state.colorPool]);

  const loadMetadata = useCallback((): SongMetadata | null => {
    try {
      const saved = sessionStorage.getItem(SONG_METADATA_KEY);
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      if (Date.now() - parsed.timestamp > 60 * 60 * 1000) {
        sessionStorage.removeItem(SONG_METADATA_KEY);
        return null;
      }

      return parsed;
    } catch (error) {
      console.error("Failed to load song metadata:", error);
      return null;
    }
  }, []);

  const clearState = useCallback(() => {
    sessionStorage.removeItem(SONG_STATE_KEY);
    sessionStorage.removeItem(SONG_METADATA_KEY);
  }, []);

  const isNewSong = useCallback((): boolean => {
    const savedState = sessionStorage.getItem(SONG_STATE_KEY);
    if (!savedState) return true;

    const savedMetadata = sessionStorage.getItem(SONG_METADATA_KEY);
    if (savedMetadata) {
      const parsed = JSON.parse(savedMetadata);
      if (parsed.songId) {
        return true;
      }
    }

    return false;
  }, []);

  const clearStateIfNewSong = useCallback(() => {
    if (isNewSong()) {
      clearState();
    }
  }, [isNewSong, clearState]);

  return {
    saveState,
    saveMetadata,
    loadState,
    loadMetadata,
    clearState,
    validateResources,
    refreshResources,
    clearStateIfNewSong,
    isNewSong,
  };
}
