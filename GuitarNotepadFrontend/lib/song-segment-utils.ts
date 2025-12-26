import {
  UISegment,
  SongChordDto,
  SongPatternDto,
  UIComment,
} from "@/types/songs";

export const ALL_COLORS = [
  "#FF6B6B", "#4ECDC4", "#FFD166", "#06D6A0", "#118AB2",
  "#EF476F", "#073B4C", "#FF9F1C", "#2EC4B6", "#E71D36",
  "#B91372", "#06BCC1", "#C5D86D", "#F4D35E", "#EE964B",
  "#F95738", "#0D3B66", "#FAF0CA", "#A663CC", "#6A994E",
  "#E63946", "#A8DADC", "#457B9D", "#1D3557", "#F4A261",
  "#2A9D8F", "#E9C46A", "#264653", "#E76F51", "#F4E285",
].filter((color) => color !== "#000000" && color !== "#FFFFFF");

export const CHORD_COLORS = ALL_COLORS.slice(0, 20);
export const PATTERN_COLORS = ALL_COLORS.slice(20, 30);

// Генерация ID сегмента
export function generateSegmentId(
  startIndex: number,
  length: number,
  chordId?: string,
  patternId?: string
): string {
  const base = `${startIndex}-${length}-${chordId || "none"}-${patternId || "none"}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash << 5) - hash + base.charCodeAt(i);
    hash = hash & hash;
  }
  return `seg-${Math.abs(hash).toString(36)}`;
}

// Найти сегмент по позиции
export function findSegmentAtPosition(
  segments: UISegment[],
  position: number
): UISegment | null {
  return (
    segments.find(
      (segment) =>
        position >= segment.startIndex &&
        position < segment.startIndex + segment.length
    ) || null
  );
}

// Разбить текст на слова с позициями
export function splitTextIntoWords(text: string): Array<{word: string, start: number, end: number}> {
  const words: Array<{word: string, start: number, end: number}> = [];
  let wordStart = -1;
  
  for (let i = 0; i <= text.length; i++) {
    const char = i < text.length ? text[i] : ' ';
    const isWordChar = !isSeparator(char);
    
    if (isWordChar && wordStart === -1) {
      wordStart = i;
    } else if (!isWordChar && wordStart !== -1) {
      const word = text.substring(wordStart, i);
      if (word.trim()) {
        words.push({
          word,
          start: wordStart,
          end: i
        });
      }
      wordStart = -1;
    }
  }
  
  return words;
}

function isSeparator(char: string): boolean {
  return char === ' ' || char === '\n' || char === '\t' || 
         char === ',' || char === '.' || char === '!' || char === '?' ||
         char === ';' || char === ':' || char === '(' || char === ')' ||
         char === '[' || char === ']';
}

// Найти слово по позиции
export function findWordAtPosition(text: string, position: number): {word: string, start: number, end: number} | null {
  const words = splitTextIntoWords(text);
  return words.find(word => position >= word.start && position < word.end) || null;
}

// Объединить смежные сегменты с одинаковыми свойствами
export function mergeSegments(segments: UISegment[]): UISegment[] {
  if (segments.length <= 1) return segments;
  
  const sorted = [...segments].sort((a, b) => a.startIndex - b.startIndex);
  const result: UISegment[] = [];
  
  let current = sorted[0];
  
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    
    // Можно объединить если:
    // 1. Сегменты идут подряд
    // 2. У них одинаковые аккорды
    // 3. У них одинаковые паттерны
    const isAdjacent = current.startIndex + current.length === next.startIndex;
    const sameChord = current.chordId === next.chordId;
    const samePattern = current.patternId === next.patternId;
    
    if (isAdjacent && sameChord && samePattern) {
      // Объединяем
      current = {
        ...current,
        length: current.length + next.length,
        text: (current.text || '') + (next.text || '')
      };
    } else {
      result.push(current);
      current = next;
    }
  }
  
  result.push(current);
  
  // Обновляем ID
  return result.map(segment => ({
    ...segment,
    id: generateSegmentId(segment.startIndex, segment.length, segment.chordId, segment.patternId)
  }));
}

// ПРИСВОЕНИЕ АККОРДА К СЛОВУ (основная функция)
export function assignChordToWord(
  segments: UISegment[],
  text: string,
  wordStart: number,
  chordId: string,
  chords: SongChordDto[],
  patterns: SongPatternDto[]
): UISegment[] {
  const word = findWordAtPosition(text, wordStart);
  if (!word) return segments;
  
  const { start, end } = word;
  const chord = chords.find(c => c.id === chordId);
  if (!chord) return segments;
  
  // Сначала находим все сегменты, которые пересекаются с этим словом
  const overlappingSegments = segments.filter(s => 
    s.startIndex < end && s.startIndex + s.length > start
  );
  
  let result: UISegment[] = segments.filter(s => 
    s.startIndex >= end || s.startIndex + s.length <= start
  );
  
  // Если нет пересечений, создаем новый сегмент
  if (overlappingSegments.length === 0) {
    const newSegment: UISegment = {
      id: generateSegmentId(start, end - start, chordId),
      order: segments.length,
      startIndex: start,
      length: end - start,
      text: word.word,
      chordId,
      patternId: undefined, // Оставляем паттерн как есть
      color: chord.color,
      backgroundColor: undefined,
    };
    result.push(newSegment);
  } else {
    // Обрабатываем пересечения
    overlappingSegments.forEach(segment => {
      const segmentEnd = segment.startIndex + segment.length;
      
      // Разбиваем сегмент на части
      const parts: Array<{
        start: number;
        end: number;
        shouldHaveChord: boolean;
      }> = [];
      
      // Часть до слова
      if (segment.startIndex < start) {
        parts.push({
          start: segment.startIndex,
          end: start,
          shouldHaveChord: false
        });
      }
      
      // Само слово
      parts.push({
        start: Math.max(segment.startIndex, start),
        end: Math.min(segmentEnd, end),
        shouldHaveChord: true
      });
      
      // Часть после слова
      if (segmentEnd > end) {
        parts.push({
          start: end,
          end: segmentEnd,
          shouldHaveChord: false
        });
      }
      
      // Создаем новые сегменты для каждой части
      parts.forEach(part => {
        const partText = text.substring(part.start, part.end);
        if (!partText.trim() && partText !== '') return;
        
        const newSegment: UISegment = {
          id: generateSegmentId(
            part.start,
            part.end - part.start,
            part.shouldHaveChord ? chordId : segment.chordId,
            segment.patternId
          ),
          order: result.length,
          startIndex: part.start,
          length: part.end - part.start,
          text: partText,
          chordId: part.shouldHaveChord ? chordId : segment.chordId,
          patternId: segment.patternId,
          color: part.shouldHaveChord ? chord.color : segment.color,
          backgroundColor: segment.backgroundColor,
        };
        result.push(newSegment);
      });
    });
  }
  
  // Объединяем смежные сегменты с одинаковыми свойствами
  return mergeSegments(result.sort((a, b) => a.startIndex - b.startIndex));
}

// ПРИСВОЕНИЕ ПАТТЕРНА К ТЕКСТУ (любой диапазон)
export function assignPatternToText(
  segments: UISegment[],
  text: string,
  patternStart: number,
  patternEnd: number,
  patternId: string,
  chords: SongChordDto[],
  patterns: SongPatternDto[]
): UISegment[] {
  const pattern = patterns.find(p => p.id === patternId);
  if (!pattern || patternStart >= patternEnd) return segments;
  
  // Находим все сегменты в диапазоне
  const rangeSegments = segments.filter(s => 
    s.startIndex < patternEnd && s.startIndex + s.length > patternStart
  );
  
  let result: UISegment[] = segments.filter(s => 
    s.startIndex >= patternEnd || s.startIndex + s.length <= patternStart
  );
  
  // Если нет сегментов в диапазоне, создаем новые
  if (rangeSegments.length === 0) {
    // Разбиваем диапазон на слова
    const words = splitTextIntoWords(text.substring(patternStart, patternEnd));
    
    words.forEach((word, index) => {
      const newSegment: UISegment = {
        id: generateSegmentId(word.start + patternStart, word.end - word.start),
        order: result.length,
        startIndex: word.start + patternStart,
        length: word.end - word.start,
        text: word.word,
        chordId: undefined, // Акорд не назначаем
        patternId,
        color: undefined,
        backgroundColor: pattern.color,
      };
      result.push(newSegment);
    });
  } else {
    // Обрабатываем существующие сегменты
    rangeSegments.forEach(segment => {
      const segmentEnd = segment.startIndex + segment.length;
      
      // Определяем, какая часть сегмента попадает в диапазон
      const overlapStart = Math.max(segment.startIndex, patternStart);
      const overlapEnd = Math.min(segmentEnd, patternEnd);
      
      // Разбиваем на части
      const parts: Array<{
        start: number;
        end: number;
        hasPattern: boolean;
      }> = [];
      
      // Часть до диапазона паттерна
      if (segment.startIndex < patternStart) {
        parts.push({
          start: segment.startIndex,
          end: patternStart,
          hasPattern: false
        });
      }
      
      // Часть в диапазоне паттерна
      if (overlapStart < overlapEnd) {
        parts.push({
          start: overlapStart,
          end: overlapEnd,
          hasPattern: true
        });
      }
      
      // Часть после диапазона паттерна
      if (segmentEnd > patternEnd) {
        parts.push({
          start: patternEnd,
          end: segmentEnd,
          hasPattern: false
        });
      }
      
      // Создаем сегменты для каждой части
      parts.forEach(part => {
        const partText = text.substring(part.start, part.end);
        if (!partText.trim() && partText !== '') return;
        
        const newSegment: UISegment = {
          id: generateSegmentId(
            part.start,
            part.end - part.start,
            segment.chordId,
            part.hasPattern ? patternId : segment.patternId
          ),
          order: result.length,
          startIndex: part.start,
          length: part.end - part.start,
          text: partText,
          chordId: segment.chordId, // Сохраняем аккорд
          patternId: part.hasPattern ? patternId : segment.patternId,
          color: segment.color,
          backgroundColor: part.hasPattern ? pattern.color : segment.backgroundColor,
        };
        result.push(newSegment);
      });
    });
  }
  
  // Объединяем смежные сегменты с одинаковыми свойствами
  return mergeSegments(result.sort((a, b) => a.startIndex - b.startIndex));
}

// Старые функции для совместимости
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
  // Для совместимости - используем выделение
  if (tool === 'chord') {
    // Назначаем аккорд каждому слову в выделении
    const words = splitTextIntoWords(text.substring(start, end));
    let result = segments;
    
    words.forEach(word => {
      result = assignChordToWord(
        result,
        text,
        word.start + start,
        selectedId,
        chords,
        patterns
      );
    });
    
    return result;
  } else {
    // Назначаем паттерн на весь диапазон
    return assignPatternToText(
      segments,
      text,
      start,
      end,
      selectedId,
      chords,
      patterns
    );
  }
}

export function prepareSegmentsForBackend(
  segments: UISegment[],
  text: string
): any[] {
  const sorted = [...segments].sort((a, b) => a.startIndex - b.startIndex);
  const result: any[] = [];

  sorted.forEach((segment, index) => {
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
        chordId: segment.chordId || undefined,
        patternId: segment.patternId || undefined,
        color: segment.color || undefined,
        backgroundColor: segment.backgroundColor || undefined,
      },
      positionIndex: index,
    });
  });

  return result;
}

export function prepareCommentsForBackend(
  comments: UIComment[],
  segments: UISegment[]
): Record<number, any[]> {
  const result: Record<number, any[]> = {};

  comments.forEach((comment) => {
    const segmentIndex = segments.findIndex((s) => s.id === comment.segmentId);
    if (segmentIndex !== -1) {
      if (!result[segmentIndex]) {
        result[segmentIndex] = [];
      }
      result[segmentIndex].push({ text: comment.text });
    }
  });

  return result;
}

// Хелперы для работы с цветами
export function isColorValidForType(
  color: string,
  type: "chord" | "pattern"
): boolean {
  const validColors = type === "chord" ? CHORD_COLORS : PATTERN_COLORS;
  return validColors.includes(color);
}

export function getNextAvailableColorForType(
  usedColors: string[],
  type: "chord" | "pattern"
): string {
  const availableColors = type === "chord" ? CHORD_COLORS : PATTERN_COLORS;

  // Ищем первый доступный цвет
  for (const color of availableColors) {
    if (!usedColors.includes(color)) {
      return color;
    }
  }

  // Если все цвета заняты, возвращаем первый
  return availableColors[0];
}

export function updateSegmentsForTextChange(
  oldText: string,
  newText: string,
  oldSegments: UISegment[]
): UISegment[] {
  if (oldText === newText) return oldSegments;

  // Простая реализация - очищаем сегменты, которые выходят за границы
  return oldSegments
    .filter((segment) => segment.startIndex < newText.length)
    .map((segment) => {
      const newLength = Math.min(
        segment.length,
        newText.length - segment.startIndex
      );

      return {
        ...segment,
        length: newLength,
        text: newText.substring(
          segment.startIndex,
          segment.startIndex + newLength
        ),
        id: generateSegmentId(
          segment.startIndex,
          newLength,
          segment.chordId,
          segment.patternId
        ),
      };
    })
    .filter((segment) => segment.length > 0 || segment.text === "[SPACE]");
}

// Старые функции для совместимости
export function mergeAdjacentSegments(segments: UISegment[]): UISegment[] {
  return mergeSegments(segments);
}