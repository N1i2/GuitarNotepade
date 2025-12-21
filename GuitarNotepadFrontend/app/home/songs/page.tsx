"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { SongDto, SongSearchResultDto } from "@/types/songs";
import { SongsService } from "@/lib/api/song-service";
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
import {
  Search,
  Plus,
  Grid3x3,
  User,
  Eye,
  EyeOff,
  Filter,
  Music2,
  Lock,
  Star,
  MessageSquare,
  GitBranch,
  Tag,
  Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/user-management/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface SongGridItem {
  id: string;
  title: string;
  artist?: string;
  isPublic: boolean;
  ownerId: string;
  ownerNickname: string;
  chordCount: number;
  patternCount: number;
  createdAt: string;
  updatedAt?: string;
  canEdit: boolean;
  isForked: boolean;
  averageBeautifulRating?: number;
  averageDifficultyRating?: number;
  reviewCount: number;
  commentCount: number;
  genre?: string;
  theme?: string;
  key?: string;
  difficulty?: string;
}

const genres = [
  "Rock",
  "Pop",
  "Jazz",
  "Blues",
  "Folk",
  "Country",
  "Classical",
  "Metal",
  "Punk",
  "Reggae",
  "Hip-Hop",
  "Electronic",
  "R&B",
  "Soul",
  "Funk",
  "Disco",
];

const themes = [
  "Love",
  "Life",
  "Nature",
  "Travel",
  "Friendship",
  "Family",
  "Work",
  "Party",
  "Sadness",
  "Joy",
  "Hope",
  "Dream",
  "Social",
  "Political",
  "Religious",
  "Philosophical",
];

export default function SongsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  const [allSongs, setAllSongs] = useState<SongDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSongsCount, setTotalSongsCount] = useState(0);
  const [showOnlyMySongs, setShowOnlyMySongs] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedTheme, setSelectedTheme] = useState<string>("all");

  const [useBeautyFilter, setUseBeautyFilter] = useState(false);
  const [useDifficultyFilter, setUseDifficultyFilter] = useState(false);

  const [beautyRange, setBeautyRange] = useState<[number, number]>([1, 5]);
  const [difficultyRange, setDifficultyRange] = useState<[number, number]>([
    1, 5,
  ]);

  const [searchInText, setSearchInText] = useState(false);

  const pageSize = 12;

  const [isReadyToLoad, setIsReadyToLoad] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      setIsReadyToLoad(true);
    }
  }, [authLoading]);

  const filteredSongs = useMemo(() => {
    let songsArray = [...allSongs];

    if (showOnlyMySongs && user) {
      songsArray = songsArray.filter((song) => song.ownerId === user.id);
    }

    if (visibilityFilter === "public") {
      songsArray = songsArray.filter((song) => song.isPublic);
    } else if (visibilityFilter === "private") {
      songsArray = songsArray.filter((song) => !song.isPublic);
    }

    if (selectedGenre !== "all") {
      songsArray = songsArray.filter((song) => {
        if (!song.genre) return false;
        if (selectedGenre === "Empty") {
          return !song.genre || song.genre.trim() === "";
        }
        return song.genre.toLowerCase() === selectedGenre.toLowerCase();
      });
    }

    if (selectedTheme !== "all") {
      songsArray = songsArray.filter((song) => {
        if (!song.theme) return false;
        if (selectedTheme === "Empty") {
          return !song.theme || song.theme.trim() === "";
        }
        return song.theme.toLowerCase() === selectedTheme.toLowerCase();
      });
    }

    if (useBeautyFilter) {
      songsArray = songsArray.filter((song) => {
        if (!song.averageBeautifulRating) return false;
        return (
          song.averageBeautifulRating >= beautyRange[0] &&
          song.averageBeautifulRating <= beautyRange[1]
        );
      });
    }

    if (useDifficultyFilter) {
      songsArray = songsArray.filter((song) => {
        if (!song.averageDifficultyRating) return false;
        return (
          song.averageDifficultyRating >= difficultyRange[0] &&
          song.averageDifficultyRating <= difficultyRange[1]
        );
      });
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      songsArray = songsArray.filter((song) => {
        if (
          song.title.toLowerCase().includes(searchLower) ||
          (song.artist && song.artist.toLowerCase().includes(searchLower)) ||
          (song.ownerName && song.ownerName.toLowerCase().includes(searchLower)) ||
          (song.genre && song.genre.toLowerCase().includes(searchLower)) ||
          (song.theme && song.theme.toLowerCase().includes(searchLower))
        ) {
          return true;
        }

        if (searchInText && song.fullText) {
          return song.fullText.toLowerCase().includes(searchLower);
        }

        return false;
      });
    }

    songsArray.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "artist":
          aValue = (a.artist || "").toLowerCase();
          bValue = (b.artist || "").toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "updatedAt":
          aValue = new Date(a.updatedAt || a.createdAt);
          bValue = new Date(b.updatedAt || b.createdAt);
          break;
        case "averageBeautiful":
          aValue = a.averageBeautifulRating || 0;
          bValue = b.averageBeautifulRating || 0;
          break;
        case "averageDifficulty":
          aValue = a.averageDifficultyRating || 0;
          bValue = b.averageDifficultyRating || 0;
          break;
        case "reviewCount":
          aValue = a.reviewCount || 0;
          bValue = b.reviewCount || 0;
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
    const paginated = songsArray.slice(startIndex, startIndex + pageSize);

    return {
      items: paginated,
      totalCount: songsArray.length,
      currentPage,
      totalPages: Math.ceil(songsArray.length / pageSize),
      hasPreviousPage: currentPage > 1,
      hasNextPage: startIndex + pageSize < songsArray.length,
    };
  }, [
    allSongs,
    searchTerm,
    currentPage,
    showOnlyMySongs,
    visibilityFilter,
    selectedGenre,
    selectedTheme,
    sortBy,
    sortOrder,
    useBeautyFilter,
    beautyRange,
    useDifficultyFilter,
    difficultyRange,
    searchInText,
    user,
  ]);

  const loadAllSongs = async () => {
    setIsLoading(true);
    try {
      console.log("Loading songs with user:", user?.id);
      
      let allSongsData: SongDto[] = [];
      let currentPageNum = 1;
      let hasMore = true;
      const loadPageSize = 100;

      const userId = user?.id ? `${user.id}` : "";

      while (hasMore) {
        const data: SongSearchResultDto = await SongsService.searchSongs({
          userId: userId,
          page: currentPageNum,
          pageSize: loadPageSize,
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        allSongsData = [...allSongsData, ...data.songs];

        if (
          data.songs.length < loadPageSize ||
          currentPageNum === data.totalPages
        ) {
          hasMore = false;
          setTotalSongsCount(data.totalCount);
        } else {
          currentPageNum++;
        }
      }

      setAllSongs(allSongsData);
    } catch (error: any) {
      console.error("Failed to load songs:", error);
      
      if (error.status === 400) {
        toast.error("Invalid request. Please try again.");
      } else if (error.status === 401 || error.status === 403) {
        try {
          const publicData: SongSearchResultDto = await SongsService.searchSongs({
            userId: `${user?.id}`,
            isPublic: true,
            page: 1,
            pageSize: 50,
            sortBy: "createdAt",
            sortOrder: "desc",
          });
          
          setAllSongs(publicData.songs);
          setTotalSongsCount(publicData.totalCount);
        } catch (publicError: any) {
          toast.error("Failed to load public songs");
        }
      } else {
        toast.error("Failed to load songs. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isReadyToLoad) {
      loadAllSongs();
    }
  }, [isReadyToLoad]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [
    searchTerm,
    showOnlyMySongs,
    visibilityFilter,
    selectedGenre,
    selectedTheme,
    useBeautyFilter,
    beautyRange,
    useDifficultyFilter,
    difficultyRange,
    searchInText,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSongClick = (songId: string) => {
    router.push(`/home/songs/${songId}`);
  };

  const handleCreateNew = () => {
    router.push("/home/songs/create");
  };

  const handleEditSong = (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/home/songs/edit/${songId}`);
  };

  const handleForkSong = (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/home/songs/fork/${songId}`);
  };

  const handleToggleVisibility = async (
    songId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      const song = allSongs.find((s) => s.id === songId);
      if (!song) return;

      const updatedSong = await SongsService.toggleSongVisibility(
        songId,
        !song.isPublic
      );
      setAllSongs((prev) =>
        prev.map((song) => (song.id === songId ? updatedSong : song))
      );
      toast.success(
        `Song is now ${updatedSong.isPublic ? "public" : "private"}`
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle visibility");
    }
  };

  const getSongItemsForGrid = (): SongGridItem[] => {
    return filteredSongs.items.map((song) => {
      const canEdit = user
        ? user.id === song.ownerId || user.role === "Admin"
        : false;

      const chordCount = Array.isArray(song.chords) ? song.chords.length : 0;
      
      const patternCount = Array.isArray(song.patterns) ? song.patterns.length : 0;

      return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        isPublic: song.isPublic,
        ownerId: song.ownerId,
        ownerNickname: song.ownerName || "Unknown",
        chordCount,
        patternCount,
        createdAt: song.createdAt,
        updatedAt: song.updatedAt,
        canEdit,
        isForked: !!song.parentSongId,
        averageBeautifulRating: song.averageBeautifulRating,
        averageDifficultyRating: song.averageDifficultyRating,
        reviewCount: song.reviewCount || 0,
        commentCount: song.commentsCount || 0,
        genre: song.genre,
        theme: song.theme,
        key: song.key,
        difficulty: song.difficulty,
      };
    });
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderRatingStars = (rating?: number) => {
    if (!rating) return null;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= Math.round(rating)
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-xs font-medium ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const clearAllFilters = () => {
    setShowOnlyMySongs(false);
    setVisibilityFilter("all");
    setSelectedGenre("all");
    setSelectedTheme("all");
    setSearchTerm("");
    setSearchInText(false);

    setUseBeautyFilter(false);
    setUseDifficultyFilter(false);
    setBeautyRange([1, 5]);
    setDifficultyRange([1, 5]);
  };

  const hasActiveFilters = () => {
    return (
      showOnlyMySongs ||
      visibilityFilter !== "all" ||
      selectedGenre !== "all" ||
      selectedTheme !== "all" ||
      searchTerm ||
      searchInText ||
      useBeautyFilter ||
      useDifficultyFilter ||
      (useBeautyFilter && (beautyRange[0] > 1 || beautyRange[1] < 5)) ||
      (useDifficultyFilter &&
        (difficultyRange[0] > 1 || difficultyRange[1] < 5))
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
            <h1 className="text-3xl font-bold tracking-tight">Songs Library</h1>
            <p className="text-muted-foreground mt-2">
              Browse and manage guitar songs. Click any song to view its
              details.
            </p>
          </div>
          <div className="hidden md:block">
            <Card className="border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Music2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Song Database</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isLoading
                    ? "Loading songs..."
                    : `${totalSongsCount} total songs`}
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
                    placeholder="Search songs by title, artist, or creator..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="searchInText"
                    checked={searchInText}
                    onCheckedChange={(checked) =>
                      setSearchInText(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="searchInText"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Search in text
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showOnlyMySongs"
                    checked={showOnlyMySongs}
                    onCheckedChange={(checked) =>
                      setShowOnlyMySongs(checked as boolean)
                    }
                    disabled={!user}
                  />
                  <Label
                    htmlFor="showOnlyMySongs"
                    className={`text-sm font-medium cursor-pointer ${
                      !user ? "text-muted-foreground" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {showOnlyMySongs ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span>Only my songs</span>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="hidden md:flex">
                    <Music2 className="h-3 w-3 mr-1" />
                    {isLoading ? "..." : filteredSongs.totalCount} songs
                  </Badge>
                  <Button
                    onClick={handleCreateNew}
                    variant="default"
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Song
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
                    <SelectItem value="all">All Songs</SelectItem>
                    <SelectItem value="public">Public Only</SelectItem>
                    <SelectItem value="private">Private Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="genreFilter"
                  className="text-sm font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Genre
                  </div>
                </Label>
                <Select
                  value={selectedGenre}
                  onValueChange={setSelectedGenre}
                >
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
                <Label
                  htmlFor="themeFilter"
                  className="text-sm font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Theme
                  </div>
                </Label>
                <Select
                  value={selectedTheme}
                  onValueChange={setSelectedTheme}
                >
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useBeautyFilter"
                    checked={useBeautyFilter}
                    onCheckedChange={(checked) => {
                      setUseBeautyFilter(checked as boolean);
                      if (checked) {
                        setBeautyRange([1, 5]);
                      }
                    }}
                  />
                  <Label
                    htmlFor="useBeautyFilter"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Filter by Beauty Rating
                  </Label>
                </div>
                {useBeautyFilter && (
                  <div className="mt-2 pl-6">
                    <Label className="text-sm font-medium">
                      Beauty: {beautyRange[0]}-{beautyRange[1]}
                    </Label>
                    <Slider
                      value={beautyRange}
                      min={1}
                      max={5}
                      step={0.5}
                      onValueChange={setBeautyRange as any}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useDifficultyFilter"
                    checked={useDifficultyFilter}
                    onCheckedChange={(checked) => {
                      setUseDifficultyFilter(checked as boolean);
                      if (checked) {
                        setDifficultyRange([1, 5]);
                      }
                    }}
                  />
                  <Label
                    htmlFor="useDifficultyFilter"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Filter by Difficulty Rating
                  </Label>
                </div>
                {useDifficultyFilter && (
                  <div className="mt-2 pl-6">
                    <Label className="text-sm font-medium">
                      Difficulty: {difficultyRange[0]}-{difficultyRange[1]}
                    </Label>
                    <Slider
                      value={difficultyRange}
                      min={1}
                      max={5}
                      step={0.5}
                      onValueChange={setDifficultyRange as any}
                      className="w-full"
                    />
                  </div>
                )}
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
                    <SelectItem value="artist">Artist</SelectItem>
                    <SelectItem value="averageBeautiful">Beauty</SelectItem>
                    <SelectItem value="averageDifficulty">
                      Difficulty
                    </SelectItem>
                    <SelectItem value="reviewCount">Reviews</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters() && (
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>

            {user && showOnlyMySongs && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 dark:text-blue-300">
                    Showing only songs that you own
                  </span>
                </div>
              </div>
            )}

            {!user && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-sm">
                  <EyeOff className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-300">
                    Sign in to use "Only my songs" filter
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
              {useBeautyFilter && (
                <Badge variant="secondary" className="text-xs">
                  Beauty: {beautyRange[0]}-{beautyRange[1]}
                </Badge>
              )}
              {useDifficultyFilter && (
                <Badge variant="secondary" className="text-xs">
                  Difficulty: {difficultyRange[0]}-{difficultyRange[1]}
                </Badge>
              )}
              {useBeautyFilter && !useDifficultyFilter && (
                <span className="text-xs text-muted-foreground">
                  (Showing only songs with beauty ratings)
                </span>
              )}
              {useDifficultyFilter && !useBeautyFilter && (
                <span className="text-xs text-muted-foreground">
                  (Showing only songs with difficulty ratings)
                </span>
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
                  {showOnlyMySongs ? "My Songs" : "All Songs"}
                  {visibilityFilter === "public" && " (Public)"}
                  {visibilityFilter === "private" && " (Private)"}
                </CardTitle>
                {!isLoading && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({filteredSongs.totalCount} found)
                  </span>
                )}
              </div>
              {!isLoading && filteredSongs.items.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {filteredSongs.totalPages}
                </div>
              )}
            </div>
            <CardDescription>
              {showOnlyMySongs
                ? "Songs that you own. Click edit icon to modify."
                : "Click any song to view its structure, chords, and patterns."}
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
            ) : filteredSongs.items.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getSongItemsForGrid().map((song) => (
                    <Card
                      key={song.id}
                      className={`cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg border-2 ${getSongColor(
                        song.title
                      )} relative group overflow-hidden`}
                      onClick={() => handleSongClick(song.id)}
                    >
                      <CardContent className="p-6 h-full flex flex-col">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {!song.isPublic && (
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <Lock className="h-3 w-3" />
                              Private
                            </Badge>
                          )}
                          {song.isForked && (
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <GitBranch className="h-3 w-3" />
                              Forked
                            </Badge>
                          )}
                          {song.canEdit && (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <User className="h-3 w-3" />
                              Owner
                            </Badge>
                          )}
                          {song.genre && song.genre !== "Empty" && (
                            <Badge variant="outline">
                              <Tag className="h-3 w-3 mr-1" />
                              {song.genre}
                            </Badge>
                          )}
                          {song.theme && song.theme !== "Empty" && (
                            <Badge variant="outline">
                              <Hash className="h-3 w-3 mr-1" />
                              {song.theme}
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-xl font-bold mb-1 line-clamp-1">
                          {song.title}
                        </h3>

                        <p className="text-muted-foreground mb-3 line-clamp-1">
                          {song.artist || "No artist"}
                        </p>

                        <div className="mb-4 space-y-2">
                          {song.averageBeautifulRating && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Beauty:
                              </span>
                              {renderRatingStars(song.averageBeautifulRating)}
                            </div>
                          )}
                          {song.averageDifficultyRating && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Difficulty:
                              </span>
                              {renderRatingStars(song.averageDifficultyRating)}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-md">
                            <div className="text-lg font-bold">
                              {song.chordCount}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Chords
                            </div>
                          </div>
                          <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-md">
                            <div className="text-lg font-bold">
                              {song.patternCount}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Patterns
                            </div>
                          </div>
                          <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-md">
                            <div className="text-lg font-bold">
                              {song.reviewCount}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <MessageSquare className="h-3 w-3 inline mr-1" />
                              Reviews
                            </div>
                          </div>
                        </div>

                        {(song.key || song.difficulty) && (
                          <div className="mb-4 flex flex-wrap gap-2">
                            {song.key && (
                              <div className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                Key: {song.key}
                              </div>
                            )}
                            {song.difficulty && (
                              <div className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                                Difficulty: {song.difficulty}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-auto pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              <div className="text-muted-foreground">
                                By {song.ownerNickname || "Unknown"}
                              </div>
                              <div className="text-xs">
                                {formatDate(song.createdAt)}
                              </div>
                            </div>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {song.canEdit && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                                    onClick={(e) => handleEditSong(song.id, e)}
                                    title="Edit song"
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
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredSongs.totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={filteredSongs.currentPage}
                      totalPages={filteredSongs.totalPages}
                      onPageChange={handlePageChange}
                      hasPreviousPage={filteredSongs.hasPreviousPage}
                      hasNextPage={filteredSongs.hasNextPage}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">
                  {showOnlyMySongs ? "No songs found" : "No songs available"}
                </h3>
                <p className="text-muted-foreground mt-2">
                  {searchTerm
                    ? `No songs matching "${searchTerm}"`
                    : showOnlyMySongs
                    ? "You haven't created any songs yet. Create your first one!"
                    : "No songs available yet. Create the first one!"}
                </p>
                {(searchTerm ||
                  showOnlyMySongs ||
                  visibilityFilter !== "all" ||
                  selectedGenre !== "all" ||
                  selectedTheme !== "all" ||
                  useBeautyFilter ||
                  useDifficultyFilter) && (
                  <div className="flex gap-2 justify-center mt-4 flex-wrap">
                    <Button variant="default" onClick={handleCreateNew}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Song
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