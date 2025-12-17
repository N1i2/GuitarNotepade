import { CreateSongDto, PaginatedSongs, Song, SongFilters, UpdateSongDto } from "@/types/songs";
import { apiClient } from "./client";

export class SongsService {
  private static readonly DEFAULT_PAGE_SIZE = 20;
  private static readonly DEFAULT_PATH = "songs";

  static async getAllSongs(filters?: SongFilters): Promise<PaginatedSongs> {
    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.title) params.append("title", filters.title);
    if (filters?.artist) params.append("artist", filters.artist);
    if (filters?.isPublic !== undefined)
      params.append("isPublic", filters.isPublic.toString());
    if (filters?.chordId) params.append("chordId", filters.chordId);
    if (filters?.patternId) params.append("patternId", filters.patternId);
    if (filters?.mySongsOnly) params.append("mySongsOnly", "true");

    params.append("page", (filters?.page || 1).toString());
    params.append(
      "pageSize",
      (filters?.pageSize || this.DEFAULT_PAGE_SIZE).toString()
    );
    params.append("sortBy", filters?.sortBy || "createdAt");
    params.append("sortOrder", filters?.sortOrder || "desc");

    return await apiClient.get<PaginatedSongs>(
      `/${this.DEFAULT_PATH}?${params.toString()}`
    );
  }

  static async getSongById(id: string): Promise<Song> {
    return await apiClient.get<Song>(`/${this.DEFAULT_PATH}/${id}`);
  }

  static async getUserSongs(
    userId: string,
    page = 1,
    pageSize = 20,
    sortBy = "createdAt",
    sortOrder = "desc"
  ): Promise<PaginatedSongs> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    params.append("sortBy", sortBy);
    params.append("sortOrder", sortOrder);

    return await apiClient.get<PaginatedSongs>(
      `/${this.DEFAULT_PATH}/user/${userId}?${params.toString()}`
    );
  }

  static async createSong(data: CreateSongDto): Promise<Song> {
    return await apiClient.post<CreateSongDto, Song>(
      `/${this.DEFAULT_PATH}`,
      data
    );
  }

  static async updateSong(id: string, data: UpdateSongDto): Promise<Song> {
    return await apiClient.put<UpdateSongDto, Song>(
      `/${this.DEFAULT_PATH}/${id}`,
      data
    );
  }

  static async deleteSong(id: string): Promise<void> {
    await apiClient.delete<void>(`/${this.DEFAULT_PATH}/${id}`);
  }

  static async toggleSongVisibility(id: string): Promise<Song> {
    return await apiClient.patch<void, Song>(
      `/${this.DEFAULT_PATH}/${id}/toggle-visibility`,
      undefined
    );
  }

  static async forkSong(id: string): Promise<Song> {
    return await apiClient.get<Song>(`/${this.DEFAULT_PATH}/${id}/fork`);
  }

  static async searchSongs(
    query: string,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedSongs> {
    const params = new URLSearchParams();
    params.append("q", query);
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedSongs>(
      `/${this.DEFAULT_PATH}/search?${params.toString()}`
    );
  }

  static async getSongChords(id: string): Promise<string[]> {
    return await apiClient.get<string[]>(`/${this.DEFAULT_PATH}/${id}/chords`);
  }

  static async getSongPatterns(id: string): Promise<string[]> {
    return await apiClient.get<string[]>(`/${this.DEFAULT_PATH}/${id}/patterns`);
  }
}