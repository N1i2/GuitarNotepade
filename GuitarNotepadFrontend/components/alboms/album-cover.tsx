"use client";

import { useState, useEffect } from "react";
import { AlbumService } from "@/lib/api/albom-service";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff } from "lucide-react";

interface AlbumCoverProps {
  coverUrl?: string;
  alt: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  fallbackLetter?: string;
}

export function AlbumCover({
  coverUrl,
  alt,
  className = "",
  size = "md",
  fallbackLetter,
}: AlbumCoverProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!coverUrl) {
        setIsLoading(false);
        setError(true);
        return;
      }

      if (coverUrl.startsWith("data:image/")) {
        setImageSrc(coverUrl);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(false);
        const base64Cover = await AlbumService.getAlbumCoverBase64(coverUrl);
        setImageSrc(base64Cover);
      } catch (err) {
        console.error("Failed to load album cover:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [coverUrl]);

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-24 h-24",
    lg: "w-48 h-48",
    xl: "w-64 h-64",
  };

  if (isLoading) {
    return (
      <Skeleton className={`${sizeClasses[size]} rounded-lg ${className}`} />
    );
  }

  if (error || !imageSrc) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ${className}`}
      >
        {fallbackLetter ? (
          <span className="text-white text-2xl font-bold">
            {fallbackLetter.charAt(0).toUpperCase()}
          </span>
        ) : (
          <ImageOff className="h-8 w-8 text-white/70" />
        )}
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${sizeClasses[size]} rounded-lg object-cover ${className}`}
      onError={() => setError(true)}
    />
  );
}
