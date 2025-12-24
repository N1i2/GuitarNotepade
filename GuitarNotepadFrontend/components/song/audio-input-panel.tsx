import { useSongCreation } from "@/app/contexts/song-creation-context";
import React, { useState, useRef, useEffect } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import {
  validateAudioFile,
  fileToBase64,
  blobToBase64,
  convertWebmToMp3,
  formatTime,
} from "@/lib/audio-utils";
import {
  Upload,
  Link,
  Mic,
  Play,
  Pause,
  StopCircle,
  Trash2,
  X,
  Check,
  Loader2,
  ExternalLink,
  Music,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { AudioInputData, AudioInputType } from "@/types/audio";

interface AudioInputPanelProps {
  value?: AudioInputData;
  onChange?: (data: AudioInputData | null) => void;
}

const AudioInputPanel: React.FC<AudioInputPanelProps> = ({
  value,
  onChange,
}) => {
  const { state, dispatch } = useSongCreation();
  const toast = useToast();

  const initialAudioInput = state.audioInput || value;
  const [activeTab, setActiveTab] = useState<AudioInputType>(
    initialAudioInput?.type || AudioInputType.NONE
  );
  const [audioFile, setAudioFile] = useState<File | null>(
    initialAudioInput?.type === AudioInputType.FILE
      ? initialAudioInput.file || null
      : null
  );
  const [audioUrl, setAudioUrl] = useState<string>(
    initialAudioInput?.type === AudioInputType.URL
      ? initialAudioInput.url || ""
      : ""
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const {
    isRecording,
    isPaused,
    audioBlob,
    recordingTime,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    audioURL,
  } = useAudioRecorder();

  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [hasLoadedInitialAudio, setHasLoadedInitialAudio] = useState(false);

  useEffect(() => {
    if (state.audioInput && !hasLoadedInitialAudio) {
      setActiveTab(state.audioInput.type);

      if (
        state.audioInput.type === AudioInputType.URL &&
        state.audioInput.url
      ) {
        setAudioUrl(state.audioInput.url);
      }

      if (state.audioInput.type === AudioInputType.FILE) {
        if (state.audioInput.file) {
          setAudioFile(state.audioInput.file);
        } else if (state.audioInput.fileName) {
          const dummyFile = new File([], state.audioInput.fileName, {
            type: "audio/*",
          });
          setAudioFile(dummyFile);
        } else if (state.audioInput.customAudioUrl) {
          const fileName = state.audioInput.fileName || "audio-file.mp3";
          const dummyFile = new File([], fileName, {
            type: "audio/*",
          });
          setAudioFile(dummyFile);
        }
      }

      setHasLoadedInitialAudio(true);
    }

    if (!state.audioInput && hasLoadedInitialAudio) {
      setHasLoadedInitialAudio(false);
    }
  }, [state.audioInput, hasLoadedInitialAudio]);

  useEffect(() => {
    if (value?.type) {
      setActiveTab(value.type);
    }
  }, [value]);

  useEffect(() => {
    let url: string | null = null;

    switch (activeTab) {
      case AudioInputType.FILE:
        if (audioFile) {
          if (audioFile.size > 0) {
            url = URL.createObjectURL(audioFile);
          } else if (state.audioInput?.customAudioUrl) {
            url = state.audioInput.customAudioUrl;
          }
        }
        break;
      case AudioInputType.RECORD:
        url = audioURL;
        break;
      case AudioInputType.URL:
        if (audioUrl && !audioUrl.startsWith("blob:")) {
          url = audioUrl;
        }
        break;
      default:
        url = null;
    }

    if (playbackUrl && playbackUrl.startsWith("blob:")) {
      URL.revokeObjectURL(playbackUrl);
    }

    setPlaybackUrl(url);

    setAudioLoaded(false);
    setAudioError(false);
    setCurrentTime(0);
    setDuration(0);

    return () => {
      if (url && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    };
  }, [activeTab, audioFile, audioURL, audioUrl, state.audioInput]);

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
      toast.error("Failed to load audio. Please check the file format.");
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
  }, [toast]);

  useEffect(() => {
    if (audioURL && audioPlayerRef.current) {
      setTimeout(() => {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.load();
        }
      }, 100);
    }
  }, [audioURL]);

  const handleTabChange = (value: string) => {
    const newTab = value as AudioInputType;
    setActiveTab(newTab);

    if (newTab === AudioInputType.NONE) {
      dispatch({ type: "SET_AUDIO_INPUT", payload: null });
      setAudioFile(null);
      setAudioUrl("");
      resetRecording();
      stopAudio();
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size === 0) {
      toast.error("File is empty");
      return;
    }

    const validation = validateAudioFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid audio file");
      return;
    }

    setAudioFile(file);

    try {
      setIsProcessing(true);
      const audioBase64 = await fileToBase64(file);

      const audioData: AudioInputData = {
        type: AudioInputType.FILE,
        file,
        fileName: file.name,
        customAudioUrl: audioBase64,
        customAudioType: "File",
      };

      dispatch({ type: "SET_AUDIO_INPUT", payload: audioData });
      toast.success("Audio file loaded successfully");
    } catch (error) {
      toast.error("Failed to process audio file");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUrlChange = async (url: string) => {
    setAudioUrl(url);

    if (url.trim() === "") {
      dispatch({ type: "SET_AUDIO_INPUT", payload: null });
      return;
    }

    try {
      new URL(url);
      const audioData: AudioInputData = {
        type: AudioInputType.URL,
        url,
        customAudioUrl: url,
        customAudioType: "Url",
      };

      dispatch({ type: "SET_AUDIO_INPUT", payload: audioData });
      toast.success("URL saved successfully");
    } catch (error) {
      toast.error("Invalid URL format");
      dispatch({ type: "SET_AUDIO_INPUT", payload: null });
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
      toast.success("Recording started");
    } catch (error) {
      toast.error(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    toast.success("Recording stopped");
  };

  const handleSaveRecordingClick = () => {
    handleSaveRecording();
  };

  const handleSaveRecording = async () => {
    if (!audioBlob) {
      return;
    }

    setIsProcessing(true);

    try {
      const mp3Blob = await convertWebmToMp3(audioBlob);

      if (mp3Blob.size < 1000) {
        toast.error("Recording is too short or empty. Please record again.");
        setIsProcessing(false);
        resetRecording();
        return;
      }

      const audioBase64 = await blobToBase64(mp3Blob);

      const audioData: AudioInputData = {
        type: AudioInputType.RECORD,
        audioBlob: mp3Blob,
        fileName: `recording-${Date.now()}.mp3`,
        customAudioUrl: audioBase64,
        customAudioType: "File",
      };

      dispatch({
        type: "SET_AUDIO_INPUT",
        payload: audioData,
      });

      toast.success("Recording saved successfully!");
    } catch (error) {
      toast.error("Failed to save recording");
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioPlayerRef.current || audioError) return;

    if (isPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play().catch((error) => {
        toast.error("Failed to play audio");
        setAudioError(true);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const stopAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const seekForward = () => {
    if (audioPlayerRef.current && duration > 0) {
      audioPlayerRef.current.currentTime = Math.min(
        audioPlayerRef.current.currentTime + 5,
        duration
      );
    }
  };

  const seekBackward = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = Math.max(
        audioPlayerRef.current.currentTime - 5,
        0
      );
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (audioPlayerRef.current && duration > 0) {
      const newTime = (value[0] / 100) * duration;
      audioPlayerRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formattedRecordingTime = formatTime(recordingTime);
  const formattedCurrentTime = formatTime(currentTime * 1000);
  const formattedDuration = formatTime(duration * 1000);

  const isRecordPlaybackReady =
    activeTab === AudioInputType.RECORD &&
    audioBlob &&
    !isRecording &&
    playbackUrl;

  const isPlaybackAvailable =
    (activeTab === AudioInputType.FILE && audioFile) ||
    (activeTab === AudioInputType.RECORD && audioBlob && !isRecording) ||
    (activeTab === AudioInputType.URL &&
      audioUrl &&
      state.audioInput?.customAudioUrl);

  const getEstimatedRecordingDuration = () => {
    if (recordingTime > 0) {
      return recordingTime / 1000;
    }
    return 0;
  };

  const displayDuration =
    duration > 0 ? duration : getEstimatedRecordingDuration();

  const hasAudioToShow =
    state.audioInput && state.audioInput.type !== AudioInputType.NONE;
  const audioSourceName = state.audioInput?.fileName || state.audioInput?.url;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Audio Attachment
        </CardTitle>
        <CardDescription>Add audio to your song (optional)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value={AudioInputType.NONE}>None</TabsTrigger>
            <TabsTrigger value={AudioInputType.FILE}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value={AudioInputType.URL}>
              <Link className="h-4 w-4 mr-2" />
              Link
            </TabsTrigger>
            <TabsTrigger value={AudioInputType.RECORD}>
              <Mic className="h-4 w-4 mr-2" />
              Record
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            {activeTab === AudioInputType.NONE && (
              <div className="text-center py-8 text-muted-foreground">
                {hasAudioToShow ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <Music className="h-6 w-6 text-primary" />
                      <span className="font-medium">Audio attached</span>
                    </div>
                    <p className="text-sm">
                      {state.audioInput?.type === AudioInputType.FILE &&
                        "File: "}
                      {state.audioInput?.type === AudioInputType.URL && "URL: "}
                      {state.audioInput?.type === AudioInputType.RECORD &&
                        "Recording: "}
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {audioSourceName}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Switch to another tab to modify audio
                    </p>
                  </div>
                ) : (
                  "No audio attached"
                )}
              </div>
            )}

            {activeTab === AudioInputType.FILE && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload MP3, WAV, OGG, M4A, AAC, FLAC, or OPUS file
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Max size: 10MB
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {audioFile || state.audioInput?.type === AudioInputType.FILE
                      ? "Change Audio File"
                      : "Upload Audio File"}
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.ogg,.m4a,.aac,.flac,.opus"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {(audioFile ||
                  state.audioInput?.type === AudioInputType.FILE) && (
                  <div className="space-y-4">
                    <Alert
                      className={`${
                        audioError
                          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                          : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      }`}
                    >
                      {audioError ? (
                        <X className="h-4 w-4 text-red-600" />
                      ) : (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                      <AlertDescription
                        className={
                          audioError
                            ? "text-red-800 dark:text-red-300"
                            : "text-green-800 dark:text-green-300"
                        }
                      >
                        {audioError
                          ? "Error loading file"
                          : `File: ${
                              state.audioInput?.fileName ||
                              audioFile?.name ||
                              "audio file"
                            }`}
                      </AlertDescription>
                    </Alert>

                    {playbackUrl && (
                      <div className="space-y-3">
                        <audio
                          ref={audioPlayerRef}
                          src={playbackUrl}
                          preload="auto"
                          className="hidden"
                        />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{formattedCurrentTime}</span>
                            <span>
                              {displayDuration > 0
                                ? formatTime(displayDuration * 1000)
                                : "--:--"}
                            </span>
                          </div>
                          <Slider
                            value={[
                              displayDuration > 0
                                ? (currentTime / displayDuration) * 100
                                : 0,
                            ]}
                            max={100}
                            step={0.1}
                            className="w-full"
                            onValueChange={handleSliderChange}
                            disabled={!audioLoaded || audioError}
                          />
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={seekBackward}
                              disabled={!isPlaybackAvailable || audioError}
                            >
                              <SkipBack className="h-4 w-4" /> 5s
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={togglePlayPause}
                              disabled={!isPlaybackAvailable || audioError}
                              className="w-16"
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
                              disabled={!isPlaybackAvailable || audioError}
                            >
                              5s <SkipForward className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === AudioInputType.URL && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="audio-url">Audio URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="audio-url"
                      type="url"
                      placeholder="https://example.com/audio.mp3"
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      onBlur={(e) => handleUrlChange(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter any URL (audio file, video, website, etc.)
                  </p>
                </div>

                {(audioUrl ||
                  state.audioInput?.type === AudioInputType.URL) && (
                  <div className="space-y-2">
                    <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <Check className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 dark:text-green-300">
                        {state.audioInput?.type === AudioInputType.URL
                          ? `URL: ${state.audioInput.url || audioUrl}`
                          : "URL saved"}
                      </AlertDescription>
                    </Alert>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            state.audioInput?.url || audioUrl,
                            "_blank"
                          )
                        }
                        disabled={!state.audioInput?.url && !audioUrl}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open URL
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === AudioInputType.RECORD && (
              <div className="space-y-4">
                {isRecording && (
                  <div className="space-y-3 p-4 bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/10 rounded-lg border border-teal-200 dark:border-teal-700 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-4 w-4 bg-teal-500 rounded-full animate-pulse" />
                          <div className="absolute inset-0 h-4 w-4 bg-teal-400 rounded-full animate-ping" />
                        </div>
                        <div>
                          <span className="font-bold text-teal-900 dark:text-teal-200">
                            Recording in progress
                          </span>
                          <p className="text-xs text-teal-700 dark:text-teal-300 mt-1">
                            Microphone is active
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-2xl font-bold text-teal-900 dark:text-teal-100">
                          {formattedRecordingTime}
                        </div>
                        <div className="text-xs text-teal-700 dark:text-teal-300 mt-1">
                          / 5:00
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-teal-200 dark:border-teal-700">
                      <div className="flex justify-between text-sm text-teal-800 dark:text-teal-300 mb-1">
                        <span className="font-medium">Time elapsed</span>
                        <span className="font-mono">
                          {formattedRecordingTime}
                        </span>
                      </div>
                      <Progress
                        value={(recordingTime / (5 * 60 * 1000)) * 100}
                        className="h-3 bg-teal-200 dark:bg-teal-800"
                      />
                      <div className="flex justify-between text-xs text-teal-600 dark:text-teal-400 mt-1">
                        <span>0:00</span>
                        <span>
                          •{" "}
                          {Math.round((recordingTime / (5 * 60 * 1000)) * 100)}%
                          •
                        </span>
                        <span>5:00</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {!isRecording ? (
                    <Button
                      onClick={handleStartRecording}
                      disabled={isProcessing || isRecording}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <>
                      {isPaused ? (
                        <Button onClick={resumeRecording}>
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </Button>
                      ) : (
                        <Button onClick={pauseRecording}>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        onClick={handleStopRecording}
                      >
                        <StopCircle className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                    </>
                  )}

                  {(audioBlob && !isRecording) ||
                  state.audioInput?.type === AudioInputType.RECORD ? (
                    <>
                      <Button
                        onClick={handleSaveRecordingClick}
                        disabled={
                          isProcessing ||
                          state.audioInput?.type === AudioInputType.RECORD
                        }
                        className="relative bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            {state.audioInput?.type === AudioInputType.RECORD
                              ? "Recording Saved"
                              : "Save Recording"}
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={resetRecording}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </>
                  ) : null}
                </div>

                {(audioBlob && !isRecording && playbackUrl) ||
                state.audioInput?.type === AudioInputType.RECORD ? (
                  <div className="space-y-4">
                    <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                      <Music className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800 dark:text-blue-300">
                        {state.audioInput?.type === AudioInputType.RECORD
                          ? "Recording attached"
                          : `Recording complete (${formattedRecordingTime})`}
                      </AlertDescription>
                    </Alert>
                    {(playbackUrl || state.audioInput?.customAudioUrl) && (
                      <div className="space-y-3">
                        <audio
                          ref={audioPlayerRef}
                          src={playbackUrl || state.audioInput?.customAudioUrl}
                          preload="auto"
                          className="hidden"
                        />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{formattedCurrentTime}</span>
                            <span>
                              {displayDuration > 0
                                ? formatTime(displayDuration * 1000)
                                : formatTime(recordingTime)}
                            </span>
                          </div>
                          <Slider
                            value={[
                              displayDuration > 0
                                ? (currentTime / displayDuration) * 100
                                : 0,
                            ]}
                            max={100}
                            step={0.1}
                            className="w-full"
                            onValueChange={handleSliderChange}
                            disabled={!isRecordPlaybackReady}
                          />
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={seekBackward}
                              disabled={!isRecordPlaybackReady}
                            >
                              <SkipBack className="h-4 w-4" />
                              <span className="sr-only">5s back</span>
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={togglePlayPause}
                              disabled={!isRecordPlaybackReady}
                              className="w-16"
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
                              disabled={!isRecordPlaybackReady}
                            >
                              <SkipForward className="h-4 w-4" />
                              <span className="sr-only">5s forward</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {audioBlob && !isRecording && !playbackUrl && (
                  <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <Music className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-300">
                      Recording complete ({formattedRecordingTime})
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Maximum recording time: 5 minutes</p>
                  <p>• Ensure microphone permissions are granted</p>
                  <p>• Record in a quiet environment for best quality</p>
                </div>
              </div>
            )}
          </div>
        </Tabs>

        {state.audioInput && state.audioInput.type !== AudioInputType.NONE && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    state.audioInput.type === AudioInputType.FILE
                      ? "bg-green-500"
                      : state.audioInput.type === AudioInputType.URL
                      ? "bg-blue-500"
                      : "bg-purple-500"
                  }`}
                />
                <div>
                  <span className="text-sm font-medium">
                    {state.audioInput.type === AudioInputType.FILE &&
                      "File attached"}
                    {state.audioInput.type === AudioInputType.URL &&
                      "URL attached"}
                    {state.audioInput.type === AudioInputType.RECORD &&
                      "Recording attached"}
                  </span>
                  {state.audioInput.fileName && (
                    <p className="text-xs text-muted-foreground">
                      {state.audioInput.fileName}
                    </p>
                  )}
                  {state.audioInput.url && (
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {state.audioInput.url}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveTab(AudioInputType.NONE);
                  dispatch({ type: "SET_AUDIO_INPUT", payload: null });
                  stopAudio();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioInputPanel;
