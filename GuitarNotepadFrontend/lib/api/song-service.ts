import { CreateCommentDto } from "@/types/comments";
import { apiClient } from "./client";
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

    const response = await apiClient.get<any>(url);

    return {
      songs: response.songs || response.Songs || [],
      totalCount: response.totalCount || response.TotalCount || 0,
      page: response.page || response.Page || filters.page || 1,
      pageSize:
        response.pageSize || response.PageSize || filters.pageSize || 20,
      totalPages: response.totalPages || response.TotalPages || 0,
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
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"}${this.BASE_PATH}/${songId}/audio`;

    console.log("📤 Uploading audio to:", url);
    console.log(
      "📁 File size:",
      (audioFile.size / 1024 / 1024).toFixed(2),
      "MB",
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload audio");
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

    console.log("📤 Creating song...");
    const createdSong = await apiClient.post<CreateSongDto, SongDto>(
      this.BASE_PATH,
      songData,
    );
    console.log("✅ Song created:", createdSong.id);

    if (data.segments && data.segments.length > 0) {
      try {
        const structurePayload: any = {
          segments: data.segments,
        };

        if (
          data.segmentComments &&
          Object.keys(data.segmentComments).length > 0
        ) {
          structurePayload.segmentComments = data.segmentComments;
          console.log(
            "📝 Including comments in structure payload:",
            data.segmentComments,
          );
        }

        await this.buildSongStructure(createdSong.id, structurePayload);
        console.log("✅ Song structure built successfully");
      } catch (error) {
        console.error("Failed to build song structure:", error);
        throw new Error("Failed to save song segments");
      }
    }

    if (data.audioFile) {
      console.log("📁 Uploading audio file...");
      try {
        const uploadResult = await this.uploadAudio(
          createdSong.id,
          data.audioFile,
        );
        console.log("✅ Audio uploaded:", uploadResult);
        createdSong.customAudioUrl = uploadResult.fileName;
        createdSong.customAudioType = uploadResult.audioType;
      } catch (error) {
        console.error("Failed to upload audio:", error);
        throw new Error(
          "Song created but audio upload failed: " + (error as Error).message,
        );
      }
    }

    if (data.chordIds && data.chordIds.length > 0) {
      for (const chordId of data.chordIds) {
        try {
          await this.addChordToSong(createdSong.id, chordId);
        } catch (error) {
          console.error(`Failed to add chord ${chordId}:`, error);
        }
      }
    }

    if (data.patternIds && data.patternIds.length > 0) {
      for (const patternId of data.patternIds) {
        try {
          await this.addPatternToSong(createdSong.id, patternId);
        } catch (error) {
          console.error(`Failed to add pattern ${patternId}:`, error);
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
    let uploadedAudioUrl: string | undefined;
    let uploadedAudioType: string | undefined;

    if (data.audioBase64 && data.audioType) {
      console.log("🎵 Uploading new audio file...");
      try {
        const base64Data = data.audioBase64.split(",")[1] || data.audioBase64;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: data.audioType });
        const file = new File(
          [blob],
          `audio-${data.id}.${data.audioType === "audio/webm" ? "webm" : "mp3"}`,
          { type: data.audioType },
        );

        const uploadResult = await this.uploadAudio(data.id, file);
        uploadedAudioUrl = uploadResult.fileName;
        uploadedAudioType = uploadResult.audioType;
        console.log("🎵 Audio uploaded:", uploadResult);
      } catch (error) {
        console.error("Failed to upload audio:", error);
        throw new Error("Failed to upload new audio");
      }
    }

    const songUpdatePayload: any = {
      title: data.title ?? undefined,
      artist: data.artist ?? undefined,
      description: data.description ?? undefined,
      genre: data.genre ?? undefined,
      theme: data.theme ?? undefined,
      isPublic: data.isPublic ?? undefined,
    };

    if (uploadedAudioUrl) {
      songUpdatePayload.customAudioUrl = uploadedAudioUrl;
      songUpdatePayload.customAudioType = uploadedAudioType;
    } else if (data.customAudioUrl) {
      songUpdatePayload.customAudioUrl = data.customAudioUrl;
      songUpdatePayload.customAudioType = data.customAudioType;
    } else if (data.isDeleteAudio) {
      songUpdatePayload.customAudioUrl = null;
      songUpdatePayload.customAudioType = null;
    }

    console.log("📤 Updating song with payload:", {
      hasNewAudio: !!uploadedAudioUrl,
      customAudioUrl: songUpdatePayload.customAudioUrl,
      isDeleteAudio: data.isDeleteAudio,
    });

    const updatedSong = await this.updateSong(data.id, songUpdatePayload);

    if (data.segments || data.segmentComments) {
      const structurePayload: any = {};
      if (data.segments) structurePayload.segments = data.segments;
      if (data.segmentComments !== undefined) {
        structurePayload.segmentComments = data.segmentComments;
      }

      await this.buildSongStructure(data.id, structurePayload);
    }

    return updatedSong;
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
  ): Promise<PaginatedDto<SongCommentDto>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedDto<SongCommentDto>>(
      `${this.BASE_PATH}/${songId}/comments?${params.toString()}`,
    );
  }

  static async countOfCreate(): Promise<number> {
    return await apiClient.get<number>("count-of-create");
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
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
    const url = `${baseUrl}/Songs/${songId}/audio-url?fileName=${encodeURIComponent(fileName)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get audio URL");
    }

    const data = await response.json();
    return data.url;
  }
}
