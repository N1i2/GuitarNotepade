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
  private static readonly ADMIN_PATH = "/usermanagement";

  // Получение профиля текущего пользователя
  static async getProfile(): Promise<UserProfileResponse> {
    return await apiClient.get<UserProfileResponse>(`${this.BASE_PATH}/profile`);
  }

  // Обновление профиля
  static async updateProfile(
    data: Partial<updateUserInfo>
  ): Promise<UserProfileResponse> {
    return await apiClient.put<Partial<updateUserInfo>, UserProfileResponse>(
      `${this.BASE_PATH}/profile`,
      data
    );
  }

  // Смена пароля
  static async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ): Promise<void> {
    await apiClient.put(`${this.BASE_PATH}/change-password`, {
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
  }

  // Админ: получение всех пользователей
  static async getAllUsers(filters: FiltersForUsers): Promise<PaginatedUsers> {
    const params = new URLSearchParams();

    if (filters.emailFilter) params.append("emailFilter", filters.emailFilter);
    if (filters.nikNameFilter) params.append("nikNameFilter", filters.nikNameFilter);
    if (filters.isBlocked !== undefined && filters.isBlocked !== null)
      params.append("isBlocked", filters.isBlocked.toString());
    if (filters.role) params.append("role", filters.role);

    params.append("page", (filters.page || 1).toString());
    params.append("pageSize", (filters.pageSize || 10).toString());
    params.append("sortBy", filters.sortBy || "createdAt");
    params.append("sortOrder", filters.sortOrder || "desc");

    return await apiClient.get<PaginatedUsers>(
      `${this.ADMIN_PATH}/users?${params.toString()}`
    );
  }

  // Админ: блокировка пользователя
  static async blockUser(data: BlockUserRequest): Promise<void> {
    await apiClient.put(`${this.ADMIN_PATH}/block-user`, data);
  }

  // Админ: разблокировка пользователя
  static async unblockUser(email: string): Promise<void> {
    await apiClient.put(`${this.ADMIN_PATH}/unblock-user`, { email });
  }

  // Админ: смена роли пользователя
  static async toggleUserRole(email: string): Promise<void> {
    await apiClient.put(`${this.ADMIN_PATH}/toggle-user-role`, { email });
  }
}