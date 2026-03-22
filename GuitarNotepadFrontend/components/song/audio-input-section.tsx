"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Mic,
  Square,
  Trash2,
  Upload,
  Link,
  Play,
  Pause,
  Music2,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  FileAudio,
} from "lucide-react";
import { AudioInputData, AudioInputType } from "@/types/audio";
import { formatTime } from "@/lib/audio-utils";

interface AudioInputSectionProps {
  value?: AudioInputData;
  onChange: (data: AudioInputData) => void;
}

export function AudioInputSection({ value, onChange }: AudioInputSectionProps) {
  const [type, setType] = useState<AudioInputType>(
    value?.type || AudioInputType.NONE,
  );
  const [url, setUrl] = useState(value?.url || "");
  const [fileName, setFileName] = useState(value?.fileName || "");
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const truncateFileName = (name: string, maxLength: number = 35) => {
    if (name.length <= maxLength) return name;
    const extension = name.split(".").pop() || "";
    const nameWithoutExt = name.slice(0, name.length - extension.length - 1);
    const truncated = nameWithoutExt.slice(0, maxLength - extension.length - 3);
    return `${truncated}...${extension}`;
  };

  const createAudioUrl = useCallback((blob: Blob): string => {
    return URL.createObjectURL(blob);
  }, []);

  const cleanupAudioUrl = useCallback(() => {
    if (audioUrlRef.current && audioUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const startTimeUpdateInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused && !audio.ended && audio.currentTime) {
        setCurrentTime(audio.currentTime);
      }
    }, 100);
  }, []);

  const stopTimeUpdateInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const initAudioFromUrl = useCallback(
    async (audioUrl: string, audioType?: string) => {
      if (!audioRef.current) return;

      if (audioUrl.startsWith("blob:") || audioUrl.startsWith("data:")) {
        console.log(
          "🎵 Initializing audio from blob/data URL:",
          audioUrl.substring(0, 50),
        );
        cleanupAudioUrl();
        audioUrlRef.current = audioUrl;

        audioRef.current.pause();
        audioRef.current.src = audioUrl;
        audioRef.current.load();

        const handleLoadedMetadata = () => {
          if (
            audioRef.current?.duration &&
            isFinite(audioRef.current.duration)
          ) {
            setDuration(audioRef.current.duration);
            setAudioLoaded(true);
            setIsLoadingAudio(false);
          }
        };

        audioRef.current.addEventListener(
          "loadedmetadata",
          handleLoadedMetadata,
          { once: true },
        );
        return;
      }

      if (audioUrl.startsWith("http")) {
        console.log("🎵 Initializing audio from http URL:", audioUrl);
        cleanupAudioUrl();
        audioUrlRef.current = audioUrl;

        audioRef.current.pause();
        audioRef.current.src = audioUrl;
        audioRef.current.load();

        const handleLoadedMetadata = () => {
          if (
            audioRef.current?.duration &&
            isFinite(audioRef.current.duration)
          ) {
            setDuration(audioRef.current.duration);
            setAudioLoaded(true);
            setIsLoadingAudio(false);
          }
        };

        audioRef.current.addEventListener(
          "loadedmetadata",
          handleLoadedMetadata,
          { once: true },
        );
        return;
      }
    },
    [cleanupAudioUrl],
  );

  useEffect(() => {
    const loadAudioFromCustomUrl = async () => {
      if (
        value?.customAudioUrl &&
        (type === AudioInputType.FILE || type === AudioInputType.RECORD)
      ) {
        console.log(
          "🎵 Loading audio from customAudioUrl:",
          value.customAudioUrl.substring(0, 50),
        );
        setIsLoadingAudio(true);
        await initAudioFromUrl(value.customAudioUrl, value.customAudioType);
      }
    };

    loadAudioFromCustomUrl();
  }, [value?.customAudioUrl, type, initAudioFromUrl]);

  useEffect(() => {
    if (value?.audioBlob && type === AudioInputType.RECORD && !audioLoaded) {
      cleanupAudioUrl();
      let blob = value.audioBlob;
      if (blob.type === "video/webm") {
        blob = new Blob([blob], { type: "audio/webm" });
        console.log("🎵 Converted video/webm blob to audio/webm");
      }
      const url = createAudioUrl(blob);
      audioUrlRef.current = url;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = url;
        audioRef.current.load();

        const handleLoadedMetadata = () => {
          if (
            audioRef.current?.duration &&
            isFinite(audioRef.current.duration)
          ) {
            setDuration(audioRef.current.duration);
            setAudioLoaded(true);
          }
        };

        audioRef.current.addEventListener(
          "loadedmetadata",
          handleLoadedMetadata,
          { once: true },
        );
      }
    }
  }, [value?.audioBlob, type, createAudioUrl, cleanupAudioUrl, audioLoaded]);

  useEffect(() => {
    if (
      value?.file &&
      type === AudioInputType.FILE &&
      !audioLoaded &&
      !value?.customAudioUrl
    ) {
      cleanupAudioUrl();
      const url = createAudioUrl(value.file);
      audioUrlRef.current = url;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = url;
        audioRef.current.load();

        const handleLoadedMetadata = () => {
          if (
            audioRef.current?.duration &&
            isFinite(audioRef.current.duration)
          ) {
            setDuration(audioRef.current.duration);
            setAudioLoaded(true);
          }
        };

        audioRef.current.addEventListener(
          "loadedmetadata",
          handleLoadedMetadata,
          { once: true },
        );
      }
    }
  }, [value?.file, type, createAudioUrl, cleanupAudioUrl, audioLoaded]);

  useEffect(() => {
    const checkPlaybackState = setInterval(() => {
      const audio = audioRef.current;
      if (audio) {
        const isPlayingNow = !audio.paused && !audio.ended;
        if (isPlayingNow !== isPlaying) {
          setIsPlaying(isPlayingNow);
        }
      }
    }, 200);

    return () => clearInterval(checkPlaybackState);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      startTimeUpdateInterval();
    } else {
      stopTimeUpdateInterval();
    }
    return () => stopTimeUpdateInterval();
  }, [isPlaying, startTimeUpdateInterval, stopTimeUpdateInterval]);

  useEffect(() => {
    return () => {
      cleanupAudioUrl();
      stopTimeUpdateInterval();
    };
  }, [cleanupAudioUrl, stopTimeUpdateInterval]);

  const handleTypeChange = useCallback(
    (newType: AudioInputType) => {
      cleanupAudioUrl();
      setType(newType);
      setUrl("");
      setFileName("");
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      setAudioLoaded(false);
      setIsLoadingAudio(false);
      onChange({ type: newType });
    },
    [cleanupAudioUrl, onChange],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      setAudioLoaded(false);
      setIsLoadingAudio(false);

      const blobUrl = URL.createObjectURL(file);

      onChange({
        type: AudioInputType.FILE,
        file,
        fileName: file.name,
        customAudioUrl: blobUrl,
        customAudioType: file.type,
      });
    },
    [onChange],
  );

  const handleUrlChange = useCallback(
    (newUrl: string) => {
      setUrl(newUrl);
      onChange({
        type: AudioInputType.URL,
        url: newUrl,
        customAudioUrl: newUrl,
        customAudioType: "url",
      });
    },
    [onChange],
  );

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setCurrentTime(0);
        setDuration(0);
        setAudioLoaded(false);
        setIsPlaying(false);
        setIsLoadingAudio(false);

        onChange({
          type: AudioInputType.RECORD,
          audioBlob: blob,
          customAudioUrl: URL.createObjectURL(blob),
          customAudioType: "audio/webm",
        });
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
    }
  }, [onChange]);

  const stopRecording = useCallback(() => {
    mediaRecorder.current?.stop();
    mediaRecorder.current?.stream.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  }, []);

  const clearAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    cleanupAudioUrl();

    if (type === AudioInputType.RECORD) {
      onChange({ type: AudioInputType.RECORD });
    } else if (type === AudioInputType.FILE) {
      setFileName("");
      onChange({ type: AudioInputType.FILE });
    }

    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setAudioLoaded(false);
    setIsLoadingAudio(false);
  }, [type, onChange, cleanupAudioUrl]);

  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audioLoaded && !isLoadingAudio) {
      console.log("🎵 Audio not loaded yet, waiting...");
      return;
    }

    try {
      if (!audio.paused) {
        audio.pause();
      } else {
        audio.muted = false;
        audio.volume = volume / 100;
        await audio.play();
      }
    } catch (error) {
      console.error("Playback error:", error);
    }
  }, [audioLoaded, isLoadingAudio, volume]);

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

  const formattedCurrentTime = useMemo(
    () => formatTime(currentTime * 1000),
    [currentTime],
  );
  const formattedDuration = useMemo(
    () => formatTime(duration * 1000),
    [duration],
  );
  const truncatedFileName = useMemo(
    () => truncateFileName(fileName, 35),
    [fileName],
  );

  const hasAudioToPlay = useMemo(() => {
    return (
      (type === AudioInputType.FILE &&
        (value?.file || value?.customAudioUrl)) ||
      (type === AudioInputType.RECORD &&
        (value?.audioBlob || value?.customAudioUrl))
    );
  }, [type, value?.file, value?.audioBlob, value?.customAudioUrl]);

  const getTypeLabel = (t: AudioInputType) => {
    switch (t) {
      case AudioInputType.URL:
        return "URL (YouTube, etc.)";
      case AudioInputType.FILE:
        return "Upload MP3";
      case AudioInputType.RECORD:
        return "Record";
      default:
        return "None";
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Select value={type} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select audio source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AudioInputType.NONE}>None</SelectItem>
            <SelectItem value={AudioInputType.URL}>
              URL (YouTube, etc.)
            </SelectItem>
            <SelectItem value={AudioInputType.FILE}>Upload MP3</SelectItem>
            <SelectItem value={AudioInputType.RECORD}>Record</SelectItem>
          </SelectContent>
        </Select>

        {type === AudioInputType.URL && (
          <div className="space-y-2">
            <Label>URL</Label>
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Supported: YouTube, SoundCloud, direct audio links
            </p>
          </div>
        )}

        {type === AudioInputType.FILE && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Audio file</Label>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() =>
                        document.getElementById("audio-upload")?.click()
                      }
                      className="w-full justify-start overflow-hidden"
                    >
                      <Upload className="h-4 w-4 mr-2 shrink-0" />
                      <span className="truncate">
                        {fileName ? truncatedFileName : "Choose file..."}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  {fileName && fileName.length > 35 && (
                    <TooltipContent side="bottom" className="max-w-md">
                      <p className="break-all">{fileName}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/mp3,audio/wav,audio/webm,audio/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {hasAudioToPlay && (
              <div className="space-y-4 p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileAudio className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm font-medium truncate cursor-help">
                          {truncatedFileName}
                        </span>
                      </TooltipTrigger>
                      {fileName && fileName.length > 35 && (
                        <TooltipContent side="bottom" className="max-w-md">
                          <p className="break-all">{fileName}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearAudio}
                    className="h-8 w-8 text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <audio ref={audioRef} />

                {isLoadingAudio && (
                  <div className="flex justify-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">
                      Loading audio...
                    </span>
                  </div>
                )}

                {!isLoadingAudio && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{formattedCurrentTime}</span>
                        <span>{formattedDuration || "00:00"}</span>
                      </div>
                      <Slider
                        value={[
                          duration > 0 ? (currentTime / duration) * 100 : 0,
                        ]}
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
                        >
                          <SkipBack className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="default"
                          size="lg"
                          onClick={togglePlayPause}
                          disabled={!audioLoaded || duration === 0}
                          className="w-10 h-10 rounded-full"
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={seekForward}
                          disabled={!audioLoaded || duration === 0}
                        >
                          <SkipForward className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={toggleMute}>
                          {isMuted ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="w-20">
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

                {value?.file && (
                  <div className="text-xs text-muted-foreground">
                    Size: {(value.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {type === AudioInputType.RECORD && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  variant="outline"
                  className="flex-1"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              )}
            </div>

            {hasAudioToPlay && (
              <div className="space-y-4 p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Recording ready</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearAudio}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <audio ref={audioRef} />

                {isLoadingAudio && (
                  <div className="flex justify-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">
                      Loading audio...
                    </span>
                  </div>
                )}

                {!isLoadingAudio && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{formattedCurrentTime}</span>
                        <span>{formattedDuration || "00:00"}</span>
                      </div>
                      <Slider
                        value={[
                          duration > 0 ? (currentTime / duration) * 100 : 0,
                        ]}
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
                        >
                          <SkipBack className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="default"
                          size="lg"
                          onClick={togglePlayPause}
                          disabled={!audioLoaded || duration === 0}
                          className="w-10 h-10 rounded-full"
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={seekForward}
                          disabled={!audioLoaded || duration === 0}
                        >
                          <SkipForward className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={toggleMute}>
                          {isMuted ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="w-20">
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

                {value?.audioBlob && (
                  <div className="text-xs text-muted-foreground">
                    Size: {(value.audioBlob.size / 1024).toFixed(1)} KB
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {type !== AudioInputType.NONE && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            ✓ {getTypeLabel(type)} selected
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
