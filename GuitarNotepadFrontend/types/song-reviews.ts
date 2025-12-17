export interface SongReview {
  id: string;
  songId: string;
  userId: string;
  userNickname?: string;
  reviewText: string;
  beautifulLevel: number;
  difficultyLevel: number;
  userLiked?: boolean;
  likesCount: number;
  dislikesCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSongReviewDto {
  reviewText: string;
  beautifulLevel: number;
  difficultyLevel: number;
}

export interface UpdateSongReviewDto {
  reviewText?: string;
  beautifulLevel?: number;
  difficultyLevel?: number;
}

export interface PaginatedSongReviews {
  items: SongReview[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ReviewStats {
  averageBeautifulLevel: number;
  averageDifficultyLevel: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number;
  };
}