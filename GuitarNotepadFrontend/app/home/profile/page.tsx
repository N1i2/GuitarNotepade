"use client"

import { Button } from "@/components/ui/button"
import { ProfileService } from "@/lib/api/profile-service"
import { useEffect } from "react"

export default function HomePage() {
  const ShowResult = () =>{
    ProfileService.getFullInfo();
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <Button onClick={ShowResult}>
        Click hear
      </Button>
    </div>
  )
}