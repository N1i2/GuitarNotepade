import { 
  SongCreationState, 
  SongSegmentDto
} from '@/types/songs';

 * Преобразует состояние UI в формат, ожидаемый бэкендом
 */
export function convertToBackendFormat(state: SongCreationState, artist: string = ''): CreateSongWithSegmentsDto {

  const sortedSegments = [...state.segments].sort((a, b) => a.startIndex - b.startIndex);
  
  const segments: SongSegmentDto[] = sortedSegments.map(segment => {
    const segmentType = segment.text === '[SPACE]' 
      ? SegmentType.Space 
      : (segment.chordId || segment.patternId) 
        ? SegmentType.Playback 
        : SegmentType.Text;

    return {
      type: segmentType,
      lyric: segment.text === '[SPACE]' ? '' : segment.text,
      chordId: segment.chordId && segment.chordId !== 'empty' && segment.chordId !== 'undefined' 
        ? segment.chordId 
        : undefined,
      patternId: segment.patternId && segment.patternId !== 'empty' && segment.patternId !== 'undefined'
        ? segment.patternId
        : undefined,
      color: segment.color,
      backgroundColor: segment.backgroundColor,
      repeatCount: 1,
      startIndex: segment.startIndex,
      length: segment.length,
    };
  });

  const metadata: SongMetadataDto = {
    comments: state.comments.map(comment => ({
      text: comment.text,
      segmentId: comment.segmentId,
    })),
    labels: [],
    segmentLabels: [],
  };

  const chordIdsSet = new Set<string>();
  const patternIdsSet = new Set<string>();
  
  segments.forEach(segment => {
    if (segment.chordId) {
      chordIdsSet.add(segment.chordId);
    }
    if (segment.patternId) {
      patternIdsSet.add(segment.patternId);
    }
  });

  state.selectedChords.forEach(chord => {
    if (chord.chordId && chord.chordId !== 'empty' && chord.chordId !== 'undefined') {
      chordIdsSet.add(chord.chordId);
    }
  });

  state.selectedPatterns.forEach(pattern => {
    if (pattern.patternId && pattern.patternId !== 'empty' && pattern.patternId !== 'undefined') {
      patternIdsSet.add(pattern.patternId);
    }
  });

  return {
    title: state.title || 'Untitled Song',
    artist: artist,
    isPublic: state.isPublic || false,
    parentSongId: undefined,
    structure: {
      segments,
      metadata,
    },
    chordIds: Array.from(chordIdsSet),
    patternIds: Array.from(patternIdsSet),
  };
}