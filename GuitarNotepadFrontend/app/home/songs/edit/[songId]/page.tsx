"use client";

import { SongResourcesPanel } from "@/components/song/table-editor/song-resources-panel";
import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { SongsService } from "@/lib/api/song-service";
import { ChordsService } from "@/lib/api/chords-service";
import { PatternsService } from "@/lib/api/patterns-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { convertSegmentsToUI } from "@/lib/song-converter";
import { TableSegment, SegmentType } from "@/types/songs";

function EditSongContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const songId = params.songId as string;
  const returnTo = searchParams.get("returnTo");
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
  } = useSongEditorState();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [originalAudioData, setOriginalAudioData] = useState<{
    url?: string;
    type?: string;
  } | null>(null);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [theme, setTheme] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
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

  const fetchAudioBlob = async (songId: string): Promise<string | null> => {
    try {
      const token = localStorage.getItem("auth_token");
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
      const url = `${baseUrl}/Songs/${songId}/audio-file`;

      console.log("🎵 Fetching audio file for edit from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch audio, status:", response.status);
        return null;
      }

      const blob = await response.blob();
      console.log("🎵 Audio blob received for edit:", blob.size, blob.type);

      if (blob.size === 0) {
        console.error("Audio blob is empty");
        return null;
      }

      const blobUrl = URL.createObjectURL(blob);
      console.log("🎵 Audio blob URL created for edit:", blobUrl);
      return blobUrl;
    } catch (error) {
      console.error("Failed to fetch audio for edit:", error);
      return null;
    }
  };

  useEffect(() => {
    const loadSongData = async () => {
      if (!user || !songId) return;

      setIsLoading(true);
      try {
        const songData = await SongsService.getSongById(
          songId,
          true,
          true,
          true,
          false,
          true,
        );

        const uiData = convertSegmentsToUI(songData);

        const tableSegments: TableSegment[] = uiData.segments.map(
          (segment, index) => ({
            id: segment.id,
            order: index,
            type: segment.text ? SegmentType.Text : SegmentType.Space,
            text: segment.text,
            chordId: segment.chordId,
            patternId: segment.patternId,
            color: segment.color,
            backgroundColor: segment.backgroundColor,
            repeatGroup: undefined,
            comment: segment.comments?.[0]?.text || "",
          }),
        );

        const [chordsData, patternsData] = await Promise.all([
          ChordsService.getAllChords({ pageSize: 100 }),
          PatternsService.getAllPatterns({ pageSize: 100 }),
        ]);

        dispatch({ type: "SET_CHORDS", payload: chordsData.items });
        dispatch({ type: "SET_PATTERNS", payload: patternsData.items });
        dispatch({ type: "SET_SEGMENTS", payload: tableSegments });

        setTitle(songData.title || "");
        setArtist(songData.artist || "");
        setGenre(songData.genre || "");
        setTheme(songData.theme || "");
        setDescription(songData.description || "");
        setIsPublic(songData.isPublic);

        if (songData.customAudioUrl && songData.customAudioType) {
          setOriginalAudioData({
            url: songData.customAudioUrl,
            type: songData.customAudioType,
          });

          const audioTypeLower = songData.customAudioType.toLowerCase();

          if (audioTypeLower === "url" || audioTypeLower === "Url") {
            setAudioData({
              type: AudioInputType.URL,
              url: songData.customAudioUrl,
              customAudioUrl: songData.customAudioUrl,
              customAudioType: "url",
            });
          } else {
            const isRecording = songData.customAudioType === "audio/webm";
            const fileName =
              songData.customAudioUrl.split("/").pop() || "audio-file";

            setAudioData({
              type: isRecording ? AudioInputType.RECORD : AudioInputType.FILE,
              customAudioUrl: songData.customAudioUrl,
              customAudioType: songData.customAudioType,
              fileName: fileName,
            });
          }
        }

        setIsInitialized(true);
      } catch (error: any) {
        console.error("Load song error:", error);
        toast.error(error.message || "Failed to load song");
        router.push("/home/songs");
      } finally {
        setIsLoading(false);
      }
    };

    loadSongData();
  }, [songId, user, dispatch, router, toast]);

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
        songId,
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
    songId,
  ]);

  const handleBack = () => {
    if (returnTo === "song-create") {
      router.push("/home/songs/create");
    } else {
      router.push(`/home/songs/${songId}`);
    }
  };

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

    setIsSaving(true);
    try {
      let audioBase64: string | undefined;
      let audioType: string | undefined;
      let customAudioUrl: string | undefined;
      let customAudioType: string | undefined;
      let isDeleteAudio = false;

      const currentAudioType = audioData.type;
      const hadOriginalAudio =
        originalAudioData?.url && originalAudioData?.type;

      if (
        (currentAudioType === AudioInputType.FILE && audioData.file) ||
        (currentAudioType === AudioInputType.RECORD && audioData.audioBlob)
      ) {
        const sourceBlob =
          currentAudioType === AudioInputType.FILE
            ? audioData.file!
            : audioData.audioBlob!;

        audioBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(sourceBlob);
        });

        audioType =
          currentAudioType === AudioInputType.FILE
            ? audioData.file!.type
            : "audio/webm";

        if (audioType === "video/webm") {
          audioType = "audio/webm";
        }

        isDeleteAudio = false;
        console.log("📤 Uploading new audio file:", {
          type: audioType,
          size: sourceBlob.size,
        });
      } else if (currentAudioType === AudioInputType.URL && audioData.url) {
        customAudioUrl = audioData.url;
        customAudioType = "url";
        isDeleteAudio = false;
        console.log("📤 Using external URL:", customAudioUrl);
      } else if (currentAudioType === AudioInputType.NONE && hadOriginalAudio) {
        isDeleteAudio = true;
        console.log("📤 Deleting audio");
      } else if (
        hadOriginalAudio &&
        audioData.customAudioUrl === originalAudioData?.url
      ) {
        console.log("📤 Keeping existing audio");
      } else {
        console.log("📤 No audio changes");
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

      const updateData: any = {
        id: songId,
        title: title || null,
        artist: artist || null,
        description: description || null,
        genre: genre || null,
        theme: theme || null,
        isPublic: isPublic,
        segments: structureSegments,
        segmentComments:
          Object.keys(segmentComments).length > 0 ? segmentComments : null,
        isDeleteAudio: isDeleteAudio,
      };

      if (audioBase64) {
        updateData.audioBase64 = audioBase64;
        updateData.audioType = audioType;
      } else if (customAudioUrl) {
        updateData.customAudioUrl = customAudioUrl;
        updateData.customAudioType = customAudioType;
      } else if (isDeleteAudio) {
      }

      console.log("📤 Updating song with audio:", {
        hasAudioBase64: !!audioBase64,
        audioType,
        hasCustomAudioUrl: !!customAudioUrl,
        isDeleteAudio,
      });

      const updatedSong = await SongsService.updateSongWithSegments(updateData);

      clearState();
      toast.success(`Song "${updatedSong.title}" updated!`);
      router.push(`/home/songs/${updatedSong.id}`);
    } catch (error: any) {
      console.error("Update song error:", error);
      toast.error(error.message || "Failed to update song");
    } finally {
      setIsSaving(false);
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
      songId,
    });
    router.push(`/home/chords/${chordId}?returnTo=song-edit&songId=${songId}`);
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
      songId,
    });
    router.push(
      `/home/patterns/${patternId}?returnTo=song-edit&songId=${songId}`,
    );
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
      songId,
    });
    router.push(`/home/chords/create?returnTo=song-edit&songId=${songId}`);
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
      songId,
    });
    router.push(`/home/patterns/create?returnTo=song-edit&songId=${songId}`);
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading song data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Song
          </Button>
          <h1 className="text-3xl font-bold">Edit Song</h1>
          <p className="text-muted-foreground mt-2">
            Edit song details, segments, chords, and patterns
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
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Song Segments</CardTitle>
                <CardDescription>
                  Edit segments, chords, and patterns
                </CardDescription>
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
          <Button variant="outline" onClick={handleBack} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !title.trim() || state.segments.length === 0}
            size="lg"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function EditSongPage() {
  return (
    <TableEditorProvider>
      <EditSongContent />
    </TableEditorProvider>
  );
}
