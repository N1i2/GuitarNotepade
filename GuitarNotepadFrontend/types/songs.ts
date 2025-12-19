export interface SongDto {
  id: string;
  title: string;
  artist: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  isPublic: boolean;
  parentSongId?: string;
  key?: string;
  difficulty?: string;
  rating?: number;
  reviewCount: number;
  likeCount: number;
  viewCount: number;
  copyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SongSearchFilters {
  searchTerm?: string;
  ownerId?: string;
  isPublic?: boolean;
  chordId?: string;
  patternId?: string;
  key?: string;
  difficulty?: string;
  parentSongId?: string;
  minRating?: number;
  maxRating?: number;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface SongSearchResultDto {
  items: SongDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateSongDto {
  title: string;
  artist: string;
  description?: string;
  isPublic: boolean;
  parentSongId?: string;
  key?: string;
  difficulty?: string;
}

export interface CreateSongWithSegmentsDto extends CreateSongDto {
  segments: SongSegmentDto[];
}

export interface SongSegmentDto {
  order: number;
  type: string;
  chordId?: string;
  patternId?: string;
  lyrics?: string;
}

export interface UpdateSongDto {
  title?: string;
  artist?: string;
  description?: string;
  isPublic?: boolean;
  key?: string;
  difficulty?: string;
}

export interface ToggleSongVisibilityDto {
  isPublic: boolean;
}

export interface SongStructureDto {
  id: string;
  segments: SongSegmentDto[];
}

export interface SongStatisticsDto {
  reviewCount: number;
  averageRating: number;
  averageBeautifulLevel: number;
  averageDifficultyLevel: number;
  likeCount: number;
  viewCount: number;
  copyCount: number;
}

export interface PaginatedDto<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}