import { UISegment, SelectedChord, SelectedPattern } from '@/types/songs';

export function splitSegmentsAtBoundary(
  segments: UISegment[],
  start: number,
  end: number
): UISegment[] {
  const result: UISegment[] = [];
  
  for (const segment of segments) {
    if (segment.startIndex + segment.length <= start) {
      result.push(segment);
      continue;
    }
    
    if (segment.startIndex >= end) {
      result.push(segment);
      continue;
    }
    
    if (segment.startIndex < start && segment.startIndex + segment.length > start) {
      result.push({
        ...segment,
        id: `${segment.id}-left`,
        length: start - segment.startIndex,
        text: segment.text.substring(0, start - segment.startIndex)
      });
    }
    
    if (segment.startIndex < end && segment.startIndex + segment.length > end) {
      result.push({
        ...segment,
        id: `${segment.id}-right`,
        startIndex: end,
        length: segment.startIndex + segment.length - end,
        text: segment.text.substring(end - segment.startIndex)
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
    
    if (current.startIndex + current.length === next.startIndex &&
        current.chordId === next.chordId &&
        current.patternId === next.patternId) {
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
  existingChords: SelectedChord[] = [],
  existingPatterns: SelectedPattern[] = []
): UISegment[] {
  let newSegments = splitSegmentsAtBoundary(segments, start, end);
  
  newSegments = newSegments.filter(segment => 
    !(segment.startIndex >= start && segment.startIndex + segment.length <= end)
  );
  
  const selectedText = text.substring(start, end);
  const newSegment: UISegment = {
    id: `segment-${Date.now()}`,
    startIndex: start,
    length: end - start,
    text: selectedText,
    chordId: undefined,
    patternId: undefined,
  };
  
  if (tool === 'chord') {
    if (selectedId && selectedId !== 'empty') {
      newSegment.chordId = selectedId;
      const chord = existingChords.find(c => c.chordId === selectedId);
      newSegment.color = chord?.color;
    }
    
    const overlappingSegments = segments.filter(segment => 
      segment.startIndex < end && segment.startIndex + segment.length > start
    );
    
    for (const seg of overlappingSegments) {
      if (seg.patternId) {
        newSegment.patternId = seg.patternId;
        newSegment.backgroundColor = seg.backgroundColor;
        break;
      }
    }
  } 
  else if (tool === 'pattern') {
    if (selectedId && selectedId !== 'empty') {
      newSegment.patternId = selectedId;
      const pattern = existingPatterns.find(p => p.patternId === selectedId);
      newSegment.backgroundColor = pattern?.color;
    }
    
    const overlappingSegments = segments.filter(segment => 
      segment.startIndex < end && segment.startIndex + segment.length > start
    );
    
    for (const seg of overlappingSegments) {
      if (seg.chordId) {
        newSegment.chordId = seg.chordId;
        newSegment.color = seg.color;
        break;
      }
    }
  }
  
  newSegments.push(newSegment);
  newSegments = mergeAdjacentSegments(
    newSegments.sort((a, b) => a.startIndex - b.startIndex)
  );
  
  return newSegments;
}

export function clearToolFromSelection(
  segments: UISegment[],
  start: number,
  end: number,
  tool: 'chord' | 'pattern'
): UISegment[] {
  return segments.map(segment => {
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
}