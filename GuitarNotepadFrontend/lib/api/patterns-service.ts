import {
  CreatePatternDto,
  PaginatedPattern,
  Pattern,
  PatternFilters,
  UpdatePatternDto,
} from "@/types/patterns";
import { apiClient } from "./client";

export class PatternsService {
  private static readonly DEFAULT_PAGE_SIZE = 20;
  private static readonly DEFAULT_PATH = "StrummingPatterns";

  static async getAllPatterns(
    filters?: PatternFilters
  ): Promise<PaginatedPattern> {
    const params = new URLSearchParams();

    if (filters?.name) params.append("name", filters.name);
    if (filters?.myPatternsOnly) params.append("myPatternsOnly", "true");
    if (filters?.isFingerStyle)
      params.append("isFingerStyle", filters.isFingerStyle ? "true" : "false");

    params.append("page", (filters?.page || 1).toString());
    params.append(
      "pageSize",
      (filters?.pageSize || this.DEFAULT_PAGE_SIZE).toString()
    );
    params.append("sortBy", filters?.sortBy || "name");
    params.append("sortOrder", filters?.sortOrder || "asc");

    return await apiClient.get<PaginatedPattern>(
      `/${this.DEFAULT_PATH}?${params.toString()}`
    );
  }

  static async getPatternByName(patternName: string): Promise<Pattern> {
    return await apiClient.get<Pattern>(`/${this.DEFAULT_PATH}/by-name/${patternName}`);
  }

  static async getPatternById(id: string): Promise<Pattern> {
    return await apiClient.get<Pattern>(`/${this.DEFAULT_PATH}/by-id/${id}`);
  }

  static async createPattern(data: CreatePatternDto): Promise<Pattern> {
    return await apiClient.post<CreatePatternDto, Pattern>(
      `/${this.DEFAULT_PATH}`,
      data
    );
  }

  static async updatePattern(
    id: string,
    data: UpdatePatternDto
  ): Promise<Pattern> {
    return await apiClient.put<UpdatePatternDto, Pattern>(
      `/${this.DEFAULT_PATH}/${id}`,
      data
    );
  }

  static async deletePattern(id: string): Promise<void> {
    await apiClient.delete<void>(`/${this.DEFAULT_PATH}/${id}`);
  }
}
