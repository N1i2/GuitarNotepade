import { CHORD_COLORS, PATTERN_COLORS } from '@/types/songs';

export function useThemeColors() {
  return {
    chordColors: CHORD_COLORS,
    patternColors: PATTERN_COLORS,
  };
}