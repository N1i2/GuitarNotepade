import { AuthResponse, LoginRequest, RegisterRequest, UserProfileResponse } from '@/types/auth'
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

let userCache: { user: UserProfileResponse | null; timestamp: number } = {
  user: null,
  timestamp: 0
}

const CACHE_DURATION = 5 * 60 * 1000 

export class AuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
    setCookie('auth_token', response.token, 7)
    // 👇 Очищаем кэш при логине
    userCache = { user: null, timestamp: 0 }
    return response
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData)
    setCookie('auth_token', response.token, 7)
    // 👇 Очищаем кэш при регистрации
    userCache = { user: null, timestamp: 0 }
    return response
  }

  static async logout(): Promise<void> {
    deleteCookie('auth_token')
    // 👇 Очищаем кэш при логауте
    userCache = { user: null, timestamp: 0 }
  }

  static getToken(): string | null {
    return getCookie('auth_token')
  }

  static isAuthenticated(): boolean {
    return !!this.getToken()
  }

  static async validateToken(force: boolean = false): Promise<UserProfileResponse | null> {
    try {
      const token = this.getToken()
      if (!token) {
        userCache = { user: null, timestamp: 0 }
        return null
      }

      // 👇 ПРОВЕРЯЕМ КЭШ: если данные актуальны и не форс-чек, возвращаем из кэша
      const now = Date.now()
      if (!force && userCache.user && (now - userCache.timestamp) < CACHE_DURATION) {
        return userCache.user
      }

      // 👇 ЗАПРОС К БЭКЕНДУ: только если кэш устарел или force=true
      const user = await apiClient.get<UserProfileResponse>('/authme')
      
      // 👇 ОБНОВЛЯЕМ КЭШ
      userCache = {
        user,
        timestamp: now
      }
      
      return user
    } catch (error) {
      console.error('Token validation failed:', error)
      // 👇 ОЧИЩАЕМ КЭШ ПРИ ОШИБКЕ
      userCache = { user: null, timestamp: 0 }
      this.logout()
      return null
    }
  }

  // 👇 МЕТОД ДЛЯ ПРИНУДИТЕЛЬНОГО ОБНОВЛЕНИЯ КЭША
  static async refreshUserData(): Promise<UserProfileResponse | null> {
    return this.validateToken(true) // 👈 force = true
  }
}