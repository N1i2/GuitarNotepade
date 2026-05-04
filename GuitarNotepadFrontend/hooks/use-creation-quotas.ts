"use client";

import { useCallback, useEffect, useState } from "react";
import { ChordsService } from "@/lib/api/chords-service";
import { PatternsService } from "@/lib/api/patterns-service";
import { SongsService } from "@/lib/api/song-service";
import { AlbumService } from "@/lib/api/albom-service";

export function isUnlimitedCreationQuota(remaining: number | null): boolean {
  return remaining !== null && remaining < 0;
}

export function useCreationQuotas(enabled: boolean) {
  const [chordsRemaining, setChordsRemaining] = useState<number | null>(null);
  const [patternsRemaining, setPatternsRemaining] = useState<number | null>(
    null,
  );
  const [songsRemaining, setSongsRemaining] = useState<number | null>(null);
  const [albumsRemaining, setAlbumsRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const [c, p, s, a] = await Promise.all([
        ChordsService.countOfCreate(),
        PatternsService.countOfCreate(),
        SongsService.countOfCreate(),
        AlbumService.countOfCreate(),
      ]);
      setChordsRemaining(c);
      setPatternsRemaining(p);
      setSongsRemaining(s);
      setAlbumsRemaining(a);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "Failed to load creation limits";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    isLoading,
    error,
    chordsRemaining,
    patternsRemaining,
    songsRemaining,
    albumsRemaining,
    reload: load,
  };
}
