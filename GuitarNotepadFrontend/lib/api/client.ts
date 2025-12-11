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
  private baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const token = AuthService.getToken()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
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

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers,
    }

    try {
      const response = await fetch(url, config)
      
      if (response.status === 401) {
        AuthService.logout()
        throw new ApiError('Authentication failed', 401)
      }
      
      if (response.status === 204) {
        return null as T
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
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        return null as T
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

  async post<T1, T2>(endpoint: string, data?: T1): Promise<T2> {
    return this.request<T2>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T1, T2>(endpoint: string, data?: T1): Promise<T2> {
    return this.request<T2>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()