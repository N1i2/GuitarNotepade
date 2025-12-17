export interface Song {
  id: string;
  title: string;
  artist: string;
  isPublic: boolean;
  ownerId: string;
  ownerNickname?: string;
  parentSongId?: string;
  structure: SongStructure;
  chordIds: string[];
  patternIds: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface SongStructure {
  sections: SongSection[];
  bpm?: number;
  timeSignature?: string;
}

export interface SongSection {
  name: string;
  chords: string[];
  pattern?: string;
  lyrics?: string;
  order: number;
}

export interface CreateSongDto {
  title: string;
  artist: string;
  isPublic: boolean;
  parentSongId?: string;
  structure: SongStructure;
  chordIds: string[];
  patternIds: string[];
}

export interface UpdateSongDto {
  title?: string;
  artist?: string;
  isPublic?: boolean;
  structure?: SongStructure;
  chordIds?: string[];
  patternIds?: string[];
}

export interface SongFilters {
  search?: string;
  title?: string;
  artist?: string;
  isPublic?: boolean;
  chordId?: string;
  patternId?: string;
  mySongsOnly?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: "title" | "artist" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedSongs {
  items: Song[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}