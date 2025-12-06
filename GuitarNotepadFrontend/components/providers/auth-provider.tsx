'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthService } from '@/lib/api/auth-service'
import { UserProfileResponse } from '@/types/auth'

// Обновляем тип контекста
interface AuthContextType {
  user: UserProfileResponse | null
  setUser: (user: UserProfileResponse | null) => void
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Инициализация при загрузке
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = AuthService.getToken()
        if (token) {
          const userData = await AuthService.validateToken()
          setUser(userData)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Функция логина
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await AuthService.login({ email, password })
      const userData = await AuthService.validateToken(true)
      setUser(userData)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Функция логаута
  const logout = () => {
    AuthService.logout()
    setUser(null)
  }

  // Функция обновления пользователя
  const refreshUser = async () => {
    try {
      const userData = await AuthService.validateToken(true)
      setUser(userData)
    } catch (error) {
      console.error('Refresh user error:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        setUser, 
        isLoading, 
        login, 
        logout, 
        refreshUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Хук useAuth
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}