import {
  AlbumDto,
  AlbumSearchFilters,
  AlbumSearchResultDto,
  AlbumWithSongsDto,
  CreateAlbumDto,
  UpdateAlbumDto,
} from "@/types/albom";
import { apiClient } from "./client";

export class AlbumsService {
  private static readonly BASE_PATH = "/albums";

  static async searchAlbums(
    filters: AlbumSearchFilters,
  ): Promise<AlbumSearchResultDto> {
    const params = new URLSearchParams();

    if (filters.userId) params.append("userId", filters.userId);
    if (filters.searchTerm) params.append("searchTerm", filters.searchTerm);
    if (filters.ownerId) params.append("ownerId", filters.ownerId);
    if (filters.isPublic !== undefined)
      params.append("isPublic", filters.isPublic.toString());
    if (filters.genre) params.append("genre", filters.genre);
    if (filters.theme) params.append("theme", filters.theme);

    params.append("sortBy", filters.sortBy || "createdAt");
    params.append("sortOrder", filters.sortOrder || "desc");
    params.append("page", (filters.page || 1).toString());
    params.append("pageSize", (filters.pageSize || 20).toString());

    return await apiClient.get<AlbumSearchResultDto>(
      `${this.BASE_PATH}?${params.toString()}`,
    );
  }

  static async getAlbumById(id: string): Promise<AlbumDto> {
    return await apiClient.get<AlbumDto>(`${this.BASE_PATH}/${id}`);
  }

  static async getAlbumWithSongs(id: string): Promise<AlbumWithSongsDto> {
    return await apiClient.get<AlbumWithSongsDto>(
      `${this.BASE_PATH}/${id}/with-songs`,
    );
  }

  static async getUserAlbums(
    userId: string,
    includePrivate: boolean = false,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<AlbumSearchResultDto> {
    const params = new URLSearchParams();
    if (includePrivate) params.append("includePrivate", "true");
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<AlbumSearchResultDto>(
      `${this.BASE_PATH}/user/${userId}?${params.toString()}`,
    );
  }

  static async getMyAlbums(
    includePrivate: boolean = true,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<AlbumSearchResultDto> {
    const params = new URLSearchParams();
    if (includePrivate) params.append("includePrivate", "true");
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<AlbumSearchResultDto>(
      `${this.BASE_PATH}/my-albums?${params.toString()}`,
    );
  }

  static async createAlbum(data: CreateAlbumDto): Promise<AlbumDto> {
    return await apiClient.post<CreateAlbumDto, AlbumDto>(this.BASE_PATH, data);
  }

  static async updateAlbum(
    id: string,
    data: UpdateAlbumDto,
  ): Promise<AlbumDto> {
    return await apiClient.put<UpdateAlbumDto, AlbumDto>(
      `${this.BASE_PATH}/${id}`,
      data,
    );
  }

  static async deleteAlbum(id: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_PATH}/${id}`);
  }

  static async addSongToAlbum(albumId: string, songId: string): Promise<void> {
    await apiClient.post<void, void>(
      `${this.BASE_PATH}/${albumId}/songs/${songId}`,
      undefined,
    );
  }

  static async removeSongFromAlbum(
    albumId: string,
    songId: string,
  ): Promise<void> {
    await apiClient.delete<void>(
      `${this.BASE_PATH}/${albumId}/songs/${songId}`,
    );
  }

  static async getFavoriteAlbum(): Promise<AlbumWithSongsDto> {
    return await apiClient.get<AlbumWithSongsDto>(`${this.BASE_PATH}/favorite`);
  }

  static async addSongToFavorite(songId: string): Promise<void> {
    await apiClient.post<void, void>(
      `${this.BASE_PATH}/favorite/${songId}`,
      undefined,
    );
  }

  static async removeSongFromFavorite(songId: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_PATH}/favorite/${songId}`);
  }

  static async isSongInFavorite(songId: string): Promise<boolean> {
    try {
      const favorite = await this.getFavoriteAlbum();
      return favorite.songs.some((song) => song.id === songId);
    } catch {
      return false;
    }
  }
}
