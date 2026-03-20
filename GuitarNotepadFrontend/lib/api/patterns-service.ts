import { apiClient } from "./client";
import {
  Pattern,
  CreatePatternDto,
  UpdatePatternDto,
  PaginatedPattern,
  PatternFilters,
} from "@/types/patterns";

export class PatternsService {
  private static readonly BASE_PATH = "/strummingpatterns";

  static async getAllPatterns(
    filters?: PatternFilters,
  ): Promise<PaginatedPattern> {
    const params = new URLSearchParams();

    if (filters?.name) params.append("name", filters.name);
    if (filters?.myPatternsOnly) params.append("myPatternsOnly", "true");
    if (filters?.isFingerStyle !== undefined)
      params.append("isFingerStyle", filters.isFingerStyle.toString());

    params.append("page", (filters?.page || 1).toString());
    params.append("pageSize", (filters?.pageSize || 20).toString());
    params.append("sortBy", filters?.sortBy || "name");
    params.append("sortOrder", filters?.sortOrder || "asc");

    return await apiClient.get<PaginatedPattern>(
      `${this.BASE_PATH}?${params.toString()}`,
    );
  }

  static async searchPatternsByName(
    name: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedPattern> {
    const params = new URLSearchParams();
    params.append("name", name);
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedPattern>(
      `${this.BASE_PATH}/search?${params.toString()}`,
    );
  }

  static async getPatternById(id: string): Promise<Pattern> {
    return await apiClient.get<Pattern>(`${this.BASE_PATH}/${id}`);
  }

  static async getPatternByName(name: string): Promise<Pattern> {
    const result = await this.searchPatternsByName(name, 1, 1);
    if (result.items.length === 0) {
      throw new Error(`Pattern "${name}" not found`);
    }
    return result.items[0];
  }

  static async getMyPatterns(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedPattern> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    return await apiClient.get<PaginatedPattern>(
      `${this.BASE_PATH}/my-patterns?${params.toString()}`,
    );
  }

  static async createPattern(data: CreatePatternDto): Promise<Pattern> {
    return await apiClient.post<CreatePatternDto, Pattern>(
      this.BASE_PATH,
      data,
    );
  }

  static async updatePattern(
    id: string,
    data: UpdatePatternDto,
  ): Promise<Pattern> {
    return await apiClient.put<UpdatePatternDto, Pattern>(
      `${this.BASE_PATH}/${id}`,
      data,
    );
  }

  static async deletePattern(id: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_PATH}/${id}`);
  }

  static async countOfCreate(): Promise<number> {
    return await apiClient.get<number>("count-of-create");
  }
}
