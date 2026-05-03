import { CreateCommentDto } from "@/types/comments";
import { apiClient, authHeaders, getApiBaseUrl } from "./client";
import {
  SongDto,
  FullSongDto,
  SongSearchFilters,
  SongSearchResultDto,
  CreateSongDto,
  UpdateSongDto,
  UpdateSongWithSegmentsDto,
  PaginatedDto,
  SongStructureDto,
  SongCommentDto,
  SongChordDto,
  SongPatternDto,
} from "@/types/songs";
import { AuthService } from "./auth-service";

export class SongsService {
  private static readonly BASE_PATH = "/songs";

  static getAudioFileUrl(songId: string): string {
    return `${getApiBaseUrl()}${this.BASE_PATH}/${songId}/audio-file`;
  }

  static getAudioUploadUrl(songId: string): string {
    return `${getApiBaseUrl()}${this.BASE_PATH}/${songId}/audio`;
  }

  static async fetchAudioFileBlob(songId: string): Promise<Blob> {
    const token = AuthService.getToken();
    const response = await fetch(this.getAudioFileUrl(songId), {
      method: "GET",
      headers: authHeaders(token),
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch audio");
    const blob = await response.blob();
    if (blob.size === 0) throw new Error("Audio file is empty");
    return blob;
  }

  static async tryFetchAudioFileBlob(songId: string): Promise<Blob | null> {
    try {
      return await this.fetchAudioFileBlob(songId);
    } catch {
      return null;
    }
  }

  private static mapFullSongToSongDto(fullSong: FullSongDto): SongDto {
    return {
      id: fullSong.id,
      title: fullSong.title,
      artist: fullSong.artist,
      genre: fullSong.genre,
      theme: fullSong.theme,
      description: fullSong.description,
      ownerId: fullSong.ownerId,
      ownerName: fullSong.ownerName,
      isPublic: fullSong.isPublic,
      parentSongId: fullSong.parentSongId,
      parentSongTitle: fullSong.parentSongTitle,
      customAudioUrl: fullSong.customAudioUrl,
      customAudioType: fullSong.customAudioType,
      createdAt: fullSong.createdAt,
      updatedAt: fullSong.updatedAt,
      reviewCount: fullSong.reviewCount,
      averageBeautifulRating: fullSong.averageBeautifulRating,
      averageDifficultyRating: fullSong.averageDifficultyRating,
      chords: fullSong.chords,
      patterns: fullSong.patterns,
      commentsCount: fullSong.comments?.length ?? 0,
      segmentsCount: fullSong.segments?.length ?? 0,
    };
  }

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
    const response = await apiClient.get<{
      songs?: SongDto[];
      Songs?: SongDto[];
      totalCount?: number;
      TotalCount?: number;
      page?: number;
      Page?: number;
      pageSize?: number;
      PageSize?: number;
      totalPages?: number;
      TotalPages?: number;
    }>(url);

    return {
      songs: response.songs ?? response.Songs ?? [],
      totalCount: response.totalCount ?? response.TotalCount ?? 0,
      page: response.page ?? response.Page ?? filters.page ?? 1,
      pageSize:
        response.pageSize ?? response.PageSize ?? filters.pageSize ?? 20,
      totalPages: response.totalPages ?? response.TotalPages ?? 0,
    };
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

  static async uploadAudio(
    songId: string,
    audioFile: File,
  ): Promise<{ fileName: string; audioType: string; size: number }> {
    const formData = new FormData();
    formData.append("audioFile", audioFile);

    const token = AuthService.getToken();
    const url = this.getAudioUploadUrl(songId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: authHeaders(token),
        body: formData,
        signal: controller.signal,
        credentials: "include",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let message = "Failed to upload audio";
        try {
          const error = await response.json();
          message =
            error?.message ?? error?.error ?? error?.title ?? message;
        } catch {
          /* non-JSON body */
        }
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Upload timeout (5 minutes). File may be too large.");
      }
      throw error;
    }
  }

  static async createSong(
    data: CreateSongDto & {
      segments?: any[];
      chordIds?: string[];
      patternIds?: string[];
      customAudioUrl?: string;
      customAudioType?: string;
      audioFile?: File;
      segmentComments?: Record<number, any[]>;
    },
  ): Promise<SongDto> {
    const songData: CreateSongDto = {
      title: data.title,
      genre: data.genre,
      theme: data.theme,
      artist: data.artist,
      description: data.description,
      isPublic: data.isPublic,
      parentSongId: data.parentSongId,
      key: data.key,
      difficulty: data.difficulty,
      customAudioUrl: data.customAudioUrl,
      customAudioType: data.customAudioType,
    };

    const createdSong = await apiClient.post<CreateSongDto, SongDto>(
      this.BASE_PATH,
      songData,
    );

    if (data.segments && data.segments.length > 0) {
      try {
        const structurePayload: Record<string, unknown> = {
          segments: data.segments,
        };

        if (
          data.segmentComments &&
          Object.keys(data.segmentComments).length > 0
        ) {
          structurePayload.segmentComments = data.segmentComments;
        }

        await this.buildSongStructure(createdSong.id, structurePayload);
      } catch {
        throw new Error("Failed to save song segments");
      }
    }

    if (data.audioFile) {
      try {
        const uploadResult = await this.uploadAudio(
          createdSong.id,
          data.audioFile,
        );
        createdSong.customAudioUrl = uploadResult.fileName;
        createdSong.customAudioType = uploadResult.audioType;
      } catch (error) {
        throw new Error(
          "Song created but audio upload failed: " + (error as Error).message,
        );
      }
    }

    if (data.chordIds && data.chordIds.length > 0) {
      for (const chordId of data.chordIds) {
        try {
          await this.addChordToSong(createdSong.id, chordId);
        } catch {
        }
      }
    }

    if (data.patternIds && data.patternIds.length > 0) {
      for (const patternId of data.patternIds) {
        try {
          await this.addPatternToSong(createdSong.id, patternId);
        } catch {
        }
      }
    }

    return createdSong;
  }

  static async updateSong(id: string, data: UpdateSongDto): Promise<SongDto> {
    return await apiClient.put<UpdateSongDto, SongDto>(
      `${this.BASE_PATH}/${id}`,
      data,
    );
  }

  static async updateSongWithSegments(
    data: UpdateSongWithSegmentsDto,
  ): Promise<SongDto> {
    const songUpdatePayload: any = {
      title: data.title ?? undefined,
      artist: data.artist ?? undefined,
      description: data.description ?? undefined,
      genre: data.genre ?? undefined,
      theme: data.theme ?? undefined,
      isPublic: data.isPublic ?? undefined,
    };

    if (data.audioBase64 && data.audioType) {
      songUpdatePayload.audioBase64 = data.audioBase64;
      songUpdatePayload.audioType = data.audioType;
    } else if (data.customAudioUrl) {
      songUpdatePayload.customAudioUrl = data.customAudioUrl;
      songUpdatePayload.customAudioType = data.customAudioType;
    } else if (data.isDeleteAudio) {
      songUpdatePayload.isDeleteAudio = true;
    }

    await this.updateSong(data.id, songUpdatePayload);

    if (data.segments || data.segmentComments) {
      const structurePayload: any = {};
      if (data.segments) structurePayload.segments = data.segments;
      if (data.segmentComments !== undefined) {
        structurePayload.segmentComments = data.segmentComments;
      }

      await this.buildSongStructure(data.id, structurePayload);
    }

    const fullSong = await this.getSongById(
      data.id,
      false,
      false,
      false,
      false,
      false,
    );

    return this.mapFullSongToSongDto(fullSong);
  }

  static async deleteSong(id: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_PATH}/${id}`);
  }

  static async buildSongStructure(
    songId: string,
    payload: any,
  ): Promise<SongStructureDto> {
    return await apiClient.post<any, SongStructureDto>(
      `${this.BASE_PATH}/${songId}/structure`,
      payload,
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
  ): Promise<SongCommentDto[]> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<SongCommentDto[]>(
      `${this.BASE_PATH}/${songId}/comments?${params.toString()}`,
    );
  }

  static async countOfCreate(): Promise<number> {
    return await apiClient.get<number>(`${this.BASE_PATH}/count-of-create`);
  }

  static async getAudioUrl(songId: string, fileName: string): Promise<string> {
    if (
      fileName.startsWith("http://") ||
      fileName.startsWith("https://") ||
      fileName.startsWith("data:")
    ) {
      return fileName;
    }

    const token = AuthService.getToken();
    const url = `${getApiBaseUrl()}${this.BASE_PATH}/${songId}/audio-url?fileName=${encodeURIComponent(fileName)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: authHeaders(token),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to get audio URL");
    }

    const data = await response.json();
    return data.url;
  }
}
