"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import {
  SubscriptionsService,
  SubscriptionDto,
} from "@/lib/api/subscriptions-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Users, X, Disc } from "lucide-react";

export default function SubscriptionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isGuest } = useAuth();
  const toast = useToast();

  const [subscriptions, setSubscriptions] = useState<SubscriptionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const albumSubscriptions = useMemo(() => subscriptions, [subscriptions]);

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
      await SubscriptionsService.unsubscribe(subscription.targetId);
      toast.success("Unsubscribed successfully");
      await loadSubscriptions();
    } catch (error: any) {
      toast.error(error.message || "Failed to unsubscribe");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAlbumClick = (albumId: string) => {
    router.push(`/home/albums/${albumId}`);
  };

  return (
    <main className="min-h-screen container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Album Subscriptions
            </h1>
            <p className="text-muted-foreground mt-2">
              Here you can manage your subscriptions to albums.
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
            <CardDescription>
              You are subscribed to the following albums
            </CardDescription>
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
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Albums</h2>
                  <Badge variant="outline">{albumSubscriptions.length}</Badge>
                </div>
                {albumSubscriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <Disc className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">
                      No subscriptions yet
                    </h3>
                    <p className="text-muted-foreground mt-2">
                      You are not subscribed to any albums yet.
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
                  <div className="space-y-3">
                    {albumSubscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between gap-4 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleAlbumClick(sub.targetId)}
                      >
                        <div className="flex flex-col flex-1">
                          <span className="font-medium">{sub.targetName}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Subscribed on{" "}
                              {new Date(sub.createdAt).toLocaleDateString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Album
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnsubscribe(sub);
                          }}
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
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
