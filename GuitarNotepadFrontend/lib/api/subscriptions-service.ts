import { apiClient } from "./client";

export interface SubscriptionDto {
  id: string;
  userId: string;
  userName: string;
  targetId: string;
  targetName: string;
  createdAt: string;
}

export class SubscriptionsService {
  private static readonly BASE_PATH = "/subscriptions";

  static async getMySubscriptions(): Promise<SubscriptionDto[]> {
    return await apiClient.get<SubscriptionDto[]>(this.BASE_PATH);
  }

  static async subscribe(albumId: string): Promise<void> {
    await apiClient.post<void, void>(`${this.BASE_PATH}/${albumId}`);
  }

  static async unsubscribe(albumId: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_PATH}/${albumId}`);
  }

  static async checkAlbumSubscription(albumId: string): Promise<boolean> {
    return await apiClient.get<boolean>(`${this.BASE_PATH}/check/${albumId}`);
  }

  static async countOfCreateSubscription(): Promise<number> {
    return await apiClient.get<number>(`${this.BASE_PATH}/count-of-create`);
  }
}
