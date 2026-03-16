import { CreateCommentDto } from "@/types/comments";
import { apiClient } from "./client";
import {
  SongDto,
  FullSongDto,
  SongSearchFilters,
  SongSearchResultDto,
  CreateSongDto,
  UpdateSongDto,
  PaginatedDto,
  SongStructureDto,
  SongCommentDto,
  SongChordDto,
  SongPatternDto,
} from "@/types/songs";

export class SongsService {
  private static readonly BASE_PATH = "/Songs";

  static async searchSongs(
    filters: SongSearchFilters,
  ): Promise<SongSearchResultDto> {
    const params = new URLSearchParams();

    if (filters.ownerId) params.append("ownerId", filters.ownerId);

    if (filters.isPublic !== undefined)
      params.append("isPublic", filters.isPublic.toString());

    if (filters.searchTerm) params.append("searchTerm", filters.searchTerm);
    if (filters.chordId) params.append("chordId", filters.chordId);
    if (filters.patternId) params.append("patternId", filters.patternId);
    if (filters.minRating !== undefined)
      params.append("minRating", filters.minRating.toString());
    if (filters.maxRating !== undefined)
      params.append("maxRating", filters.maxRating.toString());
    if (filters.createdFrom)
      params.append("createdFrom", filters.createdFrom.toISOString());
    if (filters.createdTo)
      params.append("createdTo", filters.createdTo.toISOString());

    params.append("sortBy", filters.sortBy || "createdAt");
    params.append("sortOrder", filters.sortOrder || "desc");
    params.append("page", (filters.page || 1).toString());
    params.append("pageSize", (filters.pageSize || 20).toString());

    const url = `${this.BASE_PATH}?${params.toString()}`;
    console.log("🔍 Searching songs with URL:", url);

    return await apiClient.get<SongSearchResultDto>(url);
  }

  static async getSongById(
    id: string,
    includeStructure: boolean = false,
    includeChords: boolean = false,
    includePatterns: boolean = false,
    includeReviews: boolean = false,
    includeComments: boolean = false,
  ): Promise<FullSongDto> {
    const params = new URLSearchParams();
    if (includeStructure) params.append("includeStructure", "true");
    if (includeChords) params.append("includeChords", "true");
    if (includePatterns) params.append("includePatterns", "true");
    if (includeReviews) params.append("includeReviews", "true");
    if (includeComments) params.append("includeComments", "true");

    const queryString = params.toString();
    const url = `${this.BASE_PATH}/${id}${queryString ? `?${queryString}` : ""}`;

    return await apiClient.get<FullSongDto>(url);
  }

  static async getUserSongs(
    userId: string,
    includePrivate: boolean = false,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedDto<SongDto>> {
    const params = new URLSearchParams();
    if (includePrivate) params.append("includePrivate", "true");
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedDto<SongDto>>(
      `${this.BASE_PATH}/user/${userId}?${params.toString()}`,
    );
  }

  static async getMySongs(
    includePrivate: boolean = true,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedDto<SongDto>> {
    const params = new URLSearchParams();
    if (includePrivate) params.append("includePrivate", "true");
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedDto<SongDto>>(
      `${this.BASE_PATH}/my-songs?${params.toString()}`,
    );
  }

  static async createSong(data: CreateSongDto): Promise<SongDto> {
    return await apiClient.post<CreateSongDto, SongDto>(this.BASE_PATH, data);
  }

  static async updateSong(id: string, data: UpdateSongDto): Promise<SongDto> {
    return await apiClient.put<UpdateSongDto, SongDto>(
      `${this.BASE_PATH}/${id}`,
      data,
    );
  }

  static async deleteSong(id: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_PATH}/${id}`);
  }

  static async buildSongStructure(
    songId: string,
    segments: any[],
    repeatGroups?: any,
  ): Promise<SongStructureDto> {
    return await apiClient.post<any, SongStructureDto>(
      `${this.BASE_PATH}/${songId}/structure`,
      { segments, repeatGroups },
    );
  }

  static async getSongStructure(songId: string): Promise<SongStructureDto> {
    return await apiClient.get<SongStructureDto>(
      `${this.BASE_PATH}/${songId}/structure`,
    );
  }

  static async getSongChords(songId: string): Promise<SongChordDto[]> {
    return await apiClient.get<SongChordDto[]>(
      `${this.BASE_PATH}/${songId}/chords`,
    );
  }

  static async addChordToSong(songId: string, chordId: string): Promise<void> {
    await apiClient.post<void, void>(
      `${this.BASE_PATH}/${songId}/chords/${chordId}`,
      undefined,
    );
  }

  static async removeChordFromSong(
    songId: string,
    chordId: string,
  ): Promise<void> {
    await apiClient.delete<void>(
      `${this.BASE_PATH}/${songId}/chords/${chordId}`,
    );
  }

  static async getSongPatterns(songId: string): Promise<SongPatternDto[]> {
    return await apiClient.get<SongPatternDto[]>(
      `${this.BASE_PATH}/${songId}/patterns`,
    );
  }

  static async addPatternToSong(
    songId: string,
    patternId: string,
  ): Promise<void> {
    await apiClient.post<void, void>(
      `${this.BASE_PATH}/${songId}/patterns/${patternId}`,
      undefined,
    );
  }

  static async removePatternFromSong(
    songId: string,
    patternId: string,
  ): Promise<void> {
    await apiClient.delete<void>(
      `${this.BASE_PATH}/${songId}/patterns/${patternId}`,
    );
  }

  static async addComment(
    songId: string,
    text: string,
    segmentId?: string,
  ): Promise<SongCommentDto> {
    const data: CreateCommentDto = { text, segmentId };
    return await apiClient.post<CreateCommentDto, SongCommentDto>(
      `${this.BASE_PATH}/${songId}/comments`,
      data,
    );
  }

  static async deleteComment(
    songId: string,
    segmentId?: string,
  ): Promise<void> {
    const params = segmentId ? `?segmentId=${segmentId}` : "";
    await apiClient.delete<void>(
      `${this.BASE_PATH}/${songId}/comments${params}`,
    );
  }

  static async getSongComments(
    songId: string,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<PaginatedDto<SongCommentDto>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedDto<SongCommentDto>>(
      `${this.BASE_PATH}/${songId}/comments?${params.toString()}`,
    );
  }
}
