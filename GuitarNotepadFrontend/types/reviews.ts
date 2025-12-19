export interface SongReviewDto {
  id: string;
  songId: string;
  userId: string;
  userName: string;
  reviewText: string;
  beautifulLevel: number;
  difficultyLevel: number;
  likeCount: number;
  dislikeCount: number;
  userLikeStatus?: "like" | "dislike";
  createdAt: Date;
  updatedAt: Date;
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

export interface ReviewLikeDto {
  id: string;
  reviewId: string;
  userId: string;
  isLike: boolean;
  createdAt: Date;
}

export interface CreateReviewLikeDto {
  reviewId: string;
  isLike: boolean;
}