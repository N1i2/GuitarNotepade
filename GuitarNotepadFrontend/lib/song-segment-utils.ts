import {
  UISegment,
  SongChordDto,
  SongPatternDto,
  UIComment,
} from "@/types/songs";

export const ALL_COLORS = [
  "#E53935",
  "#FB8C00",
  "#FDD835",
  "#C0CA33",
  "#43A047",
  "#00897B",
  "#00ACC1",
  "#1E88E5",
  "#3949AB",
  "#5E35B1",
  "#8E24AA",
  "#D81B60",
  "#FF7043",
  "#7CB342",
  "#039BE5",
  "#00695C",
  "#283593",
  "#6D4C41",
  "#546E7A",
  "#EF6C00",
  "#558B2F",
  "#0277BD",
  "#4527A0",
  "#AD1457",
];

export const CHORD_COLORS = ALL_COLORS;
export const PATTERN_COLORS = ALL_COLORS;

export function generateSegmentId(
  startIndex: number,
  length: number,
  chordId?: string,
  patternId?: string,
): string {
  const base = `${startIndex}-${length}-${chordId || "none"}-${patternId || "none"}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash << 5) - hash + base.charCodeAt(i);
    hash = hash & hash;
  }
  return `seg-${Math.abs(hash).toString(36)}`;
}

export function findSegmentAtPosition(
  segments: UISegment[],
  position: number,
): UISegment | null {
  return (
    segments.find(
      (segment) =>
        position >= segment.startIndex &&
        position < segment.startIndex + segment.length,
    ) || null
  );
}

export function splitTextIntoWords(
  text: string,
): Array<{ word: string; start: number; end: number }> {
  const words: Array<{ word: string; start: number; end: number }> = [];
  let wordStart = -1;

  for (let i = 0; i <= text.length; i++) {
    const char = i < text.length ? text[i] : " ";
    const isWordChar = !isSeparator(char);

    if (isWordChar && wordStart === -1) {
      wordStart = i;
    } else if (!isWordChar && wordStart !== -1) {
      const word = text.substring(wordStart, i);
      if (word.trim()) {
        words.push({
          word,
          start: wordStart,
          end: i,
        });
      }
      wordStart = -1;
    }
  }

  return words;
}

function isSeparator(char: string): boolean {
  return (
    char === " " ||
    char === "\n" ||
    char === "\t" ||
    char === "," ||
    char === "." ||
    char === "!" ||
    char === "?" ||
    char === ";" ||
    char === ":" ||
    char === "(" ||
    char === ")" ||
    char === "[" ||
    char === "]"
  );
}

export function findWordAtPosition(
  text: string,
  position: number,
): { word: string; start: number; end: number } | null {
  const words = splitTextIntoWords(text);
  return (
    words.find((word) => position >= word.start && position < word.end) || null
  );
}

export function mergeSegments(segments: UISegment[]): UISegment[] {
  if (segments.length <= 1) return segments;

  const sorted = [...segments].sort((a, b) => a.startIndex - b.startIndex);
  const result: UISegment[] = [];

  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    const isAdjacent = current.startIndex + current.length === next.startIndex;
    const sameChord = current.chordId === next.chordId;
    const samePattern = current.patternId === next.patternId;

    if (isAdjacent && sameChord && samePattern) {
      current = {
        ...current,
        length: current.length + next.length,
        text: (current.text || "") + (next.text || ""),
      };
    } else {
      result.push(current);
      current = next;
    }
  }

  result.push(current);

  return result.map((segment) => ({
    ...segment,
    id: generateSegmentId(
      segment.startIndex,
      segment.length,
      segment.chordId,
      segment.patternId,
    ),
  }));
}

export function assignChordToWord(
  segments: UISegment[],
  text: string,
  wordStart: number,
  chordId: string,
  chords: SongChordDto[],
  patterns: SongPatternDto[],
): UISegment[] {
  const word = findWordAtPosition(text, wordStart);
  if (!word) return segments;

  const { start, end } = word;
  const chord = chords.find((c) => c.id === chordId);
  if (!chord) return segments;

  const overlappingSegments = segments.filter(
    (s) => s.startIndex < end && s.startIndex + s.length > start,
  );

  let result: UISegment[] = segments.filter(
    (s) => s.startIndex >= end || s.startIndex + s.length <= start,
  );

  if (overlappingSegments.length === 0) {
    const newSegment: UISegment = {
      id: generateSegmentId(start, end - start, chordId),
      order: segments.length,
      startIndex: start,
      length: end - start,
      text: word.word,
      chordId,
      patternId: undefined,
      color: chord.color,
      backgroundColor: undefined,
    };
    result.push(newSegment);
  } else {
    overlappingSegments.forEach((segment) => {
      const segmentEnd = segment.startIndex + segment.length;

      const parts: Array<{
        start: number;
        end: number;
        shouldHaveChord: boolean;
      }> = [];

      if (segment.startIndex < start) {
        parts.push({
          start: segment.startIndex,
          end: start,
          shouldHaveChord: false,
        });
      }

      parts.push({
        start: Math.max(segment.startIndex, start),
        end: Math.min(segmentEnd, end),
        shouldHaveChord: true,
      });

      if (segmentEnd > end) {
        parts.push({
          start: end,
          end: segmentEnd,
          shouldHaveChord: false,
        });
      }

      parts.forEach((part) => {
        const partText = text.substring(part.start, part.end);
        if (!partText.trim() && partText !== "") return;

        const newSegment: UISegment = {
          id: generateSegmentId(
            part.start,
            part.end - part.start,
            part.shouldHaveChord ? chordId : segment.chordId,
            segment.patternId,
          ),
          order: result.length,
          startIndex: part.start,
          length: part.end - part.start,
          text: partText,
          chordId: part.shouldHaveChord ? chordId : segment.chordId,
          patternId: segment.patternId,
          color: part.shouldHaveChord ? chord.color : segment.color,
          backgroundColor: segment.backgroundColor,
        };
        result.push(newSegment);
      });
    });
  }

  return mergeSegments(result.sort((a, b) => a.startIndex - b.startIndex));
}

export function assignPatternToText(
  segments: UISegment[],
  text: string,
  patternStart: number,
  patternEnd: number,
  patternId: string,
  chords: SongChordDto[],
  patterns: SongPatternDto[],
): UISegment[] {
  const pattern = patterns.find((p) => p.id === patternId);
  if (!pattern || patternStart >= patternEnd) return segments;

  const rangeSegments = segments.filter(
    (s) => s.startIndex < patternEnd && s.startIndex + s.length > patternStart,
  );

  let result: UISegment[] = segments.filter(
    (s) =>
      s.startIndex >= patternEnd || s.startIndex + s.length <= patternStart,
  );

  if (rangeSegments.length === 0) {
    const words = splitTextIntoWords(text.substring(patternStart, patternEnd));

    words.forEach((word, index) => {
      const newSegment: UISegment = {
        id: generateSegmentId(word.start + patternStart, word.end - word.start),
        order: result.length,
        startIndex: word.start + patternStart,
        length: word.end - word.start,
        text: word.word,
        chordId: undefined,
        patternId,
        color: undefined,
        backgroundColor: pattern.color,
      };
      result.push(newSegment);
    });
  } else {
    rangeSegments.forEach((segment) => {
      const segmentEnd = segment.startIndex + segment.length;

      const overlapStart = Math.max(segment.startIndex, patternStart);
      const overlapEnd = Math.min(segmentEnd, patternEnd);

      const parts: Array<{
        start: number;
        end: number;
        hasPattern: boolean;
      }> = [];

      if (segment.startIndex < patternStart) {
        parts.push({
          start: segment.startIndex,
          end: patternStart,
          hasPattern: false,
        });
      }

      if (overlapStart < overlapEnd) {
        parts.push({
          start: overlapStart,
          end: overlapEnd,
          hasPattern: true,
        });
      }

      if (segmentEnd > patternEnd) {
        parts.push({
          start: patternEnd,
          end: segmentEnd,
          hasPattern: false,
        });
      }

      parts.forEach((part) => {
        const partText = text.substring(part.start, part.end);
        if (!partText.trim() && partText !== "") return;

        const newSegment: UISegment = {
          id: generateSegmentId(
            part.start,
            part.end - part.start,
            segment.chordId,
            part.hasPattern ? patternId : segment.patternId,
          ),
          order: result.length,
          startIndex: part.start,
          length: part.end - part.start,
          text: partText,
          chordId: segment.chordId,
          patternId: part.hasPattern ? patternId : segment.patternId,
          color: segment.color,
          backgroundColor: part.hasPattern
            ? pattern.color
            : segment.backgroundColor,
        };
        result.push(newSegment);
      });
    });
  }

  return mergeSegments(result.sort((a, b) => a.startIndex - b.startIndex));
}

export function applyToolToSelection(
  segments: UISegment[],
  text: string,
  start: number,
  end: number,
  tool: "chord" | "pattern",
  selectedId: string,
  chords: SongChordDto[],
  patterns: SongPatternDto[],
): UISegment[] {
  if (tool === "chord") {
    const words = splitTextIntoWords(text.substring(start, end));
    let result = segments;

    words.forEach((word) => {
      result = assignChordToWord(
        result,
        text,
        word.start + start,
        selectedId,
        chords,
        patterns,
      );
    });

    return result;
  } else {
    return assignPatternToText(
      segments,
      text,
      start,
      end,
      selectedId,
      chords,
      patterns,
    );
  }
}

export function prepareSegmentsForBackend(
  segments: UISegment[],
  text: string,
): any[] {
  const sorted = [...segments].sort((a, b) => a.startIndex - b.startIndex);
  const result: any[] = [];

  sorted.forEach((segment, index) => {
    const segmentText = text.substring(
      segment.startIndex,
      segment.startIndex + segment.length,
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
  segments: UISegment[],
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

export function isColorValidForType(
  color: string,
  _type?: "chord" | "pattern",
): boolean {
  return ALL_COLORS.includes(color);
}

export function getNextAvailableColor(usedColors: string[]): string {
  for (const color of ALL_COLORS) {
    if (!usedColors.includes(color)) {
      return color;
    }
  }

  return ALL_COLORS[0];
}

export function getNextAvailableColorForType(
  usedColors: string[],
  _type?: "chord" | "pattern",
): string {
  return getNextAvailableColor(usedColors);
}

export function updateSegmentsForTextChange(
  oldText: string,
  newText: string,
  oldSegments: UISegment[],
): UISegment[] {
  if (oldText === newText) return oldSegments;

  return oldSegments
    .filter((segment) => segment.startIndex < newText.length)
    .map((segment) => {
      const newLength = Math.min(
        segment.length,
        newText.length - segment.startIndex,
      );

      return {
        ...segment,
        length: newLength,
        text: newText.substring(
          segment.startIndex,
          segment.startIndex + newLength,
        ),
        id: generateSegmentId(
          segment.startIndex,
          newLength,
          segment.chordId,
          segment.patternId,
        ),
      };
    })
    .filter((segment) => segment.length > 0 || segment.text === "[SPACE]");
}

export function mergeAdjacentSegments(segments: UISegment[]): UISegment[] {
  return mergeSegments(segments);
}
