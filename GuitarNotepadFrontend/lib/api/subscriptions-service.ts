import { apiClient } from "./client";

export interface SubscriptionDto {
  id: string;
  userId: string;
  userName: string;
  targetId: string;
  subName: string;
  isUserSub: boolean;
  createdAt: string;
}

export class SubscriptionsService {
  private static readonly BASE_PATH = "/subscriptions";

  static async getMySubscriptions(): Promise<SubscriptionDto[]> {
    return await apiClient.get<SubscriptionDto[]>(this.BASE_PATH);
  }

  static async subscribeToUser(userId: string): Promise<void> {
    await apiClient.post<void, void>(`${this.BASE_PATH}/users/${userId}`);
  }

  static async unsubscribeFromUser(userId: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_PATH}/users/${userId}`);
  }

  static async subscribeToAlbum(albumId: string): Promise<void> {
    await apiClient.post<void, void>(`${this.BASE_PATH}/albums/${albumId}`);
  }

  static async unsubscribeFromAlbum(albumId: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_PATH}/albums/${albumId}`);
  }

  static async checkUserSubscription(userId: string): Promise<boolean> {
    return await apiClient.get<boolean>(`${this.BASE_PATH}/check/user/${userId}`);
  }

  static async checkAlbumSubscription(albumId: string): Promise<boolean> {
    return await apiClient.get<boolean>(`${this.BASE_PATH}/check/album/${albumId}`);
  }
}
