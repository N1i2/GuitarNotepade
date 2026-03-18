"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import {
  SubscriptionsService,
  SubscriptionDto,
} from "@/lib/api/subscriptions-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Users, X } from "lucide-react";

export default function SubscriptionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isGuest } = useAuth();
  const toast = useToast();

  const [subscriptions, setSubscriptions] = useState<SubscriptionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const userSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.isUserSub),
    [subscriptions],
  );
  const albumSubscriptions = useMemo(
    () => subscriptions.filter((s) => !s.isUserSub),
    [subscriptions],
  );

  const loadSubscriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await SubscriptionsService.getMySubscriptions();
      setSubscriptions(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load subscriptions");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && isGuest) {
      toast.warning("Access denied", {
        description: "Please log in to view subscriptions.",
      });
      return;
    }

    if (!authLoading && user && !isGuest) {
      loadSubscriptions();
    }
  }, [authLoading, isGuest, user, router, toast, loadSubscriptions]);

  const handleUnsubscribe = async (subscription: SubscriptionDto) => {
    setActionLoadingId(subscription.id);
    try {
      if (subscription.isUserSub) {
        await SubscriptionsService.unsubscribeFromUser(subscription.targetId);
      } else {
        await SubscriptionsService.unsubscribeFromAlbum(subscription.targetId);
      }
      toast.success("Unsubscribed successfully");
      await loadSubscriptions();
    } catch (error: any) {
      toast.error(error.message || "Failed to unsubscribe");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <main className="min-h-screen container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
            <p className="text-muted-foreground mt-2">
              Here you can manage your subscriptions to users and albums.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <Badge variant="secondary">{subscriptions.length} total</Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subscription list</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2 mt-2" />
                    </div>
                    <Skeleton className="h-9 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Users</h2>
                    <Badge variant="outline">{userSubscriptions.length}</Badge>
                  </div>
                  {userSubscriptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-2">
                      You are not subscribed to any users yet.
                    </p>
                  ) : (
                    <div className="space-y-3 mt-4">
                      {userSubscriptions.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between gap-4 rounded-lg border p-4"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{sub.subName}</span>
                            <span className="text-xs text-muted-foreground">
                              Subscribed on{" "}
                              {new Date(sub.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleUnsubscribe(sub)}
                            disabled={!!actionLoadingId}
                          >
                            {actionLoadingId === sub.id ? (
                              "Unsubscribing..."
                            ) : (
                              <span className="flex items-center gap-2">
                                <X className="h-3 w-3" />
                                Unsubscribe
                              </span>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Albums</h2>
                    <Badge variant="outline">{albumSubscriptions.length}</Badge>
                  </div>
                  {albumSubscriptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-2">
                      You are not subscribed to any albums yet.
                    </p>
                  ) : (
                    <div className="space-y-3 mt-4">
                      {albumSubscriptions.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between gap-4 rounded-lg border p-4"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{sub.subName}</span>
                            <span className="text-xs text-muted-foreground">
                              Subscribed on{" "}
                              {new Date(sub.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleUnsubscribe(sub)}
                            disabled={!!actionLoadingId}
                          >
                            {actionLoadingId === sub.id ? (
                              "Unsubscribing..."
                            ) : (
                              <span className="flex items-center gap-2">
                                <X className="h-3 w-3" />
                                Unsubscribe
                              </span>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
