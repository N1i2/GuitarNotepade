"use client";

import { useSongCreation } from "@/app/contexts/song-creation-context";
import { SegmentsList } from "./segments-list";

interface SegmentsListForCreationProps {
  onSegmentClick: (segmentId: string) => void;
}

export function SegmentsListForCreation({
  onSegmentClick,
}: SegmentsListForCreationProps) {
  const { state } = useSongCreation();

  return (
    <SegmentsList
      onSegmentClick={onSegmentClick}
      segments={state.segments}
      chords={state.selectedChords}
      patterns={state.selectedPatterns}
      comments={state.comments}
    />
  );
}
