"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ExternalLink,
  Music,
  Link,
  File,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import { formatTime } from "@/lib/audio-utils";
import { AudioInputType } from "@/types/audio";

interface AudioPlayerPanelProps {
  audioData?: {
    customAudioUrl?: string;
    customAudioType?: string;
    type?: AudioInputType;
    url?: string;
    songId?: string;
  };
  title?: string;
}

export const AudioPlayerPanel: React.FC<AudioPlayerPanelProps> = ({
  audioData,
  title = "Audio",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  const getAudioType = (): AudioInputType => {
    if (audioData?.type) return audioData.type;

    const customType = audioData?.customAudioType;

    if (customType === "Url" || customType === "url") {
      return AudioInputType.URL;
    }

    if (
      customType === "File" ||
      customType === "audio/mpeg" ||
      customType === "audio/webm" ||
      customType === "audio/wav" ||
      customType === "audio/ogg" ||
      customType === "audio/mp4"
    ) {
      return AudioInputType.FILE;
    }

    return AudioInputType.NONE;
  };

  const audioType = getAudioType();
  const audioFileName = audioData?.customAudioUrl || audioData?.url;
  const songId = audioData?.songId;

  useEffect(() => {
    const fetchAudioFile = async () => {
      if (audioType === AudioInputType.URL) {
        setIsLoading(false);
        return;
      }

      if (!audioFileName || !songId) {
        setIsLoading(false);
        return;
      }

      if (audioBlobUrl) {
        setIsLoading(false);
        return;
      }

      if (audioFileName.startsWith("data:")) {
        setAudioBlobUrl(audioFileName);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const token = localStorage.getItem("auth_token");
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
        const url = `${baseUrl}/Songs/${songId}/audio-file`;

        console.log("🎵 Fetching audio file from:", url);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("🎵 Failed to fetch audio:", error);
          throw new Error(error.error || "Failed to fetch audio");
        }

        const blob = await response.blob();
        console.log("🎵 Audio blob received:", blob.size, blob.type);

        const blobUrl = URL.createObjectURL(blob);
        setAudioBlobUrl(blobUrl);
        console.log("🎵 Audio loaded, size:", blob.size);
      } catch (error) {
        console.error("🎵 Error fetching audio:", error);
        setAudioError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAudioFile();

    return () => {
      if (audioBlobUrl && audioBlobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(audioBlobUrl);
      }
    };
  }, [audioFileName, songId, audioType]);

  const audioUrl =
    audioType === AudioInputType.URL ? audioFileName : audioBlobUrl;

  useEffect(() => {
    const audio = audioPlayerRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (audio.duration && audio.duration !== Infinity && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleLoadedData = () => {
      setAudioLoaded(true);
      setAudioError(false);
      if (audio.duration && audio.duration !== Infinity && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const handleError = () => {
      setAudioError(true);
      setAudioLoaded(false);
    };
    const handleCanPlay = () => {
      if (audio.duration && audio.duration !== Infinity && audio.duration > 0) {
        setDuration(audio.duration);
        setAudioLoaded(true);
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, []);

  useEffect(() => {
    if (
      audioPlayerRef.current &&
      audioUrl &&
      audioType === AudioInputType.FILE
    ) {
      audioPlayerRef.current.src = audioUrl;
      audioPlayerRef.current.load();
    }
  }, [audioUrl, audioType]);

  const togglePlayPause = () => {
    if (!audioPlayerRef.current || audioError || !audioLoaded) return;

    if (isPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play().catch(() => {
        setAudioError(true);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const seekForward = () => {
    if (audioPlayerRef.current && duration > 0 && audioLoaded) {
      audioPlayerRef.current.currentTime = Math.min(
        audioPlayerRef.current.currentTime + 5,
        duration,
      );
    }
  };

  const seekBackward = () => {
    if (audioPlayerRef.current && audioLoaded) {
      audioPlayerRef.current.currentTime = Math.max(
        audioPlayerRef.current.currentTime - 5,
        0,
      );
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (audioPlayerRef.current && duration > 0 && audioLoaded) {
      const newTime = (value[0] / 100) * duration;
      audioPlayerRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.volume = newVolume / 100;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioPlayerRef.current) {
      if (isMuted) {
        audioPlayerRef.current.volume = volume / 100;
        setIsMuted(false);
      } else {
        audioPlayerRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formattedCurrentTime = formatTime(currentTime * 1000);
  const formattedDuration = formatTime(duration * 1000);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Audio
          </CardTitle>
          <CardDescription>Loading audio...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if ((!audioFileName && !audioUrl) || audioType === AudioInputType.NONE) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Audio
          </CardTitle>
          <CardDescription>This song has no audio attached</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-muted/50">
            <Music className="h-4 w-4" />
            <AlertDescription>
              No audio file or URL is attached to this song
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (audioType === AudioInputType.URL) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Audio URL
          </CardTitle>
          <CardDescription>External audio link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Link className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">External Audio Link</div>
                <div className="text-sm text-muted-foreground">
                  Audio hosted on external service
                </div>
              </div>
            </div>

            <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded border">
              <div className="text-xs text-muted-foreground mb-1">URL:</div>
              <div className="text-sm font-mono break-all p-2 bg-gray-100 dark:bg-gray-900 rounded">
                {audioFileName}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="default"
              onClick={() => window.open(audioFileName, "_blank")}
              className="w-full"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Audio Link in New Tab
            </Button>

            <Alert className="bg-muted/30">
              <AlertDescription className="text-sm">
                This audio is hosted externally. Click the button above to
                listen in your browser.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Audio Player
          <span className="text-sm font-normal text-muted-foreground ml-2">
            Audio File
          </span>
        </CardTitle>
        <CardDescription>Audio file attached to this song</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <File className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">Audio File</div>
              <div className="text-sm text-muted-foreground">
                {audioFileName?.split("/").pop() || "Audio file"}
              </div>
            </div>
          </div>

          {audioLoaded && duration > 0 && (
            <div className="text-sm text-muted-foreground">
              {formattedDuration}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <audio ref={audioPlayerRef} className="hidden" />

          {audioError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load audio. The audio file might be corrupted or in an
                unsupported format.
              </AlertDescription>
            </Alert>
          )}

          {!audioError && audioUrl && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formattedCurrentTime}</span>
                  <span>{formattedDuration || "--:--"}</span>
                </div>
                <Slider
                  value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                  max={100}
                  step={0.1}
                  className="w-full"
                  onValueChange={handleSliderChange}
                  disabled={!audioLoaded}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={seekBackward}
                    disabled={!audioLoaded}
                    title="Rewind 5 seconds"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="default"
                    size="lg"
                    onClick={togglePlayPause}
                    disabled={!audioLoaded}
                    className="w-12 h-12 rounded-full"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={seekForward}
                    disabled={!audioLoaded}
                    title="Forward 5 seconds"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="w-24">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={100}
                      step={1}
                      className="w-full"
                      onValueChange={handleVolumeChange}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
