"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useNotifications } from "@/hooks/use-notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Bell, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MessagesPage() {
  const router = useRouter();
  const { isLoading: authLoading, user } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    reload,
    markAllAsRead,
  } = useNotifications();
  const toast = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      toast.warning("Access denied", {
        description: "Please log in to view your notifications.",
      });
    }
  }, [authLoading, user, router, toast]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, toast]);

  useEffect(() => {
    if (!isLoading && notifications.some((n) => !n.isRead)) {
      markAllAsRead();
    }
  }, [isLoading, notifications, markAllAsRead]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground mt-2">
              Here you can see updates from subscriptions (new songs, albums,
              etc.).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <Badge variant="secondary">{unreadCount} unread</Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
                <p className="text-sm text-muted-foreground">
                  You have no notifications yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg border p-4 flex items-start gap-3 hover:bg-muted/40 transition-colors ${
                      notification.isRead ? "bg-muted/40" : "bg-white/80"
                    }`}
                  >
                    <div className="mt-1">
                      {notification.isRead ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium">
                          {notification.type}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
