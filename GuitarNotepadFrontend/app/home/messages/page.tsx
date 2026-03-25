"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Trash2, CheckCheck, X, Bell, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function getNotificationIcon(type: string) {
  switch (type) {
    case "AlbumDeleted":
      return "🗑️";
    case "SongAdded":
      return "🎵";
    case "SongRemoved":
      return "🎵";
    case "AlbumVisibilityChanged":
      return "👁️";
    default:
      return "📀";
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case "AlbumDeleted":
      return "text-red-500";
    case "SongAdded":
      return "text-green-500";
    case "SongRemoved":
      return "text-orange-500";
    case "AlbumVisibilityChanged":
      return "text-blue-500";
    default:
      return "text-purple-500";
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
  } = useNotifications(true);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    if (notification.albumId) {
      router.push(`/home/albums/${notification.albumId}`);
    } else if (notification.songId) {
      router.push(`/home/songs/${notification.songId}`);
    }
  };

  if (isGuest) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">
              Sign in to view notifications
            </h3>
            <p className="text-muted-foreground mt-2">
              You need to be logged in to see your notifications.
            </p>
            <Button className="mt-4" onClick={() => router.push("/login")}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground mt-2">
              Updates from albums you're subscribed to
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={deleteReadNotifications}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear read
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                All notifications
              </CardTitle>
              <Badge variant="outline">
                {unreadCount} unread / {notifications.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No notifications yet</h3>
                <p className="text-muted-foreground mt-2">
                  Subscribe to albums to get updates about changes
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push("/home/albums")}
                >
                  Browse Albums
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`group flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        !notification.isRead
                          ? "bg-primary/5 border-primary/20"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div
                        className={`shrink-0 text-2xl ${getNotificationColor(
                          notification.type,
                        )}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm ${
                              !notification.isRead ? "font-semibold" : ""
                            }`}
                          >
                            {notification.message}
                          </p>
                          <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                title="Mark as read"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {notification.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              {
                                addSuffix: true,
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
