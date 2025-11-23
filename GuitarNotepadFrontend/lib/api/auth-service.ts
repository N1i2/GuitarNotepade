import { AuthResponse, LoginRequest, RegisterRequest } from '@/types/auth'
import { apiClient } from './client'

// 👇 Функция для установки куки
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/; Secure; SameSite=Strict`
}

// 👇 Функция для удаления куки
const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

// 👇 Функция для получения куки
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

export class AuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
    
    setCookie('auth_token', response.token, 7)
    
    return response
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData)
    
    setCookie('auth_token', response.token, 7)
    
    return response
  }

  static async logout(): Promise<void> {
    deleteCookie('auth_token')
  }

  static getToken(): string | null {
    return getCookie('auth_token')
  }

  static isAuthenticated(): boolean {
    return !!this.getToken()
  }
}