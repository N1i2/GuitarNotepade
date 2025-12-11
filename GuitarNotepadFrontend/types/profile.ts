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

export interface User {
  id: string;
  email: string;
  nikName: string;
  role: string;
  avatarUrl?: string;
  bio: string;
  createAt: string;
  isBlocked: boolean;
  blockedUntil?: string; 
  blockReason?: string;
}

export interface AuthResponse {
  userId: string
  email: string
  nikName: string
  role: string
  token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  nikName: string
  password: string
  confirmPassword: string
}

export interface UserProfileResponse {
  id: string
  email: string
  nikName: string
  role: string
  avatarUrl: string | null
  bio: string
  createAt: string
}

export interface BlockUserRequest {
  email: string;
  reason: string;
  blockedUntil: string; 
}

export interface BlockUserResponse {
  userId: string;
  wasBlocked: boolean;
  blockedUntil?: string;
  blockReason?: string;
  message: string;
}