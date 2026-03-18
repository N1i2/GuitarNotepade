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
}
