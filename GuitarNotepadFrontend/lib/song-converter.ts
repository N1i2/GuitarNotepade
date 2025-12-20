import { SongCreationState } from '@/types/songs';
import { prepareSegmentsForBackend, prepareCommentsForBackend } from './song-segment-utils';

export function convertStateToBackendFormat(state: SongCreationState): any {
  const segments = prepareSegmentsForBackend(state.segments, state.text);
  
  const segmentComments = prepareCommentsForBackend(state.comments, state.segments);
  
  const chordIds = Array.from(new Set(state.segments
    .filter(s => s.chordId && s.chordId !== 'empty')
    .map(s => s.chordId!)));
  
  const patternIds = Array.from(new Set(state.segments
    .filter(s => s.patternId && s.patternId !== 'empty')
    .map(s => s.patternId!)));

  return {
    title: state.title || 'Untitled',
    artist: state.artist || '',
    genre: state.genre || '',
    theme: state.theme || '',
    description: state.description || '',
    isPublic: state.isPublic,
    parentSongId: undefined,
    segments: segments,
    segmentComments: Object.keys(segmentComments).length > 0 ? segmentComments : undefined,
    chordIds: chordIds.length > 0 ? chordIds : undefined,
    patternIds: patternIds.length > 0 ? patternIds : undefined,
  };
}