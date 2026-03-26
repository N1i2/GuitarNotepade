import { apiClient, ApiError } from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  nikName: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  nikName: string;
  role: string;
  hasPremium: boolean;
  token: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  nikName: string;
  role: string;
  avatarUrl: string | null;
  bio: string;
  createAt: string;
}

const TOKEN_KEY = "auth_token";

export class AuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<LoginRequest, AuthResponse>(
      "/auth/login",
      credentials,
    );
    this.setToken(response.token);
    return response;
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<RegisterRequest, AuthResponse>(
      "/auth/register",
      userData,
    );
    this.setToken(response.token);
    return response;
  }

  static async logout(): Promise<void> {
    this.removeToken();
  }

  static setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  static getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  static removeToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static async getCurrentUser(): Promise<UserProfileResponse | null> {
    try {
      return await apiClient.get<UserProfileResponse>("/user/profile");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        this.removeToken();
        return null;
      }
      if (error instanceof ApiError && error.status === 403) {
        return null;
      }
      return null;
    }
  }

  static hasToken(): boolean {
    return !!this.getToken();
  }
}
