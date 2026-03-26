"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import {
  SubscriptionsService,
  SubscriptionWithAlbumDto,
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
import { Input } from "@/components/ui/input";
import {
  Search,
  Users,
  X,
  Disc,
  Grid3x3,
  Bell,
  BellOff,
  Lock,
  Music2,
  User,
  UserCircle,
  AtSign,
  Calendar,
  Tag,
  Hash,
} from "lucide-react";
import { Pagination } from "@/components/user-management/pagination";

export default function SubscriptionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isGuest } = useAuth();
  const toast = useToast();

  const [subscriptions, setSubscriptions] = useState<
    SubscriptionWithAlbumDto[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const filteredSubscriptions = useMemo(() => {
    let subs = [...subscriptions];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      subs = subs.filter(
        (sub) =>
          sub.targetName.toLowerCase().includes(searchLower) ||
          sub.album.description?.toLowerCase().includes(searchLower),
      );
    }

    const startIndex = (currentPage - 1) * pageSize;
    const paginated = subs.slice(startIndex, startIndex + pageSize);

    return {
      items: paginated,
      totalCount: subs.length,
      currentPage,
      totalPages: Math.ceil(subs.length / pageSize),
      hasPreviousPage: currentPage > 1,
      hasNextPage: startIndex + pageSize < subs.length,
    };
  }, [subscriptions, searchTerm, currentPage]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleUnsubscribe = async (subscription: SubscriptionWithAlbumDto) => {
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getAlbumGradient = (title: string) => {
    const gradients = [
      "bg-gradient-to-br from-blue-500 to-purple-600",
      "bg-gradient-to-br from-teal-500 to-green-600",
      "bg-gradient-to-br from-amber-500 to-orange-600",
      "bg-gradient-to-br from-rose-500 to-pink-600",
      "bg-gradient-to-br from-indigo-500 to-blue-600",
      "bg-gradient-to-br from-emerald-500 to-teal-600",
      "bg-gradient-to-br from-violet-500 to-purple-600",
      "bg-gradient-to-br from-fuchsia-500 to-pink-600",
    ];

    const hash = title
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <Skeleton className="h-20 w-40" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
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
          <div className="hidden md:block">
            <Card className="border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Subscriptions</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isLoading ? "Loading..." : `${subscriptions.length} total`}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search subscribed albums by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="hidden md:flex">
                  <Disc className="h-3 w-3 mr-1" />
                  {filteredSubscriptions.totalCount} albums
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3x3 className="h-5 w-5" />
                <CardTitle>My Subscriptions</CardTitle>
                {!isLoading && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({filteredSubscriptions.totalCount} found)
                  </span>
                )}
              </div>
              {!isLoading && filteredSubscriptions.items.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {filteredSubscriptions.totalPages}
                </div>
              )}
            </div>
            <CardDescription>
              Albums you are subscribed to. Click any album to view its details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-48 rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredSubscriptions.items.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSubscriptions.items.map((sub) => {
                    const album = sub.album;
                    const isFavorite = album.title.toLowerCase() === "favorite";

                    return (
                      <div
                        key={sub.id}
                        className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg relative group"
                        onClick={() => handleAlbumClick(sub.targetId)}
                      >
                        <div
                          className={`h-full rounded-lg border-2 overflow-hidden relative ${
                            isFavorite
                              ? "border-amber-500/50 shadow-lg shadow-amber-500/20"
                              : ""
                          }`}
                        >
                          {album.coverUrl ? (
                            <div className="absolute inset-0">
                              <img
                                src={album.coverUrl}
                                alt={album.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                  const parent = (e.target as HTMLImageElement)
                                    .parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="w-full h-full ${getAlbumGradient(
                                        album.title,
                                      )}"></div>
                                    `;
                                  }
                                }}
                              />
                              <div className="absolute inset-0 from-black/80 via-black/40 to-transparent" />
                            </div>
                          ) : (
                            <div
                              className={`absolute inset-0 ${getAlbumGradient(
                                album.title,
                              )} ${
                                isFavorite ? "from-amber-500 to-orange-600" : ""
                              }`}
                            />
                          )}

                          {isFavorite && (
                            <div className="absolute top-3 right-3 z-10">
                              <div className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <svg
                                  className="h-3 w-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Favorite
                              </div>
                            </div>
                          )}

                          <div className="relative h-full p-6 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex flex-wrap gap-2">
                                {!album.isPublic && (
                                  <Badge
                                    variant="outline"
                                    className="bg-black/40 backdrop-blur-sm border-white/30 text-white"
                                  >
                                    <Lock className="h-3 w-3 mr-1" />
                                    Private
                                  </Badge>
                                )}
                                {album.genre && album.genre !== "Empty" && (
                                  <Badge
                                    variant="outline"
                                    className="bg-black/40 backdrop-blur-sm border-white/30 text-white"
                                  >
                                    <Tag className="h-3 w-3 mr-1" />
                                    {album.genre}
                                  </Badge>
                                )}
                              </div>

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnsubscribe(sub);
                                }}
                                disabled={actionLoadingId === sub.id}
                                className="flex items-center gap-1"
                              >
                                {actionLoadingId === sub.id ? (
                                  "..."
                                ) : (
                                  <>
                                    <BellOff className="h-3 w-3" />
                                    Unsubscribe
                                  </>
                                )}
                              </Button>
                            </div>

                            <div className="mb-4">
                              <h3 className="text-xl font-bold text-white mb-2">
                                {album.title}
                                {isFavorite && (
                                  <span className="ml-2 text-xs font-normal text-amber-200">
                                    (System)
                                  </span>
                                )}
                              </h3>

                              {album.description && (
                                <p className="text-white/80 text-sm line-clamp-2 mb-3">
                                  {album.description}
                                </p>
                              )}
                            </div>

                            <div className="mb-4">
                              <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-white/10 backdrop-blur-sm rounded-md border border-white/20">
                                  <div className="text-lg font-bold text-white">
                                    {album.countOfSongs || 0}
                                  </div>
                                  <div className="text-xs text-white/70">
                                    <Music2 className="h-3 w-3 inline mr-1" />
                                    Songs
                                  </div>
                                </div>
                                <div className="text-center p-2 bg-white/10 backdrop-blur-sm rounded-md border border-white/20">
                                  <div className="text-lg font-bold text-white">
                                    {album.subscribersCount || 0}
                                  </div>
                                  <div className="text-xs text-white/70">
                                    <Users className="h-3 w-3 inline mr-1" />
                                    Subscribers
                                  </div>
                                </div>
                                {album.theme && album.theme !== "Empty" ? (
                                  <div className="text-center p-2 bg-white/10 backdrop-blur-sm rounded-md border border-white/20">
                                    <div className="text-sm font-medium text-white truncate">
                                      <Hash className="h-3 w-3 inline mr-1" />
                                      {album.theme.length > 10
                                        ? `${album.theme.substring(0, 10)}...`
                                        : album.theme}
                                    </div>
                                    <div className="text-xs text-white/70">
                                      Theme
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center p-2 bg-white/10 backdrop-blur-sm rounded-md border border-white/20">
                                    <div className="text-sm font-medium text-white">
                                      —
                                    </div>
                                    <div className="text-xs text-white/70">
                                      Theme
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-auto pt-3 border-t border-white/20">
                              <div className="flex items-center justify-between">
                                <div className="text-sm">
                                  <div className="text-white/70 flex items-center gap-1">
                                    <UserCircle className="h-3 w-3" />
                                    {album.ownerName || "Unknown"}
                                  </div>
                                  <div className="text-xs text-white/50">
                                    <Calendar className="h-3 w-3 inline mr-1" />
                                    Subscribed {formatDate(sub.createdAt)}
                                  </div>
                                </div>

                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 rounded-full bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAlbumClick(sub.targetId);
                                    }}
                                    title="View album"
                                  >
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                      />
                                    </svg>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredSubscriptions.totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={filteredSubscriptions.currentPage}
                      totalPages={filteredSubscriptions.totalPages}
                      onPageChange={handlePageChange}
                      hasPreviousPage={filteredSubscriptions.hasPreviousPage}
                      hasNextPage={filteredSubscriptions.hasNextPage}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Disc className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">
                  {searchTerm
                    ? "No matching subscriptions found"
                    : "No subscriptions yet"}
                </h3>
                <p className="text-muted-foreground mt-2">
                  {searchTerm
                    ? `No albums matching "${searchTerm}"`
                    : "You are not subscribed to any albums yet."}
                </p>
                {!searchTerm && (
                  <Button
                    variant="default"
                    className="mt-4"
                    onClick={() => router.push("/home/albums")}
                  >
                    Browse Albums
                  </Button>
                )}
                {searchTerm && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
