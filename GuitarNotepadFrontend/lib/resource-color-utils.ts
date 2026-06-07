import { ALL_COLORS } from "@/lib/song-segment-utils";
import { ColorPool } from "@/lib/color-pool";

type ColoredSegment = {
  chordId?: string;
  patternId?: string;
  color?: string;
  backgroundColor?: string;
};

export function deduplicateSegmentColors<T extends ColoredSegment>(
  segments: T[],
): T[] {
  const usedColors = new Set<string>();
  const chordColors = new Map<string, string>();
  const patternColors = new Map<string, string>();

  const chordPreferred = new Map<string, string>();
  const patternPreferred = new Map<string, string>();

  for (const segment of segments) {
    if (segment.chordId && segment.color && !chordPreferred.has(segment.chordId)) {
      chordPreferred.set(segment.chordId, segment.color);
    }
    if (
      segment.patternId &&
      segment.backgroundColor &&
      !patternPreferred.has(segment.patternId)
    ) {
      patternPreferred.set(segment.patternId, segment.backgroundColor);
    }
  }

  const assignUnique = (preferred?: string): string => {
    const normalized =
      preferred && ALL_COLORS.includes(preferred) ? preferred : undefined;

    if (normalized && !usedColors.has(normalized)) {
      usedColors.add(normalized);
      return normalized;
    }

    const nextFree = ALL_COLORS.find((color) => !usedColors.has(color));
    const color =
      nextFree ?? ALL_COLORS[usedColors.size % ALL_COLORS.length];
    usedColors.add(color);
    return color;
  };

  chordPreferred.forEach((preferred, id) => {
    chordColors.set(id, assignUnique(preferred));
  });

  patternPreferred.forEach((preferred, id) => {
    patternColors.set(id, assignUnique(preferred));
  });

  return segments.map((segment) => ({
    ...segment,
    color: segment.chordId
      ? chordColors.get(segment.chordId) ?? segment.color
      : segment.color,
    backgroundColor: segment.patternId
      ? patternColors.get(segment.patternId) ?? segment.backgroundColor
      : segment.backgroundColor,
  }));
}

export function syncColorPoolFromSegments(
  colorPool: ColorPool,
  segments: ColoredSegment[],
  chordNames: Map<string, string>,
  patternNames: Map<string, string>,
): void {
  colorPool.reset();

  const deduped = deduplicateSegmentColors(segments);
  const registered = new Set<string>();

  for (const segment of deduped) {
    if (segment.chordId && segment.color && !registered.has(segment.chordId)) {
      colorPool.forceAssignColor(
        segment.chordId,
        "chord",
        chordNames.get(segment.chordId) ?? "",
        segment.color,
      );
      registered.add(segment.chordId);
    }

    if (
      segment.patternId &&
      segment.backgroundColor &&
      !registered.has(segment.patternId)
    ) {
      colorPool.forceAssignColor(
        segment.patternId,
        "pattern",
        patternNames.get(segment.patternId) ?? "",
        segment.backgroundColor,
      );
      registered.add(segment.patternId);
    }
  }
}

export function getUsedResourceColors(segments: ColoredSegment[]): string[] {
  return Array.from(
    new Set(
      segments.flatMap((segment) =>
        [segment.color, segment.backgroundColor].filter(
          (color): color is string => Boolean(color),
        ),
      ),
    ),
  );
}
