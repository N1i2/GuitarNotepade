import { SongDetailDto } from "@/types/song-detail";
import {
  SongDto,
  UISegment,
  SongChordDto,
  SongPatternDto,
  SongCommentDto,
} from "@/types/songs";
import { SongCreationState } from "@/types/songs";

export function convertSegmentsToUI(song: SongDetailDto): {
  segments: UISegment[];
  chords: SongChordDto[];
  patterns: SongPatternDto[];
  text: string;
} {
  const segments: UISegment[] = [];
  const chordsMap = new Map<string, SongChordDto>();
  const patternsMap = new Map<string, SongPatternDto>();
  let fullText = "";

  if (!song.segments || song.segments.length === 0) {
    return {
      segments: [],
      chords: [],
      patterns: [],
      text: "",
    };
  }

  const sortedSegments = [...song.segments].sort(
    (a, b) => a.positionIndex - b.positionIndex
  );

  sortedSegments.forEach((segment) => {
    if (segment.segmentData?.lyric !== undefined) {
      fullText += segment.segmentData.lyric;
    }
  });

  let currentPosition = 0;
  sortedSegments.forEach((segment) => {
    const lyric = segment.segmentData?.lyric || "";
    
    const segmentId = `${song.id}-${segment.positionIndex}-${Date.now()}`;
    
    const uiSegment: UISegment = {
      id: segmentId,
      order: segment.positionIndex,
      startIndex: currentPosition,
      length: lyric.length,
      text: lyric,
      chordId: segment.segmentData?.chordId,
      patternId: segment.segmentData?.patternId,
      color: segment.segmentData?.color,
      backgroundColor: segment.segmentData?.backgroundColor,
      comments: [],
    };

    if (song.comments && segment.segmentData?.chordId) {
      const segmentComments = song.comments
        .filter(comment => comment.segmentId === segment.segmentData?.chordId)
        .map(comment => ({
          id: comment.id,
          segmentId: uiSegment.id,
          authorId: comment.userId || "",
          authorName: comment.userName || "Anonymous",
          text: comment.text,
          createdAt: comment.createdAt,
        }));

      if (segmentComments.length > 0) {
        uiSegment.comments = segmentComments;
      }
    }

    segments.push(uiSegment);

    if (segment.segmentData?.chordId && segment.segmentData?.chord) {
      if (!chordsMap.has(segment.segmentData.chordId)) {
        chordsMap.set(segment.segmentData.chordId, {
          chordId: segment.segmentData.chordId,
          chordName: segment.segmentData.chord.name,
          color: segment.segmentData.color || getRandomColor(),
        });
      }
    }

    if (segment.segmentData?.patternId && segment.segmentData?.pattern) {
      if (!patternsMap.has(segment.segmentData.patternId)) {
        patternsMap.set(segment.segmentData.patternId, {
          patternId: segment.segmentData.patternId,
          patternName: segment.segmentData.pattern.name,
          color: segment.segmentData.backgroundColor || getRandomColor(),
          isFingerStyle: segment.segmentData.pattern.isFingerStyle,
        });
      }
    }

    currentPosition += lyric.length;
  });

  return {
    segments,
    chords: Array.from(chordsMap.values()),
    patterns: Array.from(patternsMap.values()),
    text: fullText,
  };
}

export function convertStateToBackendFormat(state: SongCreationState): any {
  const segments = prepareSegmentsForBackend(state.segments, state.text);

  const segmentComments = prepareCommentsForBackend(
    state.comments,
    state.segments
  );

  const chordIds = Array.from(
    new Set(
      state.segments
        .filter((s) => s.chordId && s.chordId !== "empty")
        .map((s) => s.chordId!)
    )
  );

  const patternIds = Array.from(
    new Set(
      state.segments
        .filter((s) => s.patternId && s.patternId !== "empty")
        .map((s) => s.patternId!)
    )
  );

  return {
    title: state.title || "Untitled",
    artist: state.artist || "",
    genre: state.genre || "",
    theme: state.theme || "",
    description: state.description || "",
    isPublic: state.isPublic,
    parentSongId: undefined,
    segments: segments,
    segmentComments:
      Object.keys(segmentComments).length > 0 ? segmentComments : undefined,
    chordIds: chordIds.length > 0 ? chordIds : undefined,
    patternIds: patternIds.length > 0 ? patternIds : undefined,
  };
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

  const sortedSegments = [...segments].sort(
    (a, b) => a.startIndex - b.startIndex
  );

  comments.forEach((comment) => {
    const segmentIndex = sortedSegments.findIndex(
      (s) => s.id === comment.segmentId
    );
    if (segmentIndex !== -1) {
      if (!result[segmentIndex]) {
        result[segmentIndex] = [];
      }
      if (result[segmentIndex].length > 0) {
        result[segmentIndex][0] = { text: comment.text };
      } else {
        result[segmentIndex].push({ text: comment.text });
      }
    }
  });

  return result;
}

function getRandomColor(): string {
  const colors = [
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
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getStartIndex(
  fullText: string,
  segments: UISegment[],
  currentIndex: number
): number {
  if (currentIndex === 0) return 0;

  let currentPos = 0;
  for (let i = 0; i < currentIndex; i++) {
    const segment = segments[i];
    if (segment) {
      currentPos += segment.length;
      if (i < currentIndex - 1) {
        currentPos += 1;
      }
    }
  }

  return Math.min(currentPos, fullText.length);
}

interface UIComment {
  id: string;
  segmentId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}
