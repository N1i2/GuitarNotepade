"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const toast = useToast() // 👈 Используем напрямую

  // 👇 Если пользователь не авторизован - редирект на логин
  useEffect(() => {
    if (!user) {
      toast.error("Access denied", {
        description: "Please log in to access this page"
      })
      router.push('/login')
    }
  }, [user, router, toast])

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

  const handleDemoError = () => {
    toast.error("Something went wrong!", {
      description: "This is a sample error message",
      duration: 4000
    })
  }

  const handleDemoWarning = () => {
    toast.warning("Please be careful!", {
      description: "This is a sample warning message",
    })
  }

  const handleDemoInfo = () => {
    toast.info("Just so you know!", {
      description: "This is a sample info message",
    })
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Welcome back, {user.nikName}! 🎸</h1>
            <p className="text-muted-foreground">Ready to create some music?</p>
          </div>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>

        {/* Демо секция для тестирования уведомлений */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Demo</CardTitle>
            <CardDescription>Test different types of notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleDemoToast} variant="outline" size="sm">
                Success Toast
              </Button>
              <Button onClick={handleDemoError} variant="outline" size="sm">
                Error Toast
              </Button>
              <Button onClick={handleDemoWarning} variant="outline" size="sm">
                Warning Toast
              </Button>
              <Button onClick={handleDemoInfo} variant="outline" size="sm">
                Info Toast
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