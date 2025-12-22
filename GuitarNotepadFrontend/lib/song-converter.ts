import { SongDetailDto } from "@/types/song-detail";
import {
  UISegment,
  SongCreationState,
  SongChordDto,
  SongPatternDto,
  convertSongCommentToUI,
  SongCommentDto,
  SegmentDataWithPositionDto,
  FullSongDto,
} from "@/types/songs";

export function convertSegmentsToUI(data: FullSongDto): {
  segments: UISegment[];
  chords: SongChordDto[];
  patterns: SongPatternDto[];
  text: string;
  comments: any[];
} {
  console.log("=== convertSegmentsToUI DEBUG ===");
  console.log("Data received:", data);
  console.log("Comments from data:", data.comments);
  console.log("Segments from data:", data.segments);

  const segments: UISegment[] = [];

  let fullText = "";
  let position = 0;

  const sortedSegments = [...(data.segments || [])].sort(
    (a, b) => a.positionIndex - b.positionIndex
  );

  const positionToDbSegmentId = new Map<number, string>();

  const commentsByDbSegmentId = new Map<string, SongCommentDto[]>();

  sortedSegments.forEach((segmentData: SegmentDataWithPositionDto, index) => {
    if ((segmentData as any).id) {
      positionToDbSegmentId.set(
        segmentData.positionIndex,
        (segmentData as any).id
      );
    } else if (segmentData.segmentData && (segmentData.segmentData as any).id) {
      positionToDbSegmentId.set(
        segmentData.positionIndex,
        (segmentData.segmentData as any).id
      );
    }
  });

  (data.comments || []).forEach((comment) => {
    if (comment.segmentId) {
      if (!commentsByDbSegmentId.has(comment.segmentId)) {
        commentsByDbSegmentId.set(comment.segmentId, []);
      }
      commentsByDbSegmentId.get(comment.segmentId)!.push(comment);
      console.log(
        `Comment ${comment.id} belongs to DB segment ${comment.segmentId}`
      );
    }
  });

  console.log(
    "Position to DB SegmentId mapping:",
    Array.from(positionToDbSegmentId.entries())
  );
  console.log(
    "Comments by DB SegmentId:",
    Array.from(commentsByDbSegmentId.entries())
  );

  sortedSegments.forEach((segmentData: SegmentDataWithPositionDto, index) => {
    const segment = segmentData.segmentData;

    if (segment.lyric) {
      fullText += segment.lyric;
    }

    const dbSegmentId = positionToDbSegmentId.get(segmentData.positionIndex);
    console.log(
      `Segment at position ${segmentData.positionIndex} -> DB SegmentId: ${dbSegmentId}`
    );

    const segmentComments: SongCommentDto[] = dbSegmentId
      ? commentsByDbSegmentId.get(dbSegmentId) || []
      : [];

    console.log(
      `Segment ${index} (DB ID: ${dbSegmentId}) has ${segmentComments.length} comments`
    );

    const uiSegmentId = `ui-segment-${
      segmentData.positionIndex
    }-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const uiSegment: UISegment = {
      id: uiSegmentId,
      order: index,
      startIndex: position,
      length: segment.lyric?.length || 0,
      text: segment.lyric || "",
      chordId: segment.chordId,
      patternId: segment.patternId,
      color: segment.color,
      backgroundColor: segment.backgroundColor,
      commentIds: segmentComments.map((c) => c.id),
      comments: segmentComments.map(convertSongCommentToUI).map((comment) => ({
        ...comment,
        segmentId: dbSegmentId || comment.segmentId,
      })),
    };

    segments.push(uiSegment);
    position += uiSegment.length;
  });

  const chords: SongChordDto[] = Array.from(
    new Map(data.chords?.map((chord) => [chord.id, chord]) || []).values()
  );

  const patterns: SongPatternDto[] = Array.from(
    new Map(
      data.patterns?.map((pattern) => [pattern.id, pattern]) || []
    ).values()
  );

  const allComments = (data.comments || []).map(convertSongCommentToUI);

  console.log("Conversion result:", {
    segmentsCount: segments.length,
    chordsCount: chords.length,
    patternsCount: patterns.length,
    textLength: fullText.length,
    commentsCount: allComments.length,
    segmentsWithComments: segments.filter(
      (s) => s.comments && s.comments.length > 0
    ).length,
    segmentsWithCommentsDetails: segments
      .filter((s) => s.comments && s.comments.length > 0)
      .map((s) => ({ id: s.id, comments: s.comments?.length })),
  });

  return {
    segments,
    chords,
    patterns,
    text: fullText,
    comments: allComments,
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
