"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User, AuthResponse, UserProfileResponse } from '@/types/auth'
import { AuthService } from '@/lib/api/auth-service'
import { useToast } from '@/hooks/use-toast'
import { ApiError } from '@/lib/api/client'
import { showErrorToast } from '@/lib/utils/error-parser'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, nikName: string, password: string, confirmPassword: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PROTECTED_ROUTES = ['/home']
const PUBLIC_ROUTES = ['/login', '/register', '/']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const toast = useToast()

  // 👇 Функция для преобразования UserProfileResponse в User
  const transformUserProfile = (profile: UserProfileResponse): User => ({
    id: profile.id,
    email: profile.email,
    nikName: profile.nikName,
    role: profile.role,
    avatarUrl: profile.avatarUrl || undefined,
    bio: profile.bio,
    createAt: profile.createAt
  })

  // 👇 ПРОВЕРКА АУТЕНТИФИКАЦИИ ПРИ ЗАГРУЗКЕ И ПРИ СМЕНЕ СТРАНИЦ
  useEffect(() => {
    const checkAuth = async () => {
      // 👇 Не проверяем аутентификацию на публичных страницах после начальной загрузки
      if (!isLoading && PUBLIC_ROUTES.includes(pathname) && user) {
        return
      }

      setIsLoading(true)
      try {
        const userProfile = await AuthService.validateToken()
        const currentUser = userProfile ? transformUserProfile(userProfile) : null
        setUser(currentUser)

        // 👇 ЛОГИКА РЕДИРЕКТОВ
        if (currentUser && PUBLIC_ROUTES.includes(pathname)) {
          router.push('/home')
        } else if (!currentUser && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
          toast.error("Access denied", {
            description: "Please log in to access this page"
          })
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setUser(null)
        if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
          router.push('/login')
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [pathname]) // 👈 Проверяем только при изменении пути

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response: AuthResponse = await AuthService.login({ email, password })
      
      const userProfile = await AuthService.validateToken(true) // 👈 force check
      if (!userProfile) {
        throw new Error('Failed to validate token after login')
      }
      
      const userData = transformUserProfile(userProfile)
      setUser(userData)
      
      toast.success("Successfully signed in", {
        description: `Welcome back, ${userData.nikName}! 🎸`,
        duration: 3000
      })
      
      router.push('/home')
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, nikName: string, password: string, confirmPassword: string) => {
    setIsLoading(true)
    try {
      const response: AuthResponse = await AuthService.register({ 
        email, nikName, password, confirmPassword 
      })
      
      const userProfile = await AuthService.validateToken(true) // 👈 force check
      if (!userProfile) {
        throw new Error('Failed to validate token after registration')
      }
      
      const userData = transformUserProfile(userProfile)
      setUser(userData)
      
      toast.success("Account created successfully! 🎸", {
        description: `Welcome to GuitarNotepad, ${userData.nikName}!`,
        duration: 4000
      })
      
      router.push('/home')
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    try {
      AuthService.logout()
      setUser(null)
      toast.success("Signed out successfully", {
        description: "Come back soon! 🎸"
      })
      router.push('/login')
    } catch (error) {
      showErrorToast(error, toast)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}