"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api/client"
import { UserProfileResponse } from "@/types/auth"
import { UserIcon, X } from "lucide-react"

export function ProfilePanel() {
  const { user, setUser } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({
    nikName: "",
    bio: "",
    password: "",
    confirmPassword: "",
  })

  const [isSaving, setIsSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarSrc, setAvatarSrc] = useState<string>("")
  const [shouldRemoveAvatar, setShouldRemoveAvatar] = useState(false)

  // Инициализация формы
  useEffect(() => {
    if (user) {
      setForm({
        nikName: user.nikName || "",
        bio: user.bio || "",
        password: "",
        confirmPassword: "",
      })
      
      if (user.avatarUrl) {
        processAvatarFromBackend(user.avatarUrl)
      } else {
        setAvatarSrc("")
      }
      setShouldRemoveAvatar(false)
    }
  }, [user])

  // Обработка аватара
  const processAvatarFromBackend = (avatarData: string) => {
    if (!avatarData) {
      setAvatarSrc("")
      return
    }

    if (avatarData.startsWith('data:')) {
      setAvatarSrc(avatarData)
      return
    }

    const mimeType = avatarData.startsWith('/9j/') ? 'image/jpeg' : 
                    avatarData.startsWith('iVBORw') ? 'image/png' :
                    'image/jpeg'
    
    const dataUrl = `data:${mimeType};base64,${avatarData}`
    setAvatarSrc(dataUrl)
  }

  const handleSave = async () => {
  setIsSaving(true)
  
  try {
    if (form.password && form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      setIsSaving(false)
      return
    }

    const payload: any = {
      nikName: form.nikName,
      bio: form.bio,
    }

    if (form.password) {
      payload.password = form.password
    }

    // ВАЖНО: Отправляем null для удаления аватара
    if (shouldRemoveAvatar) {
      payload.avatarBase64 = null // Отправляем null
    } 
    // Если выбран новый файл
    else if (avatarFile) {
      const base64 = await fileToBase64(avatarFile)
      payload.avatarBase64 = base64
    }
    // Если ничего не менялось с аватаром - НЕ отправляем avatarBase64 вообще!

    console.log("Saving profile with avatarBase64:", payload.avatarBase64)

    const response = await apiClient.put<UserProfileResponse>('/user/profile', payload)
    
    if (response) {
      setUser(response)
      
      if (response.avatarUrl) {
        processAvatarFromBackend(response.avatarUrl)
      } else {
        setAvatarSrc("")
      }
      
      setForm(prev => ({
        ...prev,
        nikName: response.nikName || "",
        bio: response.bio || "",
        password: "",
        confirmPassword: ""
      }))
      
      setAvatarFile(null)
      setShouldRemoveAvatar(false)
      
      toast.success('Profile updated successfully')
    }

  } catch (error: any) {
    console.error("Save error:", error)
    toast.error(error?.message || 'Failed to save profile')
  } finally {
    setIsSaving(false)
  }
}

  const handleRemoveAvatar = () => {
    setAvatarSrc("")
    setAvatarFile(null)
    setShouldRemoveAvatar(true)
    
    toast.info('Avatar will be removed when you save changes')
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const MAX_SIZE = 2 * 1024 * 1024

    if (!file) {
      setAvatarFile(null)
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > MAX_SIZE) {
      toast.error('Image must be smaller than 2MB')
      return
    }

    setShouldRemoveAvatar(false)
    setAvatarFile(file)
    
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarSrc(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Update your profile information</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
              {avatarSrc ? (
                <img 
                  src={avatarSrc} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : shouldRemoveAvatar ? (
                <div className="flex flex-col items-center justify-center">
                  <UserIcon className="w-16 h-16 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-2">Avatar will be removed</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <UserIcon className="w-16 h-16 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-2">No avatar</span>
                </div>
              )}
            </div>
            
            {(avatarSrc || shouldRemoveAvatar) && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full"
                onClick={handleRemoveAvatar}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="avatar">Profile Picture</Label>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground">
              {avatarFile 
                ? `Selected: ${avatarFile.name}`
                : "JPG, PNG or GIF up to 2MB"}
            </p>
            {shouldRemoveAvatar && (
              <p className="text-sm text-amber-600 font-medium">
                ✓ Avatar will be removed when you save
              </p>
            )}
          </div>
        </div>

        {/* Nickname */}
        <div>
          <Label htmlFor="nikName">Nickname</Label>
          <Input
            id="nikName"
            value={form.nikName}
            onChange={(e) => setForm({...form, nikName: e.target.value})}
            placeholder="Your nickname"
          />
        </div>

        {/* Bio */}
        <div>
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            value={form.bio}
            onChange={(e) => setForm({...form, bio: e.target.value})}
            className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Tell us about yourself"
          />
        </div>

        {/* Passwords */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Change Password</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                placeholder="Leave empty to keep current"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Leave password fields empty if you don&apos;t want to change it
          </p>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Saving...
            </>
          ) : "Save Changes"}
        </Button>
      </CardContent>
      
      <CardFooter className="border-t pt-6">
        <div className="text-sm text-muted-foreground">
          <div className="font-medium mb-1">Account Information</div>
          <div>Email: {user?.email}</div>
          <div>Role: {user?.role}</div>
          <div>Member since: {user?.createAt ? new Date(user.createAt).toLocaleDateString() : "—"}</div>
        </div>
      </CardFooter>
    </Card>
  )
}

export default ProfilePanel