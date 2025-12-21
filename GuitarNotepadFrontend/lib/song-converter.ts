import { SongCreationState, UIComment, UISegment } from "@/types/songs";
import { prepareSegmentsForBackend } from "./song-segment-utils";

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
