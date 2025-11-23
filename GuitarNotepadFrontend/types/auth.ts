export interface User {
  id: string
  email: string
  nikName: string
  role: string
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