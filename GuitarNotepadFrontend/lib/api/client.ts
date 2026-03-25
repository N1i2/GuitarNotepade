import { AuthService } from "./auth-service";

export interface ApiErrorResponse {
  exceptionType?: string;
  message?: string;
  errors?: { [key: string]: string[] };
  statusCode?: number;
  timestamp?: string;
  path?: string;
  requestId?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public exceptionType?: string,
    public errors?: { [key: string]: string[] },
    public path?: string,
    public requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiClient {
  private baseURL: string =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;
    const url = `${this.baseURL}${normalizedEndpoint}`;

    const token = AuthService.getToken();
    const hasAuthToken = Boolean(token);

    console.log(`🌐 API Request: ${options.method || "GET"} ${url}`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: "include",
    };

    try {
      const response = await fetch(url, config);

      console.log(`📡 Response status: ${response.status}`);

      if (response.status === 401) {
        if (hasAuthToken) {
          AuthService.logout();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
        throw new ApiError("Authentication failed", 401);
      }

      if (response.status === 204) {
        return null as T;
      }

      let data: any = null;
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        try {
          data = await response.json();
        } catch (e) {
          console.warn("Failed to parse JSON response:", e);
        }
      }

      if (!response.ok) {
        const errorMessage =
          data?.message || data?.error || `HTTP error ${response.status}`;
        throw new ApiError(
          errorMessage,
          response.status,
          data?.exceptionType,
          data?.errors,
          data?.path,
          data?.requestId,
        );
      }

      return data as T;
    } catch (error) {
      console.error("❌ API Error:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : "Network error",
        0,
      );
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<TRequest, TResponse>(
    endpoint: string,
    data?: TRequest,
  ): Promise<TResponse> {
    console.log(`📤 POST ${endpoint}`, {
      hasAudio: !!(data as any)?.audioBase64,
      audioType: (data as any)?.audioType,
      audioLength: (data as any)?.audioBase64?.length,
    });
    return this.request<TResponse>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put<TRequest, TResponse>(
    endpoint: string,
    data?: TRequest,
  ): Promise<TResponse> {
    return this.request<TResponse>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async patch<TRequest, TResponse>(
    endpoint: string,
    data?: TRequest,
  ): Promise<TResponse> {
    return this.request<TResponse>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
