"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Save,
  Music,
  User,
  Hash,
  Tag,
  FileText,
} from "lucide-react";
import { SongTextEditor } from "@/components/song/song-text-editor";
import { ToolPanel } from "@/components/song/tool-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SongCreationProvider,
  useSongCreation,
} from "@/app/contexts/song-creation-context";
import {
  convertSegmentsToUI,
  convertStateToBackendFormat,
} from "@/lib/song-converter";
import { AudioInputType } from "@/types/audio";
import AudioInputPanel from "@/components/song/audio-input-panel";

function SongDetails() {
  const { state, dispatch } = useSongCreation();

  const handleChange = (field: string, value: string | boolean) => {
    switch (field) {
      case "title":
        dispatch({ type: "SET_TITLE", payload: value as string });
        break;
      case "artist":
        dispatch({ type: "SET_ARTIST", payload: value as string });
        break;
      case "genre":
        dispatch({ type: "SET_GENRE", payload: value as string });
        break;
      case "theme":
        dispatch({ type: "SET_THEME", payload: value as string });
        break;
      case "description":
        dispatch({ type: "SET_DESCRIPTION", payload: value as string });
        break;
      case "isPublic":
        dispatch({ type: "SET_PUBLIC", payload: value as boolean });
        break;
    }
  };

  const genres = [
    "Empty",
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
    "Empty",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Song Details</CardTitle>
        <CardDescription>Edit song information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Song Name *
            </div>
          </Label>
          <Input
            id="title"
            placeholder="Enter song name"
            value={state.title}
            onChange={(e) => handleChange("title", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="artist">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Artist
            </div>
          </Label>
          <Input
            id="artist"
            placeholder="Enter Artist"
            value={state.artist || ""}
            onChange={(e) => handleChange("artist", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="genre">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Genre
              </div>
            </Label>
            <Select
              value={state.genre || (genres.length > 0 ? genres[0] : "")}
              onValueChange={(value) => handleChange("genre", value)}
            >
              <SelectTrigger id="genre">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Theme
              </div>
            </Label>
            <Select
              value={state.theme || (themes.length > 0 ? themes[0] : "")}
              onValueChange={(value) => handleChange("theme", value)}
            >
              <SelectTrigger id="theme">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {themes.map((theme) => (
                  <SelectItem key={theme} value={theme}>
                    {theme}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description
            </div>
          </Label>
          <Textarea
            id="description"
            placeholder="Tell me about your song..."
            value={state.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div>
            <Label className="font-medium cursor-pointer">Visibility</Label>
            <p className="text-sm text-muted-foreground">
              {state.isPublic ? "All users" : "Only for you"}
            </p>
          </div>
          <Switch
            checked={state.isPublic}
            onCheckedChange={(checked) => handleChange("isPublic", checked)}
          />
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {state.selectedChords.length}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Chords
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {state.selectedPatterns.length}
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300">
                Patterns
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {state.segments.length}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                Segments
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {state.text.length}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300">
                Sym
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EditSongContent() {
  const router = useRouter();
  const params = useParams();
  const songId = params.songId as string;
  const { user } = useAuth();
  const toast = useToast();
  const { state, dispatch } = useSongCreation();

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadSongData = async () => {
      if (!user || !songId || isInitialized) return;

      setIsLoading(true);
      try {
        const songData = await SongsService.getSongById(
          songId,
          user.id,
          true,
          true,
          true,
          false,
          true
        );

        const uiData = convertSegmentsToUI(songData);

        let audioInputData = null;
        if (songData.customAudioUrl && songData.customAudioType) {
          if (songData.customAudioType === "File") {
            audioInputData = {
              type: AudioInputType.FILE,
              customAudioUrl: songData.customAudioUrl,
              customAudioType: "File",
              fileName: "audio-file.mp3",
            };
          } else if (songData.customAudioType === "Url") {
            audioInputData = {
              type: AudioInputType.URL,
              url: songData.customAudioUrl,
              customAudioUrl: songData.customAudioUrl,
              customAudioType: "Url",
            };
          }
        }

        dispatch({
          type: "SET_STATE",
          payload: {
            title: songData.title || "",
            artist: songData.artist || "",
            genre: songData.genre || "",
            theme: songData.theme || "",
            description: songData.description || "",
            isPublic: songData.isPublic,
            text: uiData.text,
            selectedChords: uiData.chords,
            selectedPatterns: uiData.patterns,
            segments: uiData.segments,
            comments: uiData.comments,
            currentTool: "select",
            audioInput: audioInputData,
          },
        });

        setIsInitialized(true);
        console.log("Song data loaded:", {
          title: songData.title,
          hasAudio: !!songData.customAudioUrl,
          audioType: songData.customAudioType,
          audioInputData,
        });
      } catch (error: any) {
        toast.error(error.message || "Failed to load song");
        router.push("/home/songs");
      } finally {
        setIsLoading(false);
      }
    };

    loadSongData();
  }, [songId, user, dispatch, router, toast, isInitialized]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please, log in");
      return;
    }

    if (!state.title.trim()) {
      toast.error("You need to enter song name");
      return;
    }

    if (!state.text.trim()) {
      toast.error("You need to enter song text");
      return;
    }

    if (state.selectedChords.length > 20) {
      toast.error("Maximum 20 chords per song");
      return;
    }

    if (state.selectedPatterns.length > 10) {
      toast.error("Maximum 10 patterns per song");
      return;
    }

    const chordColors = state.selectedChords.map((c) => c.color);
    const patternColors = state.selectedPatterns.map((p) => p.color);
    const allColors = [...chordColors, ...patternColors];
    const uniqueColors = new Set(allColors);

    if (allColors.length !== uniqueColors.size) {
      toast.error(
        "The colors of the chords and patterns should not be repeated."
      );
      return;
    }

    setIsLoading(true);
    try {
      const songData = convertStateToBackendFormat(state);

      const updatedSong = await SongsService.updateSongWithSegments({
        id: songId,
        ...songData,
      });

      toast.success(`Song "${updatedSong.title}" successfully updated!`);

      router.push(`/home/songs/${updatedSong.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update song");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !isInitialized) {
    return (
      <div className="container mx-auto px-4 py-8">
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
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/home/songs/${songId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to song
          </Button>
          <h1 className="text-3xl font-bold">Edit song</h1>
          <p className="text-muted-foreground mt-2">
            Edit your song, chords, patterns, and comments
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <SongDetails />
            <ToolPanel />
            <AudioInputPanel />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Song text</CardTitle>
                <CardDescription>
                  Edit lyrics and use the tools on the left to modify chords and
                  patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SongTextEditor />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex gap-4 justify-end pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => router.push(`/home/songs/${songId}`)}
            disabled={isLoading}
            size="lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !state.title.trim() || !state.text.trim()}
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save changes
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
    <SongCreationProvider>
      <EditSongContent />
    </SongCreationProvider>
  );
}
