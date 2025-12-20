'use client';

import { CHORD_COLORS, PATTERN_COLORS } from '@/lib/song-segment-utils';

export function useThemeColors() {
  return {
    chordColors: CHORD_COLORS,
    patternColors: PATTERN_COLORS,
  };
}