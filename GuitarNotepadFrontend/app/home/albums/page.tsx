"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { AlbumDto, AlbumGridItem, AlbumSearchResultDto } from "@/types/albom";
import { AlbumService } from "@/lib/api/albom-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Grid3x3,
  User,
  Eye,
  EyeOff,
  Filter,
  Disc,
  Lock,
  Music2,
  Tag,
  Hash,
} from "lucide-react";
import { Pagination } from "@/components/user-management/pagination";
import { genres, themes } from "@/lib/validations/album";

export default function AlbumsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  const [allAlbums, setAllAlbums] = useState<AlbumDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAlbumsCount, setTotalAlbumsCount] = useState(0);
  const [showOnlyMyAlbums, setShowOnlyMyAlbums] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedTheme, setSelectedTheme] = useState<string>("all");

  const pageSize = 12;

  const filteredAlbums = useMemo(() => {
    let albumsArray = [...allAlbums];

    if (showOnlyMyAlbums && user) {
      albumsArray = albumsArray.filter((album) => album.ownerId === user.id);
    }

    if (visibilityFilter === "public") {
      albumsArray = albumsArray.filter((album) => album.isPublic);
    } else if (visibilityFilter === "private") {
      albumsArray = albumsArray.filter((album) => !album.isPublic);
    }

    if (selectedGenre !== "all") {
      albumsArray = albumsArray.filter((album) => {
        if (!album.genre) return selectedGenre === "Empty";
        if (selectedGenre === "Empty") {
          return !album.genre || album.genre.trim() === "";
        }
        return album.genre.toLowerCase() === selectedGenre.toLowerCase();
      });
    }

    if (selectedTheme !== "all") {
      albumsArray = albumsArray.filter((album) => {
        if (!album.theme) return selectedTheme === "Empty";
        if (selectedTheme === "Empty") {
          return !album.theme || album.theme.trim() === "";
        }
        return album.theme.toLowerCase() === selectedTheme.toLowerCase();
      });
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      albumsArray = albumsArray.filter((album) => {
        return (
          album.title.toLowerCase().includes(searchLower) ||
          (album.description &&
            album.description.toLowerCase().includes(searchLower)) ||
          (album.ownerName &&
            album.ownerName.toLowerCase().includes(searchLower)) ||
          (album.genre && album.genre.toLowerCase().includes(searchLower)) ||
          (album.theme && album.theme.toLowerCase().includes(searchLower))
        );
      });
    }

    albumsArray.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "updatedAt":
          aValue = new Date(a.updatedAt || a.createdAt);
          bValue = new Date(b.updatedAt || b.createdAt);
          break;
        case "countOfSongs":
          aValue = a.countOfSongs || 0;
          bValue = b.countOfSongs || 0;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    const startIndex = (currentPage - 1) * pageSize;
    const paginated = albumsArray.slice(startIndex, startIndex + pageSize);

    return {
      items: paginated,
      totalCount: albumsArray.length,
      currentPage,
      totalPages: Math.ceil(albumsArray.length / pageSize),
      hasPreviousPage: currentPage > 1,
      hasNextPage: startIndex + pageSize < albumsArray.length,
    };
  }, [
    allAlbums,
    searchTerm,
    currentPage,
    showOnlyMyAlbums,
    visibilityFilter,
    selectedGenre,
    selectedTheme,
    sortBy,
    sortOrder,
    user,
  ]);

  const loadAllAlbums = async () => {
    setIsLoading(true);
    try {
      let allAlbumsData: AlbumDto[] = [];
      let currentPageNum = 1;
      let hasMore = true;
      const loadPageSize = 100;

      const userId = user?.id ? `${user.id}` : "";

      while (hasMore) {
        const data: AlbumSearchResultDto = await AlbumService.searchAlbums({
          userId: userId,
          page: currentPageNum,
          pageSize: loadPageSize,
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        console.log(data);

        allAlbumsData = [...allAlbumsData, ...(data.albums || [])];

        if (
          (data.albums?.length || 0) < loadPageSize ||
          currentPageNum === data.totalPages
        ) {
          hasMore = false;
          setTotalAlbumsCount(data.totalCount);
        } else {
          currentPageNum++;
        }
      }

      setAllAlbums(allAlbumsData);
    } catch (error: any) {
      if (error.status === 400) {
        toast.error("Invalid request. Please try again.");
      } else if (error.status === 401 || error.status === 403) {
        try {
          const publicData: AlbumSearchResultDto =
            await AlbumService.searchAlbums({
              userId: user?.id ? `${user.id}` : "",
              isPublic: true,
              page: 1,
              pageSize: 50,
              sortBy: "createdAt",
              sortOrder: "desc",
            });

          setAllAlbums(publicData.albums || []);
          setTotalAlbumsCount(publicData.totalCount);
        } catch (publicError: any) {
          toast.error("Failed to load public albums");
        }
      } else {
        toast.error("Failed to load albums. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadAllAlbums();
    }
  }, [authLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [
    searchTerm,
    showOnlyMyAlbums,
    visibilityFilter,
    selectedGenre,
    selectedTheme,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAlbumClick = (albumId: string) => {
    router.push(`/home/albums/${albumId}`);
  };

  const handleCreateNew = () => {
    router.push("/home/albums/create");
  };

  const handleEditAlbum = (albumId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/home/albums/edit/${albumId}`);
  };

  const getAlbumItemsForGrid = (): AlbumGridItem[] => {
    return filteredAlbums.items.map((album) => {
      const canEdit = user
        ? user.id === album.ownerId || user.role === "Admin"
        : false;

      return {
        id: album.id,
        title: album.title,
        isPublic: album.isPublic,
        ownerId: album.ownerId,
        ownerNickname: album.ownerName || "Unknown",
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
        canEdit,
        genre: album.genre,
        theme: album.theme,
        countOfSongs: album.countOfSongs || 0,
        coverUrl: album.coverUrl,
        description: album.description,
      };
    });
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

  const clearAllFilters = () => {
    setShowOnlyMyAlbums(false);
    setVisibilityFilter("all");
    setSelectedGenre("all");
    setSelectedTheme("all");
    setSearchTerm("");
  };

  const hasActiveFilters = () => {
    return (
      showOnlyMyAlbums ||
      visibilityFilter !== "all" ||
      selectedGenre !== "all" ||
      selectedTheme !== "all" ||
      searchTerm
    );
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
              Albums Library
            </h1>
            <p className="text-muted-foreground mt-2">
              Browse and manage music albums. Click any album to view its songs
              and details.
            </p>
          </div>
          <div className="hidden md:block">
            <Card className="border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Disc className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Album Database</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isLoading
                    ? "Loading albums..."
                    : `${totalAlbumsCount} total albums`}
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
                    placeholder="Search albums by title, description, or creator..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showOnlyMyAlbums"
                    checked={showOnlyMyAlbums}
                    onCheckedChange={(checked) =>
                      setShowOnlyMyAlbums(checked as boolean)
                    }
                    disabled={!user}
                  />
                  <Label
                    htmlFor="showOnlyMyAlbums"
                    className={`text-sm font-medium cursor-pointer ${
                      !user ? "text-muted-foreground" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {showOnlyMyAlbums ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span>Only my albums</span>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="hidden md:flex">
                    <Disc className="h-3 w-3 mr-1" />
                    {isLoading ? "..." : filteredAlbums.totalCount} albums
                  </Badge>
                  <Button
                    onClick={handleCreateNew}
                    variant="default"
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Album
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="visibilityFilter"
                  className="text-sm font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Visibility
                  </div>
                </Label>
                <Select
                  value={visibilityFilter}
                  onValueChange={setVisibilityFilter}
                >
                  <SelectTrigger id="visibilityFilter">
                    <SelectValue placeholder="Filter by visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Albums</SelectItem>
                    <SelectItem value="public">Public Only</SelectItem>
                    <SelectItem value="private">Private Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="genreFilter" className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Genre
                  </div>
                </Label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger id="genreFilter">
                    <SelectValue placeholder="Filter by genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="themeFilter" className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Theme
                  </div>
                </Label>
                <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                  <SelectTrigger id="themeFilter">
                    <SelectValue placeholder="Filter by theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Themes</SelectItem>
                    {themes.map((theme) => (
                      <SelectItem key={theme} value={theme}>
                        {theme}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortBy" className="text-sm font-medium">
                  Sort By
                </Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sortBy">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date Created</SelectItem>
                    <SelectItem value="updatedAt">Date Updated</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="countOfSongs">Song Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder" className="text-sm font-medium">
                  Sort Order
                </Label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger id="sortOrder">
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters() && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>

            {user && showOnlyMyAlbums && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 dark:text-blue-300">
                    Showing only albums that you own
                  </span>
                </div>
              </div>
            )}

            {!user && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-sm">
                  <EyeOff className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-300">
                    Sign in to use "Only my albums" filter
                  </span>
                </div>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {selectedGenre !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  Genre: {selectedGenre}
                </Badge>
              )}
              {selectedTheme !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  <Hash className="h-3 w-3 mr-1" />
                  Theme: {selectedTheme}
                </Badge>
              )}
              {visibilityFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  {visibilityFilter === "public"
                    ? "Public Only"
                    : "Private Only"}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3x3 className="h-5 w-5" />
                <CardTitle>
                  {showOnlyMyAlbums ? "My Albums" : "All Albums"}
                  {visibilityFilter === "public" && " (Public)"}
                  {visibilityFilter === "private" && " (Private)"}
                </CardTitle>
                {!isLoading && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({filteredAlbums.totalCount} found)
                  </span>
                )}
              </div>
              {!isLoading && filteredAlbums.items.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {filteredAlbums.totalPages}
                </div>
              )}
            </div>
            <CardDescription>
              {showOnlyMyAlbums
                ? "Albums that you own. Click edit icon to modify."
                : "Click any album to view its songs and details."}
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
            ) : filteredAlbums.items.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getAlbumItemsForGrid().map((album) => (
                    <div
                      key={album.id}
                      className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg relative group"
                      onClick={() => handleAlbumClick(album.id)}
                    >
                      <div className="h-full rounded-lg border-2 overflow-hidden relative">
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
                          album.title
                        )}"></div>
                    `;
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                          </div>
                        ) : (
                          <div
                            className={`absolute inset-0 ${getAlbumGradient(
                              album.title
                            )}`}
                          />
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
                              {album.canEdit && (
                                <Badge
                                  variant="secondary"
                                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white"
                                >
                                  <User className="h-3 w-3 mr-1" />
                                  Owner
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
                          </div>

                          <div className="mb-4">
                            <h3 className="text-xl font-bold text-white mb-2">
                              {album.title}
                            </h3>

                            {album.description && (
                              <p className="text-white/80 text-sm line-clamp-2 mb-3">
                                {album.description}
                              </p>
                            )}
                          </div>

                          <div className="mb-4">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="text-center p-2 bg-white/10 backdrop-blur-sm rounded-md border border-white/20">
                                <div className="text-lg font-bold text-white">
                                  {album.countOfSongs}
                                </div>
                                <div className="text-xs text-white/70">
                                  <Music2 className="h-3 w-3 inline mr-1" />
                                  Songs
                                </div>
                              </div>
                              <div className="text-center p-2 bg-white/10 backdrop-blur-sm rounded-md border border-white/20">
                                <div className="text-lg font-bold text-white">
                                  {album.theme && album.theme !== "Empty"
                                    ? "✓"
                                    : "—"}
                                </div>
                                <div className="text-xs text-white/70">
                                  <Hash className="h-3 w-3 inline mr-1" />
                                  Theme
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto pt-3 border-t border-white/20">
                            <div className="flex items-center justify-between">
                              <div className="text-sm">
                                <div className="text-white/70">
                                  By {album.ownerNickname || "Unknown"}
                                </div>
                                <div className="text-xs text-white/50">
                                  {formatDate(album.createdAt)}
                                </div>
                              </div>

                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                {album.canEdit && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 rounded-full bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                                    onClick={(e) =>
                                      handleEditAlbum(album.id, e)
                                    }
                                    title="Edit album"
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
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredAlbums.totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={filteredAlbums.currentPage}
                      totalPages={filteredAlbums.totalPages}
                      onPageChange={handlePageChange}
                      hasPreviousPage={filteredAlbums.hasPreviousPage}
                      hasNextPage={filteredAlbums.hasNextPage}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Disc className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">
                  {showOnlyMyAlbums ? "No albums found" : "No albums available"}
                </h3>
                <p className="text-muted-foreground mt-2">
                  {searchTerm
                    ? `No albums matching "${searchTerm}"`
                    : showOnlyMyAlbums
                    ? "You haven't created any albums yet. Create your first one!"
                    : "No albums available yet. Create the first one!"}
                </p>
                {(searchTerm ||
                  showOnlyMyAlbums ||
                  visibilityFilter !== "all" ||
                  selectedGenre !== "all" ||
                  selectedTheme !== "all") && (
                  <div className="flex gap-2 justify-center mt-4 flex-wrap">
                    <Button variant="default" onClick={handleCreateNew}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Album
                    </Button>
                    <Button variant="outline" onClick={clearAllFilters}>
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
