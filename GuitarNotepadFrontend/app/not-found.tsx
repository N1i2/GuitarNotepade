"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => router.back();

  return (
    <div className="min-h-screen flex items-center justify-center from-background to-muted">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md">
            The page you're looking for doesn't exist or you don't have access
            to it.
          </p>
        </div>
        <div className="space-x-4">
          <Button onClick={handleGoBack}>
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}