"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ReturnToSongEditorProps {
  className?: string;
}

function ReturnToSongEditorContent({ className }: ReturnToSongEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const handleReturn = () => {
    if (returnTo === "song-create") {
      router.push("/home/songs/create");
    } else {
      router.back();
    }
  };

  if (returnTo !== "song-create") return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleReturn}
      className={className}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Song Editor
    </Button>
  );
}

export function ReturnToSongEditor({ className }: ReturnToSongEditorProps) {
  return (
    <Suspense fallback={null}>
      <ReturnToSongEditorContent className={className} />
    </Suspense>
  );
}