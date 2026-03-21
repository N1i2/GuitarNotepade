"use client";

import { useState, useRef, useEffect } from "react";
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
import {
  Mic,
  Square,
  Trash2,
  Upload,
  Link,
  Play,
  Pause,
  Music2,
} from "lucide-react";
import { AudioInputData, AudioInputType } from "@/types/audio";

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
  const [audioBlob, setAudioBlob] = useState<Blob | undefined>(
    value?.audioBlob,
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setIsPlaying(false);

      return () => {
        URL.revokeObjectURL(url);
        audioRef.current?.pause();
      };
    }
  }, [audioBlob]);

  const handleTypeChange = (newType: AudioInputType) => {
    setType(newType);
    setUrl("");
    setFileName("");
    setAudioBlob(undefined);
    onChange({
      type: newType,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onChange({
        type: AudioInputType.FILE,
        file,
        fileName: file.name,
        customAudioUrl: URL.createObjectURL(file),
        customAudioType: file.type,
      });
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    onChange({
      type: AudioInputType.URL,
      url: value,
      customAudioUrl: value,
      customAudioType: "url",
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setAudioBlob(blob);
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
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    mediaRecorder.current?.stream.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  const clearRecording = () => {
    setAudioBlob(undefined);
    onChange({
      type: AudioInputType.RECORD,
      audioBlob: undefined,
    });
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

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
            <Link className="h-4 w-4 text-muted-foreground" />
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
        <div className="space-y-2">
          <Label>MP3 file</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => document.getElementById("audio-upload")?.click()}
              className="w-full justify-start"
            >
              <Upload className="h-4 w-4 mr-2" />
              {fileName || "Choose file..."}
            </Button>
            <input
              id="audio-upload"
              type="file"
              accept="audio/mp3,audio/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {fileName && (
            <p className="text-xs text-muted-foreground">
              Selected: {fileName}
            </p>
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

          {audioBlob && (
            <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Recording ready</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlayback}
                    className="h-8 w-8"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearRecording}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Size: {(audioBlob.size / 1024).toFixed(1)} KB
              </div>
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
  );
}
