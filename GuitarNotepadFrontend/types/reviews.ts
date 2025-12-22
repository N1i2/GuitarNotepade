import { ReviewsService } from "@/lib/api/review-service";

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

export interface CreateSongReviewDto {
  reviewText: string;
  beautifulLevel?: number;
  difficultyLevel?: number;
}

export interface UpdateSongReviewDto {
  reviewText?: string;
  beautifulLevel?: number;
  difficultyLevel?: number;
}

export async function submitReview(
  songId: string,
  reviewData: {
    reviewText: string;
    beautifulLevel?: number;
    difficultyLevel?: number;
  }
) {
  try {
    return await ReviewsService.createReview(songId, reviewData);
  } catch (error) {
    console.error("Failed to submit review:", error);
    throw error;
  }
}

export async function updateReview(
  reviewId: string,
  reviewData: {
    reviewText?: string;
    beautifulLevel?: number;
    difficultyLevel?: number;
  }
) {
  try {
    return await ReviewsService.updateReview(reviewId, reviewData);
  } catch (error) {
    console.error("Failed to update review:", error);
    throw error;
  }
}

export async function deleteReview(reviewId: string) {
  try {
    await ReviewsService.deleteReview(reviewId);
  } catch (error) {
    console.error("Failed to delete review:", error);
    throw error;
  }
}
