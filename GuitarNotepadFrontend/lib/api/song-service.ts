import { CreateSongDto, CreateSongWithSegmentsDto, PaginatedDto, SongDto, SongSearchFilters, SongSearchResultDto, SongStatisticsDto, SongStructureDto, ToggleSongVisibilityDto, UpdateSongDto } from "@/types/songs";
import { apiClient } from "./client";

export class SongsService {
  private static readonly DEFAULT_PAGE_SIZE = 20;
  private static readonly DEFAULT_PATH = "Songs";

  static async searchSongs(filters: SongSearchFilters): Promise<SongSearchResultDto> {
    const params = new URLSearchParams();

    if (filters.searchTerm) params.append("searchTerm", filters.searchTerm);
    if (filters.ownerId) params.append("ownerId", filters.ownerId);
    if (filters.isPublic !== undefined && filters.isPublic !== null) 
      params.append("isPublic", filters.isPublic.toString());
    if (filters.chordId) params.append("chordId", filters.chordId);
    if (filters.patternId) params.append("patternId", filters.patternId);
    if (filters.key) params.append("key", filters.key);
    if (filters.difficulty) params.append("difficulty", filters.difficulty);
    if (filters.parentSongId) params.append("parentSongId", filters.parentSongId);
    if (filters.minRating !== undefined && filters.minRating !== null) 
      params.append("minRating", filters.minRating.toString());
    if (filters.maxRating !== undefined && filters.maxRating !== null) 
      params.append("maxRating", filters.maxRating.toString());
    if (filters.createdFrom) params.append("createdFrom", filters.createdFrom.toISOString());
    if (filters.createdTo) params.append("createdTo", filters.createdTo.toISOString());
    
    params.append("sortBy", filters.sortBy || "createdAt");
    params.append("sortOrder", filters.sortOrder || "desc");
    params.append("page", (filters.page || 1).toString());
    params.append("pageSize", (filters.pageSize || this.DEFAULT_PAGE_SIZE).toString());

    return await apiClient.get<SongSearchResultDto>(
      `/${this.DEFAULT_PATH}?${params.toString()}`
    );
  }

  static async getSongById(
    id: string,
    includeStructure: boolean = false,
    includeChords: boolean = false,
    includePatterns: boolean = false,
    includeReviews: boolean = false,
    includeComments: boolean = false
  ): Promise<SongDto> {
    const params = new URLSearchParams();
    if (includeStructure) params.append("includeStructure", "true");
    if (includeChords) params.append("includeChords", "true");
    if (includePatterns) params.append("includePatterns", "true");
    if (includeReviews) params.append("includeReviews", "true");
    if (includeComments) params.append("includeComments", "true");

    const queryString = params.toString();
    const url = `/${this.DEFAULT_PATH}/${id}${queryString ? `?${queryString}` : ''}`;

    return await apiClient.get<SongDto>(url);
  }

  static async getUserSongs(
    userId: string,
    includePrivate: boolean = false,
    page: number = 1,
    pageSize: number = this.DEFAULT_PAGE_SIZE
  ): Promise<PaginatedDto<SongDto>> {
    const params = new URLSearchParams();
    if (includePrivate) params.append("includePrivate", "true");
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedDto<SongDto>>(
      `/${this.DEFAULT_PATH}/user/${userId}?${params.toString()}`
    );
  }

  static async getMySongs(
    includePrivate: boolean = true,
    page: number = 1,
    pageSize: number = this.DEFAULT_PAGE_SIZE
  ): Promise<PaginatedDto<SongDto>> {
    const params = new URLSearchParams();
    if (includePrivate) params.append("includePrivate", "true");
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedDto<SongDto>>(
      `/${this.DEFAULT_PATH}/my-songs?${params.toString()}`
    );
  }

  static async getRelatedSongs(
    songId: string,
    limit: number = 10
  ): Promise<SongDto[]> {
    return await apiClient.get<SongDto[]>(
      `/${this.DEFAULT_PATH}/${songId}/related?limit=${limit}`
    );
  }

  static async getSongStructure(songId: string): Promise<SongStructureDto> {
    return await apiClient.get<SongStructureDto>(
      `/${this.DEFAULT_PATH}/${songId}/structure`
    );
  }

  static async getSongStatistics(songId: string): Promise<SongStatisticsDto> {
    return await apiClient.get<SongStatisticsDto>(
      `/${this.DEFAULT_PATH}/${songId}/statistics`
    );
  }

  static async createSong(data: CreateSongDto): Promise<SongDto> {
    return await apiClient.post<CreateSongDto, SongDto>(
      `/${this.DEFAULT_PATH}`,
      data
    );
  }

  static async createSongWithSegments(data: CreateSongWithSegmentsDto): Promise<SongDto> {
    return await apiClient.post<CreateSongWithSegmentsDto, SongDto>(
      `/${this.DEFAULT_PATH}/with-segments`,
      data
    );
  }

  static async updateSong(id: string, data: UpdateSongDto): Promise<SongDto> {
    return await apiClient.put<UpdateSongDto, SongDto>(
      `/${this.DEFAULT_PATH}/${id}`,
      data
    );
  }

  static async deleteSong(id: string): Promise<void> {
    await apiClient.delete<void>(`/${this.DEFAULT_PATH}/${id}`);
  }

  static async copySong(songId: string): Promise<SongDto> {
    return await apiClient.post<void, SongDto>(
      `/${this.DEFAULT_PATH}/${songId}/copy`,
      undefined
    );
  }

  static async toggleSongVisibility(
    songId: string,
    isPublic: boolean
  ): Promise<SongDto> {
    return await apiClient.patch<ToggleSongVisibilityDto, SongDto>(
      `/${this.DEFAULT_PATH}/${songId}/visibility`,
      { isPublic }
    );
  }
}