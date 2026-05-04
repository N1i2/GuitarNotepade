import type { MessageKey } from "@/lib/i18n/messages";

export type CreationResource = "songs" | "chords" | "patterns" | "albums";

const unlimitedKey: Record<CreationResource, MessageKey> = {
  songs: "limits.unlimitedSongs",
  chords: "limits.unlimitedChords",
  patterns: "limits.unlimitedPatterns",
  albums: "limits.unlimitedAlbums",
};

const checkingKey: Record<CreationResource, MessageKey> = {
  songs: "limits.checkingSongs",
  chords: "limits.checkingChords",
  patterns: "limits.checkingPatterns",
  albums: "limits.checkingAlbums",
};

const noneKey: Record<CreationResource, MessageKey> = {
  songs: "limits.noneRemainingSongs",
  chords: "limits.noneRemainingChords",
  patterns: "limits.noneRemainingPatterns",
  albums: "limits.noneRemainingAlbums",
};

const fewKey: Record<CreationResource, MessageKey> = {
  songs: "limits.fewRemainingSongs",
  chords: "limits.fewRemainingChords",
  patterns: "limits.fewRemainingPatterns",
  albums: "limits.fewRemainingAlbums",
};

const manyKey: Record<CreationResource, MessageKey> = {
  songs: "limits.manyRemainingSongs",
  chords: "limits.manyRemainingChords",
  patterns: "limits.manyRemainingPatterns",
  albums: "limits.manyRemainingAlbums",
};

export function getCreationQuotaBanner(
  remaining: number | null,
  user: { role?: string; hasPremium?: boolean } | null | undefined,
  resource: CreationResource,
  t: (key: MessageKey) => string,
): { message: string; isWarning: boolean; showLink: boolean } | null {
  if (!user || user.role === "Guest") return null;
  if (user.role === "Admin" || user.hasPremium) {
    return { message: t(unlimitedKey[resource]), isWarning: false, showLink: false };
  }
  if (remaining === null) {
    return { message: t(checkingKey[resource]), isWarning: false, showLink: false };
  }
  if (remaining < 0) {
    return { message: t(unlimitedKey[resource]), isWarning: false, showLink: false };
  }
  if (remaining === 0) {
    return { message: t(noneKey[resource]), isWarning: true, showLink: true };
  }
  if (remaining <= 2) {
    return {
      message: t(fewKey[resource]).replace("{n}", String(remaining)),
      isWarning: true,
      showLink: false,
    };
  }
  return {
    message: t(manyKey[resource]).replace("{n}", String(remaining)),
    isWarning: false,
    showLink: false,
  };
}
