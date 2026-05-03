import { apiClient } from "./client";
import {
  UserProfileResponse,
  FiltersForUsers,
  PaginatedUsers,
  BlockUserRequest,
  updateUserInfo,
} from "@/types/profile";

export class ProfileService {
  private static readonly BASE_PATH = "/user";
  private static readonly ADMIN_PATH = "/UserManagement";

  static async getProfile(): Promise<UserProfileResponse> {
    return await apiClient.get<UserProfileResponse>(
      `${this.BASE_PATH}/profile`,
    );
  }

  static async updateProfile(
    data: Partial<updateUserInfo>,
  ): Promise<UserProfileResponse> {
    return await apiClient.put<Partial<updateUserInfo>, UserProfileResponse>(
      `${this.BASE_PATH}/profile`,
      data,
    );
  }

  static async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string,
  ): Promise<void> {
    await apiClient.put(`${this.BASE_PATH}/change-password`, {
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
  }

  static async getAllUsers(filters: FiltersForUsers): Promise<PaginatedUsers> {
    return this.getUsers(filters);
  }

  static async getUsers(filters: FiltersForUsers): Promise<PaginatedUsers> {
    const params = new URLSearchParams();

    if (filters.emailFilter) params.append("emailFilter", filters.emailFilter);
    if (filters.nikNameFilter)
      params.append("nikNameFilter", filters.nikNameFilter);
    if (filters.isBlocked !== undefined && filters.isBlocked !== null)
      params.append("isBlocked", filters.isBlocked.toString());

    params.append("page", (filters.page || 1).toString());
    params.append("pageSize", (filters.pageSize || 10).toString());
    params.append("sortBy", filters.sortBy || "createdAt");
    params.append("sortOrder", filters.sortOrder || "desc");

    return await apiClient.get<PaginatedUsers>(
      `${this.BASE_PATH}/users?${params.toString()}`,
    );
  }

  static async blockUser(data: BlockUserRequest): Promise<void> {
    await apiClient.put(`${this.ADMIN_PATH}/block-user`, data);
  }

  static async unblockUser(email: string): Promise<void> {
    await apiClient.put(`${this.ADMIN_PATH}/unblock-user`, { email });
  }

  static async toggleUserRole(email: string): Promise<void> {
    await apiClient.put(`${this.ADMIN_PATH}/toggle-user-role`, { email });
  }
}
