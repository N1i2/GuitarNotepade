"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NotificationsService, NotificationDto } from "@/lib/api/notifications-service";

export function useNotifications(enabled = true) {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await NotificationsService.getMyNotifications(50, 0);
      setNotifications(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      if (!prev.some((n) => !n.isRead)) return prev;
      return prev.map((n) => ({ ...n, isRead: true }));
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      setNotifications([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    loadNotifications();
  }, [enabled]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    reload: loadNotifications,
    markAllAsRead,
  };
}
