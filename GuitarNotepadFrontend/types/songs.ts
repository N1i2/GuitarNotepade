// НОВАЯ СТРУКТУРА ТИПОВ ДЛЯ ПЕСЕН/СЕГМЕНТОВ/АККОРДОВ/ПАТТЕРНОВ/КОММЕНТАРИЕВ

// --- SONGS ---
export interface SongDto {
  id: string;
  title: string;
  artist?: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  isPublic: boolean;
  parentSongId?: string;
  key?: string;
  difficulty?: string; // текстовая сложность или как строка, либо (1-5) если нормализуется
  // Счётчики
  rating?: number;
  reviewCount: number;
  likeCount: number;
  viewCount: number;
  copyCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Новый формат структуры и связанные сущности
  chordIds: string[];
  patternIds: string[];
  structure: SongStructureDto;
  sections?: SongSectionDto[];
  averageBeautifulLevel?: number;
  averageDifficultyLevel?: number;
}

export interface SongSectionDto {
  title: string;
  startSegmentOrder?: number;
  endSegmentOrder?: number;
}

export interface SongStructureDto {
  id: string;
  segments: SongSegmentDto[];
}

export interface SongSegmentDto {
  id: string;
  order: number;
  type: 'text' | 'space' | 'section' | string;
  text: string; // lyrics/content
  chordId?: string;
  patternId?: string;
  color?: string;
  backgroundColor?: string;
  commentIds?: string[];
  hasComments?: boolean;
}

// --- CHORDS ---
export interface SongChordDto {
  chordId: string;
  chordName: string;
  color: string;
}

// --- PATTERNS ---
export interface SongPatternDto {
  patternId: string;
  patternName: string;
  color: string;
  isFingerStyle?: boolean;
}

// --- КОММЕНТАРИИ К СЕГМЕНТАМ ---
export interface SegmentCommentDto {
  id: string;
  songId: string;
  segmentId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Date | string;
}

// --- UI типы для редактора ---
export interface UISegment {
  id: string; // обычно = SongSegmentDto.id
  order: number;
  startIndex: number; // where in the text this segment starts
  length: number; // how many chars this segment covers
  text: string; // что покрывает (lyrics)
  chordId?: string;
  patternId?: string;
  color?: string;
  backgroundColor?: string;
  commentIds?: string[];
}

export interface UIComment {
  id: string;
  segmentId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

// --- СОСТОЯНИЕ редактора создания/правки песни ---
export interface SongCreationState {
  title: string;
  isPublic: boolean;
  text: string;
  selectedChords: SongChordDto[];
  selectedPatterns: SongPatternDto[];
  segments: UISegment[];
  comments: UIComment[];
  currentTool: ToolMode;
  selectedChordId?: string;
  selectedPatternId?: string;
}

export type ToolMode = 'select' | 'chord' | 'pattern' | 'comment';

// Запросы и фильтры:
export interface SongSearchFilters {
  searchTerm?: string;
  ownerId?: string;
  isPublic?: boolean;
  chordId?: string;
  patternId?: string;
  key?: string;
  difficulty?: string;
  parentSongId?: string;
  minBeautifulLevel?: number;
  maxBeautifulLevel?: number;
  minDifficultyLevel?: number;
  maxDifficultyLevel?: number;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface SongSearchResultDto {
  items: SongDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ...остальные типы (обновление, создание песни, дто, пагинации и т.д.) --- см. прежний код при необходимости интеграции...
