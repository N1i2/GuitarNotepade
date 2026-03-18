"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, FileMusic, FileText, Hand, ListMusic } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const { user, isLoading } = useAuth();

  const isGuest = user?.role === "Guest";

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <div className="space-y-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your guitar tabs and songs
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hand className="h-5 w-5" />
                Chords Library
              </CardTitle>
              <CardDescription>
                Browse and create guitar chord diagrams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Access a comprehensive library of guitar chords with multiple
                fingerings
              </p>
              <Button asChild className="w-full">
                <Link href="/home/chords">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Go to Chords
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListMusic className="h-5 w-5" />
                Strumming Patterns Library
              </CardTitle>
              <CardDescription>
                Browse and create patterns diagrams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Access a comprehensive library of strumming pattern like finger
                style and other
              </p>
              <Button asChild className="w-full">
                <Link href="/home/patterns">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Go to Patterns
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileMusic className="h-5 w-5" />
                Song Library
              </CardTitle>
              <CardDescription>
                Browse and create songs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Access a comprehensive library of songs
              </p>
              <Button asChild className="w-full">
                <Link href="/home/songs">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Go to Songs
                </Link>
              </Button>
            </CardContent>
          </Card>
          {!isGuest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Albums
                </CardTitle>
                <CardDescription>
                  Browse and create albums
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Access a comprehensive library of albums
                </p>
                <Button asChild className="w-full">
                  <Link href="/home/albums">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Go to Albums
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {!isGuest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Users
                </CardTitle>
                <CardDescription>
                  Browse users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Get access to other users' accounts.
                </p>
                <Button asChild className="w-full">
                  <Link href="/home/users">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Go to Users
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {!isGuest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Subscriptions
                </CardTitle>
                <CardDescription>
                  Your Subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  You can view your subscriptions to users and albums.
                </p>
                <Button asChild className="w-full">
                  <Link href="/home/subscriptions">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Go to Subscriptions
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {!isGuest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Premium
                </CardTitle>
                <CardDescription>
                  My premium
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  You can buy premium here.
                </p>
                <Button asChild className="w-full">
                  <Link href="/home/premium">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Go to Premium
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {!isGuest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Messages
                </CardTitle>
                <CardDescription>
                  Your Messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Notifications about changes in the content of your subscriptions.
                </p>
                <Button asChild className="w-full">
                  <Link href="/home/messages">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Go to Messages
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
