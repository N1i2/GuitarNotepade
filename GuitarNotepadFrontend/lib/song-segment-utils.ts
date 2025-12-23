import {
  UISegment,
  SongChordDto,
  SongPatternDto,
  UIComment,
} from "@/types/songs";

export const ALL_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#FFD166",
  "#06D6A0",
  "#118AB2",
  "#EF476F",
  "#073B4C",
  "#FF9F1C",
  "#2EC4B6",
  "#E71D36",
  "#B91372",
  "#06BCC1",
  "#C5D86D",
  "#F4D35E",
  "#EE964B",
  "#F95738",
  "#0D3B66",
  "#FAF0CA",
  "#A663CC",
  "#6A994E",
  "#E63946",
  "#A8DADC",
  "#457B9D",
  "#1D3557",
  "#F4A261",
  "#2A9D8F",
  "#E9C46A",
  "#264653",
  "#E76F51",
  "#F4E285",
].filter((color) => color !== "#000000" && color !== "#FFFFFF");

export const CHORD_COLORS = ALL_COLORS.slice(0, 20);

export const PATTERN_COLORS = ALL_COLORS.slice(20, 30);

export function isColorUniqueForType(
  color: string,
  usedColors: string[],
  type: "chord" | "pattern"
): boolean {
  const validColors = type === "chord" ? CHORD_COLORS : PATTERN_COLORS;
  return !usedColors.includes(color) && validColors.includes(color);
}

export function getNextAvailableColorForType(
  usedColors: string[],
  type: "chord" | "pattern"
): string {
  const availableColors = type === "chord" ? CHORD_COLORS : PATTERN_COLORS;

  for (const color of availableColors) {
    if (!usedColors.includes(color)) {
      return color;
    }
  }

  return availableColors[0];
}

export function isColorValidForType(
  color: string,
  type: "chord" | "pattern"
): boolean {
  const validColors = type === "chord" ? CHORD_COLORS : PATTERN_COLORS;
  return validColors.includes(color);
}

export function findSegmentAtPosition(
  segments: UISegment[],
  position: number
): UISegment | undefined {
  const sortedSegments = [...segments].sort(
    (a, b) => a.startIndex - b.startIndex
  );

  for (const segment of sortedSegments) {
    if (
      segment.startIndex <= position &&
      segment.startIndex + segment.length > position
    ) {
      return segment;
    }
  }

  if (sortedSegments.length === 0) return undefined;

  if (position <= sortedSegments[0].startIndex) {
    return sortedSegments[0];
  }

  const lastSegment = sortedSegments[sortedSegments.length - 1];
  if (position >= lastSegment.startIndex + lastSegment.length) {
    return lastSegment;
  }

  for (let i = 0; i < sortedSegments.length - 1; i++) {
    const current = sortedSegments[i];
    const next = sortedSegments[i + 1];
    if (
      position >= current.startIndex + current.length &&
      position <= next.startIndex
    ) {
      return current;
    }
  }

  return undefined;
}

export function splitSegmentsAtBoundary(
  segments: UISegment[],
  start: number,
  end: number
): UISegment[] {
  const result: UISegment[] = [];

  for (const segment of segments) {
    const segmentEnd = segment.startIndex + segment.length;

    if (segmentEnd <= start || segment.startIndex >= end) {
      result.push(segment);
      continue;
    }

    if (segment.startIndex < start) {
      const leftSegment: UISegment = {
        ...segment,
        id: `${segment.id}-left`,
        length: start - segment.startIndex,
        text: segment.text.substring(0, start - segment.startIndex),
      };
      result.push(leftSegment);
    }

    if (segmentEnd > end) {
      const rightSegment: UISegment = {
        ...segment,
        id: `${segment.id}-right`,
        startIndex: end,
        length: segmentEnd - end,
        text: segment.text.substring(end - segment.startIndex),
      };
      result.push(rightSegment);
    }
  }

  return result;
}

export function mergeAdjacentSegments(segments: UISegment[]): UISegment[] {
  if (segments.length <= 1) return segments;

  const sorted = [...segments].sort((a, b) => a.startIndex - b.startIndex);
  const result: UISegment[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    if (
      current.startIndex + current.length === next.startIndex &&
      current.chordId === next.chordId &&
      current.patternId === next.patternId &&
      current.color === next.color &&
      current.backgroundColor === next.backgroundColor
    ) {
      current.length += next.length;
      current.text += next.text;
    } else {
      result.push(current);
      current = { ...next };
    }
  }

  result.push(current);
  return result;
}

export function applyToolToSelection(
  segments: UISegment[],
  text: string,
  start: number,
  end: number,
  tool: "chord" | "pattern",
  selectedId: string,
  chords: SongChordDto[],
  patterns: SongPatternDto[]
): UISegment[] {
  if (start === end) return segments;

  const selectedText = text.substring(start, end);
  if (!selectedText.trim() && selectedText !== "[SPACE]") return segments;

  const overlappingSegments = segments.filter(
    (s) => s.startIndex < end && s.startIndex + s.length > start
  );

  if (overlappingSegments.length === 0) {

    const newSegment: UISegment = {
      id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: segments.filter((s) => s.startIndex < start).length,
      startIndex: start,
      length: end - start,
      text: selectedText,
      chordId: undefined,
      patternId: undefined,
      color: undefined,
      backgroundColor: undefined,
    };

    if (tool === "chord" && selectedId !== "empty") {
      const chord = chords.find((c) => c.id === selectedId);
      if (chord) {
        newSegment.chordId = selectedId;
        newSegment.color = chord.color;
      }
    } else if (tool === "pattern" && selectedId !== "empty") {
      const pattern = patterns.find((p) => p.id === selectedId);
      if (pattern) {
        newSegment.patternId = selectedId;
        newSegment.backgroundColor = pattern.color;
      }
    }

    const result = [...segments, newSegment].sort(
      (a, b) => a.startIndex - b.startIndex
    );

    debugSegments(result, text);

    return result;
  }

  let resultSegments: UISegment[] = [];
  const sortedSegments = [...segments].sort(
    (a, b) => a.startIndex - b.startIndex
  );

  for (let i = 0; i < sortedSegments.length; i++) {
    const segment = sortedSegments[i];
    const segmentEnd = segment.startIndex + segment.length;

    if (segmentEnd <= start || segment.startIndex >= end) {
      resultSegments.push(segment);
      continue;
    }

    if (segment.startIndex >= start && segmentEnd <= end) {
      const updatedSegment = { ...segment };

      if (tool === "chord") {
        if (selectedId === "empty") {
          updatedSegment.chordId = undefined;
          updatedSegment.color = undefined;
        } else {
          const chord = chords.find((c) => c.id === selectedId);
          updatedSegment.chordId = selectedId;
          updatedSegment.color = chord?.color;
        }
      } else {
        if (selectedId === "empty") {
          updatedSegment.patternId = undefined;
          updatedSegment.backgroundColor = undefined;
        } else {
          const pattern = patterns.find((p) => p.id === selectedId);
          updatedSegment.patternId = selectedId;
          updatedSegment.backgroundColor = pattern?.color;
        }
      }

      resultSegments.push(updatedSegment);
      continue;
    }

    if (segment.startIndex < start) {
      const beforeSegment: UISegment = {
        ...segment,
        id: `${segment.id}-before-${Date.now()}`,
        length: start - segment.startIndex,
        text: segment.text.substring(0, start - segment.startIndex),
      };
      resultSegments.push(beforeSegment);
    }

    const middleStart = Math.max(segment.startIndex, start);
    const middleEnd = Math.min(segmentEnd, end);
    const middleLength = middleEnd - middleStart;
    const middleText = text.substring(middleStart, middleEnd);

    const middleSegment: UISegment = {
      ...segment,
      id: `${segment.id}-middle-${Date.now()}`,
      startIndex: middleStart,
      length: middleLength,
      text: middleText,
    };

    if (tool === "chord") {
      if (selectedId === "empty") {
        middleSegment.chordId = undefined;
        middleSegment.color = undefined;
      } else {
        const chord = chords.find((c) => c.id === selectedId);
        middleSegment.chordId = selectedId;
        middleSegment.color = chord?.color;
      }
    } else {
      if (selectedId === "empty") {
        middleSegment.patternId = undefined;
        middleSegment.backgroundColor = undefined;
      } else {
        const pattern = patterns.find((p) => p.id === selectedId);
        middleSegment.patternId = selectedId;
        middleSegment.backgroundColor = pattern?.color;
      }
    }

    resultSegments.push(middleSegment);

    if (segmentEnd > end) {
      const afterSegment: UISegment = {
        ...segment,
        id: `${segment.id}-after-${Date.now()}`,
        startIndex: end,
        length: segmentEnd - end,
        text: segment.text.substring(end - segment.startIndex),
      };
      resultSegments.push(afterSegment);
    }
  }

  const merged = mergeAdjacentSegments(
    resultSegments.sort((a, b) => a.startIndex - b.startIndex)
  );

  debugSegments(merged, text);

  return merged;
}

export function clearToolFromSelection(
  segments: UISegment[],
  text: string,
  start: number,
  end: number,
  tool: "chord" | "pattern",
  chords: SongChordDto[],
  patterns: SongPatternDto[]
): UISegment[] {
  return applyToolToSelection(
    segments,
    text,
    start,
    end,
    tool,
    "empty",
    chords,
    patterns
  );
}

export function replaceToolForAllSegments(
  segments: UISegment[],
  tool: "chord" | "pattern",
  oldId: string,
  newId: string,
  chords: SongChordDto[],
  patterns: SongPatternDto[]
): UISegment[] {
  return segments.map((segment) => {
    if (tool === "chord" && segment.chordId === oldId) {
      const chord = chords.find((c) => c.id === newId);
      return { ...segment, chordId: newId, color: chord?.color };
    } else if (tool === "pattern" && segment.patternId === oldId) {
      const pattern = patterns.find((p) => p.id === newId);
      return { ...segment, patternId: newId, backgroundColor: pattern?.color };
    }
    return segment;
  });
}

export function findDuplicateSegment(
  segments: UISegment[],
  text: string,
  chordId?: string,
  patternId?: string
): UISegment | undefined {
  return segments.find(
    (s) => s.text === text && s.chordId === chordId && s.patternId === patternId
  );
}

export function prepareSegmentsForBackend(
  segments: UISegment[],
  text: string
): any[] {
  const sortedSegments = [...segments].sort(
    (a, b) => a.startIndex - b.startIndex
  );
  const result: any[] = [];

  let positionIndex = 0;
  for (const segment of sortedSegments) {
    const segmentText = text.substring(
      segment.startIndex,
      segment.startIndex + segment.length
    );

    let segmentType = "0";
    if (segmentText === "[SPACE]") {
      segmentType = "2";
    } else if (segment.chordId || segment.patternId) {
      segmentType = "1";
    }

    result.push({
      segmentData: {
        type: segmentType,
        lyric: segmentText === "[SPACE]" ? "" : segmentText,
        chordId: segment.chordId,
        patternId: segment.patternId,
        color: segment.color,
        backgroundColor: segment.backgroundColor,
      },
      positionIndex: positionIndex++,
    });
  }

  return result;
}

export function prepareCommentsForBackend(
  comments: UIComment[],
  segments: UISegment[]
): Record<number, any[]> {
  const result: Record<number, any[]> = {};

  comments.forEach((comment) => {
    const segmentIndex = segments.findIndex((s) => s.id === comment.segmentId);
    if (segmentIndex !== -1) {
      if (!result[segmentIndex]) {
        result[segmentIndex] = [];
      }
      result[segmentIndex].push({
        text: comment.text,
      });
    }
  });

  return result;
}

export function groupSegmentsByProperties(
  segments: UISegment[]
): UISegment[][] {
  const groups: UISegment[][] = [];
  let currentGroup: UISegment[] = [];

  const sorted = [...segments].sort((a, b) => a.startIndex - b.startIndex);

  for (const segment of sorted) {
    if (currentGroup.length === 0) {
      currentGroup.push(segment);
    } else {
      const lastSegment = currentGroup[currentGroup.length - 1];

      if (
        lastSegment.chordId === segment.chordId &&
        lastSegment.patternId === segment.patternId &&
        lastSegment.color === segment.color &&
        lastSegment.backgroundColor === segment.backgroundColor
      ) {
        currentGroup.push(segment);
      } else {
        groups.push([...currentGroup]);
        currentGroup = [segment];
      }
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

export function calculateContentHash(
  text: string,
  chordId?: string,
  patternId?: string
): string {
  const content = `${text}-${chordId || ""}-${patternId || ""}`;
  let hash = 0;

  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(36);
}

export function debugSegments(segments: UISegment[], text: string) {
  const sorted = segments.sort((a, b) => a.startIndex - b.startIndex);
  let lastIndex = 0;

  sorted.forEach((seg, i) => {
    lastIndex = seg.startIndex + seg.length;
  });

  let covered = 0;
  sorted.forEach((seg) => {
    covered += seg.length;
  });
}
