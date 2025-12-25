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

export function isColorValidForType(
  color: string,
  type: "chord" | "pattern"
): boolean {
  const validColors = type === "chord" ? CHORD_COLORS : PATTERN_COLORS;
  return validColors.includes(color);
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

export function isColorUniqueForType(
  color: string,
  usedColors: string[],
  type: "chord" | "pattern"
): boolean {
  const validColors = type === "chord" ? CHORD_COLORS : PATTERN_COLORS;
  return !usedColors.includes(color) && validColors.includes(color);
}

export function generateSegmentId(
  startIndex: number,
  length: number,
  chordId?: string,
  patternId?: string
): string {
  const base = `${startIndex}-${length}-${chordId || "none"}-${
    patternId || "none"
  }`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash << 5) - hash + base.charCodeAt(i);
    hash = hash & hash;
  }
  return `seg-${Math.abs(hash).toString(36)}`;
}

export function findSegmentAtPosition(
  segments: UISegment[],
  position: number
): UISegment | null {
  return (
    segments.find(
      (segment) =>
        position >= segment.startIndex &&
        position < segment.startIndex + segment.length
    ) || null
  );
}

function createSegment(
  startIndex: number,
  length: number,
  text: string,
  tool: "chord" | "pattern",
  selectedId: string,
  chords: SongChordDto[],
  patterns: SongPatternDto[],
  existingSegment?: UISegment
): UISegment | null {
  if (length <= 0 || !text.trim()) return null;

  const segment: UISegment = {
    id: generateSegmentId(
      startIndex,
      length,
      tool === "chord" && selectedId !== "empty"
        ? selectedId
        : existingSegment?.chordId,
      tool === "pattern" && selectedId !== "empty"
        ? selectedId
        : existingSegment?.patternId
    ),
    order: 0,
    startIndex,
    length,
    text,
    chordId: existingSegment?.chordId,
    patternId: existingSegment?.patternId,
    color: existingSegment?.color,
    backgroundColor: existingSegment?.backgroundColor,
  };

  if (tool === "chord") {
    if (selectedId === "empty") {
      segment.chordId = undefined;
      segment.color = undefined;
    } else {
      const chord = chords.find((c) => c.id === selectedId);
      if (chord) {
        segment.chordId = selectedId;
        segment.color = chord.color;
      }
    }
  } else if (tool === "pattern") {
    if (selectedId === "empty") {
      segment.patternId = undefined;
      segment.backgroundColor = undefined;
    } else {
      const pattern = patterns.find((p) => p.id === selectedId);
      if (pattern) {
        segment.patternId = selectedId;
        segment.backgroundColor = pattern.color;
      }
    }
  }

  return segment;
}

function updateSegmentProperties(
  segment: UISegment,
  tool: "chord" | "pattern",
  selectedId: string,
  chords: SongChordDto[],
  patterns: SongPatternDto[]
): UISegment {
  const updated = { ...segment };

  if (tool === "chord") {
    if (selectedId === "empty") {
      updated.chordId = undefined;
      updated.color = undefined;
    } else {
      const chord = chords.find((c) => c.id === selectedId);
      updated.chordId = selectedId;
      updated.color = chord?.color;
    }
  } else if (tool === "pattern") {
    if (selectedId === "empty") {
      updated.patternId = undefined;
      updated.backgroundColor = undefined;
    } else {
      const pattern = patterns.find((p) => p.id === selectedId);
      updated.patternId = selectedId;
      updated.backgroundColor = pattern?.color;
    }
  }

  updated.id = generateSegmentId(
    updated.startIndex,
    updated.length,
    updated.chordId,
    updated.patternId
  );

  return updated;
}

function handlePartialOverlap(
  result: UISegment[],
  segment: UISegment,
  text: string,
  start: number,
  end: number,
  tool: "chord" | "pattern",
  selectedId: string,
  chords: SongChordDto[],
  patterns: SongPatternDto[]
): void {
  const segmentEnd = segment.startIndex + segment.length;

  if (segment.startIndex < start) {
    const beforeLength = start - segment.startIndex;
    const beforeText = text.substring(segment.startIndex, start);

    if (beforeLength > 0 && beforeText.trim()) {
      result.push({
        ...segment,
        id: generateSegmentId(
          segment.startIndex,
          beforeLength,
          segment.chordId,
          segment.patternId
        ),
        length: beforeLength,
        text: beforeText,
      });
    }
  }

  const overlapStart = Math.max(segment.startIndex, start);
  const overlapEnd = Math.min(segmentEnd, end);
  const overlapLength = overlapEnd - overlapStart;
  const overlapText = text.substring(overlapStart, overlapEnd);

  if (overlapLength > 0 && overlapText.trim()) {
    const overlapSegment = createSegment(
      overlapStart,
      overlapLength,
      overlapText,
      tool,
      selectedId,
      chords,
      patterns,
      segment
    );

    if (overlapSegment) result.push(overlapSegment);
  }

  if (segmentEnd > end) {
    const afterLength = segmentEnd - end;
    const afterText = text.substring(end, segmentEnd);

    if (afterLength > 0 && afterText.trim()) {
      result.push({
        ...segment,
        id: generateSegmentId(
          end,
          afterLength,
          segment.chordId,
          segment.patternId
        ),
        startIndex: end,
        length: afterLength,
        text: afterText,
      });
    }
  }
}

function handleUncoveredParts(
  result: UISegment[],
  text: string,
  start: number,
  end: number,
  tool: "chord" | "pattern",
  selectedId: string,
  chords: SongChordDto[],
  patterns: SongPatternDto[]
): void {
  const coveredRanges: Array<[number, number]> = [];

  result.forEach((segment) => {
    if (
      segment.startIndex >= start &&
      segment.startIndex + segment.length <= end
    ) {
      coveredRanges.push([
        segment.startIndex,
        segment.startIndex + segment.length,
      ]);
    }
  });

  coveredRanges.sort((a, b) => a[0] - b[0]);

  let current = start;

  for (const [rangeStart, rangeEnd] of coveredRanges) {
    if (rangeStart > current) {
      const uncoveredLength = rangeStart - current;
      const uncoveredText = text.substring(current, rangeStart);

      if (uncoveredLength > 0 && uncoveredText.trim()) {
        const newSegment = createSegment(
          current,
          uncoveredLength,
          uncoveredText,
          tool,
          selectedId,
          chords,
          patterns
        );

        if (newSegment) result.push(newSegment);
      }
    }
    current = Math.max(current, rangeEnd);
  }

  if (current < end) {
    const uncoveredLength = end - current;
    const uncoveredText = text.substring(current, end);

    if (uncoveredLength > 0 && uncoveredText.trim()) {
      const newSegment = createSegment(
        current,
        uncoveredLength,
        uncoveredText,
        tool,
        selectedId,
        chords,
        patterns
      );

      if (newSegment) result.push(newSegment);
    }
  }
}

export function mergeAdjacentSegments(segments: UISegment[]): UISegment[] {
  if (segments.length <= 1) return segments;

  const sorted = [...segments].sort((a, b) => a.startIndex - b.startIndex);
  const result: UISegment[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    const isAdjacent = current.startIndex + current.length === next.startIndex;
    const sameProperties =
      current.chordId === next.chordId &&
      current.patternId === next.patternId &&
      current.color === next.color &&
      current.backgroundColor === next.backgroundColor;

    if (isAdjacent && sameProperties) {
      current.length += next.length;
      current.text = (current.text || "") + (next.text || "");
    } else {
      current.id = generateSegmentId(
        current.startIndex,
        current.length,
        current.chordId,
        current.patternId
      );
      result.push(current);
      current = { ...next };
    }
  }

  if (current) {
    current.id = generateSegmentId(
      current.startIndex,
      current.length,
      current.chordId,
      current.patternId
    );
    result.push(current);
  }

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
  if (start >= end || start < 0 || end > text.length) {
    return segments;
  }

  if (segments.length === 0) {
    const newSegment = createSegment(
      start,
      end - start,
      text.substring(start, end),
      tool,
      selectedId,
      chords,
      patterns
    );
    return newSegment ? [newSegment] : [];
  }

  const affectedSegments = segments.filter(
    (s) => s.startIndex < end && s.startIndex + s.length > start
  );

  if (affectedSegments.length === 0) {
    const newSegment = createSegment(
      start,
      end - start,
      text.substring(start, end),
      tool,
      selectedId,
      chords,
      patterns
    );

    if (!newSegment) return segments;

    const newSegments = [...segments, newSegment].sort(
      (a, b) => a.startIndex - b.startIndex
    );
    return mergeAdjacentSegments(newSegments);
  }

  const result: UISegment[] = [];
  const sortedSegments = [...segments].sort(
    (a, b) => a.startIndex - b.startIndex
  );

  sortedSegments.forEach((segment) => {
    const segmentEnd = segment.startIndex + segment.length;

    if (segmentEnd <= start || segment.startIndex >= end) {
      result.push(segment);
      return;
    }

    if (segment.startIndex >= start && segmentEnd <= end) {
      const updated = updateSegmentProperties(
        segment,
        tool,
        selectedId,
        chords,
        patterns
      );
      if (updated) result.push(updated);
      return;
    }

    handlePartialOverlap(
      result,
      segment,
      text,
      start,
      end,
      tool,
      selectedId,
      chords,
      patterns
    );
  });

  handleUncoveredParts(
    result,
    text,
    start,
    end,
    tool,
    selectedId,
    chords,
    patterns
  );

  const sortedResult = result.sort((a, b) => a.startIndex - b.startIndex);
  return mergeAdjacentSegments(sortedResult);
}

export function prepareSegmentsForBackend(
  segments: UISegment[],
  text: string
): any[] {
  const sorted = [...segments].sort((a, b) => a.startIndex - b.startIndex);
  const result: any[] = [];

  sorted.forEach((segment, index) => {
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
        chordId: segment.chordId || undefined,
        patternId: segment.patternId || undefined,
        color: segment.color || undefined,
        backgroundColor: segment.backgroundColor || undefined,
      },
      positionIndex: index,
    });
  });

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
      result[segmentIndex].push({ text: comment.text });
    }
  });

  return result;
}

export function updateSegmentsForTextChange(
  oldText: string,
  newText: string,
  oldSegments: UISegment[]
): UISegment[] {
  if (oldText === newText) return oldSegments;

  return oldSegments
    .filter((segment) => segment.startIndex < newText.length)
    .map((segment) => {
      const newLength = Math.min(
        segment.length,
        newText.length - segment.startIndex
      );

      return {
        ...segment,
        length: newLength,
        text: newText.substring(
          segment.startIndex,
          segment.startIndex + newLength
        ),
        id: generateSegmentId(
          segment.startIndex,
          newLength,
          segment.chordId,
          segment.patternId
        ),
      };
    })
    .filter((segment) => segment.length > 0 || segment.text === "[SPACE]");
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
      return {
        ...segment,
        chordId: newId,
        color: chord?.color,
        id: generateSegmentId(
          segment.startIndex,
          segment.length,
          newId,
          segment.patternId
        ),
      };
    } else if (tool === "pattern" && segment.patternId === oldId) {
      const pattern = patterns.find((p) => p.id === newId);
      return {
        ...segment,
        patternId: newId,
        backgroundColor: pattern?.color,
        id: generateSegmentId(
          segment.startIndex,
          segment.length,
          segment.chordId,
          newId
        ),
      };
    }
    return segment;
  });
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
