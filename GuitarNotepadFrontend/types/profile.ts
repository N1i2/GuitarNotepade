export interface FiltersForUsers {
  emailFilter?: string;
  nikNameFilter?: string;
  isBlocked?: boolean | null;
  role?: string | null;
  page?: number;
  pageSize?: number;
  sortBy?: 'email' | 'nikName' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface User {
  id: string;
  email: string;
  nikName: string;
  role: string;
  avatarUrl?: string;
  bio: string;
  createAt: string;
  isBlocked: boolean;
}

export interface PaginatedUsers {
  items: User[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface updateUserInfo {
  nikName?: string;
  avatarBase64?: string;
  bio?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}