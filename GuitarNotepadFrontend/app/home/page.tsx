"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
  const { user, logout, isLoading } = useAuth() // 👈 Получаем isLoading из useAuth
  const router = useRouter()
  const toast = useToast()

  // 👇 Дополнительная защита на уровне компонента
  useEffect(() => {
    if (!isLoading && !user) {
      // Если загрузка завершена и пользователя нет - редирект
      router.push('/login')
    }
  }, [user, isLoading, router])

  // 👇 Показываем загрузку ДО любых условий
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // 👇 Проверяем пользователя ПОСЛЕ проверки загрузки
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to access this page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const handleDemoToast = () => {
    toast.success("Demo notification!", {
      description: "This is a sample success message",
      duration: 3000
    })
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Manage your guitar tabs and songs</p>
          </div>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>

        {/* Демо секция */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user.nikName}! 🎸</CardTitle>
            <CardDescription>Your personal guitar space</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleDemoToast} variant="outline" size="sm">
                Test Toast
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>My Songs</CardTitle>
              <CardDescription>Manage your guitar tabs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chords Library</CardTitle>
              <CardDescription>Browse chord diagrams</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Strumming Patterns</CardTitle>
              <CardDescription>Learn rhythm patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}