"use client";

import { SongsService } from "@/lib/api/song-service";
import React, { useState, useRef, useEffect, useCallback } from "react";
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
  const [isAudioReady, setIsAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioInitializedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const startTimeUpdateInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused && !audio.ended) {
        if (audio.currentTime && isFinite(audio.currentTime)) {
          setCurrentTime(audio.currentTime);
        }
      }
    }, 100);
  }, []);

  const stopTimeUpdateInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const fetchAudioFile = async () => {
      if (audioType === AudioInputType.URL) {
        setIsLoading(false);
        setAudioLoaded(true);
        return;
      }

      if (!audioFileName || !songId) {
        setIsLoading(false);
        return;
      }

      if (audioBlobUrl) {
        setIsLoading(false);
        setAudioLoaded(true);
        return;
      }

      if (audioFileName.startsWith("data:")) {
        setAudioBlobUrl(audioFileName);
        setIsLoading(false);
        setAudioLoaded(true);
        return;
      }

      try {
        setIsLoading(true);
        setAudioError(false);

        const blob = await SongsService.fetchAudioFileBlob(songId);
        const blobUrl = URL.createObjectURL(blob);
        setAudioBlobUrl(blobUrl);
      } catch (error) {
        console.error("Error fetching audio:", error);
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
      stopTimeUpdateInterval();
    };
  }, [audioFileName, songId, audioType, stopTimeUpdateInterval]);

  const audioUrl =
    audioType === AudioInputType.URL ? audioFileName : audioBlobUrl;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioUrl && !audioInitializedRef.current && !audioError) {
      audioInitializedRef.current = true;

      audio.src = audioUrl;
      audio.load();
      audio.volume = volume / 100;

      const handleLoadedMetadata = () => {
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
          setAudioLoaded(true);
        }
      };

      audio.addEventListener("loadedmetadata", handleLoadedMetadata);

      return () => {
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    }
  }, [audioUrl, audioError, volume]);

  useEffect(() => {
    const checkPlaybackState = setInterval(() => {
      const audio = audioRef.current;
      if (audio) {
        const isCurrentlyPlaying = !audio.paused && !audio.ended;
        if (isCurrentlyPlaying !== isPlaying) {
          setIsPlaying(isCurrentlyPlaying);
        }
      }
    }, 200);

    return () => {
      clearInterval(checkPlaybackState);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      startTimeUpdateInterval();
    } else {
      stopTimeUpdateInterval();
    }
  }, [isPlaying, startTimeUpdateInterval, stopTimeUpdateInterval]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (
      audioUrl &&
      audioType === AudioInputType.FILE &&
      !isLoading &&
      !audioError
    ) {
      const wasPlaying = isPlaying;

      audio.pause();
      audio.src = audioUrl;
      audio.load();

      const handleCanPlay = () => {
        setAudioLoaded(true);
        setIsAudioReady(true);
        if (audio.duration && isFinite(audio.duration)) {
          setDuration(audio.duration);
        }
        if (wasPlaying) {
          audio
            .play()
            .catch((err) => console.error("Play after reload failed:", err));
        }
      };

      audio.addEventListener("canplay", handleCanPlay, { once: true });
      return () => audio.removeEventListener("canplay", handleCanPlay);
    }
  }, [audioUrl, audioType, isLoading, audioError]);

  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !audioLoaded || audioError) return;

    try {
      if (!audio.paused) {
        audio.pause();
      } else {
        audio.muted = false;
        audio.volume = volume / 100;
        await audio.play();
      }
    } catch (error) {
      console.error("Play/pause error:", error);
      setAudioError(true);
    }
  }, [audioLoaded, audioError, volume]);

  const seekBackward = useCallback(() => {
    const audio = audioRef.current;
    if (audio && duration > 0 && audioLoaded) {
      audio.currentTime = Math.max(audio.currentTime - 5, 0);
      setCurrentTime(audio.currentTime);
    }
  }, [duration, audioLoaded]);

  const seekForward = useCallback(() => {
    const audio = audioRef.current;
    if (audio && duration > 0 && audioLoaded) {
      audio.currentTime = Math.min(audio.currentTime + 5, duration);
      setCurrentTime(audio.currentTime);
    }
  }, [duration, audioLoaded]);

  const handleSliderChange = useCallback(
    (value: number[]) => {
      const audio = audioRef.current;
      if (audio && duration > 0 && audioLoaded) {
        const newTime = (value[0] / 100) * duration;
        audio.currentTime = newTime;
        setCurrentTime(newTime);
      }
    },
    [duration, audioLoaded],
  );

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0];
      setVolume(newVolume);
      if (audioRef.current) {
        audioRef.current.volume = newVolume / 100;
      }
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    },
    [isMuted],
  );

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isMuted) {
        audio.volume = volume / 100;
        setIsMuted(false);
      } else {
        audio.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

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
              {duration > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Duration: {formattedDuration}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <audio ref={audioRef} />

          {audioError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load or play audio. The audio file might be corrupted.
              </AlertDescription>
            </Alert>
          )}

          {!audioError && audioUrl && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formattedCurrentTime}</span>
                  <span>{formattedDuration || "00:00"}</span>
                </div>
                <Slider
                  value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                  max={100}
                  step={0.1}
                  className="w-full"
                  onValueChange={handleSliderChange}
                  disabled={!audioLoaded || duration === 0}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={seekBackward}
                    disabled={!audioLoaded || duration === 0}
                    title="Rewind 5 seconds"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="default"
                    size="lg"
                    onClick={togglePlayPause}
                    disabled={!audioLoaded || duration === 0}
                    className="w-12 h-12 rounded-full"
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
                    disabled={!audioLoaded || duration === 0}
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
