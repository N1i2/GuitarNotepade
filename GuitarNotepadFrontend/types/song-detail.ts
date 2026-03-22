import {
  SegmentDataWithPositionDto,
  SongChordDto,
  SongCommentDto,
  SongPatternDto,
  SongReviewDto,
} from "./songs";

export interface SongDetailDto {
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
