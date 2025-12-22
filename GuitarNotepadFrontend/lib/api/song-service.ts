import {
  CreateSongDto,
  CreateSongWithSegmentsDto,
  SongDto,
  SongSearchFilters,
  SongSearchResultDto,
  UpdateSongDto,
  ToggleSongVisibilityDto,
  PaginatedDto,
  SongStructureDto,
  SongStatisticsDto,
  ApiSongSearchResult,
} from "@/types/songs";
import { apiClient } from "./client";
import { SongDetailDto } from "@/types/song-detail";

export class SongsService {
  private static readonly DEFAULT_PAGE_SIZE = 20;
  private static readonly BASE_PATH = "/Songs";

  static async searchSongs(
    filters: SongSearchFilters
  ): Promise<SongSearchResultDto> {
    const params = new URLSearchParams();

    params.append("userId", filters.userId);

    if (filters.searchTerm) params.append("searchTerm", filters.searchTerm);
    if (filters.ownerId) params.append("ownerId", filters.ownerId);
    if (filters.isPublic !== undefined && filters.isPublic !== null)
      params.append("isPublic", filters.isPublic.toString());
    if (filters.chordId) params.append("chordId", filters.chordId);
    if (filters.patternId) params.append("patternId", filters.patternId);
    if (filters.key) params.append("key", filters.key);
    if (filters.difficulty) params.append("difficulty", filters.difficulty);
    if (filters.parentSongId)
      params.append("parentSongId", filters.parentSongId);
    if (filters.minRating !== undefined && filters.minRating !== null)
      params.append("minRating", filters.minRating.toString());
    if (filters.maxRating !== undefined && filters.maxRating !== null)
      params.append("maxRating", filters.maxRating.toString());
    if (filters.createdFrom)
      params.append("createdFrom", filters.createdFrom.toISOString());
    if (filters.createdTo)
      params.append("createdTo", filters.createdTo.toISOString());

    params.append("sortBy", filters.sortBy || "createdAt");
    params.append("sortOrder", filters.sortOrder || "desc");
    params.append("page", (filters.page || 1).toString());
    params.append(
      "pageSize",
      (filters.pageSize || this.DEFAULT_PAGE_SIZE).toString()
    );

    const result = await apiClient.get<ApiSongSearchResult>(
      `${this.BASE_PATH}?${params.toString()}`
    );

    return {
      songs: result.songs,
      totalCount: result.totalCount,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  static async getSongById(
    id: string,
    userId: string,
    includeStructure: boolean = false,
    includeChords: boolean = false,
    includePatterns: boolean = false,
    includeReviews: boolean = false,
    includeComments: boolean = false
  ): Promise<SongDetailDto> {
    const params = new URLSearchParams();

    params.append("userId", userId);

    if (includeStructure) params.append("includeStructure", "true");
    if (includeChords) params.append("includeChords", "true");
    if (includePatterns) params.append("includePatterns", "true");
    if (includeReviews) params.append("includeReviews", "true");
    if (includeComments) params.append("includeComments", "true");

    const queryString = params.toString();
    const url = `${this.BASE_PATH}/${id}${
      queryString ? `?${queryString}` : ""
    }`;

    const result = await apiClient.get<SongDetailDto>(url);

    return result;
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
      `${this.BASE_PATH}/user/${userId}?${params.toString()}`
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
      `${this.BASE_PATH}/my-songs?${params.toString()}`
    );
  }

  static async getRelatedSongs(
    songId: string,
    limit: number = 10
  ): Promise<SongDto[]> {
    return await apiClient.get<SongDto[]>(
      `${this.BASE_PATH}/${songId}/related?limit=${limit}`
    );
  }

  static async getSongStructure(songId: string): Promise<SongStructureDto> {
    return await apiClient.get<SongStructureDto>(
      `${this.BASE_PATH}/${songId}/structure`
    );
  }

  static async getSongStatistics(songId: string): Promise<SongStatisticsDto> {
    return await apiClient.get<SongStatisticsDto>(
      `${this.BASE_PATH}/${songId}/statistics`
    );
  }

  static async createSong(data: CreateSongDto): Promise<SongDto> {
    return await apiClient.post<CreateSongDto, SongDto>(
      `${this.BASE_PATH}`,
      data
    );
  }

  static async createSongWithSegments(
    data: CreateSongWithSegmentsDto
  ): Promise<SongDto> {
    return await apiClient.post<CreateSongWithSegmentsDto, SongDto>(
      `${this.BASE_PATH}/with-segments`,
      data
    );
  }

  static async updateSong(id: string, data: UpdateSongDto): Promise<SongDto> {
    return await apiClient.put<UpdateSongDto, SongDto>(
      `${this.BASE_PATH}/${id}`,
      data
    );
  }

  static async deleteSong(id: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_PATH}/${id}`);
  }

  static async copySong(songId: string): Promise<SongDto> {
    return await apiClient.post<void, SongDto>(
      `${this.BASE_PATH}/${songId}/copy`,
      undefined
    );
  }

  static async toggleSongVisibility(
    songId: string,
    isPublic: boolean
  ): Promise<SongDto> {
    return await apiClient.patch<ToggleSongVisibilityDto, SongDto>(
      `${this.BASE_PATH}/${songId}/visibility`,
      { isPublic }
    );
  }

  static async addSongSegment(
    songId: string,
    segmentData: any,
    positionIndex?: number,
    repeatGroup?: string
  ): Promise<any> {
    return await apiClient.post<any, any>(
      `${this.BASE_PATH}/${songId}/segments`,
      { segmentData, positionIndex, repeatGroup }
    );
  }

  static async addSongComment(
    songId: string,
    text: string,
    segmentId?: string
  ): Promise<any> {
    return await apiClient.post<any, any>(
      `${this.BASE_PATH}/${songId}/comments`,
      { text, segmentId }
    );
  }
}
