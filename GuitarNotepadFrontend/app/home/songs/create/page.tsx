"use client";

import { useState, useEffect } from "react";
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
import {
  TableEditorProvider,
  useTableEditor,
} from "@/app/contexts/table-editor-context";
import { convertTableToDTO } from "@/lib/table-converter";

function CreateSongContent() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const { state, dispatch } = useTableEditor();

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [theme, setTheme] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
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
    };

    loadData();
  }, []);

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
      const segmentsDTO = convertTableToDTO(state.segments);

      const songData = {
        title,
        artist: artist || undefined,
        genre: genre || undefined,
        theme: theme || undefined,
        description: description || undefined,
        isPublic,
        segments: segmentsDTO,
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

      const createdSong = await SongsService.createSong(songData);
      toast.success(`Song "${createdSong.title}" created!`);
      router.push(`/home/songs/${createdSong.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create song");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
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
                    <Input
                      id="genre"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      placeholder="Rock, Pop..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Input
                      id="theme"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      placeholder="Love, Life..."
                    />
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

            <Card>
              <CardHeader>
                <CardTitle>Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Segments:</span>
                    <span className="font-bold">{state.segments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unique Chords:</span>
                    <span className="font-bold">
                      {
                        new Set(
                          state.segments
                            .filter((s) => s.chordId)
                            .map((s) => s.chordId),
                        ).size
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unique Patterns:</span>
                    <span className="font-bold">
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
                  onAddSegment={() => dispatch({ type: "ADD_SEGMENT" })}
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
