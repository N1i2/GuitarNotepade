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
import { SongTextViewer } from "@/components/song/song-text-viewer";
import { EditToolPanel } from "@/components/song/edit-tool-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSongCreation } from "@/app/contexts/song-creation-context";
import {
  convertSegmentsToUI,
  convertStateToBackendFormat,
  convertStateToUpdateBackendFormat,
} from "@/lib/song-converter";
import { AudioInputData, AudioInputType } from "@/types/audio";
import AudioInputPanel from "@/components/song/audio-input-panel";
import { EditSongProvider } from "@/app/contexts/edit-song-context";

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
        <CardTitle>Детали песни</CardTitle>
        <CardDescription>Редактируйте информацию о песне</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Название песни *
            </div>
          </Label>
          <Input
            id="title"
            placeholder="Введите название песни"
            value={state.title}
            onChange={(e) => handleChange("title", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="artist">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Исполнитель
            </div>
          </Label>
          <Input
            id="artist"
            placeholder="Введите исполнителя"
            value={state.artist || ""}
            onChange={(e) => handleChange("artist", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="genre">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Жанр
              </div>
            </Label>
            <Select
              value={state.genre || (genres.length > 0 ? genres[0] : "")}
              onValueChange={(value) => handleChange("genre", value)}
            >
              <SelectTrigger id="genre">
                <SelectValue placeholder="Выберите жанр" />
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
                Тема
              </div>
            </Label>
            <Select
              value={state.theme || (themes.length > 0 ? themes[0] : "")}
              onValueChange={(value) => handleChange("theme", value)}
            >
              <SelectTrigger id="theme">
                <SelectValue placeholder="Выберите тему" />
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
              Описание
            </div>
          </Label>
          <Textarea
            id="description"
            placeholder="Расскажите о вашей песне..."
            value={state.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div>
            <Label className="font-medium cursor-pointer">Видимость</Label>
            <p className="text-sm text-muted-foreground">
              {state.isPublic ? "Все пользователи" : "Только для вас"}
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
                Аккорды
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {state.selectedPatterns.length}
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300">
                Паттерны
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {state.segments.length}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                Сегменты
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {state.text.length}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300">
                Символов
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
  const [originalAudioData, setOriginalAudioData] = useState<{
    url?: string;
    type?: string;
  } | null>(null);

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

        let audioInputData: AudioInputData | null = null;

        if (songData.customAudioUrl && songData.customAudioType) {
          setOriginalAudioData({
            url: songData.customAudioUrl,
            type: songData.customAudioType,
          });

          if (songData.customAudioType === "File") {
            audioInputData = {
              type: AudioInputType.FILE,
              customAudioUrl: songData.customAudioUrl,
              customAudioType: "File",
              fileName:
                songData.customAudioUrl.split("/").pop() || "audio-file.mp3",
            };

            if (songData.customAudioUrl.startsWith("data:audio/")) {
              audioInputData.fileName = "audio-file.mp3";
            }
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
      } catch (error: any) {
        toast.error(error.message || "Не удалось загрузить песню");
        router.push("/home/songs");
      } finally {
        setIsLoading(false);
      }
    };

    loadSongData();
  }, [songId, user, dispatch, router, toast, isInitialized]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Пожалуйста, войдите в систему");
      return;
    }

    if (!state.title.trim()) {
      toast.error("Введите название песни");
      return;
    }

    if (!state.text.trim()) {
      toast.error("Введите текст песни");
      return;
    }

    if (state.selectedChords.length > 20) {
      toast.error("Максимум 20 аккордов на песню");
      return;
    }

    if (state.selectedPatterns.length > 10) {
      toast.error("Максимум 10 паттернов на песню");
      return;
    }

    const chordColors = state.selectedChords.map((c) => c.color);
    const patternColors = state.selectedPatterns.map((p) => p.color);
    const allColors = [...chordColors, ...patternColors];
    const uniqueColors = new Set(allColors);

    if (allColors.length !== uniqueColors.size) {
      toast.error("Цвета аккордов и паттернов не должны повторяться.");
      return;
    }

    setIsLoading(true);
    try {
      const updateData = convertStateToUpdateBackendFormat(
        state,
        songId,
        originalAudioData || undefined
      );

      const updatedSong = await SongsService.updateSongWithSegments(updateData);

      toast.success(`Песня "${updatedSong.title}" успешно обновлена!`);

      router.push(`/home/songs/${updatedSong.id}`);
    } catch (error: any) {
      toast.error(error.message || "Не удалось обновить песню");
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
            <p className="text-muted-foreground">Загрузка данных песни...</p>
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
            Назад к песне
          </Button>
          <h1 className="text-3xl font-bold">Редактирование песни</h1>
          <p className="text-muted-foreground mt-2">
            Редактируйте информацию, но не текст песни
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <SongDetails />
            <EditToolPanel />
            <AudioInputPanel />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Текст песни</CardTitle>
                <CardDescription>
                  Только просмотр. Редактирование текста, аккордов и паттернов
                  недоступно в режиме редактирования
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SongTextViewer />
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
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !state.title.trim() || !state.text.trim()}
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Сохранение...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Сохранить изменения
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function EditSongPage() {
  const params = useParams();
  const songId = params.songId as string;

  return (
    <EditSongProvider songId={songId}>
      <EditSongContent />
    </EditSongProvider>
  );
}
