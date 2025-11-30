import { AuthService } from './auth-service'

export interface ApiErrorResponse {
  error?: string
  message?: string
  errors?: { [key: string]: string[] }
  type?: string
  statusCode?: number
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: { [key: string]: string[] },
    public type?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api'

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const token = AuthService.getToken()
    
    // 👇 ИСПРАВЛЯЕМ ТИПИЗАЦИЮ HEADERS
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // 👇 КОПИРУЕМ СУЩЕСТВУЮЩИЕ ЗАГОЛОВКИ
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value
        })
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value
        })
      } else {
        Object.entries(options.headers).forEach(([key, value]) => {
          headers[key] = value as string
        })
      }
    }

    // 👇 ДОБАВЛЯЕМ AUTHORIZATION
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers,
    }

    try {
      const response = await fetch(url, config)
      
      // Обработка 401 ошибки (UNAUTHORIZED)
      if (response.status === 401) {
        AuthService.logout()
        throw new ApiError('Authentication failed', 401)
      }
      
      if (!response.ok) {
        let errorData: ApiErrorResponse
        try {
          errorData = await response.json()
        } catch {
          errorData = { 
            error: `HTTP error! status: ${response.status}` 
          }
        }
        
        const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`
        
        throw new ApiError(
          errorMessage,
          response.status,
          errorData.errors,
          errorData.type
        )
      }
      
      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient()