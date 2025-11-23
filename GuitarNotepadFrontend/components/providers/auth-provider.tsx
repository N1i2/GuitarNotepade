"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User, AuthResponse } from '@/types/auth'
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const toast = useToast()

  // 👇 Временное решение - просто проверяем наличие токена
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      try {
        const token = AuthService.getToken()
        
        if (token) {
          // 👇 Если есть токен, считаем пользователя авторизованным
          // В реальном приложении здесь должен быть запрос к /auth/me
          const tempUser: User = {
            id: 'temp-id', // Временное значение
            email: 'user@example.com',
            nikName: 'User',
            role: 'user'
          }
          setUser(tempUser)
          
          // 👇 Если на публичной странице - редирект на home
          if (pathname === '/login' || pathname === '/register' || pathname === '/') {
            router.push('/home')
          }
        } else {
          // 👇 Если нет токена и на защищенной странице - редирект на логин
          if (pathname === '/home') {
            router.push('/login')
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        AuthService.logout()
        if (pathname === '/home') {
          router.push('/login')
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response: AuthResponse = await AuthService.login({ email, password })
      const userData: User = {
        id: response.userId,
        email: response.email,
        nikName: response.nikName,
        role: response.role
      }
      setUser(userData)
      
      toast.success(`Welcome back, ${userData.nikName}! 🎸`, {
        description: "Successfully signed in",
        duration: 3000
      })
      
      router.push('/home')
    } catch (error) {
      // 👇 ПРОПАГИРУЕМ ОШИБКУ ДАЛЬШЕ ДЛЯ ДЕТАЛЬНОЙ ОБРАБОТКИ В ФОРМЕ
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
      const userData: User = {
        id: response.userId,
        email: response.email,
        nikName: response.nikName,
        role: response.role
      }
      setUser(userData)
      
      toast.success("Account created successfully! 🎸", {
        description: `Welcome to GuitarNotepad, ${userData.nikName}!`,
        duration: 4000
      })
      
      router.push('/home')
    } catch (error) {
      // 👇 ПРОПАГИРУЕМ ОШИБКУ ДАЛЬШЕ ДЛЯ ДЕТАЛЬНОЙ ОБРАБОТКИ В ФОРМЕ
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
      router.push('/')
    } catch (error) {
      // 👇 ОБРАБОТКА ОШИБОК ПРИ ЛОГАУТЕ
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