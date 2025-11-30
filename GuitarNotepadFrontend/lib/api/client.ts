import { AuthService } from "./auth-service";

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
  private baseURL: string =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const token = AuthService.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        AuthService.logout();
        if (typeof window !== "undefined") {
          window.location.href = '/login';
        }
        throw new Error("Authentication failed");
      }

      if (!response.ok) {
        // 👇 Пытаемся получить структурированную ошибку от бэкенда
        let errorData: ApiErrorResponse;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            message: `HTTP error! status: ${response.status}`,
          };
        }

         const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`

        throw new ApiError(
          errorMessage,
          response.status,
          errorData.errors,
          errorData.type
        )
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
