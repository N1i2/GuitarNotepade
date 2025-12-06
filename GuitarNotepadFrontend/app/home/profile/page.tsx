"use client"

import React, { useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import ProfilePanel from "@/components/profile/profile-panel"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const toast = useToast()

  useEffect(() => {
    if (!isLoading && !user) {
      toast.warning("Access denied", { description: "Please log in to access your profile." })
      router.push('/login')
    }
  }, [user, isLoading, router, toast])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <ProfilePanel />
    </main>
  )
}
