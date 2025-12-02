export interface User {
  id: string
  email: string
  nikName: string
  role: string
  avatarUrl?: string
  bio: string
  createAt: string
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