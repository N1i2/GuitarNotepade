import { z } from 'zod';

export enum SegmentType {
  Text = 0,
  Playback = 1,
  Space = 2,
  Section = 3
}

export interface CreateSongDto {
  title: string;
  genre?: string;
  theme?: string;
  artist?: string;
  description?: string;
  isPublic: boolean;
  parentSongId?: string;
  key?: string;
  difficulty?: string;
}

export interface SongSegmentDataDto {
  type: string; 
  lyric?: string;
  chordId?: string;
  patternId?: string;
  duration?: number;
  description?: string;
  color?: string;
  backgroundColor?: string;
}

export interface SongSegmentPositionDto {
  segmentData: SongSegmentDataDto;
  positionIndex: number;
  repeatGroup?: string;
}

export interface SegmentCommentDto {
  text: string;
}

export interface CreateSongWithSegmentsDto {
  title: string;
  genre?: string;
  theme?: string;
  artist?: string;
  description?: string;
  isPublic: boolean;
  parentSongId?: string;
  segments: SongSegmentPositionDto[];
  segmentComments?: Record<number, SegmentCommentDto[]>;
  chordIds?: string[];
  patternIds?: string[];
}

export interface UpdateSongDto {
  title?: string;
  artist?: string;
  genre?: string;
  theme?: string;
  description?: string;
  isPublic?: boolean;
  key?: string;
  difficulty?: string;
}

export interface ToggleSongVisibilityDto {
  isPublic: boolean;
}

export interface SongDto {
  id: string;
  title: string;
  artist?: string;
  description?: string;
  ownerId: string;
  ownerNickname: string;
  isPublic: boolean;
  parentSongId?: string;
  key?: string;
  difficulty?: string;
  genre?: string;
  theme?: string;
  fullText: string;
  averageBeautifulRating?: number;
  averageDifficultyRating?: number;
  reviewCount: number;
  likeCount: number;
  viewCount: number;
  copyCount: number;
  createdAt: string;
  updatedAt: string;
  chordIds: string[];
  patternIds: string[];
  structure: SongStructureDto;
  sections?: SongSectionDto[];
}

export interface SongSectionDto {
  title: string;
  startSegmentOrder?: number;
  endSegmentOrder?: number;
}

export interface SongStructureDto {
  id: string;
  segmentPositions: SongSegmentPositionDto[];
}

export interface SongSegmentDto {
  id: string;
  type: SegmentType;
  lyric?: string;
  chordId?: string;
  patternId?: string;
  chord?: ChordDto;
  pattern?: PatternDto;
  color?: string;
  backgroundColor?: string;
  description?: string;
  contentHash: string;
  positions: SongSegmentPositionDto[];
  comments: SongCommentDto[];
  segmentLabels: SegmentLabelDto[];
}

export interface SongSegmentPositionDto {
  id: string;
  songId: string;
  segmentId: string;
  positionIndex: number;
  repeatGroup?: string;
  segment: SongSegmentDto;
}

export interface ChordDto {
  id: string;
  name: string;
  fingering: string;
  description?: string;
  createdByUserId: string;
  createdAt: string;
}

export interface PatternDto {
  id: string;
  name: string;
  pattern: string;
  description?: string;
  isFingerStyle: boolean;
  createdByUserId: string;
  createdAt: string;
}

export interface SongCommentDto {
  id: string;
  songId: string;
  segmentId?: string;
  text: string;
  createdAt: string;
}

export interface SegmentLabelDto {
  id: string;
  labelId: string;
  segmentId: string;
  label: SongLabelDto;
}

export interface SongLabelDto {
  id: string;
  name: string;
  color?: string;
}

export interface SongSearchFilters {
  searchTerm?: string;
  ownerId?: string;
  isPublic?: boolean;
  chordId?: string;
  patternId?: string;
  key?: string;
  difficulty?: string;
  parentSongId?: string;
  minRating?: number;
  maxRating?: number;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface SongSearchResultDto {
  songs: SongDto[]; 
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiSongSearchResult {
  songs: SongDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedDto<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SongStatisticsDto {
  totalSegments: number;
  uniqueChords: number;
  uniquePatterns: number;
  totalComments: number;
  averageSegmentLength: number;
  sectionCount: number;
}

export interface SongChordDto {
  chordId: string;
  chordName: string;
  color: string;
}

export interface SongPatternDto {
  patternId: string;
  patternName: string;
  color: string;
  isFingerStyle?: boolean;
}

export interface UISegment {
  id: string;
  order: number;
  startIndex: number;
  length: number;
  text: string;
  chordId?: string;
  patternId?: string;
  color?: string;
  backgroundColor?: string;
  commentIds?: string[];
  comments?: UIComment[];
}

export interface UIComment {
  id: string;
  segmentId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface SongCreationState {
  title: string;
  artist?: string;
  genre?: string;
  theme?: string;
  description?: string;
  isPublic: boolean;
  key?: string;
  difficulty?: string;
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

export interface SongMetadataDto {
  comments: Array<{ text: string; segmentId: string }>;
  labels: string[];
  segmentLabels: Array<{ segmentId: string; labelId: string }>;
}

export interface SongSearchFilters {
  searchTerm?: string;
  ownerId?: string;
  isPublic?: boolean;
  chordId?: string;
  patternId?: string;
  key?: string;
  difficulty?: string;
  parentSongId?: string;
  minRating?: number;
  maxRating?: number;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const createSongSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  artist: z.string().max(200).optional(),
  genre: z.string().max(20).optional(),
  theme: z.string().max(20).optional(),
  description: z.string().max(2000).optional(),
  isPublic: z.boolean(),
  key: z.string().max(10).optional(),
  difficulty: z.string().max(50).optional(),
});

export const segmentSchema = z.object({
  type: z.enum(['0', '1', '2', '3']),
  lyric: z.string().optional(),
  chordId: z.string().optional(),
  patternId: z.string().optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
});