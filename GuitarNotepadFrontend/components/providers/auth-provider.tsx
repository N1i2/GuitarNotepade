"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname, redirect } from 'next/navigation'
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

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      try {
        const token = AuthService.getToken()
        
        if (token) {        
          if (pathname === '/login' || pathname === '/register' || pathname === '/') {
            router.push('/home')
          }
        } else {
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
      const userData: User = {
        id: response.userId,
        email: response.email,
        nikName: response.nikName,
        role: response.role
      }
      setUser(userData)
      
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
      router.push("/register");
      setUser(null)
      toast.success("Signed out successfully", {
        description: "Come back soon! 🎸"
      })
      router.push('/register')
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