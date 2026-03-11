import { apiClient } from "./client";
import {
  SongReviewDto,
  CreateSongReviewDto,
  UpdateSongReviewDto,
} from "@/types/reviews";
import { PaginatedDto } from "@/types/songs";

export class ReviewsService {
  private static readonly BASE_PATH = "/reviews";

  // Создание отзыва
  static async createReview(
    songId: string,
    data: CreateSongReviewDto
  ): Promise<SongReviewDto> {
    return await apiClient.post<CreateSongReviewDto, SongReviewDto>(
      `${this.BASE_PATH}/songs/${songId}`,
      data
    );
  }

  // Получение отзыва по ID
  static async getReview(id: string): Promise<SongReviewDto> {
    return await apiClient.get<SongReviewDto>(`${this.BASE_PATH}/${id}`);
  }

  // Отзывы на песню
  static async getSongReviews(
    songId: string,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = "createdAt",
    descending: boolean = false
  ): Promise<PaginatedDto<SongReviewDto>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    params.append("sortBy", sortBy);
    params.append("descending", descending.toString());

    return await apiClient.get<PaginatedDto<SongReviewDto>>(
      `${this.BASE_PATH}/songs/${songId}?${params.toString()}`
    );
  }

  // Обновление отзыва
  static async updateReview(
    id: string,
    data: UpdateSongReviewDto
  ): Promise<SongReviewDto> {
    return await apiClient.put<UpdateSongReviewDto, SongReviewDto>(
      `${this.BASE_PATH}/${id}`,
      data
    );
  }

  // Удаление отзыва
  static async deleteReview(id: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_PATH}/${id}`);
  }
}