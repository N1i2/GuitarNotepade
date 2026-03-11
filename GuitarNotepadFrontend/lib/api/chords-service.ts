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

  // Все аккорды с фильтрацией
  static async getAllChords(filters?: ChordFilters): Promise<PaginatedChords> {
    const params = new URLSearchParams();

    if (filters?.name) params.append("name", filters.name);
    if (filters?.myChordsOnly) params.append("myChordsOnly", "true");

    params.append("page", (filters?.page || 1).toString());
    params.append("pageSize", (filters?.pageSize || 20).toString());
    params.append("sortBy", filters?.sortBy || "name");
    params.append("sortOrder", filters?.sortOrder || "asc");

    return await apiClient.get<PaginatedChords>(
      `${this.BASE_PATH}?${params.toString()}`
    );
  }

  // Аккорд по ID
  static async getChordById(id: string): Promise<Chord> {
    return await apiClient.get<Chord>(`${this.BASE_PATH}/${id}`);
  }

  // Аккорды по точному названию
  static async getChordsByExactName(
    name: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedChords> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedChords>(
      `${this.BASE_PATH}/exact/${encodeURIComponent(name)}?${params.toString()}`
    );
  }

  // Поиск по названию
  static async searchChordsByName(
    name: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedChords> {
    const params = new URLSearchParams();
    params.append("name", name);
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedChords>(
      `${this.BASE_PATH}/search?${params.toString()}`
    );
  }

  // Мои аккорды
  static async getMyChords(
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedChords> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedChords>(
      `${this.BASE_PATH}/my-chords?${params.toString()}`
    );
  }

  // Создание аккорда
  static async createChord(data: CreateChordDto): Promise<Chord> {
    return await apiClient.post<CreateChordDto, Chord>(
      this.BASE_PATH,
      data
    );
  }

  // Обновление аккорда
  static async updateChord(id: string, data: UpdateChordDto): Promise<Chord> {
    return await apiClient.put<UpdateChordDto, Chord>(
      `${this.BASE_PATH}/${id}`,
      data
    );
  }

  // Удаление аккорда
  static async deleteChord(id: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_PATH}/${id}`);
  }
}