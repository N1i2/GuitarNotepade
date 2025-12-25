import {
  AlbumDto,
  AlbumSearchFilters,
  AlbumSearchResultDto,
  AlbumWithSongsDto,
  CreateAlbumDto,
} from "@/types/albom";
import { apiClient } from "./client";

export class AlbumService {
  private static readonly DEFAULT_PAGE_SIZE = 20;
  private static readonly BASE_PATH = "/Albums";

  static async searchAlbums(
    filters: AlbumSearchFilters
  ): Promise<AlbumSearchResultDto> {
    const params = new URLSearchParams();

    if (filters.userId) params.append("userId", filters.userId);
    if (filters.searchTerm) params.append("searchTerm", filters.searchTerm);
    if (filters.ownerId) params.append("ownerId", filters.ownerId);
    if (filters.isPublic !== undefined && filters.isPublic !== null)
      params.append("isPublic", filters.isPublic.toString());
    if (filters.genre) params.append("genre", filters.genre);
    if (filters.theme) params.append("theme", filters.theme);

    params.append("sortBy", filters.sortBy || "createdAt");
    params.append("sortOrder", filters.sortOrder || "desc");
    params.append("page", (filters.page || 1).toString());
    params.append(
      "pageSize",
      (filters.pageSize || this.DEFAULT_PAGE_SIZE).toString()
    );

    const result = await apiClient.get<AlbumSearchResultDto>(
      `${this.BASE_PATH}?${params.toString()}`
    );

    return result;
  }

  static async getAlbumById(id: string): Promise<AlbumDto> {
    return await apiClient.get<AlbumDto>(`${this.BASE_PATH}/${id}`);
  }

  static async createAlbum(data: CreateAlbumDto): Promise<AlbumDto> {
    return await apiClient.post<CreateAlbumDto, AlbumDto>(
      `${this.BASE_PATH}`,
      data
    );
  }

  static async getAlbumCoverBase64(fileName: string): Promise<string> {
    try {
      console.log(`Fetching album cover: ${fileName}`);

      if (fileName.startsWith("data:image/")) {
        console.log("Already base64, returning as is");
        return fileName;
      }

      if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
        console.log("Is URL, returning as is");
        return fileName;
      }

      const response = await apiClient.get<{ coverBase64: string }>(
        `${this.BASE_PATH}/cover/${encodeURIComponent(fileName)}`
      );

      if (!response.coverBase64) {
        console.warn(`No coverBase64 returned for ${fileName}`);
        throw new Error("Cover not found");
      }

      console.log(
        `Cover fetched successfully for ${fileName}, length: ${response.coverBase64.length}`
      );

      return response.coverBase64;
    } catch (error) {
      console.error(`Failed to fetch cover ${fileName}:`, error);

      const fallbackBase64 =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

      return fallbackBase64;
    }
  }

  //   static async updateAlbum(id: string, data: UpdateAlbumDto): Promise<AlbumDto> {
  //     return await apiClient.put<UpdateAlbumDto, AlbumDto>(
  //       `${this.BASE_PATH}/${id}`,
  //       data
  //     );
  //   }

  //   static async deleteAlbum(id: string): Promise<void> {
  //     await apiClient.delete<void>(`${this.BASE_PATH}/${id}`);
  //   }

  //   static async getAlbumSongs(albumId: string): Promise<any[]> {
  //     return await apiClient.get<any[]>(`${this.BASE_PATH}/${albumId}/songs`);
  //   }

  //   static async addSongToAlbum(albumId: string, songId: string): Promise<void> {
  //     await apiClient.post<void, void>(
  //       `${this.BASE_PATH}/${albumId}/songs/${songId}`,
  //       undefined
  //     );
  //   }

  //   static async removeSongFromAlbum(albumId: string, songId: string): Promise<void> {
  //     await apiClient.delete<void>(`${this.BASE_PATH}/${albumId}/songs/${songId}`);
  //   }

  static async getMyAlbums(
    includePrivate: boolean = true,
    page: number = 1,
    pageSize: number = this.DEFAULT_PAGE_SIZE
  ): Promise<AlbumSearchResultDto> {
    const params = new URLSearchParams();
    if (includePrivate) params.append("includePrivate", "true");
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<AlbumSearchResultDto>(
      `${this.BASE_PATH}/my-albums?${params.toString()}`
    );
  }

  static async getAlbumWithSongs(id: string): Promise<AlbumWithSongsDto> {
    return await apiClient.get<AlbumWithSongsDto>(
      `${this.BASE_PATH}/${id}/with-songs`
    );
  }

  static async addSongToAlbum(albumId: string, songId: string): Promise<void> {
    await apiClient.post<void, void>(
      `${this.BASE_PATH}/${albumId}/songs/${songId}`,
      undefined
    );
  }

  static async removeSongFromAlbum(
    albumId: string,
    songId: string
  ): Promise<void> {
    await apiClient.delete<void>(
      `${this.BASE_PATH}/${albumId}/songs/${songId}`
    );
  }
}
