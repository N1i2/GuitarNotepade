import { CreateReviewLikeDto, CreateSongReviewDto, ReviewLikeDto, SongReviewDto, UpdateSongReviewDto } from "@/types/reviews";
import { apiClient } from "./client";
import { PaginatedDto } from "@/types/songs";

export class ReviewsService {
  private static readonly DEFAULT_PAGE_SIZE = 20;
  private static readonly DEFAULT_PATH = "Reviews";

  static async createReview(
    songId: string,
    data: CreateSongReviewDto
  ): Promise<SongReviewDto> {
    return await apiClient.post<CreateSongReviewDto, SongReviewDto>(
      `/${this.DEFAULT_PATH}/songs/${songId}`,
      data
    );
  }

  static async getReview(id: string): Promise<SongReviewDto> {
    return await apiClient.get<SongReviewDto>(`/${this.DEFAULT_PATH}/${id}`);
  }

  static async getSongReviews(
    songId: string,
    page: number = 1,
    pageSize: number = this.DEFAULT_PAGE_SIZE,
    sortBy: string = "createdAt",
    descending: boolean = false
  ): Promise<PaginatedDto<SongReviewDto>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    params.append("sortBy", sortBy);
    params.append("descending", descending.toString());

    return await apiClient.get<PaginatedDto<SongReviewDto>>(
      `/${this.DEFAULT_PATH}/songs/${songId}?${params.toString()}`
    );
  }

  static async updateReview(
    id: string,
    data: UpdateSongReviewDto
  ): Promise<SongReviewDto> {
    return await apiClient.put<UpdateSongReviewDto, SongReviewDto>(
      `/${this.DEFAULT_PATH}/${id}`,
      data
    );
  }

  static async deleteReview(id: string): Promise<void> {
    await apiClient.delete<void>(`/${this.DEFAULT_PATH}/${id}`);
  }

  static async createLike(data: CreateReviewLikeDto): Promise<ReviewLikeDto> {
    return await apiClient.post<CreateReviewLikeDto, ReviewLikeDto>(
      `/${this.DEFAULT_PATH}/likes`,
      data
    );
  }

  static async getLike(id: string): Promise<ReviewLikeDto> {
    return await apiClient.get<ReviewLikeDto>(`/${this.DEFAULT_PATH}/likes/${id}`);
  }

  static async toggleLike(reviewId: string): Promise<ReviewLikeDto> {
    const dto: CreateReviewLikeDto = {
      reviewId,
      isLike: true 
    };
    
    return await apiClient.post<CreateReviewLikeDto, ReviewLikeDto>(
      `/${this.DEFAULT_PATH}/likes/toggle`,
      dto
    );
  }

  static async deleteLike(id: string): Promise<void> {
    await apiClient.delete<void>(`/${this.DEFAULT_PATH}/likes/${id}`);
  }
}