"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { AuthService } from "@/lib/api/auth-service";
import { UserProfileResponse } from "@/types/profile";
import { useRouter, usePathname } from "next/navigation";

const GUEST_USER: UserProfileResponse = {
  id: "guest",
  email: "",
  nikName: "Guest",
  role: "Guest",
  avatarUrl: null,
  bio: "",
  createAt: new Date().toISOString(),
};

interface AuthContextType {
  user: UserProfileResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isUser: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, nikName: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = AuthService.hasToken();
  const isGuest = user?.role === "Guest";
  const isUser = user?.role === "User";
  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (AuthService.hasToken()) {
          const userData = await AuthService.getCurrentUser();
          setUser(userData);
        } else {
          setUser(GUEST_USER);
        }
      } catch (error) {
        console.error("Auth error:", error);

        setUser(GUEST_USER);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const publicRoutes = ["/login", "/register"];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (isPublicRoute && !isGuest && user) {
      router.push("/home");
      return;
    }

  }, [isLoading, isGuest, user, pathname, router]);

  const login = async (email: string, password: string) => {
    const response = await AuthService.login({ email, password });
    const userData = await AuthService.getCurrentUser();
    setUser(userData);
    router.push("/home");
  };

  const register = async (
    email: string,
    nikName: string,
    password: string,
    confirmPassword: string,
  ) => {
    const response = await AuthService.register({
      email,
      nikName,
      password,
      confirmPassword,
    });
    const userData = await AuthService.getCurrentUser();
    setUser(userData);
    router.push("/home");
  };

  const logout = () => {
    AuthService.logout();
    setUser(GUEST_USER); 
    router.push("/home");
  };

  const refreshUser = async () => {
    try {
      const userData = await AuthService.getCurrentUser();
      setUser(userData || GUEST_USER);
    } catch (error) {
      setUser(GUEST_USER);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isGuest,
        isUser,
        isAdmin,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};