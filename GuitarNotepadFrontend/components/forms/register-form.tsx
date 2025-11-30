"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { validatePassword, validatePasswordMatch } from "@/lib/utils/password-validation"
import { PasswordStrength } from "./password-strength"
import { useToast } from "@/hooks/use-toast"
import { ApiError } from "@/lib/api/client"
import { parseBackendError, showErrorToast } from "@/lib/utils/error-parser" // 👈 Новый импорт

export function RegisterForm() {
  const [formData, setFormData] = useState({
    email: "",
    nikName: "",
    password: "",
    confirmPassword: ""
  })
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({})
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()
  const toast = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Очищаем ошибки при вводе
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: [] }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string[] } = {}

    // Валидация email
    if (!formData.email) {
      newErrors.email = ['Email is required']
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = ['Email is invalid']
    }

    // Валидация никнейма
    if (!formData.nikName) {
      newErrors.nikName = ['Nickname is required']
    } else if (formData.nikName.length < 3) {
      newErrors.nikName = ['Nickname must be at least 3 characters long']
    }

    // Валидация пароля
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors
    }

    // Валидация подтверждения пароля
    if (!validatePasswordMatch(formData.password, formData.confirmPassword)) {
      newErrors.confirmPassword = ['Passwords do not match']
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    setIsLoading(true)
    const loadingToastId = toast.loading("Creating your account...")
    
    try {
      await register(formData.email, formData.nikName, formData.password, formData.confirmPassword)
      toast.dismiss(loadingToastId)
      toast.success("Account created successfully! 🎸", {
        description: `Welcome to GuitarNotepad, ${formData.nikName}!`,
        duration: 3000
      })
    } catch (err: unknown) {
      toast.dismiss(loadingToastId)
      
      // 👇 УЛУЧШЕННАЯ ОБРАБОТКА ОШИБОК
      if (err instanceof ApiError || err instanceof Error) {
        const { fieldErrors, generalError } = parseBackendError(err)
        
        // Устанавливаем ошибки полей
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors)
        }
        
        // Показываем общее уведомление
        showErrorToast(err, toast)
      } else {
        toast.error("Registration failed", {
          description: "Please try again later"
        })
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Register</CardTitle>
        <CardDescription>
          Create your GuitarNotepad account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && (
              <div className="text-sm text-red-500">
                {errors.email.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nikName">Nickname</Label>
            <Input
              id="nikName"
              name="nikName"
              type="text"
              placeholder="guitar_hero"
              value={formData.nikName}
              onChange={handleChange}
              required
            />
            {errors.nikName && (
              <div className="text-sm text-red-500">
                {errors.nikName.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter a strong password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <PasswordStrength password={formData.password} />
            {errors.password && (
              <div className="text-sm text-red-500">
                {errors.password.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            {errors.confirmPassword && (
              <div className="text-sm text-red-500">
                {errors.confirmPassword.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            )}
          </div>

          {errors.submit && (
            <div className="text-sm text-red-500">
              {errors.submit.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}