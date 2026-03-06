"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthService } from "@/lib/api/auth-service";
import { UserProfileResponse } from "@/types/profile";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AuthContextType {
  user: UserProfileResponse | null;
  setUser: (user: UserProfileResponse | null) => void;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    nikName: string,
    password: string,
    confirmPassword: string
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const router = useRouter();
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = AuthService.getToken();
        const guestUser: UserProfileResponse = {
          id: "guest",
          email: "",
          nikName: "Guest",
          role: "Guest",
          avatarUrl: null,
          bio: "",
          createAt: new Date().toISOString(),
        };

        if (token) {
          const userData = await AuthService.validateToken();
          setUser(userData);
        } else {
          setUser(guestUser);
        }
      } catch (error) {
        toast.error('uncorrect token')
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await AuthService.login({ email, password });
      const userData = await AuthService.validateToken(true);
      setUser(userData);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    nikName: string,
    password: string,
    confirmPassword: string
  ) => {
    try {
      setIsLoading(true);
      const response = await AuthService.register({
        email,
        nikName,
        password,
        confirmPassword,
      });
      const userData = await AuthService.validateToken(true);
      setUser(userData);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    const guestUser: UserProfileResponse = {
      id: "guest",
      email: "",
      nikName: "Guest",
      role: "Guest",
      avatarUrl: null,
      bio: "",
      createAt: new Date().toISOString(),
    };
    setUser(guestUser);
    router.push("/login");
  };

  const refreshUser = async () => {
    try {
      const userData = await AuthService.validateToken(true);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
