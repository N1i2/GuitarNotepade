import { apiClient } from "./client";

export interface NotificationDto {
  id: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
  actorUserId?: string;
  songId?: string;
  albumId?: string;
}

export interface DeleteReadNotificationsResponse {
  message: string;
  count: number;
}

export class NotificationsService {
  private static readonly BASE_PATH = "/notifications";

  static async getMyNotifications(
    take: number = 50,
    skip: number = 0,
  ): Promise<NotificationDto[]> {
    const params = new URLSearchParams();
    params.append("take", take.toString());
    params.append("skip", skip.toString());

    return await apiClient.get<NotificationDto[]>(
      `${this.BASE_PATH}?${params.toString()}`,
    );
  }

  static async getUnreadCount(): Promise<number> {
    return await apiClient.get<number>(`${this.BASE_PATH}/unread-count`);
  }

  static async markAsRead(notificationId: string): Promise<void> {
    await apiClient.post<void, void>(
      `${this.BASE_PATH}/${notificationId}/read`,
      undefined,
    );
  }

  static async markAllAsRead(): Promise<{ message: string; count: number }> {
    return await apiClient.post<void, { message: string; count: number }>(
      `${this.BASE_PATH}/read-all`,
      undefined,
    );
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_PATH}/${notificationId}`);
  }

  static async deleteReadNotifications(): Promise<DeleteReadNotificationsResponse> {
    return await apiClient.delete<DeleteReadNotificationsResponse>(
      `${this.BASE_PATH}/read`,
    );
  }
}
