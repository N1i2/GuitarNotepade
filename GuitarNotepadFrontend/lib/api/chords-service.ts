import { apiClient } from "./client";
import {
  Chord,
  CreateChordDto,
  UpdateChordDto,
  PaginatedChords,
  ChordFilters,
} from "@/types/chords";

export class ChordsService {
  private static readonly BASE_PATH = "/chords";

  static async getAllChords(filters?: ChordFilters): Promise<PaginatedChords> {
    const params = new URLSearchParams();

    if (filters?.name) params.append("name", filters.name);
    if (filters?.myChordsOnly) params.append("myChordsOnly", "true");

    params.append("page", (filters?.page || 1).toString());
    params.append("pageSize", (filters?.pageSize || 20).toString());
    params.append("sortBy", filters?.sortBy || "name");
    params.append("sortOrder", filters?.sortOrder || "asc");

    return await apiClient.get<PaginatedChords>(
      `${this.BASE_PATH}?${params.toString()}`,
    );
  }

  static async getChordById(id: string): Promise<Chord> {
    return await apiClient.get<Chord>(`${this.BASE_PATH}/${id}`);
  }

  static async getChordsByExactName(
    name: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedChords> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedChords>(
      `${this.BASE_PATH}/exact/${encodeURIComponent(name)}?${params.toString()}`,
    );
  }

  static async searchChordsByName(
    name: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedChords> {
    const params = new URLSearchParams();
    params.append("name", name);
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedChords>(
      `${this.BASE_PATH}/search?${params.toString()}`,
    );
  }

  static async getMyChords(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedChords> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedChords>(
      `${this.BASE_PATH}/my-chords?${params.toString()}`,
    );
  }

  static async createChord(data: CreateChordDto): Promise<Chord> {
    return await apiClient.post<CreateChordDto, Chord>(this.BASE_PATH, data);
  }

  static async updateChord(id: string, data: UpdateChordDto): Promise<Chord> {
    return await apiClient.put<UpdateChordDto, Chord>(
      `${this.BASE_PATH}/${id}`,
      data,
    );
  }

  static async deleteChord(id: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_PATH}/${id}`);
  }

  static async countOfCreate(): Promise<number> {
    return await apiClient.get<number>("count-of-create");
  }
}
