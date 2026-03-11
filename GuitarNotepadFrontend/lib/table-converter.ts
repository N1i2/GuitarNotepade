import {
  UISegment,
  SegmentDataWithPositionDto,
  TableSegment,
  SegmentType,
} from "@/types/songs";

export function convertUIToTable(
  uiSegments: UISegment[],
  text: string,
): TableSegment[] {
  return uiSegments.map((segment, index) => ({
    id: segment.id,
    order: index,
    type: segment.text === "[SPACE]" ? SegmentType.Space : SegmentType.Playback,
    text: segment.text === "[SPACE]" ? "" : segment.text,
    chordId: segment.chordId,
    patternId: segment.patternId,
    color: segment.color,
    backgroundColor: segment.backgroundColor,
    repeatGroup: undefined,
  }));
}

export function convertTableToDTO(
  segments: TableSegment[],
): SegmentDataWithPositionDto[] {
  return segments.map((segment, index) => ({
    segmentData: {
      type: segment.type.toString(),
      lyric: segment.text,
      chordId: segment.chordId,
      patternId: segment.patternId,
      color: segment.color,
      backgroundColor: segment.backgroundColor,
    },
    positionIndex: index,
    repeatGroup: segment.repeatGroup,
  }));
}

export function convertTableToUI(segments: TableSegment[]): UISegment[] {
  let position = 0;
  return segments.map((segment, index) => {
    const startIndex = position;
    position += segment.text.length;

    return {
      id: segment.id,
      order: index,
      startIndex,
      length: segment.text.length,
      text: segment.text,
      chordId: segment.chordId,
      patternId: segment.patternId,
      color: segment.color,
      backgroundColor: segment.backgroundColor,
      commentIds: [],
      comments: [],
    };
  });
}
