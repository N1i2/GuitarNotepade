import axios from "axios";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const validateAudioFile = (
  file: File
): { isValid: boolean; error?: string } => {
  const validExtensions = [
    ".mp3",
    ".wav",
    ".ogg",
    ".m4a",
    ".aac",
    ".flac",
    ".opus",
  ];
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));

  if (!validExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `Invalid file format. Allowed: ${validExtensions.join(", ")}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { isValid: true };
};

export const validateAudioUrl = async (
  url: string
): Promise<{ isValid: boolean; error?: string }> => {
  try {
    new URL(url);

    const audioExtensions = [
      ".mp3",
      ".wav",
      ".ogg",
      ".m4a",
      ".aac",
      ".flac",
      ".opus",
    ];
    const hasAudioExtension = audioExtensions.some((ext) =>
      url.toLowerCase().includes(ext)
    );

    if (!hasAudioExtension) {
      return {
        isValid: false,
        error:
          "URL must point to an audio file (.mp3, .wav, .ogg, .m4a, .aac, .flac, .opus)",
      };
    }

    try {
      const response = await axios.head(url, { timeout: 5000 });

      if (response.status !== 200) {
        return {
          isValid: false,
          error: "Audio file is not accessible",
        };
      }

      const contentType = response.headers["content-type"];
      if (contentType && !contentType.includes("audio/")) {
        return {
          isValid: false,
          error: "URL does not point to an audio file",
        };
      }
    } catch (headError) {
      try {
        const response = await axios.get(url, {
          timeout: 5000,
          responseType: "arraybuffer",
          maxContentLength: MAX_FILE_SIZE,
        });

        if (response.status !== 200) {
          return {
            isValid: false,
            error: "Audio file is not accessible",
          };
        }
      } catch (getError) {
        return {
          isValid: false,
          error: "Cannot access audio file. Please check the URL",
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: "Invalid URL format",
    };
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    const mimeType = file.type || getMimeTypeFromExtension(file.name);

    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

const getMimeTypeFromExtension = (filename: string): string => {
  const extension = filename.toLowerCase().split(".").pop();

  switch (extension) {
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "ogg":
      return "audio/ogg";
    case "m4a":
      return "audio/mp4";
    case "aac":
      return "audio/aac";
    case "flac":
      return "audio/flac";
    case "opus":
      return "audio/opus";
    default:
      return "audio/mpeg";
  }
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(blob);
    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const convertWebmToMp3 = async (webmBlob: Blob): Promise<Blob> => {
  try {
    if (webmBlob.type.includes("mpeg") || webmBlob.type.includes("mp3")) {
      return webmBlob;
    }

    if (webmBlob.type.includes("webm")) {
      const mp3Blob = new Blob([webmBlob], {
        type: "audio/mpeg",
      });

      return mp3Blob;
    }
    return webmBlob;
  } catch (error) {
    return webmBlob;
  }
};

export const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};
