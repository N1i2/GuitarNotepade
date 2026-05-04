"use client";

import { useEffect, useState } from "react";
import { ChordsService } from "@/lib/api/chords-service";
import { PatternsService } from "@/lib/api/patterns-service";
import { SongsService } from "@/lib/api/song-service";
import { SubscriptionsService } from "@/lib/api/subscriptions-service";
import { AlbumService } from "@/lib/api/albom-service";

export function useUsageCounters() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chordsCount, setChordsCount] = useState<number | null>(null);
  const [patternsCount, setPatternsCount] = useState<number | null>(null);
  const [songsCount, setSongsCount] = useState<number | null>(null);
  const [subscriptionsCount, setSubscriptionsCount] = useState<number | null>(
    null,
  );
  const [albumsCount, setAlbumsCount] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [chords, patterns, songs, albums, subs] = await Promise.all([
          ChordsService.getMyChords(1, 1),
          PatternsService.getMyPatterns(1, 1),
          SongsService.getMySongs(true, 1, 1),
          AlbumService.getMyAlbums(true, 1, 1),
          SubscriptionsService.getMySubscriptions(),
        ]);

        setChordsCount(chords.totalCount);
        setPatternsCount(patterns.totalCount);
        setSongsCount(songs.totalCount);
        setAlbumsCount(albums.totalCount);
        setSubscriptionsCount(subs.length);
      } catch (err: any) {
        setError(err?.message || "Failed to load usage counts");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return {
    isLoading,
    error,
    chordsCount,
    patternsCount,
    songsCount,
    albumsCount,
    subscriptionsCount,
  };
}
