"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { AlbumWithSongsDto, SongInAlbumDto } from "@/types/albom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Music,
  User,
  Calendar,
  Clock,
  Globe,
  Lock,
  Tag,
  Hash,
  Disc,
  Plus,
  Search,
  X,
  Check,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SongDto } from "@/types/songs";
import { SongsService } from "@/lib/api/song-service";
import { AlbumService } from "@/lib/api/albom-service";

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  const albumId = params.albumId as string;

  const [album, setAlbum] = useState<AlbumWithSongsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addSongsDialogOpen, setAddSongsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(9);

  const [availableSongs, setAvailableSongs] = useState<SongDto[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);

  const loadAlbum = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await AlbumService.getAlbumWithSongs(albumId);
      setAlbum(data);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to load album";
      toast.error(message);
      router.push("/home/albums");
    } finally {
      setIsLoading(false);
    }
  }, [albumId, router, toast]);

  const loadAvailableSongs = useCallback(async () => {
    if (!user) return;

    setIsLoadingSongs(true);
    try {
      const response = await SongsService.searchSongs({
        userId: user.id,
        page: 1,
        pageSize: 100,
        sortBy: "title",
        sortOrder: "asc",
      });

      const albumSongIds = album?.songs.map((song) => song.id) || [];
      const filteredSongs = response.songs.filter(
        (song) => !albumSongIds.includes(song.id),
      );

      setAvailableSongs(filteredSongs);
    } catch (error: unknown) {
      toast.error("Failed to load available songs");
    } finally {
      setIsLoadingSongs(false);
    }
  }, [album, toast, user]);

  useEffect(() => {
    if (!authLoading && albumId) {
      loadAlbum();
    }
  }, [albumId, authLoading, loadAlbum]);

  useEffect(() => {
    if (addSongsDialogOpen && album && user) {
      loadAvailableSongs();
    }
  }, [addSongsDialogOpen, album, user, loadAvailableSongs]);

  const handleEdit = () => {
    router.push(`/home/albums/edit/${albumId}`);
  };

  const handleDelete = async () => {
    if (!album) return;

    setIsDeleting(true);
    try {
      await AlbumService.deleteAlbum(albumId);
      toast.success(`Album "${album.title}" deleted successfully`);
      router.push("/home/albums");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete album";
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleSongClick = (songId: string) => {
    router.push(`/home/songs/${songId}`);
  };

  const handleAddSongs = async () => {
    if (selectedSongs.length === 0) {
      toast.error("Please select at least one song");
      return;
    }

    try {
      for (const songId of selectedSongs) {
        await AlbumService.addSongToAlbum(albumId, songId);
      }

      toast.success(`Added ${selectedSongs.length} song(s) to album`);
      setAddSongsDialogOpen(false);
      setSelectedSongs([]);
      loadAlbum();
    } catch (error: any) {
      toast.error(error.message || "Failed to add songs to album");
    }
  };

  const handleRemoveSong = async (songId: string, songTitle: string) => {
    try {
      await AlbumService.removeSongFromAlbum(albumId, songId);
      toast.success(`Removed "${songTitle}" from album`);
      loadAlbum();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove song from album");
    }
  };

  const handleSongSelect = (songId: string) => {
    setSelectedSongs((prev) =>
      prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId],
    );
  };

  const isFavoriteAlbum = album?.title.toLowerCase() === "favorite";
  const canDelete =
    album &&
    (user?.id === album.ownerId || user?.role === "Admin") &&
    !isFavoriteAlbum;
  const canManage = album && user?.id === album.ownerId && !isFavoriteAlbum;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getGradientClass = (title: string) => {
    const gradients = [
      "bg-gradient-to-br from-blue-500 to-purple-600",
      "bg-gradient-to-br from-teal-500 to-green-600",
      "bg-gradient-to-br from-amber-500 to-orange-600",
      "bg-gradient-to-br from-rose-500 to-pink-600",
      "bg-gradient-to-br from-indigo-500 to-blue-600",
      "bg-gradient-to-br from-emerald-500 to-teal-600",
    ];

    const hash = title
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  const getSongColor = (title: string) => {
    const colors = [
      "bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/20 border-teal-200 dark:border-teal-800",
      "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800",
      "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800",
      "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800",
      "bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-900/20 border-rose-200 dark:border-rose-800",
      "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    ];

    const hash = title
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const renderRatingStars = (rating?: number) => {
    if (!rating) return null;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            className={`w-3 h-3 rounded-full ${
              star <= rating ? "bg-yellow-500" : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
        ))}
        <span className="text-xs font-medium ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const filteredAvailableSongs = availableSongs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (song.artist || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const hasAudio = (song: SongInAlbumDto): boolean => {
    return !!(song.customAudioUrl && song.customAudioType);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Disc className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Album not found</h3>
            <p className="text-muted-foreground mt-2">
              Album was not found or has been removed.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/home/albums")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Albums
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const paginatedSongs = album.songs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/home/albums")}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Albums
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {album.title}
              </h1>
              <Badge variant={album.isPublic ? "default" : "secondary"}>
                {album.isPublic ? (
                  <>
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </>
                )}
              </Badge>
              {isFavoriteAlbum && (
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300"
                >
                  Favorite
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canManage && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddSongsDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Songs
                </Button>
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </>
            )}

            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Disc className="h-5 w-5" />
                  Album Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`h-full w-full ${getGradientClass(
                        album.title,
                      )} flex items-center justify-center`}
                    >
                      <span className="text-4xl font-bold text-white">
                        {album.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {album.description || "No description provided"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {album.genre && album.genre !== "Empty" && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          Genre
                        </div>
                        <Badge variant="outline">{album.genre}</Badge>
                      </div>
                    )}

                    {album.theme && album.theme !== "Empty" && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          Theme
                        </div>
                        <Badge variant="outline">{album.theme}</Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {album.countOfSongs}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Songs in Album
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <div>
                        Created by{" "}
                        <span className="font-medium">
                          {album.ownerName || "Unknown"}
                        </span>
                        {user?.id === album.ownerId && (
                          <Badge variant="outline" className="ml-2">
                            You
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Created {formatDate(album.createdAt)}</span>
                    </div>

                    {album.updatedAt && album.updatedAt !== album.createdAt && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Updated {formatDate(album.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Songs in Album
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {album.songs.length} song
                      {album.songs.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  Click any song to view its details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {album.songs.length === 0 ? (
                  <div className="text-center py-12">
                    <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No songs yet</h3>
                    <p className="text-muted-foreground mt-2">
                      This album does not have any songs yet.
                    </p>
                    <Button
                      onClick={() => setAddSongsDialogOpen(true)}
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Song
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedSongs.map((song) => (
                        <div key={song.id} className="relative group">
                          <Card
                            className={`cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg border-2 ${getSongColor(
                              song.title,
                            )}`}
                            onClick={() => handleSongClick(song.id)}
                          >
                            <CardContent className="p-4">
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveSong(song.id, song.title);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>

                              <div className="flex flex-wrap gap-1 mb-2">
                                {!song.isPublic && (
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1 text-xs"
                                  >
                                    <Lock className="h-2.5 w-2.5" />
                                    Private
                                  </Badge>
                                )}
                                {hasAudio(song) && (
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/30"
                                  >
                                    <Music className="h-2.5 w-2.5" />
                                    Audio
                                  </Badge>
                                )}
                              </div>

                              <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                                {song.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                                {song.artist || "No artist"}
                              </p>

                              <div className="mb-3 space-y-1">
                                {song.averageBeautifulRating && (
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      Beauty:
                                    </span>
                                    {renderRatingStars(
                                      song.averageBeautifulRating,
                                    )}
                                  </div>
                                )}
                                {song.averageDifficultyRating && (
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      Difficulty:
                                    </span>
                                    {renderRatingStars(
                                      song.averageDifficultyRating,
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-1 mb-3">
                                <div className="text-center p-1 bg-white/50 dark:bg-gray-800/50 rounded">
                                  <div className="font-bold">
                                    {song.chordCount}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    Chords
                                  </div>
                                </div>
                                <div className="text-center p-1 bg-white/50 dark:bg-gray-800/50 rounded">
                                  <div className="font-bold">
                                    {song.patternCount}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    Patterns
                                  </div>
                                </div>
                                <div className="text-center p-1 bg-white/50 dark:bg-gray-800/50 rounded">
                                  <div className="font-bold">
                                    {song.reviewCount}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    Reviews
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <div>
                                  <div className="text-muted-foreground">
                                    By {song.ownerName}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {new Date(
                                      song.createdAt,
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSongClick(song.id);
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>

                    {album.songs.length > pageSize && (
                      <div className="mt-6 flex justify-center">
                        <div className="flex gap-2">
                          {Array.from(
                            {
                              length: Math.ceil(album.songs.length / pageSize),
                            },
                            (_, i) => i + 1,
                          ).map((pageNum) => (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Album</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{album.title}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addSongsDialogOpen} onOpenChange={setAddSongsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Songs to Album</DialogTitle>
            <DialogDescription>
              Select songs to add to "{album.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search songs by title or artist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoadingSongs ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading songs...</p>
              </div>
            ) : filteredAvailableSongs.length === 0 ? (
              <div className="py-8 text-center">
                <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">
                  {searchTerm ? "No songs found" : "No songs available"}
                </h3>
                <p className="text-muted-foreground mt-2">
                  {searchTerm
                    ? `No songs matching "${searchTerm}"`
                    : "All your songs are already in this album or you haven't created any songs yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredAvailableSongs.map((song) => (
                  <div
                    key={song.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSongs.includes(song.id)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleSongSelect(song.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          selectedSongs.includes(song.id)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {selectedSongs.includes(song.id) ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Music className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{song.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {song.artist || "No artist"} • {song.ownerName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {song.genre && song.genre !== "Empty" && (
                        <Badge variant="outline" className="text-xs">
                          {song.genre}
                        </Badge>
                      )}
                      {!song.isPublic && (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {selectedSongs.length} song
                {selectedSongs.length !== 1 ? "s" : ""} selected
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddSongsDialogOpen(false);
                    setSelectedSongs([]);
                    setSearchTerm("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSongs}
                  disabled={selectedSongs.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Selected Songs
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
