import { apiClient } from "./client";
import {
  Chord,
  CreateChordDto,
  UpdateChordDto,
  PaginatedChords,
  ChordFilters,
} from "@/types/chords";

export class ChordsService {
  private static readonly DEFAULT_PAGE_SIZE = 20;

  static async getDistinctChordNames(
    page = 1,
    pageSize = 20
  ): Promise<PaginatedChords> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    params.append("sortBy", "name");
    params.append("sortOrder", "asc");

    return await apiClient.get<PaginatedChords>(
      `/chords/distinct?${params.toString()}`
    );
  }

  static async getChordVariations(
    chordName: string,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedChords> {
    const params = new URLSearchParams();
    params.append("name", chordName);
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    params.append("sortBy", "createdAt");
    params.append("sortOrder", "desc");

    return await apiClient.get<PaginatedChords>(`/chords?${params.toString()}`);
  }

  static async getChordById(id: string): Promise<Chord> {
    return await apiClient.get<Chord>(`/chords/${id}`);
  }

  static async searchChordsByName(
    name: string,
    page = 1
  ): Promise<PaginatedChords> {
    const params = new URLSearchParams();
    params.append("name", name);
    params.append("page", page.toString());
    params.append("pageSize", this.DEFAULT_PAGE_SIZE.toString());

    return await apiClient.get<PaginatedChords>(
      `/chords/search?${params.toString()}`
    );
  }

  static async getMyChords(page = 1): Promise<PaginatedChords> {
    const params = new URLSearchParams();
    params.append("myChordsOnly", "true");
    params.append("page", page.toString());
    params.append("pageSize", this.DEFAULT_PAGE_SIZE.toString());

    return await apiClient.get<PaginatedChords>(`/chords?${params.toString()}`);
  }

  static async getAllChords(filters?: ChordFilters): Promise<PaginatedChords> {
    const params = new URLSearchParams();

    if (filters?.name) params.append("name", filters.name);
    if (filters?.myChordsOnly) params.append("myChordsOnly", "true");
    params.append("page", (filters?.page || 1).toString());
    params.append(
      "pageSize",
      (filters?.pageSize || this.DEFAULT_PAGE_SIZE).toString()
    );
    params.append("sortBy", filters?.sortBy || "name");
    params.append("sortOrder", filters?.sortOrder || "asc");

    return await apiClient.get<PaginatedChords>(`/chords?${params.toString()}`);
  }

  static async createChord(data: CreateChordDto): Promise<Chord> {
    return await apiClient.post<CreateChordDto, Chord>("/chords", data);
  }

  static async updateChord(id: string, data: UpdateChordDto): Promise<Chord> {
    return await apiClient.put<UpdateChordDto, Chord>(`/chords/${id}`, data);
  }
  static async getChordsByExactName(
    name: string,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedChords> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedChords>(
      `/chords/exact/${encodeURIComponent(name)}?${params.toString()}`
    );
  }
  static async deleteChord(id: string): Promise<void> {
    await apiClient.delete<void>(`/chords/${id}`);
  }

  static async getAdjacentVariation(
    currentId: string,
    direction: "next" | "prev"
  ): Promise<Chord | null> {
    return null;
  }
}
