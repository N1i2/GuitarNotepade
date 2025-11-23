"use client"

import { Toaster } from "@/components/ui/sonner"

export function ToastProvider() {
  return (
    <Toaster 
      position="top-right"
      expand={true}
      richColors
      closeButton
      duration={5000}
    />
  )
}