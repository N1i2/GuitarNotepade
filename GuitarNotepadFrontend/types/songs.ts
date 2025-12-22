import { z } from "zod";

export enum SegmentType {
  Text = 0,
  Playback = 1,
  Space = 2,
  Section = 3,
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

  chord?: SongChordDto;
  pattern?: SongPatternDto;
  labels?: SegmentLabelDto[];
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
  genre: string;
  theme: string;
  ownerId: string;
  ownerName?: string;
  isPublic: boolean;
  parentSongId?: string;
  parentSongTitle?: string;
  customAudioUrl?: string;
  customAudioType?: string;
  createdAt: string;
  updatedAt?: string;
  reviewCount: number;
  averageBeautifulRating?: number;
  averageDifficultyRating?: number;
  chords: SongChordDto[];
  patterns: SongPatternDto[];
  commentsCount: number;
  segmentsCount: number;

  key?: string;
  difficulty?: string;
  fullText?: string;
  likeCount?: number;
  viewCount?: number;
  copyCount?: number;
  chordIds?: string[];
  patternIds?: string[];
  structure?: SongStructureDto;
}

export interface FullSongDto {
  id: string;
  title: string;
  artist?: string;
  genre: string;
  theme: string;
  description?: string;
  isPublic: boolean;
  ownerId: string;
  ownerName?: string;
  customAudioUrl?: string;
  customAudioType?: string;
  parentSongId?: string;
  parentSongTitle?: string;
  createdAt: string;
  updatedAt?: string;
  reviewCount: number;
  averageBeautifulRating?: number;
  averageDifficultyRating?: number;
  chords: SongChordDto[];
  patterns: SongPatternDto[];
  comments: SongCommentDto[];
  segments: SegmentDataWithPositionDto[];
  reviews: SongReviewDto[];
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

export interface BrushState {
  type: "chord" | "pattern" | null;
  id: string | null;
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

export interface SongChordDto {
  id: string;
  name: string;
  fingering: string;
  description?: string;
  color?: string;
}

export interface SongPatternDto {
  id: string;
  name: string;
  pattern: string;
  isFingerStyle: boolean;
  description?: string;
  color?: string;
}

export interface SongCommentDto {
  id: string;
  songId: string;
  segmentId?: string;
  text: string;
  createdAt: string;
  userId?: string;
  userName?: string;
}

export interface SegmentDataWithPositionDto {
  segmentData: SongSegmentDataDto;
  positionIndex: number;
  repeatGroup?: string;
}

export interface SongReviewDto {
  id: string;
  songId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  reviewText: string;
  beautifulLevel?: number;
  difficultyLevel?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SegmentLabelDto {
  id: string;
  name: string;
  color?: string;
}

export interface SongLabelDto {
  id: string;
  name: string;
  color?: string;
}

export interface SongSearchFilters {
  userId: string;
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
  sortOrder?: "asc" | "desc";
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

export interface SongChordStatsDto {
  chordId: string;
  chordName: string;
  color: string;
}

export interface SongPatternStatsDto {
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

export type ToolMode = "select" | "chord" | "pattern" | "comment";

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
  sortOrder?: "asc" | "desc";
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
  type: z.enum(["0", "1", "2", "3"]),
  lyric: z.string().optional(),
  chordId: z.string().optional(),
  patternId: z.string().optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
});

export interface SongViewData {
  song: FullSongDto;
  reviews: SongReviewDto[];
  currentUserReview: SongReviewDto | null;
  stats: {
    totalSegments: number;
    chordsCount: number;
    patternsCount: number;
    reviewsCount: number;
    averageRating: number;
  };
}

export interface ReviewStats {
  total: number;
  averageBeauty: number;
  averageDifficulty: number;
  totalLikes: number;
  totalDislikes: number;
}

export interface SegmentGroup {
  id: string;
  text: string;
  chord?: {
    id: string;
    name: string;
    color?: string;
  };
  pattern?: {
    id: string;
    name: string;
    color?: string;
    isFingerStyle?: boolean;
  };
  positions: number[];
  count: number;
  commentCount: number;
}

export function convertSongCommentToUI(comment: SongCommentDto): UIComment {
  return {
    id: comment.id,
    segmentId: comment.segmentId || "",
    authorId: comment.userId || "unknown",
    authorName: comment.userName || "Anonymous",
    text: comment.text,
    createdAt: comment.createdAt,
  };
}

export function convertSongCommentsToUI(
  comments: SongCommentDto[]
): UIComment[] {
  return comments.map(convertSongCommentToUI);
}
