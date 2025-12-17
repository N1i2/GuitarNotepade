import { CreateSongReviewDto, PaginatedSongReviews, ReviewStats, SongReview, UpdateSongReviewDto } from "@/types/song-reviews";
import { apiClient } from "./client";

export class SongReviewsService {
  private static readonly DEFAULT_PAGE_SIZE = 20;
  private static readonly DEFAULT_PATH = "songreviews";

  static async getSongReviews(
    songId: string,
    page = 1,
    pageSize = 20,
    sortBy = "createdAt",
    sortOrder = "desc"
  ): Promise<PaginatedSongReviews> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    params.append("sortBy", sortBy);
    params.append("sortOrder", sortOrder);

    return await apiClient.get<PaginatedSongReviews>(
      `/${this.DEFAULT_PATH}/song/${songId}?${params.toString()}`
    );
  }

  static async getUserReviews(
    userId: string,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedSongReviews> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedSongReviews>(
      `/${this.DEFAULT_PATH}/user/${userId}?${params.toString()}`
    );
  }

  static async getMyReviews(
    page = 1,
    pageSize = 20
  ): Promise<PaginatedSongReviews> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedSongReviews>(
      `/${this.DEFAULT_PATH}/my-reviews?${params.toString()}`
    );
  }

  static async getReviewById(id: string): Promise<SongReview> {
    return await apiClient.get<SongReview>(`/${this.DEFAULT_PATH}/${id}`);
  }

  static async createReview(
    songId: string,
    data: CreateSongReviewDto
  ): Promise<SongReview> {
    return await apiClient.post<CreateSongReviewDto, SongReview>(
      `/${this.DEFAULT_PATH}/song/${songId}`,
      data
    );
  }

  static async updateReview(
    id: string,
    data: UpdateSongReviewDto
  ): Promise<SongReview> {
    return await apiClient.put<UpdateSongReviewDto, SongReview>(
      `/${this.DEFAULT_PATH}/${id}`,
      data
    );
  }

  static async deleteReview(id: string): Promise<void> {
    await apiClient.delete<void>(`/${this.DEFAULT_PATH}/${id}`);
  }

  static async likeReview(id: string): Promise<void> {
    await apiClient.post<void, void>(`/${this.DEFAULT_PATH}/${id}/like`, undefined);
  }

  static async dislikeReview(id: string): Promise<void> {
    await apiClient.post<void, void>(`/${this.DEFAULT_PATH}/${id}/dislike`, undefined);
  }

  static async removeReaction(id: string): Promise<void> {
    await apiClient.delete<void>(`/${this.DEFAULT_PATH}/${id}/reaction`);
  }

  static async getMyReviewForSong(songId: string): Promise<SongReview> {
    return await apiClient.get<SongReview>(
      `/${this.DEFAULT_PATH}/song/${songId}/my-review`
    );
  }

  static async getSongReviewStats(songId: string): Promise<ReviewStats> {
    return await apiClient.get<ReviewStats>(
      `/${this.DEFAULT_PATH}/stats/song/${songId}`
    );
  }
}