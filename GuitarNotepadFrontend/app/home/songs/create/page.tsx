"use client";

import { SongResourcesPanel } from "@/components/song/table-editor/song-resources-panel";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { SongsService } from "@/lib/api/song-service";
import { ChordsService } from "@/lib/api/chords-service";
import { PatternsService } from "@/lib/api/patterns-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { SegmentTable } from "@/components/song/table-editor/segment-table";
import { convertTableToDTO, convertCommentsToDTO } from "@/lib/table-converter";
import {
  TableEditorProvider,
  useTableEditor,
} from "@/app/contexts/table-editor-context";
import { useSongEditorState } from "@/hooks/use-song-editor-state";
import { AudioInputData, AudioInputType } from "@/types/audio";
import { useAudioUpload } from "@/hooks/use-audio-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function CreateSongContent() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const { state, dispatch } = useTableEditor();
  const {
    saveState,
    saveMetadata,
    loadState,
    loadMetadata,
    clearState,
    validateResources,
    refreshResources,
    clearStateIfNewSong,
  } = useSongEditorState();
  const { activeUpload, uploadAudio, cancelUpload, isUploading } =
    useAudioUpload();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showUploadStatus, setShowUploadStatus] = useState(false);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [theme, setTheme] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioData, setAudioData] = useState<AudioInputData>({
    type: AudioInputType.NONE,
  });

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

  useEffect(() => {
    clearStateIfNewSong();
  }, [clearStateIfNewSong]);

  const loadInitialData = useCallback(async () => {
    try {
      const [chordsData, patternsData] = await Promise.all([
        ChordsService.getAllChords({ pageSize: 100 }),
        PatternsService.getAllPatterns({ pageSize: 100 }),
      ]);

      dispatch({ type: "SET_CHORDS", payload: chordsData.items });
      dispatch({ type: "SET_PATTERNS", payload: patternsData.items });
    } catch (error) {
      toast.error("Failed to load chords and patterns");
    }
  }, [dispatch, toast]);

  useEffect(() => {
    const handleFocus = () => {
      if (isInitialized) {
        validateResources();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isInitialized, validateResources]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (
      state.chords.length > 0 &&
      state.patterns.length > 0 &&
      !isInitialized
    ) {
      const loadSavedState = async () => {
        const savedStateLoaded = loadState();
        const savedMetadata = loadMetadata();

        if (savedStateLoaded) {
          toast.info("Restored your previous work");
        }

        if (savedMetadata) {
          setTitle(savedMetadata.title || "");
          setArtist(savedMetadata.artist || "");
          setGenre(savedMetadata.genre || "");
          setTheme(savedMetadata.theme || "");
          setDescription(savedMetadata.description || "");
          setIsPublic(savedMetadata.isPublic || false);
          if (savedMetadata.audioData) {
            setAudioData(savedMetadata.audioData);
          }
        }

        setIsInitialized(true);

        await validateResources();
      };

      loadSavedState();
    }
  }, [
    state.chords.length,
    state.patterns.length,
    isInitialized,
    loadState,
    loadMetadata,
    validateResources,
    toast,
  ]);

  useEffect(() => {
    if (isInitialized && state.segments.length > 0) {
      saveState();
    }
  }, [state.segments, isInitialized, saveState]);

  useEffect(() => {
    if (isInitialized) {
      saveMetadata({
        title,
        artist,
        genre,
        theme,
        description,
        isPublic,
        audioData,
      });
    }
  }, [
    title,
    artist,
    genre,
    theme,
    description,
    isPublic,
    audioData,
    isInitialized,
    saveMetadata,
  ]);

  useEffect(() => {
    const handleReturn = async () => {
      if (document.visibilityState === "visible" && isInitialized) {
        await refreshResources();
        await validateResources();
      }
    };

    document.addEventListener("visibilitychange", handleReturn);
    return () => document.removeEventListener("visibilitychange", handleReturn);
  }, [isInitialized, refreshResources, validateResources]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please log in");
      return;
    }

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (state.segments.length === 0) {
      toast.error("Add at least one segment");
      return;
    }

    setIsLoading(true);
    try {
      let customAudioUrl: string | undefined;
      let customAudioType: string | undefined;
      let audioFile: File | undefined;

      if (audioData.type === AudioInputType.FILE && audioData.file) {
        audioFile = audioData.file;
        console.log("📁 File audio prepared:", {
          name: audioFile.name,
          type: audioFile.type,
          size: audioFile.size,
        });
      } else if (
        audioData.type === AudioInputType.RECORD &&
        audioData.audioBlob
      ) {
        audioFile = new File(
          [audioData.audioBlob],
          `recording-${Date.now()}.webm`,
          {
            type: "audio/webm",
          },
        );
        console.log("🎙️ Recording audio prepared:", {
          size: audioFile.size,
          type: audioFile.type,
        });
      } else if (audioData.type === AudioInputType.URL && audioData.url) {
        customAudioUrl = audioData.url;
        customAudioType = "url";
        console.log("🔗 URL audio prepared:", { url: audioData.url });
      }

      const segmentsDTO = convertTableToDTO(state.segments);
      const structureSegments = segmentsDTO.map((segment) => ({
        type: segment.segmentData.type,
        lyric: segment.segmentData.lyric,
        chordId: segment.segmentData.chordId,
        patternId: segment.segmentData.patternId,
        color: segment.segmentData.color,
        backgroundColor: segment.segmentData.backgroundColor,
      }));

      const segmentComments = convertCommentsToDTO(state.segments);

      const songData = {
        title,
        artist: artist || undefined,
        genre: genre || undefined,
        theme: theme || undefined,
        description: description || undefined,
        isPublic,
        customAudioUrl,
        customAudioType,
        audioFile: undefined,
        segments: structureSegments,
        segmentComments,
        chordIds: Array.from(
          new Set(
            state.segments.filter((s) => s.chordId).map((s) => s.chordId!),
          ),
        ),
        patternIds: Array.from(
          new Set(
            state.segments.filter((s) => s.patternId).map((s) => s.patternId!),
          ),
        ),
      };

      console.log("📤 Creating song...");
      const createdSong = await SongsService.createSong(songData);
      console.log("✅ Song created:", createdSong.id);

      if (audioFile) {
        console.log("🎵 Uploading audio...");
        setShowUploadStatus(true);

        uploadAudio({
          songId: createdSong.id,
          file: audioFile,
          onProgress: (percent) => {
            console.log(`Upload progress: ${percent}%`);
          },
          onSuccess: () => {
            toast.success("Audio uploaded successfully!");
            setShowUploadStatus(false);
          },
          onError: (error) => {
            toast.error(`Audio upload failed: ${error.message}`);
            setShowUploadStatus(false);
          },
        }).catch((error) => {
          console.error("Upload error:", error);
        });

        toast.info("Song created! Audio uploading in background.");
      }

      clearState();
      router.push(`/home/songs/${createdSong.id}`);
    } catch (error: any) {
      console.error("❌ Create song error:", error);
      toast.error(error.message || "Failed to create song");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChord = (chordId: string) => {
    dispatch({ type: "DELETE_CHORD_FROM_SONG", payload: chordId });
  };

  const handleDeletePattern = (patternId: string) => {
    dispatch({ type: "DELETE_PATTERN_FROM_SONG", payload: patternId });
  };

  const handleReplaceChord = (oldChordId: string, newChordId: string) => {
    dispatch({ type: "REPLACE_CHORD", payload: { oldChordId, newChordId } });
  };

  const handleReplacePattern = (oldPatternId: string, newPatternId: string) => {
    dispatch({
      type: "REPLACE_PATTERN",
      payload: { oldPatternId, newPatternId },
    });
  };

  const handleNavigateToChord = (chordId: string) => {
    sessionStorage.setItem("returning_from_edit", "true");
    saveState();
    saveMetadata({
      title,
      artist,
      genre,
      theme,
      description,
      isPublic,
      audioData,
    });
    router.push(`/home/chords/${chordId}?returnTo=song-create`);
  };

  const handleNavigateToPattern = (patternId: string) => {
    sessionStorage.setItem("returning_from_edit", "true");
    saveState();
    saveMetadata({
      title,
      artist,
      genre,
      theme,
      description,
      isPublic,
      audioData,
    });
    router.push(`/home/patterns/${patternId}?returnTo=song-create`);
  };

  const handleCreateChord = () => {
    sessionStorage.setItem("returning_from_edit", "true");
    saveState();
    saveMetadata({
      title,
      artist,
      genre,
      theme,
      description,
      isPublic,
      audioData,
    });
    router.push("/home/chords/create?returnTo=song-create");
  };

  const handleCreatePattern = () => {
    sessionStorage.setItem("returning_from_edit", "true");
    saveState();
    saveMetadata({
      title,
      artist,
      genre,
      theme,
      description,
      isPublic,
      audioData,
    });
    router.push("/home/patterns/create?returnTo=song-create");
  };

  const completedSegments = state.segments.filter(
    (s) => s.chordId && s.patternId,
  ).length;
  const completionPercentage = Math.round(
    (completedSegments / Math.max(1, state.segments.length)) * 100,
  );

  const textOnlyCount = state.segments.filter(
    (s) => s.text && !s.patternId,
  ).length;
  const playbackOnlyCount = state.segments.filter(
    (s) => !s.text && s.patternId,
  ).length;
  const fullSectionsCount = state.segments.filter(
    (s) => s.text && s.patternId,
  ).length;
  const spacesCount = state.segments.filter(
    (s) => !s.text && !s.patternId,
  ).length;

  const UploadStatusIndicator = () => {
    if (!showUploadStatus || !activeUpload) return null;

    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 shadow-lg border-2 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {activeUpload.status === "uploading" && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              )}
              {activeUpload.status === "completed" && (
                <div className="rounded-full h-4 w-4 bg-green-500" />
              )}
              {activeUpload.status === "failed" && (
                <div className="rounded-full h-4 w-4 bg-red-500" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {activeUpload.status === "uploading" && "Uploading audio..."}
                  {activeUpload.status === "completed" && "Audio uploaded!"}
                  {activeUpload.status === "failed" && "Upload failed"}
                </p>
                {activeUpload.status === "uploading" && (
                  <>
                    <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${activeUpload.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeUpload.progress}% - {activeUpload.fileName}
                    </p>
                  </>
                )}
                {activeUpload.error && (
                  <p className="text-xs text-red-500 mt-1">
                    {activeUpload.error}
                  </p>
                )}
              </div>
              {activeUpload.status === "failed" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (activeUpload) {
                      setShowUploadStatus(false);
                    }
                  }}
                >
                  Dismiss
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/home/songs")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Songs
          </Button>
          <h1 className="text-3xl font-bold">Create New Song</h1>
          <p className="text-muted-foreground mt-2">
            Build your song segment by segment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Song Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Song title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artist">Artist</Label>
                  <Input
                    id="artist"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Artist name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Select
                      value={genre || "none"}
                      onValueChange={(value) =>
                        setGenre(value === "none" ? "" : value)
                      }
                    >
                      <SelectTrigger id="genre" className="w-full">
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {genres.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={theme || "none"}
                      onValueChange={(value) =>
                        setTheme(value === "none" ? "" : value)
                      }
                    >
                      <SelectTrigger id="theme" className="w-full">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {themes.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="About this song..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isPublic">Public</Label>
                  <Switch
                    id="isPublic"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                </div>
              </CardContent>
            </Card>

            <SongResourcesPanel
              segments={state.segments}
              chords={state.chords}
              patterns={state.patterns}
              onChordClick={handleNavigateToChord}
              onPatternClick={handleNavigateToPattern}
              onDeleteChord={handleDeleteChord}
              onDeletePattern={handleDeletePattern}
              onReplaceChord={handleReplaceChord}
              onReplacePattern={handleReplacePattern}
              onCreateChord={handleCreateChord}
              onCreatePattern={handleCreatePattern}
              audioData={audioData}
              onAudioChange={setAudioData}
            />

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Segments:</span>
                    <span className="font-bold text-lg">
                      {state.segments.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Unique Chords:
                    </span>
                    <span className="font-bold text-lg">
                      {
                        new Set(
                          state.segments
                            .filter((s) => s.chordId)
                            .map((s) => s.chordId),
                        ).size
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Unique Patterns:
                    </span>
                    <span className="font-bold text-lg">
                      {
                        new Set(
                          state.segments
                            .filter((s) => s.patternId)
                            .map((s) => s.patternId),
                        ).size
                      }
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t">
                  <div className="flex justify-between text-xs">
                    <span>Completion</span>
                    <span>{completionPercentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <h4 className="text-xs font-medium">Segment Types</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Text only:</span>
                      <span className="font-medium">{textOnlyCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Playback only:
                      </span>
                      <span className="font-medium">{playbackOnlyCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Full sections:
                      </span>
                      <span className="font-medium">{fullSectionsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Spaces:</span>
                      <span className="font-medium">{spacesCount}</span>
                    </div>
                  </div>
                </div>

                {state.segments.length === 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs">
                    <p className="text-blue-800 dark:text-blue-300">
                      💡 Click "Add New Segment" to start building your song
                    </p>
                  </div>
                )}

                {state.segments.length > 0 && completionPercentage < 100 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs">
                    <p className="text-amber-800 dark:text-amber-300">
                      💡 Add patterns to text segments to create full sections
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Song Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <SegmentTable
                  segments={state.segments}
                  chords={state.chords}
                  patterns={state.patterns}
                  onUpdateSegment={(index, segment) =>
                    dispatch({
                      type: "UPDATE_SEGMENT",
                      payload: { index, segment },
                    })
                  }
                  onDeleteSegment={(index) =>
                    dispatch({ type: "DELETE_SEGMENT", payload: index })
                  }
                  onAddSegment={(copyFromSegment) => {
                    if (copyFromSegment) {
                      dispatch({
                        type: "ADD_SEGMENT",
                        payload: copyFromSegment,
                      });
                    } else {
                      dispatch({ type: "ADD_SEGMENT" });
                    }
                  }}
                  onReorderSegments={(from, to) =>
                    dispatch({
                      type: "REORDER_SEGMENTS",
                      payload: { from, to },
                    })
                  }
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6">
          <Button
            variant="outline"
            onClick={() => router.push("/home/songs")}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !title.trim() || state.segments.length === 0}
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Song
              </>
            )}
          </Button>
        </div>
      </div>

      <UploadStatusIndicator />
    </div>
  );
}

export default function CreateTableSongPage() {
  return (
    <TableEditorProvider>
      <CreateSongContent />
    </TableEditorProvider>
  );
}
