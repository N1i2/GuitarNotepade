import { UISegment, SongChordDto, SongPatternDto, UIComment } from '@/types/songs';

export const CHORD_COLORS = [
 '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', 
  '#EF476F', '#073B4C', '#FF9F1C', '#2EC4B6', '#E71D36',
  '#011627', '#FDFFFC', '#B91372', '#06BCC1', '#C5D86D',
  '#F4D35E', '#EE964B', '#F95738', '#0D3B66', '#FAF0CA'
];

export const PATTERN_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', 
  '#EF476F', '#073B4C', '#FF9F1C', '#2EC4B6', '#E71D36',
  '#011627', '#FDFFFC', '#B91372', '#06BCC1', '#C5D86D',
  '#F4D35E', '#EE964B', '#F95738', '#0D3B66', '#FAF0CA'
].filter((color, index, self) => self.indexOf(color) === index);

export function isColorUnique(color: string, usedColors: string[]): boolean {
  return !usedColors.includes(color);
}

export function getNextAvailableColor(usedColors: string[], availableColors: string[]): string {
  return availableColors.find(color => !usedColors.includes(color)) || availableColors[0];
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
    
    if (segment.startIndex < start && segmentEnd > start) {
      result.push({
        ...segment,
        id: `${segment.id}-left`,
        length: start - segment.startIndex,
        text: segment.text.substring(0, start - segment.startIndex),
      });
    }
    
    if (segment.startIndex < end && segmentEnd > end) {
      result.push({
        ...segment,
        id: `${segment.id}-right`,
        startIndex: end,
        length: segmentEnd - end,
        text: segment.text.substring(end - segment.startIndex),
      });
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
  tool: 'chord' | 'pattern',
  selectedId: string,
  chords: SongChordDto[],
  patterns: SongPatternDto[]
): UISegment[] {
  let newSegments = splitSegmentsAtBoundary(segments, start, end);
  
  newSegments = newSegments.filter(s => !(s.startIndex >= start && s.startIndex + s.length <= end));
  
  const selectedText = text.substring(start, end);
  
  if (!selectedText.trim() && selectedText !== '[SPACE]') {
    return mergeAdjacentSegments(newSegments);
  }
  
  const overlappedSegments = segments.filter(s => 
    s.startIndex < end && s.startIndex + s.length > start
  );
  
  const newSegment: UISegment = {
    id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    order: newSegments.filter(s => s.startIndex < start).length,
    startIndex: start,
    length: end - start,
    text: selectedText,
    chordId: undefined,
    patternId: undefined,
    color: undefined,
    backgroundColor: undefined,
    commentIds: [],
  };
  
  if (overlappedSegments.length > 0) {
    const firstOverlap = overlappedSegments[0];
    
    if (tool === 'chord') {
      newSegment.patternId = firstOverlap.patternId;
      newSegment.backgroundColor = firstOverlap.backgroundColor;
    } else {
      newSegment.chordId = firstOverlap.chordId;
      newSegment.color = firstOverlap.color;
    }
  }
  
  if (tool === 'chord' && selectedId !== 'empty') {
    const chord = chords.find(c => c.chordId === selectedId);
    if (chord) {
      newSegment.chordId = selectedId;
      newSegment.color = chord.color;
    }
  } else if (tool === 'pattern' && selectedId !== 'empty') {
    const pattern = patterns.find(p => p.patternId === selectedId);
    if (pattern) {
      newSegment.patternId = selectedId;
      newSegment.backgroundColor = pattern.color;
    }
  }
  
  if (selectedId === 'empty') {
    if (tool === 'chord') {
      newSegment.chordId = undefined;
      newSegment.color = undefined;
    } else {
      newSegment.patternId = undefined;
      newSegment.backgroundColor = undefined;
    }
  }
  
  newSegments.push(newSegment);
  
  return mergeAdjacentSegments(newSegments.sort((a, b) => a.startIndex - b.startIndex));
}

export function mergePartialSelections(
  segments: UISegment[],
  text: string, 
  start: number,
  end: number,
  tool: 'chord' | 'pattern',
  selectedId: string,
  chords: SongChordDto[],
  patterns: SongPatternDto[]
): UISegment[] {
  const overlappedSegments = segments.filter(s => 
    s.startIndex < end && s.startIndex + s.length > start
  );
  
  if (overlappedSegments.length === 0) {
    return applyToolToSelection(segments, text, start, end, tool, selectedId, chords, patterns);
  }
  
  const firstSegment = overlappedSegments[0];
  const allSame = overlappedSegments.every(segment => {
    if (tool === 'chord') {
      return segment.chordId === firstSegment.chordId;
    } else {
      return segment.patternId === firstSegment.patternId;
    }
  });
  
  if (allSame && selectedId !== 'empty') {
    const minStart = Math.min(start, ...overlappedSegments.map(s => s.startIndex));
    const maxEnd = Math.max(end, ...overlappedSegments.map(s => s.startIndex + s.length));
    
    const otherSegments = segments.filter(s => 
      !overlappedSegments.some(os => os.id === s.id)
    );
    
    const newSegment: UISegment = {
      ...firstSegment,
      id: `merged-${Date.now()}`,
      startIndex: minStart,
      length: maxEnd - minStart,
      text: text.substring(minStart, maxEnd),
    };
    
    return mergeAdjacentSegments([...otherSegments, newSegment]);
  }
  
  return applyToolToSelection(segments, text, start, end, tool, selectedId, chords, patterns);
}

export function clearToolFromSelection(
  segments: UISegment[],
  start: number,
  end: number,
  tool: 'chord' | 'pattern'
): UISegment[] {
  let newSegments = splitSegmentsAtBoundary(segments, start, end);
  
  newSegments = newSegments.map(segment => {
    if (segment.startIndex < end && segment.startIndex + segment.length > start) {
      if (tool === 'chord') {
        return { 
          ...segment, 
          chordId: undefined, 
          color: undefined 
        };
      } else {
        return { 
          ...segment, 
          patternId: undefined, 
          backgroundColor: undefined 
        };
      }
    }
    return segment;
  });
  
  return mergeAdjacentSegments(newSegments);
}

export function replaceToolForAllSegments(
  segments: UISegment[],
  tool: 'chord' | 'pattern',
  oldId: string,
  newId: string,
  chords: SongChordDto[],
  patterns: SongPatternDto[]
): UISegment[] {
  return segments.map(segment => {
    if (tool === 'chord' && segment.chordId === oldId) {
      const chord = chords.find(c => c.chordId === newId);
      return { ...segment, chordId: newId, color: chord?.color };
    } else if (tool === 'pattern' && segment.patternId === oldId) {
      const pattern = patterns.find(p => p.patternId === newId);
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
  return segments.find(s =>
    s.text === text && s.chordId === chordId && s.patternId === patternId
  );
}

export function prepareSegmentsForBackend(
  segments: UISegment[],
  text: string
): any[] {
  const sortedSegments = [...segments].sort((a, b) => a.startIndex - b.startIndex);
  const result: any[] = [];
  
  let positionIndex = 0;
  for (const segment of sortedSegments) {
    const segmentText = text.substring(segment.startIndex, segment.startIndex + segment.length);
    
    let segmentType = '0'; 
    if (segmentText === '[SPACE]') {
      segmentType = '2'; 
    } else if (segment.chordId || segment.patternId) {
      segmentType = '1'; 
    }
    
    result.push({
      segmentData: {
        type: segmentType,
        lyric: segmentText === '[SPACE]' ? '' : segmentText,
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
  
  comments.forEach(comment => {
    const segmentIndex = segments.findIndex(s => s.id === comment.segmentId);
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

export function groupSegmentsByProperties(segments: UISegment[]): UISegment[][] {
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
  const content = `${text}-${chordId || ''}-${patternId || ''}`;
  let hash = 0;
  
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}
