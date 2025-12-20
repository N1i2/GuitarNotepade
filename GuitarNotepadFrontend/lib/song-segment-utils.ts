import { UISegment, SongChordDto, SongPatternDto, UIComment } from '@/types/songs';

/**
 * Разделить сегменты по границам выделения (start, end)
 */
export function splitSegmentsAtBoundary(
  segments: UISegment[],
  start: number,
  end: number
): UISegment[] {
  const result: UISegment[] = [];
  for (const segment of segments) {
    if (segment.startIndex + segment.length <= start || segment.startIndex >= end) {
      result.push(segment);
      continue;
    }
    // Left
    if (segment.startIndex < start && segment.startIndex + segment.length > start) {
      result.push({
        ...segment,
        id: `${segment.id}-left`,
        length: start - segment.startIndex,
        text: segment.text.substring(0, start - segment.startIndex),
      });
    }
    // Right
    if (segment.startIndex < end && segment.startIndex + segment.length > end) {
      result.push({
        ...segment,
        id: `${segment.id}-right`,
        startIndex: end,
        length: segment.startIndex + segment.length - end,
        text: segment.text.substring(end - segment.startIndex),
      });
    }
  }
  return result;
}

/**
 * Слить соседние сегменты с одинаковыми аккордами и паттернами
 */
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
      current.backgroundColor === next.backgroundColor &&
      (current.commentIds?.join(',') || '') === (next.commentIds?.join(',') || '')
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

/**
 * Применить аккорд/паттерн к выделению
 */
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
  const newSegment: UISegment = {
    id: `segment-${Date.now()}`,
    order: 0, // переустановить позже при сборке всей песни
    startIndex: start,
    length: end - start,
    text: selectedText,
    chordId: undefined,
    patternId: undefined,
    color: undefined,
    backgroundColor: undefined,
    commentIds: [],
  };
  if (tool === 'chord') {
    newSegment.chordId = selectedId;
    const chord = chords.find(c => c.chordId === selectedId);
    newSegment.color = chord?.color;
    // Сохраняем pattern у сегмента, если был
    const overlapped = segments.find(
      s => s.startIndex < end && s.startIndex + s.length > start && s.patternId
    );
    if (overlapped) {
      newSegment.patternId = overlapped.patternId;
      newSegment.backgroundColor = overlapped.backgroundColor;
    }
  } else if (tool === 'pattern') {
    newSegment.patternId = selectedId;
    const pattern = patterns.find(p => p.patternId === selectedId);
    newSegment.backgroundColor = pattern?.color;
    // Аналогично — сохраняем chord, если был
    const overlapped = segments.find(
      s => s.startIndex < end && s.startIndex + s.length > start && s.chordId
    );
    if (overlapped) {
      newSegment.chordId = overlapped.chordId;
      newSegment.color = overlapped.color;
    }
  }
  newSegments.push(newSegment);
  return mergeAdjacentSegments(newSegments.sort((a, b) => a.startIndex - b.startIndex));
}

/**
 * Очистить аккорд/паттерн с выделения
 */
export function clearToolFromSelection(
  segments: UISegment[],
  start: number,
  end: number,
  tool: 'chord' | 'pattern',
): UISegment[] {
  let newSegments = splitSegmentsAtBoundary(segments, start, end);
  newSegments = newSegments.map(segment => {
    if (segment.startIndex < end && segment.startIndex + segment.length > start) {
      if (tool === 'chord') {
        return { ...segment, chordId: undefined, color: undefined };
      } else {
        return { ...segment, patternId: undefined, backgroundColor: undefined };
      }
    }
    return segment;
  });
  return mergeAdjacentSegments(newSegments);
}

/**
 * Массовая замена одного аккорда/паттерна на другой для всех сегментов
 */
export function replaceToolForAllSegments(
  segments: UISegment[],
  tool: 'chord' | 'pattern',
  oldId: string,
  newId: string,
  chords: SongChordDto[],
  patterns: SongPatternDto[]
) {
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

/**
 * Проверка на дублирование сегмента (по chordId, patternId, text)
 */
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

/**
 * Пометить у всех сегментов, где есть комментарии, поле hasComments=true
 */
export function markSegmentsWithComments(
  segments: UISegment[],
  comments: UIComment[]
) {
  const commentMap = new Map<string, UIComment[]>();
  comments.forEach(c => {
    if (!commentMap.has(c.segmentId)) commentMap.set(c.segmentId, []);
    commentMap.get(c.segmentId)!.push(c);
  });
  return segments.map(seg =>
    commentMap.has(seg.id)
      ? { ...seg, hasComments: true, commentIds: commentMap.get(seg.id)!.map(c => c.id) }
      : { ...seg, hasComments: false, commentIds: [] },
  );
}
