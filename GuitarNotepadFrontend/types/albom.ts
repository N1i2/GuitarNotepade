export interface AlbumDto {
  id: string;
  title: string;
  coverUrl?: string;
  description?: string;
  isPublic: boolean;
  genre?: string;
  theme?: string;
  ownerId: string;
  ownerName?: string;
  createdAt: string;
  updatedAt?: string;
  countOfSongs: number;
}

export interface CreateAlbumDto {
  title: string;
  coverUrl?: string;
  description?: string;
  isPublic: boolean;
  genre?: string;
  theme?: string;
}

export interface AlbumSearchResultDto {
  albums: AlbumDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AlbumGridItem {
  id: string;
  title: string;
  isPublic: boolean;
  ownerId: string;
  ownerNickname: string;
  createdAt: string;
  updatedAt?: string;
  canEdit: boolean;
  genre?: string;
  theme?: string;
  countOfSongs: number;
  coverUrl?: string;
  description?: string;
}

export interface AlbumSearchFilters {
  userId?: string;
  searchTerm?: string;
  ownerId?: string;
  isPublic?: boolean;
  genre?: string;
  theme?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface UpdateAlbumDto {
  title?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  isPublic?: boolean | null;
  genre?: string | null;
  theme?: string | null;
}

export interface AlbumWithSongsDto extends AlbumDto {
  songs: SongInAlbumDto[];
}

export interface SongIdDto {
  songId: string;
}

export interface SongInAlbumDto {
  id: string;
  title: string;
  artist?: string;
  description?: string;
  genre?: string;
  theme?: string;
  isPublic: boolean;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt?: string;
  averageBeautifulRating?: number;
  averageDifficultyRating?: number;
  reviewCount: number;
  commentsCount: number;
  chordCount: number;
  patternCount: number;
  customAudioUrl?: string;
  customAudioType?: string;
  hasAudio: boolean;
}
