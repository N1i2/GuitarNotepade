"use client";

import { SongsService } from "@/lib/api/song-service";
import { useState, useCallback, useRef } from "react";

interface UploadTask {
  songId: string;
  file: File;
  onProgress?: (percent: number) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface ActiveUpload {
  songId: string;
  fileName: string;
  file: File;
  status: "uploading" | "completed" | "failed";
  progress: number;
  error?: string;
  onProgress?: (percent: number) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useAudioUpload() {
  const [activeUpload, setActiveUpload] = useState<ActiveUpload | null>(null);
  const currentXhr = useRef<XMLHttpRequest | null>(null);

  const uploadAudio = useCallback((task: UploadTask) => {
    return new Promise<{ fileName: string; audioType: string; size: number }>(
      (resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("audioFile", task.file);

        const token = localStorage.getItem("auth_token");
        const url = SongsService.getAudioUploadUrl(task.songId);

        setActiveUpload({
          songId: task.songId,
          fileName: task.file.name,
          file: task.file,
          status: "uploading",
          progress: 0,
          onProgress: task.onProgress,
          onSuccess: task.onSuccess,
          onError: task.onError,
        });

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setActiveUpload((prev) =>
              prev ? { ...prev, progress: percent } : null,
            );
            if (task.onProgress) task.onProgress(percent);
          }
        };

        xhr.onload = () => {
          currentXhr.current = null;

          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              setActiveUpload((prev) =>
                prev ? { ...prev, status: "completed", progress: 100 } : null,
              );
              if (task.onSuccess) task.onSuccess();
              resolve(response);
            } catch {
              const error = new Error("Failed to parse response");
              setActiveUpload((prev) =>
                prev
                  ? { ...prev, status: "failed", error: error.message }
                  : null,
              );
              if (task.onError) task.onError(error);
              reject(error);
            }
          } else {
            let errorMessage = `Upload failed with status ${xhr.status}`;
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              errorMessage =
                errorResponse.error || errorResponse.message || errorMessage;
            } catch {
            }
            const error = new Error(errorMessage);
            setActiveUpload((prev) =>
              prev ? { ...prev, status: "failed", error: error.message } : null,
            );
            if (task.onError) task.onError(error);
            reject(error);
          }
        };

        xhr.onerror = () => {
          currentXhr.current = null;
          const error = new Error("Network error");
          setActiveUpload((prev) =>
            prev ? { ...prev, status: "failed", error: error.message } : null,
          );
          if (task.onError) task.onError(error);
          reject(error);
        };

        xhr.ontimeout = () => {
          currentXhr.current = null;
          const error = new Error("Upload timeout");
          setActiveUpload((prev) =>
            prev ? { ...prev, status: "failed", error: error.message } : null,
          );
          if (task.onError) task.onError(error);
          reject(error);
        };

        xhr.open("POST", url);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.timeout = 600000;

        currentXhr.current = xhr;
        xhr.send(formData);
      },
    );
  }, []);

  const cancelUpload = useCallback(() => {
    if (currentXhr.current) {
      currentXhr.current.abort();
      currentXhr.current = null;
    }
    setActiveUpload(null);
  }, []);

  return {
    activeUpload,
    uploadAudio,
    cancelUpload,
    isUploading: activeUpload?.status === "uploading",
  };
}
