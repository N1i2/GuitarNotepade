"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  RatingDisplay,
  RatingSelector,
} from "@/components/song/review/rating-display";
import { SegmentDataWithPositionDto, UIComment } from "@/types/songs";
import { Chord, PaginatedChords } from "@/types/chords";
import { Pattern } from "@/types/patterns";
import { SVGChordDiagram } from "@/components/chords/svg-chord-diagram";
import { PatternDiagram } from "@/components/patterns/pattern-diagram";
import { FingerStyleDiagram } from "@/components/patterns/finger-style-diagram";
import { SongDetailDto } from "@/types/song-detail";
import { AudioInputType } from "@/types/audio";
import { AudioPlayerPanel } from "@/components/song/audio-player-panel";

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
            <div className="border rounded-lg p-6 bg-gradient-to-b from-background to-muted/20">
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
            <div className="border rounded-lg p-6 bg-gradient-to-b from-background to-muted/20">
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
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  const songId = params.songId as string;

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
    null
  );
  const [selectedPatternName, setSelectedPatternName] = useState<string | null>(
    null
  );

  const loadSong = async () => {
    setIsLoading(true);
    try {
      const data = await SongsService.getSongById(
        songId,
        user?.id || "",
        true,
        true,
        true,
        false,
        true
      );

      setSong(data);

      const { segments, chords, patterns, text, comments } =
        convertSegmentsToUI(data);
      console.log("Conversion result:", {
        segments,
        chords,
        patterns,
        textLength: text.length,
        comments,
        segmentsWithComments: segments.filter(
          (s) => s.comments && s.comments.length > 0
        ),
      });

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

  const [allComments, setAllComments] = useState<UIComment[]>([]);

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

  useEffect(() => {
    if (!authLoading && songId) {
      loadSong();
    }
  }, [songId, user, authLoading]);

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
      (a, b) => a.startIndex - b.startIndex
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
            </span>
          );
        }
      }

      const segmentEnd = Math.min(
        segment.startIndex + segment.length,
        songText.length
      );
      const segmentText = songText.substring(segment.startIndex, segmentEnd);

      if (!segmentText) {
        lastIndex = segmentEnd;
        return;
      }

      const segmentStyles: React.CSSProperties = {
        position: "relative" as "relative",
        display: "inline-block",
      };

      if (segment.color) {
        segmentStyles.borderBottom = `3px solid ${segment.color}`;
      }

      if (segment.backgroundColor) {
        segmentStyles.backgroundColor = segment.backgroundColor;
        segmentStyles.paddingLeft = "3px";
        segmentStyles.paddingRight = "3px";
        segmentStyles.paddingTop = "1px";
        segmentStyles.paddingBottom = "1px";
        segmentStyles.borderRadius = "3px";
        segmentStyles.marginLeft = "1px";
        segmentStyles.marginRight = "1px";
        if (segment.color) {
          segmentStyles.marginBottom = "3px";
        }
      }

      const hasComments = segment.comments && segment.comments.length > 0;

      result.push(
        <span
          key={segment.id}
          style={segmentStyles}
          className="relative inline-block group whitespace-pre-wrap cursor-default"
          title={`${segmentText}\n${
            segment.chordId
              ? "Chord: " + uiChords.find((c) => c.id === segment.chordId)?.name
              : ""
          }\n${
            segment.patternId
              ? "Pattern: " +
                uiPatterns.find((p) => p.id === segment.patternId)?.name
              : ""
          }`}
        >
          {segmentText}
          {hasComments && (
            <span className="absolute -top-1 -right-1">
              <MessageSquare className="h-3 w-3 text-blue-500" />
            </span>
          )}
        </span>
      );

      lastIndex = segmentEnd;
    });

    if (lastIndex < songText.length) {
      result.push(
        <span key={`text-end-${lastIndex}`} className="whitespace-pre-wrap">
          {songText.substring(lastIndex)}
        </span>
      );
    }

    return result;
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
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/home/songs")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Songs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const uniqueChords = Array.from(
    new Map(song.chords?.map((chord) => [chord.id, chord]) || []).values()
  );

  const uniquePatterns = Array.from(
    new Map(
      song.patterns?.map((pattern) => [pattern.id, pattern]) || []
    ).values()
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/home/songs")}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Songs
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
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Song Text
                </CardTitle>
                <CardDescription>
                  Lyrics with chords and patterns visualization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="min-h-[400px] p-4 border rounded-lg bg-background whitespace-pre-wrap font-mono overflow-y-auto leading-relaxed text-base">
                  {renderTextWithSegments() || (
                    <div className="text-muted-foreground italic h-full flex items-center justify-center">
                      No text available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

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
          </div>

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

                {song.genre && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Genre
                    </div>
                    <Badge variant="outline">{song.genre}</Badge>
                  </div>
                )}

                {song.theme && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Theme
                    </div>
                    <Badge variant="outline">{song.theme}</Badge>
                  </div>
                )}

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

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {uniqueChords.length}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        Chords
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {uniquePatterns.length}
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-300">
                        Patterns
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {song.comments.length}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">
                        Comments
                      </div>
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
                type:
                  song.customAudioType === "Url"
                    ? AudioInputType.URL
                    : song.customAudioType === "File"
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
                      const segmentWithChord = song.segments?.find(
                        (seg: SegmentDataWithPositionDto) =>
                          seg.segmentData.chordId === chord.id
                      );

                      const chordColor = segmentWithChord?.segmentData.color;

                      return (
                        <div
                          key={chord.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: chordColor || "#000" }}
                            />
                            <div>
                              <div className="font-medium">{chord.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {chord.fingering}
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
                      const patternColor = song.segments?.find(
                        (seg: SegmentDataWithPositionDto) =>
                          seg.segmentData.patternId === pattern.id
                      )?.segmentData.backgroundColor;

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
                              <div className="font-medium">{pattern.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {pattern.isFingerStyle
                                  ? "Fingerstyle"
                                  : "Strumming"}{" "}
                                • {pattern.pattern}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPatternName(pattern.name)}
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
  );
}
