import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  NotificationsService,
  NotificationDto,
} from "@/lib/api/notifications-service";
import { useToast } from "./use-toast";

export function useNotifications(autoRefresh: boolean = true) {
  const { user, isGuest } = useAuth();
  const toast = useToast();

  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadUnreadCount = useCallback(async () => {
    if (isGuest || !user) return;

    try {
      const count = await NotificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  }, [user, isGuest]);

  const loadNotifications = useCallback(async () => {
    if (isGuest || !user) return;

    setIsLoading(true);
    try {
      const data = await NotificationsService.getMyNotifications(50, 0);
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isGuest]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await NotificationsService.markAsRead(notificationId);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        toast.error("Failed to mark notification as read");
      }
    },
    [toast],
  );

  const markAllAsRead = useCallback(async () => {
    try {
      const result = await NotificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success(result.message);
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  }, [toast]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await NotificationsService.deleteNotification(notificationId);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        if (
          notifications.find((n) => n.id === notificationId)?.isRead === false
        ) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        toast.success("Notification deleted");
      } catch (error) {
        toast.error("Failed to delete notification");
      }
    },
    [toast, notifications],
  );

  const deleteReadNotifications = useCallback(async () => {
    try {
      const result = await NotificationsService.deleteReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      toast.success(result.message);
    } catch (error) {
      toast.error("Failed to delete read notifications");
    }
  }, [toast]);

  useEffect(() => {
    if (!autoRefresh) return;

    if (!isGuest && user) {
      loadNotifications();
      loadUnreadCount();

      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isGuest, autoRefresh, loadNotifications, loadUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
    refreshUnreadCount: loadUnreadCount,
  };
}
