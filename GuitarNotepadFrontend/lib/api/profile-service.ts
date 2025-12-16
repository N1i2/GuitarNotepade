import { FiltersForUsers, PaginatedUsers, User, updateUserInfo as UpdateUserInfo, UserProfileResponse, BlockUserRequest, BlockUserResponse } from "@/types/profile";
import { apiClient } from "./client";

export class ProfileService {
  private static readonly DEFAULT_PAGE_SIZE = 10;
  private static readonly DEFAULT_PATH = 'UserManagement';

  static async getFullInfo(id?: string): Promise<User> {
    const response = await apiClient.get<User>("/User/profile");
    return response;
  }

  static async updateProfile(data: Partial<UpdateUserInfo>): Promise<UserProfileResponse> {
    const response = await apiClient.put<UpdateUserInfo, UserProfileResponse>("/User/profile", data);
    if (data.currentPassword) {
      await apiClient.put<UpdateUserInfo, UserProfileResponse>("/User/change-password", data);
    }
    return response;
  }

  static async getAllUsers(data: FiltersForUsers): Promise<PaginatedUsers> {
    const params = new URLSearchParams();
    
    if (data.emailFilter) params.append("emailFilter", data.emailFilter);
    if (data.nikNameFilter) params.append("nikNameFilter", data.nikNameFilter);
    if (data.isBlocked !== undefined && data.isBlocked !== null) 
      params.append("isBlocked", data.isBlocked.toString());
    if (data.role) params.append("role", data.role);
    
    params.append("page", (data.page || 1).toString());
    params.append("pageSize", (data.pageSize || this.DEFAULT_PAGE_SIZE).toString());
    params.append("sortBy", data.sortBy || "createdAt");
    params.append("sortOrder", data.sortOrder || "desc");

    const response = await apiClient.get<PaginatedUsers>(
      `/${this.DEFAULT_PATH}/users?${params.toString()}`
    );
    return response;
  }

  static async blockUser(data: BlockUserRequest): Promise<void>{
    await apiClient.put(`/${this.DEFAULT_PATH}/block-user`, data);
  }

  static async unblockUser(email: string): Promise<void>{
    await apiClient.put(`/${this.DEFAULT_PATH}/unblock-user`, {email});
  }

  static async toggleUserRole(email: string): Promise<void> {
    await apiClient.put(`/${this.DEFAULT_PATH}/toggle-user-role`, {email});
  }
}

