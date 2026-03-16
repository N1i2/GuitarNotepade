export interface CreateCommentDto {
  text: string;
  segmentId?: string;
}

export interface SongCommentDto {
  id: string;
  songId: string;
  segmentId?: string;
  userId: string;
  userName?: string;
  text: string;
  createdAt: string;
}

export interface UpdateCommentDto {
  text?: string;
  segmentId?: string;
}

export interface CommentSearchFilters {
  songId?: string;
  segmentId?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "text";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedComments {
  items: SongCommentDto[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}