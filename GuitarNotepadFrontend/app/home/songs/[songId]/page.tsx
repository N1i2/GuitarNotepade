"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { SongsService } from "@/lib/api/song-service";
import { ReviewsService } from "@/lib/api/review-service";
import { ChordsService } from "@/lib/api/chords-service";
import { PatternsService } from "@/lib/api/patterns-service";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  MessageSquare,
  FileText,
  GitBranch,
  Star,
  Sparkles,
  Target,
  Send,
  MoreVertical,
  ExternalLink,
  ListMusic,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Heart,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SegmentsList } from "@/components/song/segments-list";
import { convertSegmentsToUI } from "@/lib/song-converter";
import { CreateSongReviewDto, SongReviewDto } from "@/types/reviews";
import { RatingDisplay } from "@/components/song/review/rating-display";
import { UIComment } from "@/types/songs";
import { Chord, PaginatedChords } from "@/types/chords";
import { Pattern } from "@/types/patterns";
import { SVGChordDiagram } from "@/components/chords/svg-chord-diagram";
import { PatternDiagram } from "@/components/patterns/pattern-diagram";
import { FingerStyleDiagram } from "@/components/patterns/finger-style-diagram";
import { SongDetailDto } from "@/types/song-detail";
import { AudioInputType } from "@/types/audio";
import { AudioPlayerPanel } from "@/components/song/audio-player-panel";
import { AlbumService } from "@/lib/api/albom-service";
import { RatingSelector } from "@/components/song/review/rating-selector";
import { Label } from "@/components/ui/label";

function ChordModal({
  chordName,
  onClose,
}: {
  chordName: string;
  onClose: () => void;
}) {
  const [variations, setVariations] = useState<PaginatedChords | null>(null);
  const [currentVariation, setCurrentVariation] = useState<Chord | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVariations();
  }, [chordName]);

  const loadVariations = async () => {
    setIsLoading(true);
    try {
      const data = await ChordsService.getChordsByExactName(chordName, 1, 100);
      setVariations(data);

      if (data.items.length > 0) {
        setCurrentVariation(data.items[0]);
        setCurrentIndex(0);
      }
    } catch (error: unknown) {
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (!variations || currentIndex <= 0) return;

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    setCurrentVariation(variations.items[newIndex]);
  };

  const handleNext = () => {
    if (!variations || currentIndex >= variations.items.length - 1) return;

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    setCurrentVariation(variations.items[newIndex]);
  };

  const parseFingering = (fingering: string): string[] => {
    if (!fingering) return Array(6).fill("0");

    let values: string[];

    if (fingering.includes("-")) {
      values = fingering.split("-");
    } else {
      values = fingering.split("");
    }

    while (values.length < 6) {
      values.push("0");
    }

    return values.slice(0, 6);
  };

  const currentFingeringValues = currentVariation
    ? parseFingering(currentVariation.fingering)
    : [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              {chordName} Chord
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1">
              Variation {currentIndex + 1} of {variations?.items.length || 0}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading chord...</p>
          </div>
        ) : !currentVariation ? (
          <div className="py-8 text-center">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Chord not found</h3>
            <p className="text-muted-foreground mt-2">
              No variations found for chord "{chordName}"
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border rounded-lg p-6 from-background to-muted/20">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Chord Diagram
              </h3>
              <div className="flex justify-center">
                <SVGChordDiagram
                  fingering={currentVariation.fingering}
                  name={currentVariation.name}
                  width={300}
                  height={400}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Fingering Details
                </h3>
                <div className="font-mono text-2xl font-bold bg-muted p-4 rounded text-center">
                  {currentVariation.fingering}
                </div>

                <div className="mt-4 grid grid-cols-6 gap-2">
                  {[6, 5, 4, 3, 2, 1].map((stringNum, index) => {
                    const fretValue = currentFingeringValues[index];
                    return (
                      <div
                        key={stringNum}
                        className="text-center p-2 bg-muted/50 rounded"
                      >
                        <div className="text-sm text-muted-foreground">
                          String {stringNum}
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            fretValue === "0"
                              ? "text-green-600"
                              : fretValue === "X" || fretValue === "x"
                                ? "text-red-600"
                                : "text-blue-600"
                          }`}
                        >
                          {fretValue === "0"
                            ? "Open"
                            : fretValue === "X" || fretValue === "x"
                              ? "Mute"
                              : `Fret ${fretValue}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {currentVariation.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground p-3 bg-muted/30 rounded">
                    {currentVariation.description}
                  </p>
                </div>
              )}
            </div>

            {variations && variations.items.length > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="flex gap-2">
                  {variations.items.map((_, index) => (
                    <Button
                      key={index}
                      variant={index === currentIndex ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => {
                        setCurrentIndex(index);
                        setCurrentVariation(variations.items[index]);
                      }}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={currentIndex === variations.items.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PatternModal({
  patternName,
  onClose,
}: {
  patternName: string;
  onClose: () => void;
}) {
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    loadPattern();
  }, [patternName]);

  const loadPattern = async () => {
    setIsLoading(true);
    try {
      const data = await PatternsService.getPatternByName(patternName);
      setPattern(data);
    } catch (error: unknown) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              {patternName} Pattern
            </div>
            {pattern && (
              <Badge variant={pattern.isFingerStyle ? "secondary" : "default"}>
                {pattern.isFingerStyle ? "Fingerstyle" : "Strumming"}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading pattern...</p>
          </div>
        ) : !pattern ? (
          <div className="py-8 text-center">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Pattern not found</h3>
            <p className="text-muted-foreground mt-2">
              Pattern "{patternName}" was not found
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border rounded-lg p-6 from-background to-muted/20">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Pattern Visualization
              </h3>
              {pattern.isFingerStyle ? (
                <FingerStyleDiagram
                  pattern={pattern.pattern}
                  name={pattern.name}
                />
              ) : (
                <PatternDiagram pattern={pattern.pattern} name={pattern.name} />
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Pattern Notation</h3>
                <div className="font-mono text-2xl font-bold bg-muted p-4 rounded text-center break-all">
                  {pattern.pattern}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Type</div>
                  <div className="font-medium">
                    {pattern.isFingerStyle ? "Fingerstyle" : "Strumming"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Length</div>
                  <div className="font-medium">
                    {pattern.isFingerStyle
                      ? `${pattern.pattern.length} symbols`
                      : `${pattern.pattern.length} steps`}
                  </div>
                </div>
              </div>

              {pattern.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground p-3 bg-muted/30 rounded">
                    {pattern.description}
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Symbol Legend</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLegend(!showLegend)}
                >
                  {showLegend ? (
                    <EyeOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  {showLegend ? "Hide" : "Show"} Legend
                </Button>
              </div>

              {showLegend &&
                (pattern.isFingerStyle ? (
                  <div className="p-3 bg-muted/30 rounded">
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4, 5, 6, "X", "."].map((symbol) => (
                        <div
                          key={symbol}
                          className="flex items-center gap-2 p-2"
                        >
                          <div className="font-mono font-bold">{symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {symbol === 1 && "String 1 (High E)"}
                            {symbol === 2 && "String 2 (B)"}
                            {symbol === 3 && "String 3 (G)"}
                            {symbol === 4 && "String 4 (D)"}
                            {symbol === 5 && "String 5 (A)"}
                            {symbol === 6 && "String 6 (Low E)"}
                            {symbol === "X" && "Scratch/Chuck"}
                            {symbol === "." && "Mute"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/30 rounded">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex items-center gap-2 p-2">
                        <div className="font-mono font-bold">D</div>
                        <div className="text-sm text-muted-foreground">
                          Down All
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <div className="font-mono font-bold">d</div>
                        <div className="text-sm text-muted-foreground">
                          Down Top
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <div className="font-mono font-bold">U</div>
                        <div className="text-sm text-muted-foreground">
                          Up All
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <div className="font-mono font-bold">u</div>
                        <div className="text-sm text-muted-foreground">
                          Up Top
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <div className="font-mono font-bold">X</div>
                        <div className="text-sm text-muted-foreground">
                          Scratch
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <div className="font-mono font-bold">-</div>
                        <div className="text-sm text-muted-foreground">
                          Pause
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <div className="font-mono font-bold">.</div>
                        <div className="text-sm text-muted-foreground">
                          Mute
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  const songId = params.songId as string;
  const returnTo = searchParams.get("returnTo");

  const [song, setSong] = useState<SongDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uiSegments, setUiSegments] = useState<any[]>([]);
  const [uiChords, setUiChords] = useState<any[]>([]);
  const [uiPatterns, setUiPatterns] = useState<any[]>([]);
  const [songText, setSongText] = useState("");

  const [reviews, setReviews] = useState<SongReviewDto[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [beautifulLevel, setBeautifulLevel] = useState<number>();
  const [difficultyLevel, setDifficultyLevel] = useState<number>();
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [selectedChordName, setSelectedChordName] = useState<string | null>(
    null,
  );
  const [selectedPatternName, setSelectedPatternName] = useState<string | null>(
    null,
  );

  const [isFavorite, setIsFavorite] = useState(false);
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(false);

  const [allComments, setAllComments] = useState<UIComment[]>([]);
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showAllHints, setShowAllHints] = useState(false);
  const [popoverSegment, setPopoverSegment] = useState<string | null>(null);

  const loadSong = async () => {
    setIsLoading(true);
    try {
      const data = await SongsService.getSongById(
        songId,
        true,
        true,
        true,
        false,
        true,
      );

      setSong(data);

      const { segments, chords, patterns, text, comments } =
        convertSegmentsToUI(data);

      setUiSegments(segments);
      setUiChords(chords);
      setUiPatterns(patterns);
      setSongText(text);
      setAllComments(comments);

      await loadReviews();
    } catch (error: any) {
      toast.error(error.message || "Failed to load song");
      router.push("/home/songs");
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviews = async () => {
    if (!songId) return;

    setIsLoadingReviews(true);
    try {
      const response = await ReviewsService.getSongReviews(songId);
      setReviews(response.items);
    } catch (error: any) {
      toast.error(error.message || "Failed to load reviews");
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!user) {
      setIsFavorite(false);
      return;
    }

    setIsCheckingFavorite(true);
    try {
      const isFav = await AlbumService.isSongInFavorite(songId);
      setIsFavorite(isFav);
    } catch (error) {
      console.error("Error checking favorite status:", error);
      setIsFavorite(false);
    } finally {
      setIsCheckingFavorite(false);
    }
  };

  useEffect(() => {
    if (!authLoading && songId) {
      loadSong();
    }
  }, [songId, user, authLoading]);

  useEffect(() => {
    checkFavoriteStatus();
  }, [songId, user]);

  const handleBack = () => {
    if (returnTo === "song-create") {
      router.push("/home/songs/create");
    } else {
      router.push("/home/songs");
    }
  };

  const handleEdit = () => {
    router.push(`/home/songs/edit/${songId}`);
  };

  const handleDelete = async () => {
    try {
      await SongsService.deleteSong(songId);

      toast.success(`Song "${song?.title}" deleted successfully`);
      router.push("/home/songs");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete song");
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Please log in to submit a review");
      return;
    }

    if (!reviewText.trim()) {
      toast.error("Please enter review text");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const reviewData: CreateSongReviewDto = {
        reviewText: reviewText.trim(),
        beautifulLevel: beautifulLevel,
        difficultyLevel: difficultyLevel,
      };

      await ReviewsService.createReview(songId, reviewData);

      toast.success("Review submitted successfully!");
      setReviewText("");
      setBeautifulLevel(undefined);
      setDifficultyLevel(undefined);

      await loadReviews();
      await loadSong();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await ReviewsService.deleteReview(reviewId);
      toast.success("Review deleted successfully");
      loadReviews();
      loadSong();
    } catch (error: any) {}
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please log in to add to favorites");
      return;
    }

    try {
      if (isFavorite) {
        await AlbumService.removeSongFromFavorite(songId);
        setIsFavorite(false);
        toast.success("Removed from favorites");
      } else {
        await AlbumService.addSongToFavorite(songId);
        setIsFavorite(true);
        toast.success("Added to favorites");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update favorites");
    }
  };

  const handleSegmentMouseEnter = (
    segmentId: string,
    event: React.MouseEvent,
  ) => {
    if (showAllHints) return;
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setMousePos({ x: event.clientX, y: event.clientY });
    const timeout = setTimeout(() => {
      setHoveredSegmentId(segmentId);
    }, 300);
    setHoverTimeout(timeout);
  };

  const handleSegmentMouseLeave = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setHoveredSegmentId(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const canEdit = song && user?.id === song.ownerId;
  const canDelete =
    song && (user?.id === song.ownerId || user?.role === "Admin");
  const canReview = song && user?.id !== song.ownerId;

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

  const renderTextWithSegments = () => {
    if (!songText) return null;

    const segments = [...uiSegments].sort(
      (a, b) => a.startIndex - b.startIndex,
    );
    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    segments.forEach((segment) => {
      if (segment.startIndex > songText.length) return;

      if (segment.startIndex > lastIndex) {
        const beforeText = songText.substring(lastIndex, segment.startIndex);
        if (beforeText) {
          result.push(
            <span
              key={`text-before-${segment.id}-${lastIndex}`}
              className="whitespace-pre-wrap"
            >
              {beforeText}
            </span>,
          );
        }
      }

      const segmentEnd = Math.min(
        segment.startIndex + segment.length,
        songText.length,
      );
      const segmentText = songText.substring(segment.startIndex, segmentEnd);

      const hasContent = segmentText.trim().length > 0;
      const hasChord = !!segment.chordId;
      const hasPattern = !!segment.patternId;
      const isEmptyPlayback = !hasContent && (hasChord || hasPattern);

      const chordName = uiChords.find((c) => c.id === segment.chordId)?.name;
      const pattern = uiPatterns.find((p) => p.id === segment.patternId);
      const hasComments = segment.comments && segment.comments.length > 0;

      const segmentStyles: React.CSSProperties = {
        display: "inline-block",
        padding: "2px 0",
      };

      if (hasChord && segment.color) {
        segmentStyles.borderBottom = `3px solid ${segment.color}`;
      }

      if (hasPattern && pattern?.color) {
        segmentStyles.backgroundColor = pattern.color;
        segmentStyles.borderRadius = "4px";
        segmentStyles.padding = "2px 4px";
      } else if (hasPattern && segment.backgroundColor) {
        segmentStyles.backgroundColor = segment.backgroundColor;
        segmentStyles.borderRadius = "4px";
        segmentStyles.padding = "2px 4px";
      }

      const segmentElement = (
        <span
          key={segment.id}
          style={segmentStyles}
          className={`relative inline-block group cursor-default ${isEmptyPlayback ? "min-w-8" : ""}`}
          title={!showAllHints ? chordName || undefined : undefined}
          onMouseEnter={(e) => {
            if (!showAllHints) {
              handleSegmentMouseEnter(segment.id, e);
            }
          }}
          onMouseLeave={() => {
            if (!showAllHints) {
              handleSegmentMouseLeave();
            }
          }}
        >
          {showAllHints && chordName && (
            <span className="inline-block text-[10px] bg-popover text-popover-foreground px-1 py-0.5 rounded shadow-sm mr-1 align-middle">
              {chordName}
            </span>
          )}

          {isEmptyPlayback ? (
            <span className="opacity-50 italic text-sm">⏺</span>
          ) : (
            segmentText
          )}

          {hasComments && (
            <Popover
              open={popoverSegment === segment.id}
              onOpenChange={(open) =>
                setPopoverSegment(open ? segment.id : null)
              }
            >
              <PopoverTrigger asChild>
                <span className="absolute -top-2 -right-2 cursor-help">
                  <MessageSquare className="h-3 w-3 text-blue-500 fill-blue-100" />
                </span>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span>Comment</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {segment.comments?.[0]?.text || "No comment"}
                  </div>
                  {segment.comments?.[0]?.authorName && (
                    <div className="text-xs text-muted-foreground pt-1 border-t">
                      — {segment.comments[0].authorName}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </span>
      );

      result.push(segmentElement);
      lastIndex = segmentEnd;
    });

    if (lastIndex < songText.length) {
      result.push(
        <span key={`text-end-${lastIndex}`} className="whitespace-pre-wrap">
          {songText.substring(lastIndex)}
        </span>,
      );
    }

    return result;
  };

  const uniqueChords = Array.from(
    new Map(song?.chords?.map((chord) => [chord.id, chord]) || []).values(),
  );

  const uniquePatterns = Array.from(
    new Map(
      song?.patterns?.map((pattern) => [pattern.id, pattern]) || [],
    ).values(),
  );

  const chordColorMap = new Map<string, string>();
  uiSegments.forEach((segment) => {
    if (segment.chordId && segment.color) {
      chordColorMap.set(segment.chordId, segment.color);
    }
  });

  const patternColorMap = new Map<string, string>();
  uiSegments.forEach((segment) => {
    if (segment.patternId && segment.backgroundColor) {
      patternColorMap.set(segment.patternId, segment.backgroundColor);
    }
  });

  const getTooltipContent = () => {
    if (!hoveredSegmentId) return null;
    const segment = uiSegments.find((s) => s.id === hoveredSegmentId);
    if (!segment) return null;

    const chordName = segment.chordId
      ? uiChords.find((c) => c.id === segment.chordId)?.name
      : null;
    const patternName = segment.patternId
      ? uiPatterns.find((p) => p.id === segment.patternId)?.name
      : null;
    const commentText = segment.comments?.[0]?.text;

    if (!chordName && !patternName && !commentText) return null;

    return (
      <div className="space-y-1">
        {chordName && (
          <div className="text-sm">
            <span className="font-medium">Chord:</span> {chordName}
          </div>
        )}
        {patternName && (
          <div className="text-sm">
            <span className="font-medium">Pattern:</span> {patternName}
          </div>
        )}
        {commentText && (
          <div className="text-sm border-t pt-1 mt-1">
            <span className="font-medium">Comment:</span> {commentText}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Song not found</h3>
            <p className="text-muted-foreground mt-2">
              Song was not found or has been removed.
            </p>
            <Button variant="outline" className="mt-4" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Songs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {song.title}
                </h1>
                <Badge variant={song.isPublic ? "default" : "secondary"}>
                  {song.isPublic ? (
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
                {song.parentSongId && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    Forked
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-2">
                {song.artist || "No artist specified"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFavorite}
                disabled={isCheckingFavorite || !user}
                className={
                  isFavorite
                    ? "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800"
                    : ""
                }
              >
                {isCheckingFavorite ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                ) : (
                  <Heart
                    className={`h-4 w-4 mr-2 ${isFavorite ? "fill-current text-yellow-600" : ""}`}
                  />
                )}
                {isFavorite ? "In Favorites" : "Add to Favorites"}
              </Button>

              {canEdit && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}

              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Song Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Title
                    </div>
                    <div className="font-medium text-lg">{song.title}</div>
                  </div>

                  {song.artist && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Artist
                      </div>
                      <div className="font-medium">{song.artist}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Genre
                      </Label>
                      <div className="font-medium">
                        {song.genre && song.genre !== "" ? song.genre : "—"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Theme
                      </Label>
                      <div className="font-medium">
                        {song.theme && song.theme !== "" ? song.theme : "—"}
                      </div>
                    </div>
                  </div>

                  {song.description && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Description
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap p-3 bg-muted/30 rounded">
                        {song.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {uniqueChords.length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Chords
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {uniquePatterns.length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Patterns
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {allComments.length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Comments
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {song.reviewCount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Reviews
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <AudioPlayerPanel
                audioData={{
                  customAudioUrl: song.customAudioUrl,
                  customAudioType: song.customAudioType,
                  url: song.customAudioUrl,
                  songId: song.id,
                  type:
                    song.customAudioType === "Url" ||
                    song.customAudioType === "url"
                      ? AudioInputType.URL
                      : song.customAudioType === "File" ||
                          song.customAudioType === "audio/mpeg" ||
                          song.customAudioType === "audio/webm"
                        ? AudioInputType.FILE
                        : AudioInputType.NONE,
                }}
                title="Song Audio"
              />

              {uniqueChords.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      Chords in this Song
                    </CardTitle>
                    <CardDescription>
                      {uniqueChords.length} unique chord
                      {uniqueChords.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {uniqueChords.map((chord) => {
                        const chordColor = chordColorMap.get(chord.id);
                        const usageCount = uiSegments.filter(
                          (s) => s.chordId === chord.id,
                        ).length;

                        return (
                          <div
                            key={chord.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{
                                  backgroundColor: chordColor || "#000",
                                }}
                              />
                              <div>
                                <div className="font-medium">{chord.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {chord.fingering} • used {usageCount} time
                                  {usageCount !== 1 ? "s" : ""}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedChordName(chord.name)}
                              className="text-primary hover:underline flex items-center gap-1 text-sm"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {uniquePatterns.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ListMusic className="h-5 w-5" />
                      Patterns in this Song
                    </CardTitle>
                    <CardDescription>
                      {uniquePatterns.length} unique pattern
                      {uniquePatterns.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {uniquePatterns.map((pattern) => {
                        const patternColor = patternColorMap.get(pattern.id);
                        const usageCount = uiSegments.filter(
                          (s) => s.patternId === pattern.id,
                        ).length;

                        return (
                          <div
                            key={pattern.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded border"
                                style={{
                                  backgroundColor: patternColor || "#000",
                                }}
                              />
                              <div>
                                <div className="font-medium">
                                  {pattern.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {pattern.isFingerStyle
                                    ? "Fingerstyle"
                                    : "Strumming"}{" "}
                                  • used {usageCount} time
                                  {usageCount !== 1 ? "s" : ""}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSelectedPatternName(pattern.name)
                              }
                              className="text-primary hover:underline flex items-center gap-1 text-sm"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Created By
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="font-medium">
                      {song.ownerName || "Unknown"}
                    </div>
                    {user?.id === song.ownerId && (
                      <Badge variant="outline">You</Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Created {formatDate(song.createdAt)}</span>
                    </div>

                    {song.updatedAt && song.updatedAt !== song.createdAt && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Updated {formatDate(song.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Song Text
                      </CardTitle>
                      <CardDescription>
                        Lyrics with chords and patterns visualization
                      </CardDescription>
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showAllHints}
                        onChange={(e) => setShowAllHints(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-muted-foreground hover:text-foreground">
                        Show all hints
                      </span>
                    </label>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={`min-h-[400px] p-4 border rounded-lg bg-background whitespace-pre-wrap font-mono overflow-y-auto leading-relaxed text-base relative ${
                      showAllHints ? "pt-8" : ""
                    }`}
                    onMouseMove={handleMouseMove}
                  >
                    {renderTextWithSegments() || (
                      <div className="text-muted-foreground italic h-full flex items-center justify-center">
                        No text available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {hoveredSegmentId && !showAllHints && (
                <div
                  className="fixed z-50 bg-popover text-popover-foreground rounded-lg shadow-lg border p-2 max-w-xs pointer-events-none"
                  style={{
                    top: mousePos.y + 15,
                    left: mousePos.x + 15,
                  }}
                >
                  {getTooltipContent()}
                </div>
              )}

              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Segments List</h3>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({uiSegments.length} segments)
                  </span>
                </div>
                <SegmentsList
                  segments={uiSegments}
                  chords={uiChords.map((chord) => ({
                    id: chord.id,
                    name: chord.name,
                    fingering: chord.fingering,
                    color: chord.color,
                  }))}
                  patterns={uiPatterns.map((pattern) => ({
                    id: pattern.id,
                    name: pattern.name,
                    pattern: pattern.pattern,
                    isFingerStyle: pattern.isFingerStyle,
                    color: pattern.color,
                  }))}
                  comments={allComments}
                  onSegmentClick={(segmentId) => {
                    const segment = uiSegments.find((s) => s.id === segmentId);
                    if (segment) {
                      const previewElement =
                        document.querySelector(".preview-text");
                      if (previewElement) {
                        previewElement.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }
                    }
                  }}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Reviews & Ratings
                  </CardTitle>
                  <CardDescription>
                    {song.reviewCount === 0
                      ? "No reviews yet"
                      : `${song.reviewCount} review${
                          song.reviewCount !== 1 ? "s" : ""
                        }`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(song.averageBeautifulRating ||
                    song.averageDifficultyRating) && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Average Ratings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {song.averageBeautifulRating && (
                          <RatingDisplay
                            rating={song.averageBeautifulRating}
                            label="Beauty"
                            icon={<Sparkles className="h-4 w-4" />}
                          />
                        )}
                        {song.averageDifficultyRating && (
                          <RatingDisplay
                            rating={song.averageDifficultyRating}
                            label="Difficulty"
                            icon={<Target className="h-4 w-4" />}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {canReview && (
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-medium">Add Your Review</h4>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Write your review here..."
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          className="min-h-[100px]"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <RatingSelector
                            value={beautifulLevel}
                            onChange={setBeautifulLevel}
                            label="How beautiful is this song?"
                            disabled={isSubmittingReview}
                          />
                          <RatingSelector
                            value={difficultyLevel}
                            onChange={setDifficultyLevel}
                            label="How difficult is this song?"
                            disabled={isSubmittingReview}
                          />
                        </div>

                        <Button
                          onClick={handleSubmitReview}
                          disabled={isSubmittingReview || !reviewText.trim()}
                          className="w-full"
                        >
                          {isSubmittingReview ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Submit Review
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Reviews</h4>
                    {isLoadingReviews ? (
                      <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No reviews yet. Be the first to review!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <Card key={review.id}>
                            <CardContent className="pt-6">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <User className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {review.userName}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {formatDate(review.createdAt)}
                                    </div>
                                  </div>
                                </div>

                                {(review.userId === user?.id ||
                                  user?.role === "Admin") && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() =>
                                          handleDeleteReview(review.id)
                                        }
                                      >
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>

                              <p className="mb-4 whitespace-pre-wrap">
                                {review.reviewText}
                              </p>

                              <div className="flex gap-6">
                                {review.beautifulLevel && (
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-medium">
                                      Beauty:
                                    </span>
                                    <span className="text-sm">
                                      {review.beautifulLevel}/5
                                    </span>
                                  </div>
                                )}
                                {review.difficultyLevel && (
                                  <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-purple-500" />
                                    <span className="text-sm font-medium">
                                      Difficulty:
                                    </span>
                                    <span className="text-sm">
                                      {review.difficultyLevel}/5
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {allComments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Comments
                    </CardTitle>
                    <CardDescription>
                      Author's notes on specific segments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {allComments.map((comment, index) => {
                        const segment = uiSegments.find(
                          (s) => s.id === comment.segmentId,
                        );
                        const segmentText = segment?.text || "";
                        return (
                          <div
                            key={comment.id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-medium text-muted-foreground">
                                Comment #{index + 1}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (segment) {
                                    const textElement =
                                      document.querySelector(".preview-text");
                                    if (textElement) {
                                      textElement.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center",
                                      });
                                    }
                                  }
                                }}
                              >
                                Jump to segment
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                            <p className="text-muted-foreground whitespace-pre-wrap">
                              {comment.text}
                            </p>
                            {segmentText && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Segment: "{segmentText.substring(0, 100)}..."
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Song</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{song?.title}"? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedChordName && (
          <ChordModal
            chordName={selectedChordName}
            onClose={() => setSelectedChordName(null)}
          />
        )}

        {selectedPatternName && (
          <PatternModal
            patternName={selectedPatternName}
            onClose={() => setSelectedPatternName(null)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
