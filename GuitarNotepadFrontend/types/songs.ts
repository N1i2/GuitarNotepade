import { z } from "zod";
import { AudioInputData } from "./audio";

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
  customAudioUrl?: string;
  customAudioType?: string;
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
  id?: string;
  title: string;
  genre?: string;
  theme?: string;
  artist?: string;
  description?: string;
  customAudioUrl?: string;
  customAudioType?: string;
  isPublic: boolean;
  parentSongId?: string;
  segments: SongSegmentPositionDto[];
  segmentComments?: Record<number, SegmentCommentDto[]>;
  chordIds?: string[];
  patternIds?: string[];
}

export interface UpdateSongWithSegmentsDto {
  id: string;
  title?: string | null;
  artist?: string | null;
  description?: string | null;
  genre?: string | null;
  theme?: string | null;
  customAudioUrl?: string | null;
  customAudioType?: string | null;
  isDeleteAudio?: boolean;
  isPublic?: boolean | null;
  parentSongId?: string | null;
  audioBase64?: string | null;
  audioType?: string | null;

  oldSegments?: string[] | null;
  oldComments?: Record<number, string[]> | null;
  segments?: any[] | null;
  segmentComments?: Record<number, any[]> | null;
}

export interface MinimalUpdateSongDto {
  id: string;
  title?: string;
  artist?: string;
  genre?: string;
  theme?: string;
  description?: string;
  isPublic?: boolean;
  key?: string;
  difficulty?: string;
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
  audioInput?: AudioInputData | null;
}

export interface BrushState {
  type: "chord" | "pattern" | null;
  id: string | null;
}

export interface SongEditChanges {
  metadata: {
    title?: boolean;
    artist?: boolean;
    genre?: boolean;
    theme?: boolean;
    description?: boolean;
    isPublic?: boolean;
    customAudioUrl?: boolean;
    customAudioType?: boolean;
    parentSongId?: boolean;
  };
  segments: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
  comments: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
}

export const initialEditChanges: SongEditChanges = {
  metadata: {},
  segments: { added: [], modified: [], deleted: [] },
  comments: { added: [], modified: [], deleted: [] },
};

export interface SongEditState extends SongCreationState {
  originalState?: {
    title?: string;
    artist?: string;
    genre?: string;
    theme?: string;
    description?: string;
    isPublic?: boolean;
    customAudioUrl?: string;
    customAudioType?: string;
    parentSongId?: string | null;
    segments?: UISegment[];
    comments?: UIComment[];
  };
  changes: SongEditChanges;
}

export const initialEditState: SongEditState = {
  title: "",
  artist: "",
  genre: "",
  theme: "",
  description: "",
  isPublic: false,
  text: "",
  selectedChords: [],
  selectedPatterns: [],
  segments: [],
  comments: [],
  currentTool: "select",
  selectedChordId: undefined,
  selectedPatternId: undefined,

  originalState: undefined,
  changes: initialEditChanges,
};

export interface TableSegment {
  id: string;
  order: number;
  type: SegmentType;
  text: string;
  chordId?: string;
  patternId?: string;
  repeatGroup?: string;
  color?: string;
  backgroundColor?: string;
  comment?: string;
}

export interface TableEditorState {
  segments: TableSegment[];
  repeatGroups: string[];
}

export type SongEditAction =
  | { type: "SET_EDIT_STATE"; payload: SongCreationState }
  | { type: "UPDATE_EDIT_TITLE"; payload: string }
  | { type: "UPDATE_EDIT_ARTIST"; payload: string }
  | { type: "UPDATE_EDIT_GENRE"; payload: string }
  | { type: "UPDATE_EDIT_THEME"; payload: string }
  | { type: "UPDATE_EDIT_DESCRIPTION"; payload: string }
  | { type: "UPDATE_EDIT_PUBLIC"; payload: boolean }
  | { type: "UPDATE_EDIT_SEGMENT"; payload: UISegment }
  | { type: "ADD_EDIT_SEGMENT"; payload: UISegment }
  | { type: "REMOVE_EDIT_SEGMENT"; payload: string }
  | { type: "UPDATE_EDIT_COMMENT"; payload: UIComment }
  | { type: "ADD_EDIT_COMMENT"; payload: UIComment }
  | { type: "REMOVE_EDIT_COMMENT"; payload: string }
  | { type: "CLEAR_EDIT_CHANGES" }
  | { type: "RESET_EDIT_STATE" };

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

export interface SongGridItem {
  id: string;
  title: string;
  artist?: string;
  isPublic: boolean;
  ownerId: string;
  ownerNickname: string;
  chordCount: number;
  patternCount: number;
  createdAt: string;
  updatedAt?: string;
  canEdit: boolean;
  isForked: boolean;
  averageBeautifulRating?: number;
  averageDifficultyRating?: number;
  reviewCount: number;
  commentCount: number;
  genre?: string;
  theme?: string;
  key?: string;
  difficulty?: string;
  hasAudio?: boolean;
  customAudioType?: string;
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
  comments: SongCommentDto[],
): UIComment[] {
  return comments.map(convertSongCommentToUI);
}
