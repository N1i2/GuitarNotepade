import { SelectedChord, SelectedPattern } from "@/types/songs";

export const EMPTY_CHORD: SelectedChord = {
  chordId: 'empty',
  chordName: 'Clear Chord',
  color: 'transparent'
};

export const EMPTY_PATTERN: SelectedPattern = {
  patternId: 'empty',
  patternName: 'Clear Pattern',
  isFingerStyle: false,
  color: 'transparent'
};